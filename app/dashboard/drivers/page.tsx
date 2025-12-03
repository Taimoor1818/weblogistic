"use client";

import { useStore } from "@/store/useStore";
import { DriverDialog } from "@/components/drivers/DriverDialog";
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
import { Edit, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";

export default function DriversPage() {
    const { drivers, deleteDriver } = useStore();

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this driver?")) {
            await deleteDriver(id);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Drivers</h2>
                    <p className="text-muted-foreground">
                        Manage your fleet drivers and their status.
                    </p>
                </div>
                <DriverDialog />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Drivers</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Driver</TableHead>
                                <TableHead>License</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {drivers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                        No drivers found. Add your first driver.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                drivers.map((driver) => (
                                    <TableRow key={driver.id}>
                                        <TableCell className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={driver.photoURL} />
                                                <AvatarFallback>{driver.name[0]}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{driver.name}</span>
                                        </TableCell>
                                        <TableCell>{driver.licenseNumber}</TableCell>
                                        <TableCell>{driver.phone}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    driver.status === "available"
                                                        ? "default" // Changed from success to default as success might not exist in shadcn default
                                                        : driver.status === "busy"
                                                            ? "secondary" // Changed from warning
                                                            : "destructive"
                                                }
                                                className={
                                                    driver.status === "available" ? "bg-green-500 hover:bg-green-600" :
                                                        driver.status === "busy" ? "bg-yellow-500 hover:bg-yellow-600" : ""
                                                }
                                            >
                                                {driver.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(driver.joinedDate), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <DriverDialog
                                                    driver={driver}
                                                    trigger={
                                                        <Button variant="ghost" size="icon">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    }
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(driver.id)}
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
