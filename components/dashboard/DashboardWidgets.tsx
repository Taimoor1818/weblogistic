"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/store/useStore";
import { useRouter } from "next/navigation";

import { Users, Package, FileText, Settings, CreditCard, TrendingUp, Wallet, DollarSign } from "lucide-react";
import { useMemo } from "react";
import { getCurrencySymbol } from "@/lib/currency";

export function DashboardWidgets() {
    const { trips, drivers, vehicles, payments, employees, customers, settings } = useStore();
    const router = useRouter();

    const stats = useMemo(() => {
        // Payment Employees count
        const totalEmployees = employees.length;
        
        // Customers count
        const totalCustomers = customers.length;
        
        // Issued payments count (paid status)
        const issuedPayments = payments.filter((p: any) => p.status === "paid").length;
        
        // Active vehicles count
        const activeVehicles = vehicles.filter((v: any) => v.status === "available").length;

        // Calculate financial stats
        const receivedPayments = payments.filter((p: any) => p.status === "received");
        const paidPayments = payments.filter((p: any) => p.status === "paid");
        
        // Total revenue from received trip payments
        const totalRevenue = receivedPayments
            .filter((p: any) => p.type === "trip")
            .reduce((sum: number, p: any) => sum + p.amount, 0);
        
        // Total expenses from paid non-trip payments
        const totalExpenses = paidPayments
            .filter((p: any) => p.type !== "trip")
            .reduce((sum: number, p: any) => sum + p.amount, 0);
        
        // Net profit
        const netProfit = totalRevenue - totalExpenses;

        return {
            totalEmployees,
            totalCustomers,
            issuedPayments,
            activeVehicles,
            totalRevenue,
            totalExpenses,
            netProfit
        };
    }, [payments, employees, customers, vehicles]);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover:border-primary/50 transition-all cursor-pointer" onClick={() => router.push('/dashboard/employees')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Payment Employees</CardTitle>
                    <Users className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalEmployees}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Total employees
                    </p>
                </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-all cursor-pointer" onClick={() => router.push('/dashboard/customers')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Customers</CardTitle>
                    <Package className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalCustomers}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Active customers
                    </p>
                </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-all cursor-pointer" onClick={() => router.push('/dashboard/payments')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Issue Payments</CardTitle>
                    <CreditCard className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.issuedPayments}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Payments issued
                    </p>
                </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-all cursor-pointer" onClick={() => router.push('/dashboard/vehicles')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Vehicles</CardTitle>
                    <Settings className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.activeVehicles}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Vehicles available
                    </p>
                </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-all cursor-pointer" onClick={() => router.push('/dashboard/payments')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{getCurrencySymbol(settings.currency)}{stats.totalRevenue.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        From trip payments
                    </p>
                </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-all cursor-pointer" onClick={() => router.push('/dashboard/payments')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                    <Wallet className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{getCurrencySymbol(settings.currency)}{stats.totalExpenses.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Salaries & expenses
                    </p>
                </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-all cursor-pointer" onClick={() => router.push('/dashboard/payments')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                    <DollarSign className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {getCurrencySymbol(settings.currency)}{stats.netProfit.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Revenue - Expenses
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}