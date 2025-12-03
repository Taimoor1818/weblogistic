"use client";

import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";

const LiveMap = dynamic(() => import("@/components/map/LiveMap"), {
    ssr: false,
    loading: () => <div className="h-[600px] w-full bg-muted animate-pulse rounded-lg" />,
});

export default function MapPage() {
    return (
        <div className="space-y-8 h-[calc(100vh-8rem)]">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Live Map</h2>
                    <p className="text-muted-foreground">
                        Real-time tracking of your fleet.
                    </p>
                </div>
            </div>

            <Card className="h-full border-none shadow-none bg-transparent">
                <CardContent className="h-full p-0">
                    <LiveMap />
                </CardContent>
            </Card>
        </div>
    );
}
