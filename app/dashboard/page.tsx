"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { User } from "@/lib/types";
import { checkAndUpdateSubscriptionStatus } from "@/lib/subscription";
import { DashboardWidgets } from "@/components/dashboard/DashboardWidgets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardPage() {
    const router = useRouter();
    const { profile, setProfile, trips, drivers, vehicles, payments } = useStore();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            // Check if we have MPIN session authentication only on client side
            let mpinSession = null;
            if (typeof window !== 'undefined') {
                mpinSession = sessionStorage.getItem('mpin_auth_session');
            }
            
            if (firebaseUser || mpinSession) {
                try {
                    let userId;
                    if (firebaseUser) {
                        userId = firebaseUser.uid;
                    } else if (mpinSession) {
                        const sessionData = JSON.parse(mpinSession);
                        userId = sessionData.userId;
                    }
                    
                    if (userId) {
                        const userDocRef = doc(db, "users", userId);
                        const userDocSnap = await getDoc(userDocRef);

                        if (userDocSnap.exists()) {
                            const userData = userDocSnap.data() as User;

                            // Check and update subscription status
                            const status = await checkAndUpdateSubscriptionStatus(userData);

                            // Convert User to UserProfile
                            setProfile({
                                uid: userData.uid,
                                name: userData.displayName || userData.email || "User",
                                email: userData.email || "",
                                photoURL: userData.photoURL,
                                companyName: userData.companyName || "",
                                phone: userData.mobileNumber,
                                subscriptionStatus: status,
                                role: userData.role,
                                mpinHash: userData.mpinHash
                            });
                        }
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                    toast.error("Failed to load user data");
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

    // Calculate dashboard metrics
    const totalShipments = trips.filter(t => t.status === 'delivered').length;
    const activeDrivers = drivers.filter(d => d.status === 'available').length;
    const pendingPayments = payments.filter(p => p.status === 'pending').length;
    const activeVehicles = vehicles.filter(v => v.status === 'available').length;

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground mt-2">
                    Welcome back, {profile?.name}
                </p>
            </div>

            {/* Top 4 Widgets */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
                        <div className="h-4 w-4 text-muted-foreground">📦</div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalShipments}</div>
                        <p className="text-xs text-muted-foreground">Delivered shipments</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Drivers</CardTitle>
                        <div className="h-4 w-4 text-muted-foreground">🚗</div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeDrivers}</div>
                        <p className="text-xs text-muted-foreground">Available drivers</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                        <div className="h-4 w-4 text-muted-foreground">💰</div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingPayments}</div>
                        <p className="text-xs text-muted-foreground">Awaiting processing</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Vehicles</CardTitle>
                        <div className="h-4 w-4 text-muted-foreground">🚛</div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeVehicles}</div>
                        <p className="text-xs text-muted-foreground">Available for dispatch</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Dashboard Widgets */}
            <DashboardWidgets />
        </div>
    );
}