"use client";

import { cn } from "@/lib/utils";

interface StatusBadgeProps {
    status: "active" | "pending" | "expired" | "trial" | "pending_payment";
    showDot?: boolean;
    className?: string;
}

export function StatusBadge({ status, showDot = true, className }: StatusBadgeProps) {
    const statusConfig = {
        active: {
            label: "Active",
            color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
            dotColor: "bg-green-500",
        },
        pending: {
            label: "Pending",
            color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
            dotColor: "bg-red-500 animate-pulse",
        },
        pending_payment: {
            label: "Payment Pending",
            color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
            dotColor: "bg-red-500 animate-pulse",
        },
        expired: {
            label: "Expired",
            color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
            dotColor: "bg-gray-500",
        },
        trial: {
            label: "Trial",
            color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
            dotColor: "bg-red-500 animate-pulse",
        },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
                config.color,
                className
            )}
        >
            {showDot && (
                <span className={cn("w-2 h-2 rounded-full", config.dotColor)} />
            )}
            {config.label}
        </span>
    );
}