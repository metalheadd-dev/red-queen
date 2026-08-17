import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { getWorkingConnection } from "./solana";
import { THREAT_TOKEN_MINT, getThreatClearance } from "./threat-token";

export const SOLANA_MAINNET_CAIP2 = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";
export const SOLANA_CLUSTER = "mainnet-beta";
export const SOLANA_COMMITMENT = "confirmed";

export type ThreatTokenProgram = "SPL TOKEN" | "TOKEN-2022" | "UNKNOWN";

function tokenProgramLabel(owner: PublicKey | undefined): ThreatTokenProgram {
  if (owner?.equals(TOKEN_PROGRAM_ID)) return "SPL TOKEN";
  if (owner?.equals(TOKEN_2022_PROGRAM_ID)) return "TOKEN-2022";
  return "UNKNOWN";
}

export async function readThreatBalance(owner: PublicKey) {
  const connection = await getWorkingConnection(false);
  const mint = new PublicKey(THREAT_TOKEN_MINT);
  const accounts = await connection.getParsedTokenAccountsByOwner(owner, { mint }, SOLANA_COMMITMENT);

  return accounts.value.reduce((total, account) => {
    const tokenAmount = account.account.data.parsed?.info?.tokenAmount;
    const amount = Number(tokenAmount?.uiAmountString ?? tokenAmount?.uiAmount ?? 0);
    return total + (Number.isFinite(amount) ? amount : 0);
  }, 0);
}

export async function readOnchainWalletSnapshot(address: string) {
  const startedAt = Date.now();
  const connection = await getWorkingConnection(false);
  const owner = new PublicKey(address);
  const mint = new PublicKey(THREAT_TOKEN_MINT);

  const [lamports, tokenAccounts, mintAccount, slot] = await Promise.all([
    connection.getBalance(owner, SOLANA_COMMITMENT),
    connection.getParsedTokenAccountsByOwner(owner, { mint }, SOLANA_COMMITMENT),
    connection.getAccountInfo(mint, SOLANA_COMMITMENT),
    connection.getSlot(SOLANA_COMMITMENT),
  ]);

  const threatBalance = tokenAccounts.value.reduce((total, account) => {
    const tokenAmount = account.account.data.parsed?.info?.tokenAmount;
    const amount = Number(tokenAmount?.uiAmountString ?? tokenAmount?.uiAmount ?? 0);
    return total + (Number.isFinite(amount) ? amount : 0);
  }, 0);
  const clearance = getThreatClearance(threatBalance);

  return {
    address: owner.toBase58(),
    cluster: SOLANA_CLUSTER,
    caip2: SOLANA_MAINNET_CAIP2,
    commitment: SOLANA_COMMITMENT,
    slot,
    rpcLatencyMs: Date.now() - startedAt,
    solBalance: lamports / LAMPORTS_PER_SOL,
    threat: {
      mint: THREAT_TOKEN_MINT,
      balance: threatBalance,
      tokenAccounts: tokenAccounts.value.length,
      program: tokenProgramLabel(mintAccount?.owner),
      clearance: {
        tier: clearance.tier,
        level: clearance.level,
        name: clearance.name,
        responseDepth: clearance.responseDepth,
        contextMessages: clearance.contextMessages,
        earnedXpMultiplier: clearance.earnedXpMultiplier,
      },
    },
    readOnly: true,
    transactionRequested: false,
    updatedAt: new Date().toISOString(),
  };
}
