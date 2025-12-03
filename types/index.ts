export interface Driver {
    id: string;
    name: string;
    photoURL?: string;
    licenseNumber: string;
    phone: string;
    status: 'available' | 'busy' | 'off-duty';
    joinedDate: string;
    licenseExpiry?: string;
    rating?: number;
    salaryType?: 'per-trip' | 'monthly';
    salaryAmount?: number;
    documents?: string[];
}

export interface Vehicle {
    id: string;
    plateNumber: string;
    type: 'truck' | 'van' | 'bike' | 'car';
    status: 'available' | 'in-use' | 'maintenance';
    capacity: string;
}

export interface Customer {
    id: string;
    name: string;
    email?: string;
    phone: string;
    address: string;
}

export interface Trip {
    id: string;
    driverId: string;
    vehicleId: string;
    customerId: string;
    status: 'planned' | 'assigned' | 'picked-up' | 'in-transit' | 'delivered';
    pickupLocation: string;
    dropoffLocation: string;
    pickupTime?: string;
    deliveryTime?: string;
    proofOfDelivery?: {
        signature?: string;
        photoURL?: string;
        timestamp: string;
    };
    createdAt: string;
}

export interface UserProfile {
    uid: string;
    name: string;
    email: string;
    photoURL?: string;
    companyName: string;
    phone?: string;
    subscriptionStatus?: string;
    role?: string;
}

export interface AppData {
    profile: UserProfile | null;
    drivers: Driver[];
    vehicles: Vehicle[];
    customers: Customer[];
    trips: Trip[];
    settings: {
        currency: string;
        notificationsEnabled: boolean;
    };
}
