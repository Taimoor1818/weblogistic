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
            // Check if we have MPIN session authentication only on client side
            if (typeof window !== 'undefined') {
                const mpinSession = sessionStorage.getItem('mpin_auth_session');
                if (!user && !mpinSession) {
                    router.push("/login");
                }
            } else if (!user) {
                // Server side - redirect to login if no user
                router.push("/login");
            }
        });

        return () => unsubscribe();
    }, [router]);

    // Handle authentication redirect in useEffect to avoid React warnings
    useEffect(() => {
        // Check if we have MPIN session authentication only on client side
        if (typeof window !== 'undefined') {
            const mpinSession = sessionStorage.getItem('mpin_auth_session');
            if (!authLoading && !isAuthenticated && !mpinSession) {
                router.push("/login");
            }
        } else if (!authLoading && !isAuthenticated) {
            // Server side - redirect to login if not authenticated
            router.push("/login");
        }
    }, [authLoading, isAuthenticated, router]);

    // Show loading spinner while authenticating or initializing store
    if (authLoading || (!isAuthenticated && !authLoading) || (isAuthenticated && isLoading && !initialized)) {
        // Check if we have MPIN session authentication only on client side
        let hasMPINSession = false;
        if (typeof window !== 'undefined') {
            hasMPINSession = !!sessionStorage.getItem('mpin_auth_session');
        }
        
        if (!hasMPINSession) {
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
    }

    return (
        <div className="flex h-screen">
            {/* Desktop sidebar - hidden on mobile */}
            <div className="hidden lg:block w-64 border-r bg-card">
                <Sidebar />
            </div>

            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Mobile header - hidden on desktop */}
                <Header />

                <main className="flex-1 overflow-y-auto bg-background">
                    {children}
                </main>
            </div>
        </div>
    );
}