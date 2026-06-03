import { Connection, PublicKey } from "@solana/web3.js";

// Harmonized list of public mainnet RPC nodes for resiliency and bypass of rate-limits
export const MAINNET_RPC_URLS = [
  "https://solana-mainnet.rpc.extrnode.com",
  "https://rpc.ankr.com/solana",
  "https://mainnet.ankr.com/solana",
  "https://api.mainnet-beta.solana.com",
  "https://api.mainnet.solana.com"
];

export const DEVNET_RPC_URLS = [
  "https://api.devnet.solana.com"
];

/**
 * Validates if a string is a valid base58 Solana public key.
 */
export function isValidSolanaPublicKey(address: string | null | undefined): boolean {
  if (!address) return false;
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets a working connection by testing a list of RPC endpoints.
 * Returns the first connection that successfully responds within a timeout window.
 */
export async function getWorkingConnection(isDevnet = false): Promise<Connection> {
  const urls = isDevnet ? DEVNET_RPC_URLS : MAINNET_RPC_URLS;
  
  for (const url of urls) {
    try {
      console.log(`[SOLANA RPC] Testing connectivity for: ${url}`);
      const connection = new Connection(url, "confirmed");
      
      // Perform a lightweight getLatestBlockhash test with 2500ms timeout
      await Promise.race([
        connection.getLatestBlockhash("confirmed"),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2500))
      ]);
      
      console.log(`[SOLANA RPC] Connection established successfully with: ${url}`);
      return connection;
    } catch (e: any) {
      console.warn(`[SOLANA RPC] Endpoint ${url} health check failed: ${e?.message || e}`);
    }
  }
  
  // Fallback to first URL if all fail
  const fallbackUrl = urls[0];
  console.warn(`[SOLANA RPC] All endpoints failed health checks. Falling back to: ${fallbackUrl}`);
  return new Connection(fallbackUrl, "confirmed");
}
