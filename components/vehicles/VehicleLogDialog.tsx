"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "react-hot-toast";
import { Wrench, Calendar, DollarSign, Gauge } from "lucide-react";
import { MaintenanceType } from "@/lib/types";

interface VehicleLogDialogProps {
    vehicleId: string;
    vehiclePlate: string;
    trigger?: React.ReactNode;
}

export function VehicleLogDialog({ vehicleId, vehiclePlate, trigger }: VehicleLogDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        type: "service" as MaintenanceType,
        date: new Date().toISOString().split("T")[0],
        cost: "",
        odometer: "",
        description: "",
        provider: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await addDoc(collection(db, "maintenance_logs"), {
                vehicleId,
                type: formData.type,
                date: new Date(formData.date),
                cost: parseFloat(formData.cost) || 0,
                odometer: parseInt(formData.odometer) || 0,
                description: formData.description,
                provider: formData.provider,
                createdAt: serverTimestamp()
            });

            toast.success("Maintenance log added");
            setOpen(false);
            setFormData({
                type: "service",
                date: new Date().toISOString().split("T")[0],
                cost: "",
                odometer: "",
                description: "",
                provider: ""
            });
        } catch (error) {
            console.error("Error adding log:", error);
            toast.error("Failed to add log");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm">
                        <Wrench className="h-4 w-4 mr-2" />
                        Add Log
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Maintenance Log</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        Record service or maintenance for {vehiclePlate}
                    </p>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Log Type</Label>
                        <Select
                            value={formData.type}
                            onValueChange={(value: MaintenanceType) => setFormData({ ...formData, type: value })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="service">Regular Service</SelectItem>
                                <SelectItem value="tyre">Tyre Change/Repair</SelectItem>
                                <SelectItem value="battery">Battery Replacement</SelectItem>
                                <SelectItem value="repair">General Repair</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Date</Label>
                            <div className="relative">
                                <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="date"
                                    className="pl-8"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Cost</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    className="pl-8"
                                    value={formData.cost}
                                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Odometer Reading (km)</Label>
                        <div className="relative">
                            <Gauge className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="number"
                                placeholder="Current mileage"
                                className="pl-8"
                                value={formData.odometer}
                                onChange={(e) => setFormData({ ...formData, odometer: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Service Provider</Label>
                        <Input
                            placeholder="Workshop or mechanic name"
                            value={formData.provider}
                            onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Description</Label>
                        <Textarea
                            placeholder="Details about the service performed..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : "Save Log"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
