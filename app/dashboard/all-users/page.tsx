"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User } from "@/lib/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function AllUsersPage() {
    const [users, setUsers] = useState<(User & { id: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();

    // Redirect if not admin or not authenticated
    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated) {
                router.push("/login");
            } else if (!isAdmin) {
                router.push("/dashboard");
            }
        }
    }, [isAuthenticated, isAdmin, authLoading, router]);

    useEffect(() => {
        // Only fetch users if authenticated and admin
        if (isAuthenticated && isAdmin) {
            const fetchUsers = async () => {
                try {
                    setLoading(true);
                    const usersSnapshot = await getDocs(collection(db, "users"));
                    const usersData = usersSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...(doc.data() as User)
                    }));
                    
                    setUsers(usersData);
                } catch (err) {
                    console.error("Error fetching users:", err);
                    setError("Failed to load users");
                } finally {
                    setLoading(false);
                }
            };

            fetchUsers();
        }
    }, [isAuthenticated, isAdmin]);

    if (authLoading || loading) {
        return (
            <div className="container mx-auto py-8">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto py-8">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center text-destructive">
                            <p>{error}</p>
                            <p className="text-sm text-muted-foreground mt-2">
                                Please try refreshing the page
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // If not admin, don't show content
    if (!isAdmin) {
        return null;
    }

    return (
        <div className="container mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">All Users</h1>
                <p className="text-muted-foreground mt-2">
                    Manage all users in the system
                </p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                User Management
                            </CardTitle>
                            <CardDescription>
                                View and manage all registered users
                            </CardDescription>
                        </div>
                        <Badge variant="secondary">
                            {users.length} users
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    {users.length === 0 ? (
                        <div className="text-center py-8">
                            <Users className="h-12 w-12 mx-auto text-muted-foreground" />
                            <p className="mt-2 text-muted-foreground">No users found</p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Joined</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    {user.photoURL ? (
                                                        <img 
                                                            src={user.photoURL} 
                                                            alt={user.displayName}
                                                            className="h-8 w-8 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                            <span className="text-xs font-medium text-primary">
                                                                {user.displayName?.charAt(0)?.toUpperCase()}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-medium">{user.displayName}</p>
                                                        {user.companyName && (
                                                            <p className="text-xs text-muted-foreground">
                                                                {user.companyName}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">
                                                {user.email}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge status={user.subscriptionStatus} />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Calendar className="h-3 w-3" />
                                                    {user.createdAt && format(new Date(user.createdAt.toDate()), "MMM dd, yyyy")}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}