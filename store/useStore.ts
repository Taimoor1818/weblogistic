import { create } from 'zustand';
import { AppData, Driver, Vehicle, Customer, Trip, UserProfile, TeamMember, Payment, Employee } from '@/types';
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
    deleteTrip: (tripId: string) => Promise<void>;
    
    addPayment: (payment: Omit<Payment, 'id'>) => Promise<void>;
    updatePayment: (payment: Payment) => Promise<void>;
    deletePayment: (paymentId: string) => Promise<void>;
    
    addEmployee: (employee: Omit<Employee, 'id'>) => Promise<void>;
    updateEmployee: (employee: Employee) => Promise<void>;
    deleteEmployee: (employeeId: string) => Promise<void>;
}

const initialState: AppData = {
    profile: null,
    drivers: [],
    teamMembers: [],
    vehicles: [],
    customers: [],
    trips: [],
    payments: [],
    employees: [],
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
                        profile: { ...state.profile, ...data.profile, mpinHash: data.mpinHash } as UserProfile,
                        settings: data.settings || state.settings
                    }));
                }
            });
            unsubscribers.push(userUnsub);

            // 2. Subscribe to User Subcollections
            // Fetch drivers from user's drivers subcollection
            const driversQuery = query(collection(db, 'users', uid, 'drivers'));
            const driversUnsub = onSnapshot(driversQuery, (snapshot) => {
                const drivers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Driver));
                set({ drivers });
            });
            unsubscribers.push(driversUnsub);

            // Fetch team members from user's teamMembers subcollection
            const teamMembersQuery = query(collection(db, 'users', uid, 'teamMembers'));
            const teamMembersUnsub = onSnapshot(teamMembersQuery, (snapshot) => {
                const teamMembers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeamMember));
                set({ teamMembers });
            });
            unsubscribers.push(teamMembersUnsub);

            // 3. Subscribe to User Subcollections (vehicles, customers, trips)
            // Fetch vehicles from user's vehicles subcollection
            const vehiclesQuery = query(collection(db, 'users', uid, 'vehicles'));
            const vehiclesUnsub = onSnapshot(vehiclesQuery, (snapshot) => {
                const vehicles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
                set({ vehicles });
            });
            unsubscribers.push(vehiclesUnsub);

            // Fetch customers from user's customers subcollection
            const customersQuery = query(collection(db, 'users', uid, 'customers'));
            const customersUnsub = onSnapshot(customersQuery, (snapshot) => {
                const customers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
                set({ customers });
            });
            unsubscribers.push(customersUnsub);

            // Fetch trips from user's trips subcollection
            const tripsQuery = query(collection(db, 'users', uid, 'trips'));
            const tripsUnsub = onSnapshot(tripsQuery, (snapshot) => {
                const trips = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trip));
                set({ trips });
            });
            unsubscribers.push(tripsUnsub);
            
            // Fetch payments from user's payments subcollection
            const paymentsQuery = query(collection(db, 'users', uid, 'payments'));
            const paymentsUnsub = onSnapshot(paymentsQuery, (snapshot) => {
                const payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
                set({ payments });
            });
            unsubscribers.push(paymentsUnsub);
            
            // Fetch employees from user's employees subcollection
            const employeesQuery = query(collection(db, 'users', uid, 'employees'));
            const employeesUnsub = onSnapshot(employeesQuery, (snapshot) => {
                const employees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
                set({ employees });
            });
            unsubscribers.push(employeesUnsub);

            set({ unsubscribers, isLoading: false, initialized: true });

        } catch (error) {
            console.error('Error initializing store:', error);
            toast.error('Failed to load data');
            set({ isLoading: false });
        }
    },

    addDriver: async (driver) => {
        const { profile } = get();
        if (!profile) {
            toast.error('User not authenticated');
            return;
        }
        
        try {
            await addDoc(collection(db, 'users', profile.uid, 'drivers'), driver);
            toast.success('Driver added');
        } catch (error) {
            console.error(error);
            toast.error('Failed to add driver');
        }
    },

    updateDriver: async (driver) => {
        const { profile } = get();
        if (!profile) {
            toast.error('User not authenticated');
            return;
        }
        
        try {
            const { id, ...data } = driver;
            await updateDoc(doc(db, 'users', profile.uid, 'drivers', id), data);
            toast.success('Driver updated');
        } catch (error) {
            console.error(error);
            toast.error('Failed to update driver');
        }
    },

    deleteDriver: async (driverId) => {
        const { profile } = get();
        if (!profile) {
            toast.error('User not authenticated');
            return;
        }
        
        try {
            await deleteDoc(doc(db, 'users', profile.uid, 'drivers', driverId));
            toast.success('Driver deleted');
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete driver');
        }
    },

    addVehicle: async (vehicle) => {
        const { profile } = get();
        if (!profile) {
            toast.error('User not authenticated');
            return;
        }
        
        try {
            await addDoc(collection(db, 'users', profile.uid, 'vehicles'), vehicle);
            toast.success('Vehicle added');
        } catch (error) {
            console.error(error);
            toast.error('Failed to add vehicle');
        }
    },

    updateVehicle: async (vehicle) => {
        const { profile } = get();
        if (!profile) {
            toast.error('User not authenticated');
            return;
        }
        
        try {
            const { id, ...data } = vehicle;
            await updateDoc(doc(db, 'users', profile.uid, 'vehicles', id), data);
            toast.success('Vehicle updated');
        } catch (error) {
            console.error(error);
            toast.error('Failed to update vehicle');
        }
    },

    deleteVehicle: async (vehicleId) => {
        const { profile } = get();
        if (!profile) {
            toast.error('User not authenticated');
            return;
        }
        
        try {
            await deleteDoc(doc(db, 'users', profile.uid, 'vehicles', vehicleId));
            toast.success('Vehicle deleted');
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete vehicle');
        }
    },

    addCustomer: async (customer) => {
        const { profile } = get();
        if (!profile) {
            toast.error('User not authenticated');
            return;
        }
        
        try {
            await addDoc(collection(db, 'users', profile.uid, 'customers'), customer);
            toast.success('Customer added');
        } catch (error) {
            console.error(error);
            toast.error('Failed to add customer');
        }
    },

    updateCustomer: async (customer) => {
        const { profile } = get();
        if (!profile) {
            toast.error('User not authenticated');
            return;
        }
        
        try {
            const { id, ...data } = customer;
            await updateDoc(doc(db, 'users', profile.uid, 'customers', id), data);
            toast.success('Customer updated');
        } catch (error) {
            console.error(error);
            toast.error('Failed to update customer');
        }
    },

    deleteCustomer: async (customerId) => {
        const { profile } = get();
        if (!profile) {
            toast.error('User not authenticated');
            return;
        }
        
        try {
            await deleteDoc(doc(db, 'users', profile.uid, 'customers', customerId));
            toast.success('Customer deleted');
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete customer');
        }
    },

    addTrip: async (trip) => {
        const { profile } = get();
        if (!profile) {
            toast.error('User not authenticated');
            return;
        }
        
        try {
            await addDoc(collection(db, 'users', profile.uid, 'trips'), trip);
            toast.success('Trip added');
        } catch (error) {
            console.error(error);
            toast.error('Failed to add trip');
        }
    },

    updateTrip: async (trip) => {
        const { profile } = get();
        if (!profile) {
            toast.error('User not authenticated');
            return;
        }
        
        try {
            const { id, ...data } = trip;
            await updateDoc(doc(db, 'users', profile.uid, 'trips', id), data);
            toast.success('Trip updated');
        } catch (error) {
            console.error(error);
            toast.error('Failed to update trip');
        }
    },

    deleteTrip: async (tripId) => {
        const { profile } = get();
        if (!profile) {
            toast.error('User not authenticated');
            return;
        }
        
        try {
            await deleteDoc(doc(db, 'users', profile.uid, 'trips', tripId));
            toast.success('Trip deleted');
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete trip');
        }
    },
    
    addPayment: async (payment) => {
        const { profile } = get();
        if (!profile) {
            toast.error('User not authenticated');
            return;
        }
        
        try {
            await addDoc(collection(db, 'users', profile.uid, 'payments'), payment);
            toast.success('Payment added');
        } catch (error) {
            console.error(error);
            toast.error('Failed to add payment');
        }
    },

    updatePayment: async (payment) => {
        const { profile } = get();
        if (!profile) {
            toast.error('User not authenticated');
            return;
        }
        
        try {
            const { id, ...data } = payment;
            await updateDoc(doc(db, 'users', profile.uid, 'payments', id), data);
            toast.success('Payment updated');
        } catch (error) {
            console.error(error);
            toast.error('Failed to update payment');
        }
    },

    deletePayment: async (paymentId) => {
        const { profile } = get();
        if (!profile) {
            toast.error('User not authenticated');
            return;
        }
        
        try {
            await deleteDoc(doc(db, 'users', profile.uid, 'payments', paymentId));
            toast.success('Payment deleted');
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete payment');
        }
    },
    
    addEmployee: async (employee) => {
        const { profile } = get();
        if (!profile) {
            toast.error('User not authenticated');
            return;
        }
        
        try {
            await addDoc(collection(db, 'users', profile.uid, 'employees'), employee);
            toast.success('Employee added');
        } catch (error) {
            console.error(error);
            toast.error('Failed to add employee');
        }
    },

    updateEmployee: async (employee) => {
        const { profile } = get();
        if (!profile) {
            toast.error('User not authenticated');
            return;
        }
        
        try {
            const { id, ...data } = employee;
            await updateDoc(doc(db, 'users', profile.uid, 'employees', id), data);
            toast.success('Employee updated');
        } catch (error) {
            console.error(error);
            toast.error('Failed to update employee');
        }
    },

    deleteEmployee: async (employeeId) => {
        const { profile } = get();
        if (!profile) {
            toast.error('User not authenticated');
            return;
        }
        
        try {
            await deleteDoc(doc(db, 'users', profile.uid, 'employees', employeeId));
            toast.success('Employee deleted');
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete employee');
        }
    },
}));