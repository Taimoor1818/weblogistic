"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { verifyMPIN } from "@/lib/encryption";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { KeyRound, ArrowLeft } from "lucide-react";

interface MPINLoginProps {
    open: boolean;
    onClose: () => void;
    onSwitchToGoogle: () => void;
}

export function MPINLogin({ open, onClose, onSwitchToGoogle }: MPINLoginProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [email, setEmail] = useState("");
    const [step, setStep] = useState<"email" | "pin">("email");
    const [userMpinHash, setUserMpinHash] = useState("");
    const [pin, setPin] = useState("");
    const pinRefs = useRef<Array<HTMLInputElement | null>>([]);
    const router = useRouter();

    useEffect(() => {
        // Check if user has logged in before with MPIN
        const savedEmail = localStorage.getItem("lastMpinEmail");
        if (savedEmail) {
            setEmail(savedEmail);
            // Automatically proceed to PIN entry for returning users
            setTimeout(() => {
                handleAutoEmailSubmit(savedEmail);
            }, 100);
        }
    }, []);

    const handleAutoEmailSubmit = async (userEmail: string) => {
        setLoading(true);
        try {
            // Find user by email
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("email", "==", userEmail));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                // If no account found, stay on email step
                setStep("email");
                setLoading(false);
                return;
            }

            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();

            if (!userData.mpinHash) {
                // If no MPIN set, stay on email step
                setStep("email");
                setLoading(false);
                return;
            }

            setUserMpinHash(userData.mpinHash);
            setStep("pin");
            setPin("");
            
            // Focus first PIN input
            setTimeout(() => {
                pinRefs.current[0]?.focus();
            }, 100);
        } catch (error: any) {
            console.error("Error finding user:", error);
            setStep("email");
        } finally {
            setLoading(false);
        }
    };

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            toast.error("Please enter your email");
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.error("Please enter a valid email address");
            return;
        }

        setLoading(true);
        try {
            // Find user by email
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("email", "==", email));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                toast.error("No account found with this email. Please login with Google first to create an account.");
                setLoading(false);
                return;
            }

            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();

            if (!userData.mpinHash) {
                toast.error("No MPIN set for this account. Please login with Google first to set up your MPIN.");
                setLoading(false);
                return;
            }

            setUserMpinHash(userData.mpinHash);
            setStep("pin");
            setPin("");
            localStorage.setItem("lastMpinEmail", email);
            
            // Focus first PIN input
            setTimeout(() => {
                pinRefs.current[0]?.focus();
            }, 100);
        } catch (error: any) {
            console.error("Error finding user:", error);
            toast.error(`Failed to find user: ${error.message || "Please try again"}`);
        } finally {
            setLoading(false);
        }
    };

    const handlePinChange = (value: string, index: number) => {
        const newPin = pin.substring(0, index) + value.slice(-1) + pin.substring(index + 1);
        setPin(newPin);
        if (value && index < 3) {
            pinRefs.current[index + 1]?.focus();
        }
    };

    // Auto-submit when PIN is entered
    useEffect(() => {
        if (pin.length === 4) {
            handlePinComplete();
        }
    }, [pin]);

    const handlePinComplete = async () => {
        setLoading(true);
        setError(false);

        try {
            const isValid = await verifyMPIN(pin, userMpinHash);

            if (isValid) {
                // Close the MPIN dialog first
                onClose();
                
                // For MPIN login, we need to trigger Google sign-in silently
                // We'll redirect to dashboard and let the auth state handle the rest
                toast.success("Welcome back!");
                router.push("/dashboard");
            } else {
                setError(true);
                toast.error("Incorrect MPIN. Please try again.");
                // Clear PIN and focus first input
                setPin("");
                setTimeout(() => {
                    pinRefs.current[0]?.focus();
                }, 100);
            }
        } catch (error: any) {
            console.error("Error verifying MPIN:", error);
            toast.error(`Failed to login: ${error.message || "Please try again"}`);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setStep("email");
            setError(false);
            setPin("");
            onClose();
        }
    };

    const handleBack = () => {
        setStep("email");
        setError(false);
        setPin("");
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <KeyRound className="h-6 w-6 text-primary" />
                    </div>
                    <DialogTitle className="text-center">
                        {step === "email" ? "Login with MPIN" : "Enter Your MPIN"}
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        {step === "email"
                            ? "Enter your email to continue"
                            : "Enter your 4-digit PIN to login"}
                    </DialogDescription>
                </DialogHeader>

                {step === "email" ? (
                    <form onSubmit={handleEmailSubmit} className="space-y-4">
                        <div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                disabled={loading}
                                autoFocus
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Searching..." : "Continue"}
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">Or</span>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={onSwitchToGoogle}
                            className="w-full"
                            disabled={loading}
                        >
                            Use Google Sign-In Instead
                        </Button>
                    </form>
                ) : (
                    <>
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
                                        className={`w-12 h-12 text-center text-xl font-bold rounded-lg border-2 ${
                                            error ? "border-destructive" : "border-border"
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
                            <p className="text-xs text-center text-muted-foreground mt-4">
                                Logged in with {email}
                            </p>
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
                                onClick={handleBack}
                                disabled={loading}
                                className="flex-1"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
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
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}