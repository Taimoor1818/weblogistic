"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { KeyRound } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { hashMPINSHA256 } from "@/lib/encryption";

interface MPINVerifyProps {
    open: boolean;
    onClose: () => void;
    onSuccess: (pin: string) => void;
    title?: string;
    description?: string;
    userId?: string;
}

export function MPINVerify({ open, onClose, onSuccess, title = "Verify MPIN", description = "Enter your MPIN to continue", userId }: MPINVerifyProps) {
    const [pin, setPin] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const pinRefs = useRef<Array<HTMLInputElement | null>>([]);
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

    // Reset form when dialog opens
    useEffect(() => {
        if (open) {
            setPin("");
            setError(false);
        }
    }, [open]);

    const handlePinChange = (value: string, index: number) => {
        const newPin = pin.substring(0, index) + value.slice(-1) + pin.substring(index + 1);
        setPin(newPin);
        if (value && index < 3) {
            pinRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
        if (e.key === "Backspace" && !pin[index] && index > 0) {
            pinRefs.current[index - 1]?.focus();
        }
    };

    // Auto-submit with debounce when PIN is entered
    useEffect(() => {
        if (pin.length === 4) {
            // Clear any existing timeout
            if (debounceTimeout.current) {
                clearTimeout(debounceTimeout.current);
            }

            // Set new timeout for 300ms
            debounceTimeout.current = setTimeout(() => {
                handlePinComplete();
            }, 300);
        }

        // Cleanup timeout on unmount
        return () => {
            if (debounceTimeout.current) {
                clearTimeout(debounceTimeout.current);
            }
        };
    }, [pin]);

    const handlePinComplete = async () => {
        setLoading(true);
        setError(false);

        try {
            // Hash the entered MPIN using SHA-256
            const hashedEnteredMPIN = await hashMPINSHA256(pin);

            // If userId is provided, verify against that specific user's MPIN
            if (userId) {
                const mpinRecordRef = doc(db, "mpin_records", userId);
                const mpinRecordSnap = await getDoc(mpinRecordRef);

                if (!mpinRecordSnap.exists()) {
                    throw new Error("No MPIN record found for this account");
                }

                const mpinData = mpinRecordSnap.data();
                const storedHash = mpinData.hashedMPIN;

                // Compare hashed MPIN with stored hash
                if (hashedEnteredMPIN === storedHash) {
                    onSuccess(pin);
                } else {
                    throw new Error("Incorrect MPIN");
                }
            } else {
                // For login verification, search across all mpin_records
                onSuccess(pin);
            }
        } catch (error: any) {
            console.error("Error verifying MPIN:", error);
            setError(true);
            toast.error(error.message || "Failed to verify MPIN. Please try again.");
            setPin("");
            setTimeout(() => {
                pinRefs.current[0]?.focus();
            }, 100);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setError(false);
            setPin("");
            onClose();
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <KeyRound className="h-6 w-6 text-primary" />
                    </div>
                    <DialogTitle className="text-center">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6">
                    <p className="text-sm font-medium mb-3 text-center">Enter your 4-digit PIN</p>
                    <div className="flex gap-3 justify-center">
                        {[0, 1, 2, 3].map((index) => (
                            <input
                                key={index}
                                ref={(el) => { pinRefs.current[index] = el; }}
                                type="password"
                                maxLength={1}
                                value={pin[index] || ""}
                                onChange={(e) => {
                                    handlePinChange(e.target.value, index);
                                }}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                className={`w-12 h-12 text-center text-xl font-bold rounded-lg border-2 ${error ? "border-destructive" : "border-border"
                                    } focus:border-primary focus:outline-none`}
                                disabled={loading}
                            />
                        ))}
                    </div>
                    {pin.length > 0 && pin.length < 4 && (
                        <p className="text-xs text-center text-muted-foreground mt-2">
                            Enter all 4 digits
                        </p>
                    )}
                </div>

                {loading && (
                    <div className="flex justify-center">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    </div>
                )}

                {error && (
                    <p className="text-xs text-center text-destructive">
                        Incorrect MPIN. Please try again.
                    </p>
                )}

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={loading}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}