"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Employee } from "@/types";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/store/useStore";
import { toast } from "react-hot-toast";
import { Plus } from "lucide-react";

interface EmployeeDialogProps {
    employee?: Employee;
    trigger?: React.ReactNode;
}

export function EmployeeDialog({ employee, trigger }: EmployeeDialogProps) {
    const [open, setOpen] = useState(false);
    const { addEmployee, updateEmployee } = useStore();

    const { register, handleSubmit, reset } = useForm<Employee>({
        defaultValues: employee || {
            position: "",
            salaryType: "monthly",
            salaryAmount: 0,
            joinedDate: new Date().toISOString(),
            name: "",
            phone: ""
        },
    });

    const onSubmit = async (data: Employee) => {
        try {
            if (employee) {
                await updateEmployee({ ...employee, ...data });
            } else {
                await addEmployee({
                    ...data,
                    joinedDate: new Date().toISOString(),
                });
            }
            setOpen(false);
            reset();
            toast.success(employee ? "Employee updated" : "Employee added");
        } catch (error) {
            console.error(error);
            toast.error(employee ? "Failed to update employee" : "Failed to add employee");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Employee
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{employee ? "Edit Employee" : "Add New Employee"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" {...register("name", { required: true })} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="position">Position</Label>
                        <Input id="position" {...register("position", { required: true })} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" {...register("phone", { required: true })} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="salaryType">Salary Type</Label>
                            <select
                                id="salaryType"
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                {...register("salaryType", { required: true })}
                            >
                                <option value="per-trip">Per Trip</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="salaryAmount">Amount</Label>
                            <Input
                                id="salaryAmount"
                                type="number"
                                {...register("salaryAmount", { required: true, valueAsNumber: true })}
                            />
                        </div>
                    </div>

                    <Button type="submit" className="w-full">
                        {employee ? "Update Employee" : "Add Employee"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}