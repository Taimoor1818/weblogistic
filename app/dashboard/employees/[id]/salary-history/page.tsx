"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, DollarSign, Calendar, CreditCard, Clock } from "lucide-react";
import { getCurrencySymbol } from "@/lib/currency";

export default function EmployeeSalaryHistoryPage() {
    const router = useRouter();
    const params = useParams();
    const { employees, payments, settings } = useStore();
    const [employee, setEmployee] = useState<any>(null);
    
    const employeeId = params.id as string;
    
    useEffect(() => {
        // Find the employee by ID
        const foundEmployee = employees.find(emp => emp.id === employeeId);
        setEmployee(foundEmployee);
    }, [employeeId, employees]);
    
    // Filter payments for this employee
    const employeePayments = payments.filter(payment => 
        payment.type === 'salary' && payment.employeeId === employeeId
    );
    
    // Calculate total salary paid to this employee
    const totalSalaryPaid = employeePayments
        .filter(payment => payment.status === 'paid')
        .reduce((sum, payment) => sum + payment.amount, 0);
    
    const lastPaymentDate = employeePayments.length > 0 ? employeePayments[employeePayments.length - 1].date : null;
    
    if (!employee) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }
    
    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-6">
                <Button variant="outline" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Employees
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">Salary History</h1>
                <p className="text-muted-foreground">
                    View salary payment history for {employee?.name}
                </p>
            </div>

            <div className="grid gap-6 mb-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Salary Paid</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{getCurrencySymbol(settings.currency)}{totalSalaryPaid.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">All time salary payments</p>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Salary</CardTitle>
                        <Calendar className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{getCurrencySymbol(settings.currency)}{employee?.salaryAmount?.toFixed(2) || '0.00'}</div>
                        <p className="text-xs text-muted-foreground">Per {employee?.salaryType}</p>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Payment Count</CardTitle>
                        <CreditCard className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{employeePayments.length}</div>
                        <p className="text-xs text-muted-foreground">Total payments made</p>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Last Payment</CardTitle>
                        <Clock className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {lastPaymentDate ? new Date(lastPaymentDate).toLocaleDateString() : 'N/A'}
                        </div>
                        <p className="text-xs text-muted-foreground">Most recent payment</p>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Salary Payment History</CardTitle>
                </CardHeader>
                <CardContent>
                    {employeePayments.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No salary payments recorded for this employee yet.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {employeePayments.map((payment) => (
                                    <TableRow key={payment.id}>
                                        <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                                        <TableCell>{payment.description}</TableCell>
                                        <TableCell className="font-medium">
                                            {getCurrencySymbol(settings.currency)}{payment.amount.toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={
                                                payment.status === 'paid' ? 'bg-green-100 text-green-800' :
                                                payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-gray-100 text-gray-800'
                                            }>
                                                {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}