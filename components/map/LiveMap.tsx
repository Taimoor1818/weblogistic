"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useStore } from "@/store/useStore";


// Fix Leaflet marker icon issue
const icon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

// Mock coordinates for demo
const MOCK_LOCATIONS = [
    { lat: 40.7128, lng: -74.0060 }, // NYC
    { lat: 34.0522, lng: -118.2437 }, // LA
    { lat: 41.8781, lng: -87.6298 }, // Chicago
    { lat: 29.7604, lng: -95.3698 }, // Houston
    { lat: 33.4484, lng: -112.0740 }, // Phoenix
];

export default function LiveMap() {
    const { drivers } = useStore();
    const [driverLocations, setDriverLocations] = useState<Record<string, { lat: number; lng: number }>>({});

    useEffect(() => {
        // Initialize random locations for drivers
        const initialLocations: Record<string, { lat: number; lng: number }> = {};
        drivers.forEach((driver, index) => {
            const baseLoc = MOCK_LOCATIONS[index % MOCK_LOCATIONS.length];
            initialLocations[driver.id] = {
                lat: baseLoc.lat + (Math.random() - 0.5) * 0.1,
                lng: baseLoc.lng + (Math.random() - 0.5) * 0.1,
            };
        });
        
        // Use setTimeout to avoid calling setState directly in useEffect
        setTimeout(() => {
            setDriverLocations(initialLocations);
        }, 0);

        // Mock movement every 3s (faster than 30s for demo feel)
        const interval = setInterval(() => {
            setDriverLocations((prev) => {
                const next = { ...prev };
                Object.keys(next).forEach((id) => {
                    next[id] = {
                        lat: next[id].lat + (Math.random() - 0.5) * 0.001,
                        lng: next[id].lng + (Math.random() - 0.5) * 0.001,
                    };
                });
                return next;
            });
        }, 3000);

        return () => clearInterval(interval);
    }, [drivers]);

    return (
        <MapContainer
            center={[39.8283, -98.5795]} // Center of US
            zoom={4}
            style={{ height: "100%", width: "100%", borderRadius: "0.5rem" }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {drivers.map((driver) => {
                const loc = driverLocations[driver.id];
                if (!loc) return null;

                return (
                    <Marker key={driver.id} position={[loc.lat, loc.lng]} icon={icon}>
                        <Popup>
                            <div className="font-bold">{driver.name}</div>
                            <div className="text-xs">{driver.status}</div>
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}
