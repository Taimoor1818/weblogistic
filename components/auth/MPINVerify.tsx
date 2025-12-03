"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PinInput } from "@/components/ui/pin-input";
import { verifyMPIN } from "@/lib/encryption";
import { toast } from "react-hot-toast";
import { ShieldCheck } from "lucide-react";

interface MPINVerifyProps {
    open: boolean;
    onClose: () => void;
    mpinHash: string;
    onSuccess: () => void;
    title?: string;
    description?: string;
}

export function MPINVerify({
    open,
    onClose,
    mpinHash,
    onSuccess,
    title = "Verify Your MPIN",
    description = "Enter your 4-digit PIN to continue",
}: MPINVerifyProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [attempts, setAttempts] = useState(0);

    const handlePinComplete = async (pin: string) => {
        setLoading(true);
        setError(false);

        try {
            const isValid = await verifyMPIN(pin, mpinHash);

            if (isValid) {
                toast.success("MPIN verified!");
                onSuccess();
                onClose();
                setAttempts(0);
            } else {
                setError(true);
                setAttempts(attempts + 1);
                toast.error("Incorrect MPIN. Please try again.");

                if (attempts >= 2) {
                    toast.error("Too many incorrect attempts. Please try later.");
                    setTimeout(() => {
                        onClose();
                        setAttempts(0);
                    }, 1500);
                }
            }
        } catch (error) {
            console.error("Error verifying MPIN:", error);
            toast.error("Failed to verify MPIN. Please try again.");
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setError(false);
            onClose();
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                    </div>
                    <DialogTitle className="text-center">{title}</DialogTitle>
                    <DialogDescription className="text-center">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6">
                    <PinInput
                        length={4}
                        onComplete={handlePinComplete}
                        disabled={loading}
                        error={error}
                        autoFocus
                    />
                </div>

                {error && (
                    <p className="text-xs text-center text-red-500">
                        Incorrect MPIN. {3 - attempts} attempts remaining.
                    </p>
                )}

                <Button variant="outline" onClick={handleClose} disabled={loading}>
                    Cancel
                </Button>
            </DialogContent>
        </Dialog>
    );
}
