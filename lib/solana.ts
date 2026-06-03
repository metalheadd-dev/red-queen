import { Connection, PublicKey } from "@solana/web3.js";

// Clean list of free public mainnet nodes
export const MAINNET_RPC_URLS = [
  "https://api.mainnet-beta.solana.com",
  "https://api.mainnet.solana.com",
  "https://solana.public-rpc.com"
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
      
      // Perform a lightweight getBalance test on a system address to ensure basic RPC methods are authorized
      const systemKey = new PublicKey("11111111111111111111111111111111");
      await Promise.race([
        connection.getBalance(systemKey),
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
