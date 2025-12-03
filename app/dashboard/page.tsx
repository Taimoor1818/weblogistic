"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { User } from "@/lib/types";
import { checkAndUpdateSubscriptionStatus } from "@/lib/subscription";
import { DashboardWidgets } from "@/components/dashboard/DashboardWidgets";
import { toast } from "react-hot-toast";
import { Truck, Users, CreditCard, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardPage() {
    const router = useRouter();
    const { profile, setProfile, trips, drivers, vehicles, payments } = useStore();
    const [loading, setLoading] = useState(true);
    // Stats are now calculated directly from the store data using useMemo

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

                        // Stats are now calculated directly from the store data
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

    // Stats are now calculated directly from the store data using useMemo

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
                <h1 className="text-3xl font-bold tracking-tight">{profile?.companyName || "WebLogistic"} Dashboard</h1>
                <p className="text-muted-foreground mt-2">
                    Welcome back, {profile?.name}
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/dashboard/trips')}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
                        <Truck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{trips.filter(t => t.status === 'delivered').length}</div>
                        <p className="text-xs text-muted-foreground">Delivered shipments</p>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/dashboard/drivers')}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Drivers</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{drivers.filter((d: any) => d.status === 'available').length}</div>
                        <p className="text-xs text-muted-foreground">Available drivers</p>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/dashboard/payments')}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Issue Payments</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{payments.filter((p: any) => p.status === 'pending').length}</div>
                        <p className="text-xs text-muted-foreground">Payments to be issued</p>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/dashboard/vehicles')}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Vehicles</CardTitle>
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{vehicles.filter((v: any) => v.status === 'available').length}</div>
                        <p className="text-xs text-muted-foreground">Operational</p>
                    </CardContent>
                </Card>
            </div>

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