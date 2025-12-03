"use client";

import { useStore } from "@/store/useStore";
import { VehicleDialog } from "@/components/vehicles/VehicleDialog";
import { VehicleLogDialog } from "@/components/vehicles/VehicleLogDialog";
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
import { Edit, Trash2, Truck } from "lucide-react";

export default function VehiclesPage() {
    const { vehicles, deleteVehicle } = useStore();

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this vehicle?")) {
            await deleteVehicle(id);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Vehicles</h2>
                    <p className="text-muted-foreground">
                        Manage your fleet vehicles.
                    </p>
                </div>
                <VehicleDialog />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Vehicles</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Plate Number</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Capacity</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {vehicles.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        No vehicles found. Add your first vehicle.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                vehicles.map((vehicle) => (
                                    <TableRow key={vehicle.id}>
                                        <TableCell className="font-medium flex items-center gap-2">
                                            <Truck className="h-4 w-4 text-muted-foreground" />
                                            {vehicle.plateNumber}
                                        </TableCell>
                                        <TableCell className="capitalize">{vehicle.type}</TableCell>
                                        <TableCell>{vehicle.capacity}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    vehicle.status === "available"
                                                        ? "default"
                                                        : vehicle.status === "in-use"
                                                            ? "secondary"
                                                            : "destructive"
                                                }
                                                className={
                                                    vehicle.status === "available" ? "bg-green-500 hover:bg-green-600" :
                                                        vehicle.status === "in-use" ? "bg-blue-500 hover:bg-blue-600" : ""
                                                }
                                            >
                                                {vehicle.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <VehicleLogDialog
                                                    vehicleId={vehicle.id}
                                                    vehiclePlate={vehicle.plateNumber}
                                                />
                                                <VehicleDialog
                                                    vehicle={vehicle}
                                                    trigger={
                                                        <Button variant="ghost" size="icon">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    }
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(vehicle.id)}
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
