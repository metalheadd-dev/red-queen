import bs58 from "bs58";
import {
  AddressLookupTableAccount,
  ComputeBudgetProgram,
  PublicKey,
  SystemProgram,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { getWorkingConnection } from "@/lib/solana";

const MEMO_PROGRAMS = new Set([
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
  "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo",
]);

const PROGRAM_NAMES = new Map<string, string>([
  [SystemProgram.programId.toBase58(), "SYSTEM PROGRAM"],
  [TOKEN_PROGRAM_ID.toBase58(), "SPL TOKEN"],
  [TOKEN_2022_PROGRAM_ID.toBase58(), "TOKEN-2022"],
  [ASSOCIATED_TOKEN_PROGRAM_ID.toBase58(), "ASSOCIATED TOKEN"],
  [ComputeBudgetProgram.programId.toBase58(), "COMPUTE BUDGET"],
  ["JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4", "JUPITER SWAP V6"],
]);

const TOKEN_INSTRUCTION_NAMES: Record<number, string> = {
  3: "TRANSFER",
  4: "APPROVE DELEGATE",
  5: "REVOKE DELEGATE",
  6: "SET AUTHORITY",
  8: "BURN",
  9: "CLOSE ACCOUNT",
  12: "TRANSFER CHECKED",
  13: "APPROVE CHECKED",
  15: "BURN CHECKED",
};

function decodeInstructionData(data: Uint8Array | string) {
  if (data instanceof Uint8Array) return data;
  try { return bs58.decode(data); } catch { return new Uint8Array(); }
}

function readU64Le(bytes: Uint8Array, offset: number) {
  if (bytes.length < offset + 8) return null;
  let value = BigInt(0);
  for (let index = 0; index < 8; index += 1) value |= BigInt(bytes[offset + index]) << BigInt(index * 8);
  return value.toString();
}

async function loadAddressTables(transaction: VersionedTransaction) {
  const connection = await getWorkingConnection(false);
  const tables = await Promise.all(transaction.message.addressTableLookups.map(async (lookup) => {
    const response = await connection.getAddressLookupTable(lookup.accountKey);
    return response.value;
  }));
  if (tables.some((table) => !table)) throw new Error("One or more address lookup tables could not be resolved.");
  return { connection, tables: tables as AddressLookupTableAccount[] };
}

export async function inspectSolanaTransaction(base64Transaction: string, expectedWallet = "") {
  const wire = Buffer.from(base64Transaction, "base64");
  if (!wire.length || wire.length > 180_000) throw new Error("Transaction payload is empty or exceeds the inspection limit.");

  let transaction: VersionedTransaction;
  try {
    transaction = VersionedTransaction.deserialize(wire);
  } catch {
    throw new Error("The payload is not a valid serialized Solana versioned transaction.");
  }

  const { connection, tables } = await loadAddressTables(transaction);
  const accountKeys = transaction.message.getAccountKeys({ addressLookupTableAccounts: tables });
  const allKeys = Array.from({ length: accountKeys.length }, (_, index) => accountKeys.get(index));
  const requiredSignerCount = transaction.message.header.numRequiredSignatures;
  const signers = transaction.message.staticAccountKeys.slice(0, requiredSignerCount).map((key) => key.toBase58());
  const expectedSignerPresent = expectedWallet ? signers.includes(expectedWallet) : null;
  const writableAccounts = allKeys.filter((_, index) => transaction.message.isAccountWritable(index)).length;

  const instructions = transaction.message.compiledInstructions.map((instruction, index) => {
    const programKey = accountKeys.get(instruction.programIdIndex);
    const programId = programKey?.toBase58() || "UNRESOLVED";
    const data = decodeInstructionData(instruction.data);
    let operation = PROGRAM_NAMES.get(programId) || (MEMO_PROGRAMS.has(programId) ? "MEMO" : "UNRECOGNIZED PROGRAM");
    let amount: string | null = null;
    if (programId === TOKEN_PROGRAM_ID.toBase58() || programId === TOKEN_2022_PROGRAM_ID.toBase58()) {
      operation = TOKEN_INSTRUCTION_NAMES[data[0]] || `TOKEN INSTRUCTION ${data[0] ?? "UNKNOWN"}`;
      if (data[0] === 3 || data[0] === 4 || data[0] === 12 || data[0] === 13) amount = readU64Le(data, 1);
    }
    if (programId === SystemProgram.programId.toBase58() && data.length >= 12) {
      const discriminator = new DataView(data.buffer, data.byteOffset, data.byteLength).getUint32(0, true);
      if (discriminator === 2) {
        operation = "SYSTEM TRANSFER";
        amount = readU64Le(data, 4);
      }
    }
    return {
      index,
      programId,
      program: PROGRAM_NAMES.get(programId) || (MEMO_PROGRAMS.has(programId) ? "MEMO" : "UNRECOGNIZED"),
      operation,
      accountCount: instruction.accountKeyIndexes.length,
      rawAmount: amount,
    };
  });

  const riskFlags: Array<{ severity: "INFO" | "REVIEW" | "HIGH"; code: string; explanation: string }> = [];
  const authorityChanges = instructions.filter((item) => /APPROVE|SET AUTHORITY/i.test(item.operation));
  const closes = instructions.filter((item) => item.operation === "CLOSE ACCOUNT");
  const unknownPrograms = instructions.filter((item) => item.program === "UNRECOGNIZED");
  if (authorityChanges.length) riskFlags.push({ severity: "HIGH", code: "TOKEN_AUTHORITY_CHANGE", explanation: `${authorityChanges.length} instruction(s) can create or change token authority. Verify every affected account and delegate before signing.` });
  if (closes.length) riskFlags.push({ severity: "REVIEW", code: "ACCOUNT_CLOSE", explanation: `${closes.length} token account close instruction(s) were detected. Confirm where reclaimed rent will be sent.` });
  if (unknownPrograms.length) riskFlags.push({ severity: "REVIEW", code: "UNRECOGNIZED_PROGRAM", explanation: `${unknownPrograms.length} instruction(s) use programs outside RED QUEEN's small known-program list. Unknown does not mean malicious.` });
  if (requiredSignerCount > 1) riskFlags.push({ severity: "REVIEW", code: "MULTIPLE_SIGNERS", explanation: `The message requires ${requiredSignerCount} signatures. Confirm why each signer is necessary.` });
  if (expectedSignerPresent === false) riskFlags.push({ severity: "HIGH", code: "WALLET_NOT_REQUIRED_SIGNER", explanation: "The supplied wallet is not one of the transaction's required signers." });
  if (writableAccounts > 20) riskFlags.push({ severity: "REVIEW", code: "LARGE_WRITE_SURFACE", explanation: `${writableAccounts} writable accounts create a broad state-change surface.` });

  const simulation = await connection.simulateTransaction(transaction, {
    sigVerify: false,
    replaceRecentBlockhash: true,
    commitment: "confirmed",
  });
  if (simulation.value.err) riskFlags.push({ severity: "HIGH", code: "SIMULATION_FAILED", explanation: "RPC simulation returned an error. Do not sign until the cause is understood and the transaction is rebuilt." });
  if (!riskFlags.length) riskFlags.push({ severity: "INFO", code: "NO_EXPLICIT_HIGH_RISK_PATTERN", explanation: "No authority change or simulation failure was detected by this bounded inspection. This is not proof that the transaction is safe." });

  const overallRisk = riskFlags.some((flag) => flag.severity === "HIGH")
    ? "HIGH"
    : riskFlags.some((flag) => flag.severity === "REVIEW") ? "REVIEW" : "LOWER OBSERVED RISK";

  return {
    network: "Solana Mainnet",
    messageVersion: 0,
    recentBlockhash: transaction.message.recentBlockhash,
    requiredSignerCount,
    signers,
    expectedWallet: expectedWallet || null,
    expectedSignerPresent,
    staticAccounts: transaction.message.staticAccountKeys.length,
    addressLookupTables: transaction.message.addressTableLookups.map((lookup) => lookup.accountKey.toBase58()),
    totalResolvedAccounts: accountKeys.length,
    writableAccounts,
    instructions,
    simulation: {
      ok: simulation.value.err === null,
      error: simulation.value.err,
      unitsConsumed: simulation.value.unitsConsumed ?? null,
      logs: simulation.value.logs?.slice(-20) || [],
    },
    overallRisk,
    riskFlags,
    queenDirective: simulation.value.err
      ? "Do not sign this payload. Rebuild it from the trusted originating application and inspect the new simulation."
      : authorityChanges.length
        ? "Do not sign until every authority target, delegate and allowance is understood."
        : "Compare the wallet's final simulation, asset changes, destination accounts and domain with this report before deciding whether to sign.",
    limitations: [
      "Simulation uses sigVerify=false and a replaced recent blockhash; it does not authorize or submit the inspected transaction.",
      "A successful simulation does not prove the originating website, price, token mint or business intent is trustworthy.",
      "Program recognition is intentionally conservative and cannot decode every custom or dynamically loaded program instruction.",
    ],
    inspectedAt: new Date().toISOString(),
  };
}
