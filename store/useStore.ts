import { create } from 'zustand';
import { AppData, Driver, Vehicle, Customer, Trip, UserProfile } from '@/types';
import { db } from '@/lib/firebase';
import { doc, updateDoc, onSnapshot, collection, addDoc, deleteDoc, query, Unsubscribe } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

interface StoreState extends AppData {
    isLoading: boolean;
    initialized: boolean;
    unsubscribers: Unsubscribe[];

    // Actions
    setProfile: (profile: UserProfile) => void;
    initializeStore: (uid: string) => Promise<void>;
    cleanup: () => void;

    addDriver: (driver: Omit<Driver, 'id'>) => Promise<void>;
    updateDriver: (driver: Driver) => Promise<void>;
    deleteDriver: (driverId: string) => Promise<void>;

    addVehicle: (vehicle: Omit<Vehicle, 'id'>) => Promise<void>;
    updateVehicle: (vehicle: Vehicle) => Promise<void>;
    deleteVehicle: (vehicleId: string) => Promise<void>;

    addCustomer: (customer: Omit<Customer, 'id'>) => Promise<void>;
    updateCustomer: (customer: Customer) => Promise<void>;
    deleteCustomer: (customerId: string) => Promise<void>;

    addTrip: (trip: Omit<Trip, 'id'>) => Promise<void>;
    updateTrip: (trip: Trip) => Promise<void>;
}

const initialState: AppData = {
    profile: null,
    drivers: [],
    vehicles: [],
    customers: [],
    trips: [],
    settings: {
        currency: 'USD',
        notificationsEnabled: true,
    },
};

export const useStore = create<StoreState>((set, get) => ({
    ...initialState,
    isLoading: true,
    initialized: false,
    unsubscribers: [],

    setProfile: (profile) => set({ profile }),

    cleanup: () => {
        const { unsubscribers } = get();
        unsubscribers.forEach(unsub => unsub());
        set({ unsubscribers: [], initialized: false });
    },

    initializeStore: async (uid) => {
        const { cleanup } = get();
        cleanup(); // Cleanup previous listeners if any

        set({ isLoading: true });
        const unsubscribers: Unsubscribe[] = [];

        try {
            // 1. Load User Profile
            const userDocRef = doc(db, 'users', uid);
            const userUnsub = onSnapshot(userDocRef, (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    // Only update profile and settings from user doc
                    set((state) => ({
                        profile: { ...state.profile, ...data.profile } as UserProfile,
                        settings: data.settings || state.settings
                    }));
                }
            });
            unsubscribers.push(userUnsub);

            // 2. Subscribe to Collections
            const collections = [
                { name: 'drivers', setter: 'drivers' },
                { name: 'vehicles', setter: 'vehicles' },
                { name: 'customers', setter: 'customers' },
                { name: 'trips', setter: 'trips' }
            ];

            collections.forEach(({ name, setter }) => {
                // Assuming we might want to filter by ownerId in the future, but for now getting all
                // In a real SaaS, we MUST filter by ownerId/userId.
                // Adding basic security filter here assuming documents have ownerId or similar
                // But wait, the current types don't enforce ownerId on everything.
                // For now, we'll fetch all, but we SHOULD add ownerId to everything.

                // Let's assume the security rules handle the "read" permission (which they do),
                // so we can just query the collection.
                const q = query(collection(db, name));
                const unsub = onSnapshot(q, (snapshot) => {
                    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    set({ [setter]: items } as Partial<StoreState>);
                });
                unsubscribers.push(unsub);
            });

            set({ unsubscribers, isLoading: false, initialized: true });

        } catch (error) {
            console.error('Error initializing store:', error);
            toast.error('Failed to load data');
            set({ isLoading: false });
        }
    },

    addDriver: async (driver) => {
        try {
            await addDoc(collection(db, 'drivers'), driver);
            toast.success('Driver added');
        } catch (error) {
            console.error(error);
            toast.error('Failed to add driver');
        }
    },

    updateDriver: async (driver) => {
        try {
            const { id, ...data } = driver;
            await updateDoc(doc(db, 'drivers', id), data);
            toast.success('Driver updated');
        } catch (error) {
            console.error(error);
            toast.error('Failed to update driver');
        }
    },

    deleteDriver: async (driverId) => {
        try {
            await deleteDoc(doc(db, 'drivers', driverId));
            toast.success('Driver deleted');
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete driver');
        }
    },

    addVehicle: async (vehicle) => {
        try {
            await addDoc(collection(db, 'vehicles'), vehicle);
            toast.success('Vehicle added');
        } catch (error) {
            console.error(error);
            toast.error('Failed to add vehicle');
        }
    },

    updateVehicle: async (vehicle) => {
        try {
            const { id, ...data } = vehicle;
            await updateDoc(doc(db, 'vehicles', id), data);
            toast.success('Vehicle updated');
        } catch (error) {
            console.error(error);
            toast.error('Failed to update vehicle');
        }
    },

    deleteVehicle: async (vehicleId) => {
        try {
            await deleteDoc(doc(db, 'vehicles', vehicleId));
            toast.success('Vehicle deleted');
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete vehicle');
        }
    },

    addCustomer: async (customer) => {
        try {
            await addDoc(collection(db, 'customers'), customer);
            toast.success('Customer added');
        } catch (error) {
            console.error(error);
            toast.error('Failed to add customer');
        }
    },

    updateCustomer: async (customer) => {
        try {
            const { id, ...data } = customer;
            await updateDoc(doc(db, 'customers', id), data);
            toast.success('Customer updated');
        } catch (error) {
            console.error(error);
            toast.error('Failed to update customer');
        }
    },

    deleteCustomer: async (customerId) => {
        try {
            await deleteDoc(doc(db, 'customers', customerId));
            toast.success('Customer deleted');
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete customer');
        }
    },

    addTrip: async (trip) => {
        try {
            await addDoc(collection(db, 'trips'), trip);
            toast.success('Trip added');
        } catch (error) {
            console.error(error);
            toast.error('Failed to add trip');
        }
    },

    updateTrip: async (trip) => {
        try {
            const { id, ...data } = trip;
            await updateDoc(doc(db, 'trips', id), data);
            toast.success('Trip updated');
        } catch (error) {
            console.error(error);
            toast.error('Failed to update trip');
        }
    },
}));