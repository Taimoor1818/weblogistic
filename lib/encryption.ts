import bcrypt from "bcryptjs";

/**
 * Hash a 4-digit MPIN for secure storage
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
 * Verify a MPIN against its hash
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
 * Validate MPIN format
 * @param mpin - MPIN to validate
 * @returns True if valid format
 */
export function isValidMPIN(mpin: string): boolean {
    return /^\d{4}$/.test(mpin);
}
