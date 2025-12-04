"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { KeyRound, ArrowLeft } from "lucide-react";
import { hashMPINSHA256 } from "@/lib/encryption";
import { signInWithCustomToken } from "firebase/auth";

interface MPINLoginProps {
    open: boolean;
    onClose: () => void;
    onSwitchToGoogle: () => void;
}

export function MPINLogin({ open, onClose, onSwitchToGoogle }: MPINLoginProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [pin, setPin] = useState("");
    const pinRefs = useRef<Array<HTMLInputElement | null>>([]);
    const router = useRouter();
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

    const handlePinChange = (value: string, index: number) => {
        const newPin = pin.substring(0, index) + value.slice(-1) + pin.substring(index + 1);
        setPin(newPin);
        if (value && index < 3) {
            pinRefs.current[index + 1]?.focus();
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

            // Query Firestore: mpin_records collection to find matching record
            // Since we don't know the userId, we need to query by hashedMPIN
            const mpinRecordsRef = collection(db, "mpin_records");
            const q = query(mpinRecordsRef, where("hashedMPIN", "==", hashedEnteredMPIN));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                toast.error("Invalid MPIN. Please try again.");
                setError(true);
                setPin("");
                setTimeout(() => {
                    pinRefs.current[0]?.focus();
                }, 100);
                setLoading(false);
                return;
            }

            // Get the user ID from the matching record
            const mpinRecordDoc = querySnapshot.docs[0];
            const mpinData = mpinRecordDoc.data();
            const userId = mpinData.userId;

            // Get user document to verify existence
            const userDocRef = doc(db, "users", userId);
            const userDocSnap = await getDoc(userDocRef);

            if (!userDocSnap.exists()) {
                toast.error("User account not found.");
                setError(true);
                setPin("");
                setTimeout(() => {
                    pinRefs.current[0]?.focus();
                }, 100);
                setLoading(false);
                return;
            }

            // TODO: In a real implementation, you would need to sign in the user
            // This would typically involve calling a backend function to generate a custom token
            // For now, we'll simulate successful login
            
            // Simulate successful login
            onClose();
            toast.success("Welcome back!");
            router.push("/dashboard");
        } catch (error: any) {
            console.error("Error verifying MPIN:", error);
            toast.error(`Failed to login: ${error.message || "Please try again"}`);
            setError(true);
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
                        Enter Your MPIN
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        Enter your 4-digit PIN to login
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
                                onKeyDown={(e) => {
                                    if (e.key === "Backspace" && !pin[index] && index > 0) {
                                        pinRefs.current[index - 1]?.focus();
                                    }
                                }}
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
                        onClick={onSwitchToGoogle}
                        disabled={loading}
                        className="flex-1"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Use Google Sign-In
                    </Button>
                    <Button
                        variant="ghost"
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