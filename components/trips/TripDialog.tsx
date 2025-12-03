"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Trip } from "@/types";
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

interface TripDialogProps {
    trip?: Trip;
    trigger?: React.ReactNode;
}

export function TripDialog({ trip, trigger }: TripDialogProps) {
    const [open, setOpen] = useState(false);
    const { addTrip, updateTrip, drivers, vehicles, customers } = useStore();

    const { register, handleSubmit, reset, setValue } = useForm<Trip>({
        defaultValues: trip || {
            status: "planned",
        },
    });

    const onSubmit = async (data: Trip) => {
        try {
            if (trip) {
                await updateTrip({ ...trip, ...data });
            } else {
                await addTrip({
                    ...data,
                    createdAt: new Date().toISOString(),
                    status: "planned",
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
                        New Trip
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{trip ? "Edit Trip" : "Create New Trip"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="customerId">Customer</Label>
                        <Select
                            onValueChange={(value) => setValue("customerId", value)}
                            defaultValue={trip?.customerId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select customer" />
                            </SelectTrigger>
                            <SelectContent>
                                {customers.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="driverId">Driver</Label>
                            <Select
                                onValueChange={(value) => setValue("driverId", value)}
                                defaultValue={trip?.driverId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select driver" />
                                </SelectTrigger>
                                <SelectContent>
                                    {drivers.map((d) => (
                                        <SelectItem key={d.id} value={d.id}>
                                            {d.name} ({d.status})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="vehicleId">Vehicle</Label>
                            <Select
                                onValueChange={(value) => setValue("vehicleId", value)}
                                defaultValue={trip?.vehicleId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select vehicle" />
                                </SelectTrigger>
                                <SelectContent>
                                    {vehicles.map((v) => (
                                        <SelectItem key={v.id} value={v.id}>
                                            {v.plateNumber} ({v.type})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="pickupLocation">Pickup Location</Label>
                        <Input
                            id="pickupLocation"
                            {...register("pickupLocation", { required: true })}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="dropoffLocation">Dropoff Location</Label>
                        <Input
                            id="dropoffLocation"
                            {...register("dropoffLocation", { required: true })}
                        />
                    </div>

                    {trip && (
                        <div className="grid gap-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                onValueChange={(value) => setValue("status", value as 'planned' | 'assigned' | 'picked-up' | 'in-transit' | 'delivered')}
                                defaultValue={trip.status}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="planned">Planned</SelectItem>
                                    <SelectItem value="assigned">Assigned</SelectItem>
                                    <SelectItem value="picked-up">Picked Up</SelectItem>
                                    <SelectItem value="in-transit">In Transit</SelectItem>
                                    <SelectItem value="delivered">Delivered</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <Button type="submit" className="w-full">
                        {trip ? "Update Trip" : "Create Trip"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
