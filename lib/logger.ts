import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";


export async function logActivity(
    userId: string,
    userName: string,
    action: string,
    details: string,
    metadata: Record<string, unknown> = {}
) {
    try {
        await addDoc(collection(db, "activity_logs"), {
            userId,
            userName,
            action,
            details,
            metadata,
            timestamp: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error logging activity:", error);
        // Don't throw error to prevent blocking main flow
    }
}
