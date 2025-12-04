"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { User } from "@/lib/types";
import { checkAndUpdateSubscriptionStatus } from "@/lib/subscription";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardPage() {
    const router = useRouter();
    const { profile, setProfile, trips, drivers, vehicles, payments } = useStore();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    const userDocRef = doc(db, "users", firebaseUser.uid);
                    const userDocSnap = await getDoc(userDocRef);

                    if (userDocSnap.exists()) {
                        const userData = userDocSnap.data() as User;

                        // Check and update subscription status
                        const status = await checkAndUpdateSubscriptionStatus(userData);

                        setProfile({
                            uid: userData.uid,
                            name: userData.displayName,
                            email: userData.email,
                            photoURL: userData.photoURL,
                            companyName: userData.companyName || "",
                            phone: userData.mobileNumber,
                            subscriptionStatus: status,
                            role: userData.role
                        });

                        // Redirect if payment is needed
                        if (status === "pending_payment" || status === "expired") {
                            router.push("/dashboard/payments");
                            return;
                        }
                    } else {
                        router.push("/login");
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                    toast.error("Failed to load dashboard data");
                } finally {
                    setLoading(false);
                }
            } else {
                router.push("/login");
            }
        });

        return () => unsubscribe();
    }, [router, setProfile]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground mt-2">
                    Welcome back, {profile?.name}
                </p>
            </div>

            <div className="mt-8 flex justify-center">
                <Button asChild>
                    <Link href="/dashboard/trips/create">
                        Create New Shipment
                    </Link>
                </Button>
            </div>
        </div>
    );
}