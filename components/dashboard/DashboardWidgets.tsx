"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/store/useStore";
import { useRouter } from "next/navigation";

import { Fuel, TrendingUp, Activity, AlertCircle } from "lucide-react";
import { useMemo } from "react";

export function DashboardWidgets() {
    const { trips, drivers, vehicles, payments } = useStore();
    const router = useRouter();

    const stats = useMemo(() => {
        const activeTrips = trips.filter((t) => t.status === "assigned" || t.status === "picked-up" || t.status === "in-transit").length;
        const completedTrips = trips.filter((t) => t.status === "delivered").length;

        // Calculate actual fuel usage from payments
        const fuelExpenses = payments.filter((p: any) => p.type === "expense" && p.description.toLowerCase().includes("fuel"));
        const totalFuel = fuelExpenses.reduce((sum: number, payment: any) => sum + payment.amount, 0);

        // Driver performance (based on completed trips)
        const topDriver = drivers.reduce((prev, current) => {
            const prevTrips = trips.filter(t => t.driverId === prev.id && t.status === "delivered").length;
            const currTrips = trips.filter(t => t.driverId === current.id && t.status === "delivered").length;
            return currTrips > prevTrips ? current : prev;
        }, drivers[0]);

        return {
            activeTrips,
            completedTrips,
            totalFuel,
            topDriver: topDriver?.name || "N/A"
        };
    }, [trips, drivers, vehicles]);

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card className="hover:border-primary/50 transition-all cursor-pointer" onClick={() => router.push('/dashboard/trips')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Live Trips</CardTitle>
                    <Activity className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.activeTrips}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Assigned trips
                    </p>
                </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-all cursor-pointer" onClick={() => router.push('/dashboard/payments')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Fuel Usage</CardTitle>
                    <Fuel className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${stats.totalFuel.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Fuel expenses
                    </p>
                </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-all cursor-pointer" onClick={() => router.push('/dashboard/drivers')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Top Driver</CardTitle>
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold truncate">{stats.topDriver}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Most completed deliveries
                    </p>
                </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-all cursor-pointer" onClick={() => router.push('/dashboard/trips')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completed Trips</CardTitle>
                    <AlertCircle className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.completedTrips}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Successfully delivered
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
