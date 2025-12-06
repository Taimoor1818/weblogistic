"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { KeyRound, Check } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { hashMPINSHA256 } from "@/lib/client-encryption";

interface MPINSetupProps {
    open: boolean;
    onClose: () => void;
    userId: string;
    userEmail: string;
    onSuccess?: () => void;
    required?: boolean;
    hasMPIN?: boolean;
}

export function MPINSetup({ open, onClose, userId, userEmail, onSuccess, required = false, hasMPIN = false }: MPINSetupProps) {
    const [step, setStep] = useState(1); // 1: enter MPIN, 2: confirm MPIN, 3: success
    const [pin, setPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const pinRefs = useRef<Array<HTMLInputElement | null>>([]);
    const confirmPinRefs = useRef<Array<HTMLInputElement | null>>([]);

    // Reset form when dialog opens
    useEffect(() => {
        if (open) {
            setStep(1);
            setPin("");
            setConfirmPin("");
            setError("");
        }
    }, [open]);

    const handlePinChange = (value: string, index: number, isConfirm = false) => {
        if (isConfirm) {
            const newPin = confirmPin.substring(0, index) + value.slice(-1) + confirmPin.substring(index + 1);
            setConfirmPin(newPin);
            if (value && index < 3) {
                confirmPinRefs.current[index + 1]?.focus();
            }
        } else {
            const newPin = pin.substring(0, index) + value.slice(-1) + pin.substring(index + 1);
            setPin(newPin);
            if (value && index < 3) {
                pinRefs.current[index + 1]?.focus();
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, index: number, isConfirm = false) => {
        const currentPin = isConfirm ? confirmPin : pin;
        const refs = isConfirm ? confirmPinRefs : pinRefs;

        if (e.key === "Backspace" && !currentPin[index] && index > 0) {
            refs.current[index - 1]?.focus();
        }
    };

    const handleSubmit = useCallback(async () => {
        if (pin.length !== 4) {
            setError("Please enter a 4-digit MPIN");
            return;
        }

        if (!/^\d{4}$/.test(pin)) {
            setError("MPIN must contain only digits");
            return;
        }

        if (step === 1) {
            setStep(2);
            setTimeout(() => {
                confirmPinRefs.current[0]?.focus();
            }, 100);
        } else if (step === 2) {
            if (pin !== confirmPin) {
                setError("MPINs do not match");
                setConfirmPin("");
                setTimeout(() => {
                    confirmPinRefs.current[0]?.focus();
                }, 100);
                return;
            }

            // Save MPIN
            setLoading(true);
            setError("");

            try {
                // Hash the MPIN using SHA-256
                const hashedMPIN = await hashMPINSHA256(pin);

                // Store in mpin_records collection with userId as document ID
                const mpinRecordRef = doc(db, "mpin_records", userId);
                await setDoc(mpinRecordRef, {
                    userId,
                    userEmail,
                    hashedMPIN,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                // Cleanup: Ensure mpinHash is NOT in the users collection
                const userDocRef = doc(db, "users", userId);
                try {
                    const { updateDoc, deleteField } = await import("firebase/firestore");
                    await updateDoc(userDocRef, {
                        mpinHash: deleteField()
                    });
                } catch (cleanupError) {
                    console.warn("Could not cleanup mpinHash from users collection:", cleanupError);
                }

                setStep(3);
                if (onSuccess) onSuccess();
                toast.success(hasMPIN ? "MPIN updated successfully!" : "MPIN set successfully!");
            } catch (err: any) {
                console.error("Error setting MPIN:", err);
                const errorMessage = err.message || "Failed to set MPIN. Please try again.";

                // Provide specific error messages for common issues
                if (errorMessage.includes("Web Crypto API")) {
                    setError("Your browser doesn't support secure encryption. Please use a modern browser.");
                    toast.error("Browser not supported. Please use Chrome, Firefox, or Edge.");
                } else if (errorMessage.includes("permission")) {
                    setError("Permission denied. Please check your Firebase security rules.");
                    toast.error("Permission denied. Please contact support.");
                } else {
                    setError(errorMessage);
                    toast.error(errorMessage);
                }
            } finally {
                setLoading(false);
            }
        }
    }, [pin, step, confirmPin, userId, userEmail, onSuccess, hasMPIN]);

    // Auto-submit when confirm PIN is complete
    useEffect(() => {
        if (step === 2 && confirmPin.length === 4) {
            const timer = setTimeout(() => {
                handleSubmit();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [confirmPin, step, handleSubmit]);

    const handleClose = () => {
        if (!loading) {
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
                        {hasMPIN ? "Change MPIN" : "Set Up MPIN"}
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        {step === 1
                            ? "Create a 4-digit PIN for quick access"
                            : step === 2
                                ? "Confirm your 4-digit PIN"
                                : "MPIN setup complete!"}
                    </DialogDescription>
                </DialogHeader>

                {step === 1 && (
                    <div className="py-6">
                        <p className="text-sm font-medium mb-3 text-center">Enter a 4-digit PIN</p>
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
                                    className="w-12 h-12 text-center text-xl font-bold rounded-lg border-2 border-border focus:border-primary focus:outline-none"
                                    disabled={loading}
                                />
                            ))}
                        </div>
                        {pin.length > 0 && pin.length < 4 && (
                            <p className="text-xs text-center text-muted-foreground mt-2">
                                Enter all 4 digits
                            </p>
                        )}
                        {error && (
                            <p className="text-xs text-center text-destructive mt-2">
                                {error}
                            </p>
                        )}
                    </div>
                )}

                {step === 2 && (
                    <div className="py-6">
                        <p className="text-sm font-medium mb-3 text-center">Confirm your 4-digit PIN</p>
                        <div className="flex gap-3 justify-center">
                            {[0, 1, 2, 3].map((index) => (
                                <input
                                    key={index}
                                    ref={(el) => { confirmPinRefs.current[index] = el; }}
                                    type="password"
                                    maxLength={1}
                                    value={confirmPin[index] || ""}
                                    onChange={(e) => {
                                        handlePinChange(e.target.value, index, true);
                                    }}
                                    onKeyDown={(e) => handleKeyDown(e, index, true)}
                                    className="w-12 h-12 text-center text-xl font-bold rounded-lg border-2 border-border focus:border-primary focus:outline-none"
                                    disabled={loading}
                                />
                            ))}
                        </div>
                        {confirmPin.length > 0 && confirmPin.length < 4 && (
                            <p className="text-xs text-center text-muted-foreground mt-2">
                                Enter all 4 digits
                            </p>
                        )}
                        {error && (
                            <p className="text-xs text-center text-destructive mt-2">
                                {error}
                            </p>
                        )}
                    </div>
                )}

                {step === 3 && (
                    <div className="py-8 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
                            <Check className="h-8 w-8 text-green-600" />
                        </div>
                        <p className="text-lg font-medium">
                            {hasMPIN ? "MPIN Updated!" : "MPIN Set Successfully!"}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            You can now use your MPIN to login quickly
                        </p>
                    </div>
                )}

                {step < 3 && (
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
                            onClick={handleSubmit}
                            disabled={loading || (step === 1 ? pin.length < 4 : confirmPin.length < 4)}
                            className="flex-1"
                        >
                            {loading ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : step === 1 ? (
                                "Continue"
                            ) : (
                                "Confirm"
                            )}
                        </Button>
                    </div>
                )}

                {step === 3 && (
                    <Button onClick={handleClose} className="w-full">
                        Done
                    </Button>
                )}
            </DialogContent>
        </Dialog>
    );
}