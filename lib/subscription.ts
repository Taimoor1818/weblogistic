import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import { User, SubscriptionStatus } from "./types";

const TRIAL_DAYS = 2;
const SUBSCRIPTION_MONTHS = 4;

/**
 * Initialize user document in Firestore after first login
 */
export async function initializeUserDocument(
    uid: string,
    email: string,
    displayName: string,
    photoURL?: string
): Promise<void> {
    const userRef = doc(db, "users", uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
        const now = new Date();
        const trialEnd = new Date(now);
        trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);

        const userData: Partial<User> = {
            uid,
            email,
            displayName,
            photoURL,
            role: email === "taimoorshah1818@gmail.com" ? "admin" : "user",
            trialStartDate: Timestamp.fromDate(now),
            trialEndDate: Timestamp.fromDate(trialEnd),
            subscriptionStatus: "trial",
            createdAt: Timestamp.fromDate(now),
            updatedAt: Timestamp.fromDate(now),
        };

        await setDoc(userRef, userData);
    }
}

/**
 * Get user document from Firestore
 */
export async function getUserDocument(uid: string): Promise<User | null> {
    const userRef = doc(db, "users", uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
        return null;
    }

    return userDoc.data() as User;
}

/**
 * Update user document
 */
export async function updateUserDocument(
    uid: string,
    data: Partial<User>
): Promise<void> {
    const userRef = doc(db, "users", uid);
    await setDoc(
        userRef,
        {
            ...data,
            updatedAt: serverTimestamp(),
        },
        { merge: true }
    );
}

/**
 * Check if user's trial has expired
 */
export function isTrialExpired(user: User): boolean {
    if (user.subscriptionStatus !== "trial") {
        return false;
    }

    const now = new Date();
    const trialEnd = user.trialEndDate.toDate();
    return now > trialEnd;
}

/**
 * Check if user's subscription has expired
 */
export function isSubscriptionExpired(user: User): boolean {
    if (user.subscriptionStatus !== "active" || !user.subscriptionEndDate) {
        return false;
    }

    const now = new Date();
    const subEnd = user.subscriptionEndDate.toDate();
    return now > subEnd;
}

/**
 * Get remaining days for trial or subscription
 */
export function getRemainingDays(user: User): number {
    const now = new Date();
    let endDate: Date;

    if (user.subscriptionStatus === "trial") {
        endDate = user.trialEndDate.toDate();
    } else if (user.subscriptionStatus === "active" && user.subscriptionEndDate) {
        endDate = user.subscriptionEndDate.toDate();
    } else {
        return 0;
    }

    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
}

/**
 * Activate user subscription (called when payment is approved)
 */
export async function activateSubscription(uid: string): Promise<void> {
    const now = new Date();
    const subEnd = new Date(now);
    subEnd.setMonth(subEnd.getMonth() + SUBSCRIPTION_MONTHS);

    await updateUserDocument(uid, {
        subscriptionStatus: "active",
        subscriptionEndDate: Timestamp.fromDate(subEnd),
    });
}

/**
 * Check subscription status and update if needed
 */
export async function checkAndUpdateSubscriptionStatus(
    user: User
): Promise<SubscriptionStatus> {
    let newStatus = user.subscriptionStatus;

    if (user.subscriptionStatus === "trial" && isTrialExpired(user)) {
        newStatus = "pending_payment";
        await updateUserDocument(user.uid, { subscriptionStatus: newStatus });
    } else if (
        user.subscriptionStatus === "active" &&
        isSubscriptionExpired(user)
    ) {
        // When subscription expires, reset to trial mode with a new trial period
        const now = new Date();
        const trialEnd = new Date(now);
        trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);
        
        newStatus = "trial";
        await updateUserDocument(user.uid, { 
            subscriptionStatus: newStatus,
            trialStartDate: Timestamp.fromDate(now),
            trialEndDate: Timestamp.fromDate(trialEnd)
            // subscriptionEndDate will be cleared by not including it in the update
        });
    }

    return newStatus;
}
