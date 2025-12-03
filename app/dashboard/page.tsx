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
import { toast } from "react-hot-toast";
import { Truck, Users, CreditCard, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardPage() {
    const router = useRouter();
    const { profile, setProfile } = useStore();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalShipments: 0,
        activeDrivers: 0,
        pendingPayments: 0,
        activeVehicles: 0,
    });

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
                            router.push("/dashboard/payment");
                            return;
                        }

                        // Fetch dashboard stats
                        fetchDashboardStats(firebaseUser.uid);
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

    const fetchDashboardStats = async (uid: string) => {
        try {
            // In a real app, you would fetch actual stats from your database
            // For now, we'll use dummy data
            setStats({
                totalShipments: 124,
                activeDrivers: 8,
                pendingPayments: 3,
                activeVehicles: 12,
            });
        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
            toast.error("Failed to load dashboard statistics");
        }
    };

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

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
                        <Truck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalShipments}</div>
                        <p className="text-xs text-muted-foreground">+12% from last month</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Drivers</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeDrivers}</div>
                        <p className="text-xs text-muted-foreground">+2 from last week</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pendingPayments}</div>
                        <p className="text-xs text-muted-foreground">Requires attention</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Vehicles</CardTitle>
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeVehicles}</div>
                        <p className="text-xs text-muted-foreground">All systems operational</p>
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