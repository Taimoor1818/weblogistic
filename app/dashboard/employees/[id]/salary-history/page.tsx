"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { useRouter, useParams } from "next/navigation";
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
import { ArrowLeft, DollarSign } from "lucide-react";
import { format } from "date-fns";

export default function EmployeeSalaryHistoryPage() {
    const router = useRouter();
    const params = useParams();
    const { employees, payments } = useStore();
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
    
    if (!employee) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }
    
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Salary History</h2>
                        <p className="text-muted-foreground">
                            View salary payments for {employee.name}
                        </p>
                    </div>
                </div>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Employee Name</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{employee.name}</div>
                        <p className="text-xs text-muted-foreground">{employee.position}</p>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Salary Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold capitalize">{employee.salaryType}</div>
                        <p className="text-xs text-muted-foreground">Payment structure</p>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${totalSalaryPaid.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">All time salary payments</p>
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
                                        <TableCell>
                                            {format(new Date(payment.date), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {payment.description || "Salary Payment"}
                                        </TableCell>
                                        <TableCell>${payment.amount.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Badge 
                                                variant={
                                                    payment.status === 'paid' ? 'default' : 
                                                    payment.status === 'pending' ? 'secondary' : 'destructive'
                                                }
                                            >
                                                {payment.status}
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