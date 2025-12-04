"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { KeyRound, ArrowLeft } from "lucide-react";

// Function to hash MPIN with SHA-256
async function hashMPIN(mpin: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(mpin);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export function MPINLogin({ open, onClose, onSwitchToGoogle }: { open: boolean; onClose: () => void; onSwitchToGoogle: () => void; }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [email, setEmail] = useState("");
    const [pin, setPin] = useState("");
    const pinRefs = useRef<Array<HTMLInputElement | null>>([]);
    const router = useRouter();
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Check if user has logged in before with MPIN
        const savedEmail = localStorage.getItem("last_login_email");
        if (savedEmail) {
            setEmail(savedEmail);
        }
    }, []);

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
        if (!email) {
            toast.error("Email not found. Please login with Google first.");
            return;
        }

        setLoading(true);
        setError(false);

        try {
            // Hash the entered MPIN
            const hashedEnteredMPIN = await hashMPIN(pin);
            
            // Query Firestore: users collection by email → Get UID
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("email", "==", email));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                toast.error("No account found with this email. Please login with Google first.");
                setLoading(false);
                return;
            }

            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();
            const uid = userDoc.id;

            // Query Firestore: mpin_records/{UID} → Get stored hash
            const mpinRecordRef = doc(db, "mpin_records", uid);
            const mpinRecordSnap = await getDoc(mpinRecordRef);

            if (!mpinRecordSnap.exists()) {
                toast.error("No MPIN record found for this account. Please set up your MPIN first.");
                setLoading(false);
                return;
            }

            const mpinData = mpinRecordSnap.data();
            const storedHash = mpinData.mpin; // Using the simpler structure

            // Compare hashed MPIN with stored hash
            if (hashedEnteredMPIN === storedHash) {
                // ✓ Match → Close dialog and navigate to dashboard
                // The auth state will be handled by the useAuth hook
                onClose();
                toast.success("Welcome back!");
                router.push("/dashboard");
            } else {
                // ✗ No Match → Show error "Incorrect MPIN"
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