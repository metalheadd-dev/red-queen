import {
  createRevokeInstruction,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { getWorkingConnection } from "./solana";
import { THREAT_TOKEN_MINT, getThreatClearance } from "./threat-token";

export const SOLANA_MAINNET_CAIP2 = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";
export const SOLANA_CLUSTER = "mainnet-beta";
export const SOLANA_COMMITMENT = "confirmed";

export type ThreatTokenProgram = "SPL TOKEN" | "TOKEN-2022" | "UNKNOWN";

export type WalletDelegateExposure = {
  tokenAccount: string;
  mint: string;
  program: "SPL TOKEN" | "TOKEN-2022";
  state: string;
  balance: string;
  decimals: number;
  delegate: string;
  delegatedAmount: string;
};

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
        signalWatchSlots: clearance.signalWatchSlots,
        comparisonSignals: clearance.comparisonSignals,
        earnedXpMultiplier: clearance.earnedXpMultiplier,
      },
    },
    readOnly: true,
    transactionRequested: false,
    updatedAt: new Date().toISOString(),
  };
}

function parsedTokenAccount(
  account: any,
  program: "SPL TOKEN" | "TOKEN-2022",
) {
  const info = account.account.data.parsed?.info || {};
  const tokenAmount = info.tokenAmount || {};
  const delegatedAmount = info.delegatedAmount || {};
  return {
    tokenAccount: account.pubkey.toBase58(),
    mint: String(info.mint || ""),
    program,
    state: String(info.state || "unknown").toUpperCase(),
    balance: String(tokenAmount.uiAmountString ?? tokenAmount.uiAmount ?? "0"),
    rawBalance: String(tokenAmount.amount || "0"),
    decimals: Number(tokenAmount.decimals || 0),
    delegate: typeof info.delegate === "string" ? info.delegate : "",
    delegatedAmount: String(delegatedAmount.uiAmountString ?? delegatedAmount.uiAmount ?? "0"),
    rawDelegatedAmount: String(delegatedAmount.amount || "0"),
    closeAuthority: typeof info.closeAuthority === "string" ? info.closeAuthority : "",
  };
}

export async function readWalletSecuritySnapshot(address: string) {
  const startedAt = Date.now();
  const connection = await getWorkingConnection(false);
  const owner = new PublicKey(address);
  const [classic, token2022, slot] = await Promise.all([
    connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_PROGRAM_ID }, SOLANA_COMMITMENT),
    connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_2022_PROGRAM_ID }, SOLANA_COMMITMENT),
    connection.getSlot(SOLANA_COMMITMENT),
  ]);
  const accounts = [
    ...classic.value.map((account) => parsedTokenAccount(account, "SPL TOKEN")),
    ...token2022.value.map((account) => parsedTokenAccount(account, "TOKEN-2022")),
  ];
  const delegates: WalletDelegateExposure[] = accounts
    .filter((account) => account.delegate && BigInt(account.rawDelegatedAmount || "0") > BigInt(0))
    .map(({ tokenAccount, mint, program, state, balance, decimals, delegate, delegatedAmount }) => ({
      tokenAccount,
      mint,
      program,
      state,
      balance,
      decimals,
      delegate,
      delegatedAmount,
    }));
  const frozenAccounts = accounts.filter((account) => account.state === "FROZEN");
  const emptyAccounts = accounts.filter((account) => BigInt(account.rawBalance || "0") === BigInt(0));
  const externalCloseAuthorities = accounts.filter(
    (account) => account.closeAuthority && account.closeAuthority !== owner.toBase58(),
  );

  return {
    address: owner.toBase58(),
    cluster: SOLANA_CLUSTER,
    caip2: SOLANA_MAINNET_CAIP2,
    commitment: SOLANA_COMMITMENT,
    slot,
    rpcLatencyMs: Date.now() - startedAt,
    status: delegates.length > 0 || externalCloseAuthorities.length > 0 ? "REVIEW" : "CLEAR",
    summary: {
      tokenAccounts: accounts.length,
      classicTokenAccounts: classic.value.length,
      token2022Accounts: token2022.value.length,
      activeDelegates: delegates.length,
      frozenAccounts: frozenAccounts.length,
      emptyAccounts: emptyAccounts.length,
      externalCloseAuthorities: externalCloseAuthorities.length,
    },
    delegates,
    frozenAccounts: frozenAccounts.slice(0, 20).map(({ tokenAccount, mint, program, state }) => ({ tokenAccount, mint, program, state })),
    externalCloseAuthorities: externalCloseAuthorities.slice(0, 20).map(({ tokenAccount, mint, program, closeAuthority }) => ({ tokenAccount, mint, program, closeAuthority })),
    guidance: delegates.length > 0
      ? "Review every active delegate. A delegate can transfer up to its approved amount; revoke only authorities you no longer trust or recognize."
      : "No active positive-balance SPL delegate approvals were observed in this confirmed RPC snapshot.",
    limitations: [
      "PUBLIC_RPC_ONLY",
      "NO_MALWARE_OR_DOMAIN_ATTRIBUTION",
      "NO_AUTOMATIC_REVOCATION",
      "VERIFY_IN_WALLET_BEFORE_SIGNING",
    ],
    readOnly: true,
    transactionRequested: false,
    updatedAt: new Date().toISOString(),
  };
}

export async function prepareDelegateRevocation(address: string, requestedAccounts: string[]) {
  const owner = new PublicKey(address);
  const snapshot = await readWalletSecuritySnapshot(address);
  const requested = new Set(requestedAccounts);
  const selected = snapshot.delegates.filter((exposure) => requested.has(exposure.tokenAccount));
  if (selected.length === 0 || selected.length !== requested.size) {
    throw new Error("One or more selected token accounts no longer have an active delegate.");
  }
  if (selected.length > 8) {
    throw new Error("A single lockdown transaction is limited to 8 delegate revocations.");
  }

  const connection = await getWorkingConnection(false);
  const latestBlockhash = await connection.getLatestBlockhash(SOLANA_COMMITMENT);
  const instructions = selected.map((exposure) => createRevokeInstruction(
    new PublicKey(exposure.tokenAccount),
    owner,
    [],
    exposure.program === "TOKEN-2022" ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID,
  ));
  const message = new TransactionMessage({
    payerKey: owner,
    recentBlockhash: latestBlockhash.blockhash,
    instructions,
  }).compileToV0Message();
  const transaction = new VersionedTransaction(message);
  const simulation = await connection.simulateTransaction(transaction, {
    sigVerify: false,
    replaceRecentBlockhash: true,
    commitment: SOLANA_COMMITMENT,
  });

  return {
    transaction: Buffer.from(transaction.serialize()).toString("base64"),
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    simulation: {
      ok: simulation.value.err === null,
      error: simulation.value.err,
      unitsConsumed: simulation.value.unitsConsumed ?? null,
      logs: simulation.value.logs?.slice(-12) || [],
    },
    revocations: selected,
    statement: `This transaction revokes ${selected.length} SPL delegate approval${selected.length === 1 ? "" : "s"}. It does not transfer tokens or expose a private key.`,
    updatedAt: new Date().toISOString(),
  };
}
