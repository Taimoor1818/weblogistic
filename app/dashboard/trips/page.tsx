"use client";

import { useStore } from "@/store/useStore";
import { TripDialog } from "@/components/trips/TripDialog";
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
import { Edit, Download } from "lucide-react";
import { format } from "date-fns";
import { DeliveryProof } from "@/components/trips/DeliveryProof";
import { exportToExcel } from "@/lib/export";

export default function TripsPage() {
    const { trips, drivers, vehicles, customers } = useStore();

    const getDriverName = (id: string) => drivers.find((d) => d.id === id)?.name || "Unknown";
    const getVehiclePlate = (id: string) => vehicles.find((v) => v.id === id)?.plateNumber || "Unknown";
    const getCustomerName = (id: string) => customers.find((c) => c.id === id)?.name || "Unknown";

    const handleExport = () => {
        const data = trips.map((t) => ({
            ID: t.id,
            Customer: getCustomerName(t.customerId),
            Driver: getDriverName(t.driverId),
            Vehicle: getVehiclePlate(t.vehicleId),
            Status: t.status,
            Pickup: t.pickupLocation,
            Dropoff: t.dropoffLocation,
            Date: format(new Date(t.createdAt), "yyyy-MM-dd HH:mm"),
        }));
        exportToExcel(data, "Trips_Report", "Trips");
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Trips</h2>
                    <p className="text-muted-foreground">
                        Manage and track your logistics trips.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" />
                        Export Excel
                    </Button>
                    <TripDialog />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Trips</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Driver</TableHead>
                                <TableHead>Vehicle</TableHead>
                                <TableHead>Route</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {trips.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                        No trips found. Create your first trip.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                trips.map((trip) => (
                                    <TableRow key={trip.id}>
                                        <TableCell className="font-mono text-xs">
                                            {trip.id.slice(0, 8)}
                                        </TableCell>
                                        <TableCell>{getCustomerName(trip.customerId)}</TableCell>
                                        <TableCell>{getDriverName(trip.driverId)}</TableCell>
                                        <TableCell>{getVehiclePlate(trip.vehicleId)}</TableCell>
                                        <TableCell className="max-w-[200px] truncate">
                                            <span className="text-xs text-muted-foreground">From:</span> {trip.pickupLocation}
                                            <br />
                                            <span className="text-xs text-muted-foreground">To:</span> {trip.dropoffLocation}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    trip.status === "delivered"
                                                        ? "default"
                                                        : trip.status === "planned"
                                                            ? "secondary"
                                                            : "outline"
                                                }
                                                className={
                                                    trip.status === "delivered" ? "bg-green-500 hover:bg-green-600" :
                                                        trip.status === "in-transit" ? "bg-blue-500 hover:bg-blue-600" : ""
                                                }
                                            >
                                                {trip.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {trip.status === "in-transit" && (
                                                    <DeliveryProof trip={trip} />
                                                )}
                                                <TripDialog
                                                    trip={trip}
                                                    trigger={
                                                        <Button variant="ghost" size="icon">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    }
                                                />
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
