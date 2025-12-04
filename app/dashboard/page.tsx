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
                // Check for MPIN session
                const mpinUserId = typeof window !== 'undefined' ? localStorage.getItem('mpin_authenticated_user') : null;

                if (mpinUserId) {
                    try {
                        const userDocRef = doc(db, "users", mpinUserId);
                        const userDocSnap = await getDoc(userDocRef);

                        if (userDocSnap.exists()) {
                            const userData = userDocSnap.data() as User;

                            // For MPIN users, we might skip subscription checks or handle them differently
                            // For now, load the profile
                            setProfile({
                                uid: userData.uid,
                                name: userData.displayName,
                                email: userData.email,
                                photoURL: userData.photoURL,
                                companyName: userData.companyName || "",
                                phone: userData.mobileNumber,
                                subscriptionStatus: userData.subscriptionStatus || 'active', // Default or fetch real status
                                role: userData.role
                            });

                            setLoading(false);
                            return; // Stay on dashboard
                        }
                    } catch (error) {
                        console.error("Error fetching MPIN user data:", error);
                    }
                }

                // If no Firebase user AND no MPIN user, then redirect
                router.push("/login");
                setLoading(false);
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
                <Card className="hover:border-primary/50 transition-all cursor-pointer" onClick={() => router.push('/dashboard/trips')}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-blue-500">
                            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                            <path d="M15 18H9" />
                            <path d="M19 22V10a2 2 0 0 0-2-2h-4" />
                            <path d="M18 13h-1" />
                            <path d="M22 18v-2" />
                            <circle cx="18" cy="22" r="1" />
                            <circle cx="14" cy="22" r="1" />
                        </svg>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalShipments}</div>
                        <p className="text-xs text-muted-foreground">Delivered shipments</p>
                    </CardContent>
                </Card>

                <Card className="hover:border-primary/50 transition-all cursor-pointer" onClick={() => router.push('/dashboard/drivers')}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Drivers</CardTitle>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-green-500">
                            <path d="M17 21v-2a1 1 0 0 1-1-1" />
                            <path d="M21 21v-2a1 1 0 0 1-1-1" />
                            <path d="M22 19h-2a2 2 0 0 1-2-2v-1" />
                            <path d="M2 19h2a2 2 0 0 0 2-2v-1" />
                            <path d="M16 5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2" />
                            <path d="M18 7v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7" />
                            <rect x="4" y="5" width="16" height="14" rx="1" />
                        </svg>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeDrivers}</div>
                        <p className="text-xs text-muted-foreground">Available drivers</p>
                    </CardContent>
                </Card>

                <Card className="hover:border-primary/50 transition-all cursor-pointer" onClick={() => router.push('/dashboard/payments')}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-orange-500">
                            <path d="M12 2v20" />
                            <path d="M8 10H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4" />
                            <path d="M20 10h-4a2 2 0 0 0-2-2V6a2 2 0 0 0 2-2h4" />
                            <path d="M8 14h.01" />
                            <path d="M8 18h.01" />
                            <path d="M16 14h.01" />
                            <path d="M16 18h.01" />
                        </svg>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingPayments}</div>
                        <p className="text-xs text-muted-foreground">Requires attention</p>
                    </CardContent>
                </Card>

                <Card className="hover:border-primary/50 transition-all cursor-pointer" onClick={() => router.push('/dashboard/vehicles')}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Vehicles</CardTitle>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-purple-500">
                            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                            <path d="M15 18H9" />
                            <path d="M19 22V10a2 2 0 0 0-2-2h-4" />
                            <path d="M18 13h-1" />
                            <path d="M22 18v-2" />
                            <circle cx="18" cy="22" r="1" />
                            <circle cx="14" cy="22" r="1" />
                        </svg>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeVehicles}</div>
                        <p className="text-xs text-muted-foreground">Fleet status</p>
                    </CardContent>
                </Card>
            </div>

            {/* Existing Widgets */}
            <DashboardWidgets />

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