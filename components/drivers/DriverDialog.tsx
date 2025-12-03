"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Driver } from "@/types";
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
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-hot-toast";
import { Plus, Upload } from "lucide-react";
import Image from "next/image";

interface DriverDialogProps {
    driver?: Driver;
    trigger?: React.ReactNode;
}

export function DriverDialog({ driver, trigger }: DriverDialogProps) {
    const [open, setOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [photoPreview, setPhotoPreview] = useState<string | null>(
        driver?.photoURL || null
    );
    const { addDriver, updateDriver, profile } = useStore();

    const { register, handleSubmit, reset, setValue } = useForm<Driver>({
        defaultValues: driver || {
            status: "available",
        },
    });

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !profile?.uid) return;

        setUploading(true);
        try {
            const storageRef = ref(storage, `users/${profile.uid}/drivers/${uuidv4()}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            setPhotoPreview(url);
            setValue("photoURL", url);
            toast.success("Photo uploaded");
        } catch (error) {
            console.error(error);
            toast.error("Failed to upload photo");
        } finally {
            setUploading(false);
        }
    };

    const onSubmit = async (data: Driver) => {
        try {
            if (driver) {
                await updateDriver({ ...driver, ...data });
            } else {
                await addDriver({
                    ...data,
                    joinedDate: new Date().toISOString(),
                    status: "available",
                });
            }
            setOpen(false);
            reset();
            setPhotoPreview(null);
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
                        Add Driver
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{driver ? "Edit Driver" : "Add New Driver"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-dashed border-muted-foreground/50 bg-muted">
                            {photoPreview ? (
                                <Image
                                    src={photoPreview}
                                    alt="Preview"
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                    <Upload className="h-8 w-8 text-muted-foreground" />
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={handleImageUpload}
                                disabled={uploading}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {uploading ? "Uploading..." : "Click to upload photo"}
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" {...register("name", { required: true })} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" {...register("phone", { required: true })} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="licenseNumber">License Number</Label>
                        <Input
                            id="licenseNumber"
                            {...register("licenseNumber", { required: true })}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="licenseExpiry">License Expiry</Label>
                        <Input
                            id="licenseExpiry"
                            type="date"
                            {...register("licenseExpiry", { required: true })}
                        />
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

                    <Button type="submit" className="w-full" disabled={uploading}>
                        {driver ? "Update Driver" : "Add Driver"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
