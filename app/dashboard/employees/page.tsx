"use client";

import { useStore } from "@/store/useStore";
import { EmployeeDialog } from "@/components/employees/EmployeeDialog";
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
import { Edit, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

export default function EmployeesPage() {
    const router = useRouter();
    const { employees, deleteEmployee } = useStore();

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this employee?")) {
            await deleteEmployee(id);
        }
    };

    const handleViewSalaryHistory = (employeeId: string) => {
        // Navigate to a salary history page for this employee
        router.push(`/dashboard/employees/${employeeId}/salary-history`);
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Employees</h2>
                    <p className="text-muted-foreground">
                        Manage your company employees and their details.
                    </p>
                </div>
                <EmployeeDialog />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Employees</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Position</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Salary Type</TableHead>
                                <TableHead>Salary Amount</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {employees.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                        No employees found. Add your first employee.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                employees.map((employee) => (
                                    <TableRow key={employee.id}>
                                        <TableCell className="font-medium">{employee.name}</TableCell>
                                        <TableCell>{employee.position}</TableCell>
                                        <TableCell>{employee.phone}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">
                                                {employee.salaryType}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>${employee.salaryAmount}</TableCell>
                                        <TableCell>
                                            {format(new Date(employee.joinedDate), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon"
                                                    onClick={() => handleViewSalaryHistory(employee.id)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <EmployeeDialog
                                                    employee={employee}
                                                    trigger={
                                                        <Button variant="ghost" size="icon">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    }
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(employee.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}