"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { hashMPIN } from "@/lib/encryption";
import { updateUserDocument } from "@/lib/subscription";
import { toast } from "react-hot-toast";
import { Lock } from "lucide-react";

interface MPINSetupProps {
    open: boolean;
    onClose: () => void;
    userId: string;
    onSuccess?: () => void;
    required?: boolean;
    hasMPIN?: boolean;
}

export function MPINSetup({ open, onClose, userId, onSuccess, required = false, hasMPIN = false }: MPINSetupProps) {
    const [firstPin, setFirstPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const firstPinRefs = useRef<Array<HTMLInputElement | null>>([]);
    const confirmPinRefs = useRef<Array<HTMLInputElement | null>>([]);

    // Handle first PIN input
    const handleFirstPinChange = (value: string, index: number) => {
        const newPin = firstPin.substring(0, index) + value.slice(-1) + firstPin.substring(index + 1);
        setFirstPin(newPin);
        if (value && index < 3) {
            firstPinRefs.current[index + 1]?.focus();
        }
    };

    // Handle confirm PIN input
    const handleConfirmPinChange = (value: string, index: number) => {
        const newPin = confirmPin.substring(0, index) + value.slice(-1) + confirmPin.substring(index + 1);
        setConfirmPin(newPin);
        if (value && index < 3) {
            confirmPinRefs.current[index + 1]?.focus();
        }
    };

    // Auto-submit when both PINs are entered and match
    useEffect(() => {
        if (firstPin.length === 4 && confirmPin.length === 4) {
            if (firstPin === confirmPin) {
                handleSubmit();
            } else {
                setError(true);
            }
        } else {
            setError(false);
        }
    }, [firstPin, confirmPin]);

    const handleSubmit = async () => {
        if (firstPin !== confirmPin) {
            setError(true);
            toast.error("MPINs do not match. Please try again.");
            return;
        }

        setLoading(true);
        try {
            const mpinHash = await hashMPIN(firstPin);
            await updateUserDocument(userId, { mpinHash });

            toast.success("MPIN set successfully!");
            onSuccess?.();
            onClose();

            // Reset state
            setFirstPin("");
            setConfirmPin("");
        } catch (error) {
            console.error("Error setting MPIN:", error);
            toast.error("Failed to set MPIN. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        // If MPIN setup is required and user doesn't have an MPIN yet, 
        // only allow closing if they haven't started entering the PIN
        if (required && !hasMPIN && (firstPin || confirmPin)) {
            toast.error("Please complete MPIN setup or reset to cancel");
            return;
        }
        
        if (!loading) {
            setFirstPin("");
            setConfirmPin("");
            setError(false);
            onClose();
        }
    };

    const handleReset = () => {
        setFirstPin("");
        setConfirmPin("");
        setError(false);
        firstPinRefs.current[0]?.focus();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Lock className="h-6 w-6 text-primary" />
                    </div>
                    <DialogTitle className="text-center">Set Your MPIN</DialogTitle>
                    <DialogDescription className="text-center">
                        Enter a 4-digit PIN for secure access
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* First PIN Input */}
                    <div>
                        <p className="text-sm font-medium mb-2">Enter MPIN</p>
                        <div className="flex gap-3 justify-center">
                            {[0, 1, 2, 3].map((index) => (
                                <input
                                    key={index}
                                    ref={(el) => { firstPinRefs.current[index] = el; }}
                                    type="password"
                                    maxLength={1}
                                    value={firstPin[index] || ""}
                                    onChange={(e) => {
                                        handleFirstPinChange(e.target.value, index);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Backspace" && !firstPin[index] && index > 0) {
                                            firstPinRefs.current[index - 1]?.focus();
                                        }
                                    }}
                                    className={`w-12 h-12 text-center text-xl font-bold rounded-lg border-2 ${
                                        error ? "border-destructive" : "border-border"
                                    } focus:border-primary focus:outline-none`}
                                    disabled={loading}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Confirm PIN Input */}
                    <div>
                        <p className="text-sm font-medium mb-2">Confirm MPIN</p>
                        <div className="flex gap-3 justify-center">
                            {[0, 1, 2, 3].map((index) => (
                                <input
                                    key={index}
                                    ref={(el) => { confirmPinRefs.current[index] = el; }}
                                    type="password"
                                    maxLength={1}
                                    value={confirmPin[index] || ""}
                                    onChange={(e) => {
                                        handleConfirmPinChange(e.target.value, index);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Backspace" && !confirmPin[index] && index > 0) {
                                            confirmPinRefs.current[index - 1]?.focus();
                                        }
                                    }}
                                    className={`w-12 h-12 text-center text-xl font-bold rounded-lg border-2 ${
                                        error ? "border-destructive" : "border-border"
                                    } focus:border-primary focus:outline-none`}
                                    disabled={loading}
                                />
                            ))}
                        </div>
                    </div>

                    {error && (
                        <p className="text-xs text-center text-destructive">
                            MPINs do not match. Please try again.
                        </p>
                    )}

                    <p className="text-xs text-center text-muted-foreground">
                        You&apos;ll need this MPIN for sensitive operations like editing and deleting data
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={loading}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={handleReset}
                        disabled={loading}
                        className="flex-1"
                    >
                        Reset
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}