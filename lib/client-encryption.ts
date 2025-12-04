/**
 * Hash a 4-digit MPIN using SHA-256 for MPIN records collection
 * This file is safe to use in client components as it uses the Web Crypto API
 * @param mpin - 4-digit MPIN string
 * @returns SHA-256 hashed MPIN
 */
export async function hashMPINSHA256(mpin: string): Promise<string> {
    if (!/^\d{4}$/.test(mpin)) {
        throw new Error("MPIN must be exactly 4 digits");
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(mpin);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}
