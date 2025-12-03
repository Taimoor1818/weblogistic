"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/store/useStore";

import { Fuel, TrendingUp, Activity, AlertCircle } from "lucide-react";
import { useMemo } from "react";

export function DashboardWidgets() {
    const { trips, drivers, vehicles } = useStore();

    const stats = useMemo(() => {
        const activeTrips = trips.filter((t) => t.status === "in-transit").length;
        const completedTrips = trips.filter((t) => t.status === "delivered").length;

        // Mock fuel data for now (until we implement expenses)
        const totalFuel = vehicles.length * 150; // Random mock

        // Driver performance (mock logic based on completed trips)
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
            <Card className="hover:border-primary/50 transition-all">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Live Trips</CardTitle>
                    <Activity className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.activeTrips}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Vehicles currently on road
                    </p>
                </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-all">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Fuel Usage (Est)</CardTitle>
                    <Fuel className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalFuel} L</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Total consumption this month
                    </p>
                </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-all">
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

            <Card className="hover:border-primary/50 transition-all">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completed Trips</CardTitle>
                    <AlertCircle className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.completedTrips}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Total successful deliveries
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
