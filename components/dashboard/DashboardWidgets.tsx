"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/store/useStore";
import { useRouter } from "next/navigation";

import { Users, Package, FileText, Settings } from "lucide-react";
import { useMemo } from "react";

export function DashboardWidgets() {
    const { trips, drivers, vehicles, payments, employees, customers } = useStore();
    const router = useRouter();

    const stats = useMemo(() => {
        // Payment Employees count
        const totalEmployees = employees.length;
        
        // Customers count
        const totalCustomers = customers.length;
        
        // Pending payments count
        const pendingPayments = payments.filter((p: any) => p.status === "pending").length;
        
        // Active vehicles count
        const activeVehicles = vehicles.filter((v: any) => v.status === "available").length;

        return {
            totalEmployees,
            totalCustomers,
            pendingPayments,
            activeVehicles
        };
    }, [employees, customers, payments, vehicles]);

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card className="hover:border-primary/50 transition-all cursor-pointer" onClick={() => router.push('/dashboard/payments')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Payment Employees</CardTitle>
                    <Users className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalEmployees}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Team members
                    </p>
                </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-all cursor-pointer" onClick={() => router.push('/dashboard/customers')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Customers</CardTitle>
                    <FileText className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalCustomers}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Client base
                    </p>
                </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-all cursor-pointer" onClick={() => router.push('/dashboard/settings')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Settings</CardTitle>
                    <Settings className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{/* No count needed for settings */}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Configure system
                    </p>
                </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-all cursor-pointer" onClick={() => router.push('/dashboard/employees')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Employees</CardTitle>
                    <Users className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalEmployees}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Staff members
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}