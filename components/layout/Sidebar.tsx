"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    Truck,
    Settings,
    LogOut,
    Package,
    FileText,
    CreditCard,
    Briefcase,
    Map
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/store/useStore";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/ui/status-badge";

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isAdmin } = useAuth();
    const { profile } = useStore();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push("/login");
            toast.success("Logged out successfully");
        } catch {
            toast.error("Failed to logout");
        }
    };

    const sidebarItems = [
        {
            title: "Dashboard",
            href: "/dashboard",
            icon: LayoutDashboard,
            color: "text-blue-500"
        },
        {
            title: "Map",
            href: "/dashboard/map",
            icon: Map,
            color: "text-cyan-500"
        },
        {
            title: "Drivers",
            href: "/dashboard/drivers",
            icon: Users,
            color: "text-green-500"
        },
        {
            title: "Vehicles",
            href: "/dashboard/vehicles",
            icon: Truck,
            color: "text-purple-500"
        },
        {
            title: "Trips",
            href: "/dashboard/trips",
            icon: Package,
            color: "text-orange-500"
        },
        {
            title: "Customers",
            href: "/dashboard/customers",
            icon: FileText,
            color: "text-red-500"
        },
        {
            title: "Team",
            href: "/dashboard/team",
            icon: Briefcase,
            color: "text-indigo-500"
        },
        {
            title: "Employees",
            href: "/dashboard/employees",
            icon: Users,
            color: "text-teal-500"
        },
        {
            title: "Settings",
            href: "/dashboard/settings",
            icon: Settings,
            color: "text-gray-500"
        },
        {
            title: "Subscription",
            href: "/dashboard/payment",
            icon: CreditCard,
            color: "text-pink-500"
        },
        {
            title: "Payment Management",
            href: "/dashboard/payments",
            icon: CreditCard,
            color: "text-yellow-500"
        },
    ];

    const adminItems = [
        {
            title: "Admin Dashboard",
            href: "/admin",
            icon: LayoutDashboard,
            color: "text-blue-500"
        },
        {
            title: "Payment Requests",
            href: "/admin/payment-requests",
            icon: CreditCard,
            color: "text-green-500"
        },
        {
            title: "All Users",
            href: "/dashboard/all-users",
            icon: Users,
            color: "text-purple-500"
        },
    ];

    return (
        <div className="flex h-full w-64 flex-col border-r bg-card text-card-foreground">
            <div className="flex h-16 items-center border-b px-6">
                <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
                    <Truck className="h-6 w-6 text-green-500" />
                    <span>WebLogistic</span>
                </Link>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
                <nav className="grid gap-1 px-2">
                    {sidebarItems.map((item, index) => (
                        <Link
                            key={index}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                                pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                            )}
                        >
                            <item.icon className={`h-4 w-4 ${item.color}`} />
                            {item.title}
                        </Link>
                    ))}

                    {isAdmin && (
                        <>
                            <div className="mt-4 mb-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Admin
                            </div>
                            {adminItems.map((item, index) => (
                                <Link
                                    key={`admin-${index}`}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                                        pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                                    )}
                                >
                                    <item.icon className={`h-4 w-4 ${item.color}`} />
                                    {item.title}
                                </Link>
                            ))}
                        </>
                    )}
                </nav>
            </div>
            <div className="border-t p-4">
                <div className="mb-4 flex items-center gap-3 px-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {user?.displayName?.[0] || "U"}
                    </div>
                    <div className="overflow-hidden flex-1">
                        <p className="truncate text-sm font-medium">{user?.displayName || "User"}</p>
                        <div className="flex items-center gap-2">
                            <p className="truncate text-xs text-muted-foreground">{user?.companyName || "My Company"}</p>
                            {user?.subscriptionStatus && (
                                <StatusBadge status={user.subscriptionStatus} showDot={false} className="scale-75 origin-left" />
                            )}
                        </div>
                    </div>
                </div>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                    Logout
                </Button>
            </div>
        </div>
    );
}