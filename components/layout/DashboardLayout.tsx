"use client";

import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useStore } from "@/store/useStore";
import { useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, getRedirectResult } from "firebase/auth";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { StatusBadge } from "@/components/ui/status-badge";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { isLoading, initialized, profile } = useStore();
    const { loading: authLoading, isAuthenticated, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Handle redirect results
        const handleRedirectResult = async () => {
            try {
                const result = await getRedirectResult(auth);
                if (result) {
                    toast.success("Welcome back!");
                    // Redirect to dashboard after successful login
                    router.push("/dashboard");
                }
            } catch (error) {
                console.error("Redirect sign-in error:", error);
                toast.error("Authentication failed. Please try again.");
            }
        };

        handleRedirectResult();

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            // Also check for MPIN authentication
            if (!user && typeof window !== 'undefined') {
                const mpinUserId = localStorage.getItem('mpin_authenticated_user');
                if (!mpinUserId) {
                    router.push("/login");
                }
            } else if (!user) {
                router.push("/login");
            }
        });

        return () => unsubscribe();
    }, [router]);

    // Handle authentication redirect in useEffect to avoid React warnings
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            // Check for MPIN authentication before redirecting
            if (typeof window !== 'undefined') {
                const mpinUserId = localStorage.getItem('mpin_authenticated_user');
                if (!mpinUserId) {
                    router.push("/login");
                }
            } else {
                router.push("/login");
            }
        }
    }, [authLoading, isAuthenticated, router]);

    // Show loading spinner while authenticating or initializing store
    if (authLoading || (!isAuthenticated && !authLoading) || (isAuthenticated && isLoading && !initialized)) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading dashboard...</p>
                    <div className="mt-2 text-xs text-muted-foreground">
                        {authLoading && <span>Authenticating...</span>}
                        {!authLoading && isAuthenticated && isLoading && !initialized && <span>Initializing data...</span>}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <div className="hidden lg:block">
                <Sidebar />
            </div>
            <div className="flex flex-1 flex-col overflow-hidden">
                <Header />
                {/* Desktop Header */}
                <div className="hidden lg:flex h-16 items-center justify-between border-b bg-background px-6">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold">{profile?.companyName || "WebLogistic"}</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                            <p className="text-sm font-medium truncate max-w-[200px]">{user?.email || "user@example.com"}</p>
                            {user?.subscriptionStatus && (
                                <StatusBadge status={user.subscriptionStatus} showDot={false} className="scale-75 origin-right" />
                            )}
                        </div>
                    </div>
                </div>
                <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}