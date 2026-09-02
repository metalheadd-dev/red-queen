import { Connection, PublicKey } from "@solana/web3.js";

// Free public mainnet RPC pool, ordered by reliability with no-key-required endpoints first
export const MAINNET_RPC_URLS = [
  "https://api.mainnet-beta.solana.com", // Official Solana Labs
  "https://api.mainnet.solana.com",       // Official Solana Labs mirror
  "https://solana-rpc.publicnode.com",    // PublicNode fallback (some token methods may be restricted)
  "https://solana.public-rpc.com"         // Additional fallback
];

export const DEVNET_RPC_URLS = [
  "https://api.devnet.solana.com"
];

const MAINNET_GENESIS_HASH = "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";
const DEVNET_GENESIS_HASH = "EtWTRABZaYq6iMfeYKouRu166VU2xqa1";

function configuredRpcUrl() {
  return typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_SOLANA_RPC_URL
    : (process.env.SOLANA_RPC_URL || process.env.NEXT_PUBLIC_SOLANA_RPC_URL);
}

export function getSolanaRpcUrls(isDevnet = false) {
  const envRpc = configuredRpcUrl();
  return Array.from(new Set([
    ...(envRpc ? [envRpc] : []),
    ...(isDevnet ? DEVNET_RPC_URLS : MAINNET_RPC_URLS),
  ]));
}

export async function withWorkingConnection<T>(
  operation: (connection: Connection) => Promise<T>,
  isDevnet = false,
  timeoutMs = 6_000,
): Promise<{ connection: Connection; result: T }> {
  const expectedGenesisHash = isDevnet ? DEVNET_GENESIS_HASH : MAINNET_GENESIS_HASH;
  let lastError: unknown = null;

  for (const url of getSolanaRpcUrls(isDevnet)) {
    const connection = new Connection(url, "confirmed");
    try {
      const result = await Promise.race([
        (async () => {
          const genesisHash = await connection.getGenesisHash();
          // CAIP-2 uses the first 32 characters of the Solana genesis hash.
          if (!genesisHash.startsWith(expectedGenesisHash)) {
            throw new Error(`RPC network mismatch: expected ${expectedGenesisHash}, received ${genesisHash}`);
          }
          return await operation(connection);
        })(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("RPC request timed out")), timeoutMs)),
      ]);
      return { connection, result };
    } catch (error) {
      lastError = error;
      console.warn(`[SOLANA RPC] Endpoint ${url} could not complete the requested operation.`, error);
    }
  }

  throw new Error(lastError instanceof Error
    ? `Solana RPC unavailable: ${lastError.message}`
    : "Solana RPC unavailable for the requested operation.");
}

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
  const testKey = new PublicKey("11111111111111111111111111111111");
  const { connection } = await withWorkingConnection(
    (candidate) => candidate.getBalance(testKey),
    isDevnet,
    4_000,
  );
  return connection;
}
