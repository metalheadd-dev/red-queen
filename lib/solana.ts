import { Connection, PublicKey } from "@solana/web3.js";

// Free public mainnet RPC pool — ordered by reliability with no-key-required endpoints first
export const MAINNET_RPC_URLS = [
  "https://solana-rpc.publicnode.com",    // PublicNode — free, no key, no rate block
  "https://api.mainnet-beta.solana.com", // Official Solana Labs
  "https://api.mainnet.solana.com",       // Official Solana Labs mirror
  "https://solana.public-rpc.com"         // Additional fallback
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
 * Prioritizes custom user RPCs if specified in process.env.
 */
export async function getWorkingConnection(isDevnet = false): Promise<Connection> {
  // Prioritize environment-defined RPC endpoints first
  const envRpc = typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_SOLANA_RPC_URL
    : (process.env.SOLANA_RPC_URL || process.env.NEXT_PUBLIC_SOLANA_RPC_URL);

  if (envRpc) {
    console.log(`[SOLANA RPC] Prioritizing environment-defined RPC: ${envRpc}`);
    return new Connection(envRpc, "confirmed");
  }

  const urls = isDevnet ? DEVNET_RPC_URLS : MAINNET_RPC_URLS;
  
  for (const url of urls) {
    try {
      console.log(`[SOLANA RPC] Testing connectivity for: ${url}`);
      const connection = new Connection(url, "confirmed");
      
      // Test with a real account balance query — the treasury address — to confirm
      // the endpoint allows user-account lookups (some nodes block these with 403)
      const testKey = new PublicKey("AUCYMsSZXASMiXfjLNL26NF7sPehUA4ncEzTCx8MdSYg");
      await Promise.race([
        connection.getBalance(testKey),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 3000))
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
