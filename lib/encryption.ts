import bcrypt from "bcryptjs";
import crypto from "crypto";

/**
 * Hash a 4-digit MPIN for secure storage using bcrypt
 * @param mpin - 4-digit MPIN string
 * @returns Hashed MPIN
 */
export async function hashMPIN(mpin: string): Promise<string> {
    if (!/^\d{4}$/.test(mpin)) {
        throw new Error("MPIN must be exactly 4 digits");
    }

    const saltRounds = 10;
    return await bcrypt.hash(mpin, saltRounds);
}

/**
 * Verify a MPIN against its bcrypt hash
 * @param mpin - 4-digit MPIN string to verify
 * @param hash - Stored MPIN hash
 * @returns True if MPIN matches, false otherwise
 */
export async function verifyMPIN(mpin: string, hash: string): Promise<boolean> {
    if (!/^\d{4}$/.test(mpin)) {
        return false;
    }

    try {
        return await bcrypt.compare(mpin, hash);
    } catch (error) {
        console.error("Error verifying MPIN:", error);
        return false;
    }
}

/**
 * Hash a 4-digit MPIN using SHA-256 for MPIN records collection
 * @param mpin - 4-digit MPIN string
 * @returns SHA-256 hashed MPIN
 */
export async function hashMPINSHA256(mpin: string): Promise<string> {
    if (!/^\d{4}$/.test(mpin)) {
        throw new Error("MPIN must be exactly 4 digits");
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(mpin);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Validate MPIN format
 * @param mpin - MPIN to validate
 * @returns True if valid format
 */
export function isValidMPIN(mpin: string): boolean {
    return /^\d{4}$/.test(mpin);
}