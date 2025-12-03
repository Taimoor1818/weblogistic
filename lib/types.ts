import { Timestamp } from "firebase/firestore";

export type UserRole = "user" | "admin" | "driver" | "client";

export type SubscriptionStatus = "trial" | "active" | "expired" | "pending_payment";

export type PaymentRequestStatus = "pending" | "approved" | "rejected";

export type ShipmentStatus = "created" | "pickup" | "in-transit" | "delivered" | "cancelled";

export type MaintenanceType = "service" | "tyre" | "battery" | "repair" | "other";

export interface User {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    mpinHash?: string;
    companyName?: string;
    city?: string;
    mobileNumber?: string;
    role: UserRole;
    trialStartDate: Timestamp;
    trialEndDate: Timestamp;
    subscriptionStatus: SubscriptionStatus;
    subscriptionEndDate?: Timestamp;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface ActivityLog {
    id: string;
    userId: string;
    userName: string;
    action: string;
    details: string;
    timestamp: Timestamp;
    metadata?: Record<string, unknown>;
}

export interface Shipment {
    id: string;
    trackingId: string;
    customerId: string;
    driverId?: string;
    vehicleId?: string;
    status: ShipmentStatus;
    pickupLocation: {
        address: string;
        lat?: number;
        lng?: number;
    };
    dropoffLocation: {
        address: string;
        lat?: number;
        lng?: number;
    };
    pickupDate: Timestamp;
    deliveryDate?: Timestamp;
    items: {
        description: string;
        quantity: number;
        weight?: number;
    }[];
    qrCode?: string;
    proofUrl?: string;
    signatureUrl?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface Expense {
    id: string;
    tripId?: string;
    vehicleId?: string;
    type: "fuel" | "toll" | "maintenance" | "salary" | "other";
    amount: number;
    date: Timestamp;
    notes?: string;
    receiptUrl?: string;
    createdBy: string;
}

export interface MaintenanceLog {
    id: string;
    vehicleId: string;
    type: MaintenanceType;
    cost: number;
    odometer?: number;
    date: Timestamp;
    description: string;
    nextServiceDate?: Timestamp;
    provider?: string;
    documents?: string[];
}

export interface WarehouseItem {
    id: string;
    sku: string;
    name: string;
    category: string;
    quantity: number;
    minQuantity: number;
    location: string; // Shelf/Slot
    unit: string;
    price: number;
    updatedAt: Timestamp;
}

export interface PaymentRequest {
    id: string;
    userId: string;
    userEmail: string;
    userName: string;
    amount: number;
    status: PaymentRequestStatus;
    requestDate: Timestamp;
    processedDate?: Timestamp;
    processedBy?: string;
    notes?: string;
}

export interface TeamMember {
    id: string;
    ownerId: string;
    memberEmail: string;
    memberMobile?: string;
    addedAt: Timestamp;
    status: "pending" | "active";
}

export interface CompanyProfile {
    companyName: string;
    city: string;
    mobileNumber: string;
}
