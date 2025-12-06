"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { collection, query, getDocs, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AdminGuard from "@/components/admin/AdminGuard";
import { Users, CreditCard, AlertCircle, CheckCircle2 } from "lucide-react";
import { PaymentRequest } from "@/lib/types";
import { toast } from "react-hot-toast";

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        pendingPayments: 0,
        activeSubscriptions: 0,
        totalRevenue: 0
    });
    const [recentRequests, setRecentRequests] = useState<PaymentRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch users stats
            const usersSnapshot = await getDocs(collection(db, "users"));
            const totalUsers = usersSnapshot.size;
            const activeSubscriptions = usersSnapshot.docs.filter(
                doc => doc.data().subscriptionStatus === "active"
            ).length;

            // Fetch payment stats
            const paymentsSnapshot = await getDocs(collection(db, "paymentRequests"));
            const pendingPayments = paymentsSnapshot.docs.filter(
                doc => doc.data().status === "pending"
            ).length;
            const approvedPayments = paymentsSnapshot.docs.filter(
                doc => doc.data().status === "approved"
            );
            const totalRevenue = approvedPayments.reduce(
                (acc, doc) => acc + (doc.data().amount || 0),
                0
            );

            setStats({
                totalUsers,
                pendingPayments,
                activeSubscriptions,
                totalRevenue
            });

            // Get recent pending requests
            try {
                const q = query(
                    collection(db, "paymentRequests"),
                    where("status", "==", "pending"),
                    orderBy("requestDate", "desc"),
                    limit(5)
                );
                const recentSnapshot = await getDocs(q);
                setRecentRequests(recentSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as PaymentRequest[]);
            } catch (queryError: unknown) {
                console.error("Error fetching recent requests:", queryError);
                // Handle the index error specifically
                const err = queryError as { code?: string; message: string };
                if (err.code === "failed-precondition" && err.message.includes("query requires an index")) {
                    setError("The application requires a Firestore index to display recent requests. Please contact the administrator.");
                    toast.error("Missing database index. Some features may be limited.");
                } else {
                    setError("Failed to load recent requests.");
                    toast.error("Failed to load recent requests.");
                }
                // Set empty array to avoid breaking the UI
                setRecentRequests([]);
            }

        } catch (error: unknown) {
            console.error("Error fetching admin stats:", error);
            setError("Failed to load dashboard statistics.");
            toast.error("Failed to load dashboard statistics.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            if (isMounted) {
                await fetchStats();
            }
        };

        loadData();

        return () => {
            isMounted = false;
        };
    }, [fetchStats]);

    return (
        <AdminGuard>
            <div className="container mx-auto py-8 px-4">
                <h1 className="text-3xl font-bold tracking-tight mb-8">Admin Dashboard</h1>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : error ? (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
                        <p className="text-destructive">{error}</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Some dashboard features may be temporarily unavailable.
                        </p>
                    </div>
                ) : null}

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalUsers}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.pendingPayments}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">SR {stats.totalRevenue}</div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card className="col-span-2">
                        <CardHeader>
                            <CardTitle>Recent Payment Requests</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {recentRequests.length === 0 ? (
                                <p className="text-muted-foreground">
                                    {error ? "Unable to load requests due to missing index" : "No pending requests."}
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {recentRequests.map((request) => (
                                        <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div>
                                                <p className="font-medium">{request.userName}</p>
                                                <p className="text-sm text-muted-foreground">{request.userEmail}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold">SR {request.amount}</p>
                                                <p className="text-xs text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full inline-block">
                                                    Pending
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminGuard>
    );
}