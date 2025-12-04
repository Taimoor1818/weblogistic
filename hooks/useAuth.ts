"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { User } from "@/lib/types";
import {
    getUserDocument,
    initializeUserDocument,
    checkAndUpdateSubscriptionStatus,
} from "@/lib/subscription";

import { useStore } from "@/store/useStore";

// Define the structure for MPIN session data
interface MPINSessionData {
    userId: string;
    userEmail: string;
    timestamp: number;
}

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setFirebaseUser(firebaseUser);

            try {
                if (firebaseUser) {
                    // Standard Firebase authentication flow
                    await initializeUserDocument(
                        firebaseUser.uid,
                        firebaseUser.email!,
                        firebaseUser.displayName || "User",
                        firebaseUser.photoURL || undefined
                    );

                    // Get user document
                    const userDoc = await getUserDocument(firebaseUser.uid);

                    if (userDoc) {
                        // Check and update subscription status
                        const status = await checkAndUpdateSubscriptionStatus(userDoc);

                        setUser({ ...userDoc, subscriptionStatus: status });

                        // Initialize global store
                        useStore.getState().initializeStore(firebaseUser.uid);
                    }
                } else {
                    // Check for MPIN session authentication
                    const mpinSession = sessionStorage.getItem('mpin_auth_session');
                    if (mpinSession) {
                        try {
                            const sessionData: MPINSessionData = JSON.parse(mpinSession);
                            
                            // Check if session is still valid (e.g., not older than 24 hours)
                            const now = Date.now();
                            const sessionAge = now - sessionData.timestamp;
                            const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours

                            if (sessionAge < maxSessionAge) {
                                // Get user document
                                const userDoc = await getUserDocument(sessionData.userId);

                                if (userDoc) {
                                    // Check and update subscription status
                                    const status = await checkAndUpdateSubscriptionStatus(userDoc);

                                    setUser({ ...userDoc, subscriptionStatus: status });

                                    // Initialize global store
                                    useStore.getState().initializeStore(sessionData.userId);
                                    
                                    // We're done loading
                                    setLoading(false);
                                    return;
                                }
                            } else {
                                // Session expired, clear it
                                sessionStorage.removeItem('mpin_auth_session');
                            }
                        } catch (error) {
                            console.error("Error parsing MPIN session:", error);
                            sessionStorage.removeItem('mpin_auth_session');
                        }
                    }
                    
                    // No valid authentication found
                    setUser(null);
                    useStore.getState().cleanup();
                }
            } catch (error) {
                console.error("Error in auth state change:", error);
                // Even if there's an error, we still need to stop loading
                setUser(null);
                useStore.getState().cleanup();
            } finally {
                // Always set loading to false when auth state change is complete
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const isAdmin = user?.role === "admin";
    const needsPayment =
        user?.subscriptionStatus === "pending_payment" ||
        user?.subscriptionStatus === "expired";

    return {
        user,
        firebaseUser,
        loading,
        isAuthenticated: !!user,
        isAdmin,
        needsPayment,
    };
}