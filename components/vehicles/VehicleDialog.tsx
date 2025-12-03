"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Vehicle } from "@/types";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/store/useStore";

import { Plus } from "lucide-react";

interface VehicleDialogProps {
    vehicle?: Vehicle;
    trigger?: React.ReactNode;
}

export function VehicleDialog({ vehicle, trigger }: VehicleDialogProps) {
    const [open, setOpen] = useState(false);
    const { addVehicle, updateVehicle } = useStore();

    const { register, handleSubmit, reset, setValue } = useForm<Vehicle>({
        defaultValues: vehicle || {
            status: "available",
            type: "truck",
        },
    });

    const onSubmit = async (data: Vehicle) => {
        try {
            if (vehicle) {
                await updateVehicle({ ...vehicle, ...data });
            } else {
                await addVehicle({
                    ...data,
                    status: "available",
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
                        Add Vehicle
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{vehicle ? "Edit Vehicle" : "Add New Vehicle"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="plateNumber">Plate Number</Label>
                        <Input
                            id="plateNumber"
                            {...register("plateNumber", { required: true })}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="type">Type</Label>
                        <Select
                            onValueChange={(value) => setValue("type", value as 'truck' | 'van' | 'bike' | 'car')}
                            defaultValue={vehicle?.type || "truck"}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="truck">Truck</SelectItem>
                                <SelectItem value="van">Van</SelectItem>
                                <SelectItem value="car">Car</SelectItem>
                                <SelectItem value="bike">Bike</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="capacity">Capacity (e.g., 5000kg)</Label>
                        <Input id="capacity" {...register("capacity", { required: true })} />
                    </div>

                    <Button type="submit" className="w-full">
                        {vehicle ? "Update Vehicle" : "Add Vehicle"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
