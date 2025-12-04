"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function TestPage() {
    const { user, loading, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push("/login");
        }
    }, [loading, isAuthenticated, router]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8">Test Page</h1>
            
            {user ? (
                <div className="bg-card p-6 rounded-lg border">
                    <h2 className="text-xl font-semibold mb-4">User Information</h2>
                    <div className="space-y-2">
                        <p><strong>Name:</strong> {user.displayName}</p>
                        <p><strong>Email:</strong> {user.email}</p>
                        <p><strong>Role:</strong> {user.role}</p>
                        <p><strong>Subscription Status:</strong> {user.subscriptionStatus}</p>
                        <p><strong>UID:</strong> {user.uid}</p>
                    </div>
                    
                    <button 
                        onClick={() => router.push("/dashboard")}
                        className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                        Go to Dashboard
                    </button>
                </div>
            ) : (
                <div className="bg-card p-6 rounded-lg border">
                    <p>No user data available</p>
                </div>
            )}
        </div>
    );
}