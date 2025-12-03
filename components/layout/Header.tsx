"use client";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Bell } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/store/useStore";
import { StatusBadge } from "@/components/ui/status-badge";

export function Header() {
    const { user } = useAuth();
    const { profile } = useStore();
    
    return (
        <header className="flex h-16 items-center justify-between border-b bg-background px-6 lg:hidden">
            <div className="flex items-center gap-4">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="lg:hidden">
                            <Menu className="h-6 w-6" />
                            <span className="sr-only">Toggle navigation menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-64">
                        <Sidebar />
                    </SheetContent>
                </Sheet>
                <span className="font-bold text-lg">{profile?.companyName || "WebLogistic"}</span>
            </div>
            <div className="flex items-center gap-4">
                <div className="hidden sm:flex flex-col items-end">
                    <p className="text-sm font-medium truncate max-w-[150px]">{user?.email || "user@example.com"}</p>
                    {user?.subscriptionStatus && (
                        <StatusBadge status={user.subscriptionStatus} showDot={false} className="scale-75 origin-right" />
                    )}
                </div>
                <Button variant="ghost" size="icon">
                    <Bell className="h-5 w-5" />
                </Button>
                <ModeToggle />
            </div>
        </header>
    );
}
