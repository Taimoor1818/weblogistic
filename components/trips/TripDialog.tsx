"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Trip, Driver } from "@/types";
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

import { Plus, Circle } from "lucide-react";

interface TripDialogProps {
    trip?: Trip;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function TripDialog({ trip, trigger, open: controlledOpen, onOpenChange: controlledOnOpenChange }: TripDialogProps) {
    const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
    
    const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
    const setOpen = controlledOnOpenChange !== undefined ? controlledOnOpenChange : setUncontrolledOpen;
    const { addTrip, updateTrip, updateDriver, drivers, vehicles, customers } = useStore();
    
    const { register, handleSubmit, reset, setValue, control } = useForm<Trip>({
        defaultValues: trip || {
            status: "planned",
        },
    });
    
    const watchDriverId = useWatch({
        control,
        name: "driverId",
        defaultValue: trip?.driverId || ""
    });

    const onSubmit = async (data: Trip) => {
        try {
            if (trip) {
                // Update existing trip
                await updateTrip({ ...trip, ...data });
                
                // Update driver status if trip is assigned
                if (data.status === 'assigned' && data.driverId) {
                    const driver = drivers.find(d => d.id === data.driverId);
                    if (driver && driver.status !== 'busy') {
                        updateDriver({ ...driver, status: 'busy' });
                    }
                }
                // Update driver status to available if trip is delivered or returned
                else if ((data.status === 'delivered' || data.status === 'returned') && data.driverId) {
                    const driver = drivers.find(d => d.id === data.driverId);
                    if (driver && driver.status !== 'available') {
                        updateDriver({ ...driver, status: 'available' });
                    }
                }
            } else {
                // Create new trip
                await addTrip({
                    ...data,
                    createdAt: new Date().toISOString(),
                    status: "planned",
                });
                
                // Update driver status if trip is assigned
                if (data.status === 'assigned' && data.driverId) {
                    const driver = drivers.find(d => d.id === data.driverId);
                    if (driver && driver.status !== 'busy') {
                        updateDriver({ ...driver, status: 'busy' });
                    }
                }
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
                                        <div className="flex items-center">
                                            {c.name}
                                            {c.phone && (
                                                <span className="ml-2 text-xs text-muted-foreground">({c.phone})</span>
                                            )}
                                        </div>
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
                                            <div className="flex items-center">
                                                <Circle 
                                                    className={`w-3 h-3 mr-2 ${d.status === 'available' ? 'text-green-500' : d.status === 'busy' ? 'text-red-500 animate-pulse' : 'text-gray-500'}`} 
                                                    fill={d.status === 'available' ? 'currentColor' : d.status === 'busy' ? 'currentColor' : 'none'}
                                                />
                                                {d.name} 
                                                {d.phone && (
                                                    <span className="ml-2 text-xs text-muted-foreground">({d.phone})</span>
                                                )}
                                            </div>
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
                                onValueChange={(value) => {
                                    setValue("status", value as 'planned' | 'assigned' | 'picked-up' | 'in-transit' | 'delivered' | 'returned');
                                    
                                    // Update driver status when trip status changes
                                    if (value === 'assigned' && watchDriverId) {
                                        const driver = drivers.find(d => d.id === watchDriverId);
                                        if (driver && driver.status !== 'busy') {
                                            updateDriver({ ...driver, status: 'busy' });
                                        }
                                    } else if ((value === 'delivered' || value === 'returned') && watchDriverId) {
                                        const driver = drivers.find(d => d.id === watchDriverId);
                                        if (driver && driver.status !== 'available') {
                                            updateDriver({ ...driver, status: 'available' });
                                        }
                                    }
                                }}
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
                                    <SelectItem value="returned">Returned</SelectItem>
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
