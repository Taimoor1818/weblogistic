"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Customer } from "@/types";
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

import { Plus } from "lucide-react";

interface CustomerDialogProps {
    customer?: Customer;
    trigger?: React.ReactNode;
}

export function CustomerDialog({ customer, trigger }: CustomerDialogProps) {
    const [open, setOpen] = useState(false);
    const { addCustomer, updateCustomer } = useStore();

    const { register, handleSubmit, reset } = useForm<Customer>({
        defaultValues: customer || {},
    });

    const onSubmit = async (data: Customer) => {
        try {
            if (customer) {
                await updateCustomer({ ...customer, ...data });
            } else {
                await addCustomer({
                    ...data,
                });
            }
            setOpen(false);
            reset();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Customer
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{customer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" {...register("name", { required: true })} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" {...register("email")} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" {...register("phone", { required: true })} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="address">Address</Label>
                        <Input id="address" {...register("address", { required: true })} />
                    </div>

                    <Button type="submit" className="w-full">
                        {customer ? "Update Customer" : "Add Customer"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
