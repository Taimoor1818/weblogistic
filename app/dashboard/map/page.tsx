"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MapPage() {
    // Replace with your actual Google Maps Embed API URL
    // Format: https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=LOCATION
    const googleMapsEmbedUrl = "https://www.google.com/maps/embed/v1/place?key=YOUR_GOOGLE_MAPS_API_KEY&q=New+York,NY";

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
                <CardHeader>
                    <CardTitle>Fleet Tracking</CardTitle>
                </CardHeader>
                <CardContent className="h-full p-0">
                    <div className="h-full w-full rounded-lg overflow-hidden">
                        <iframe
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            loading="lazy"
                            src={googleMapsEmbedUrl}
                            allowFullScreen
                        ></iframe>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}