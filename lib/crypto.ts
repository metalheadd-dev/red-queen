import crypto from "crypto";

const WALLET_SALT = process.env.WALLET_SALT || "red-queen-cyber-salt-2026";

/**
 * Generates a SHA-256 hash of the user's public key concatenated with a server-side salt.
 * Used as an anonymous index ID for database records to ensure absolute privacy.
 */
export function getHashedWallet(wallet: string): string {
  if (!wallet) return "";
  return crypto
    .createHash("sha256")
    .update(wallet + WALLET_SALT)
    .digest("hex");
}
