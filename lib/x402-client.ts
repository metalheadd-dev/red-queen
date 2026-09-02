import { createTransferCheckedInstruction, getAssociatedTokenAddress } from "@solana/spl-token";
import {
  ComputeBudgetProgram,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { withWorkingConnection } from "@/lib/solana";

export type X402Delivery = {
  data: any;
  operationId: string;
  receiptStored: boolean;
  transactionSignature: string | null;
};

type X402ClientInput = {
  endpoint: string;
  method?: "GET" | "POST";
  body?: unknown;
  publicKey: PublicKey;
  signTransaction: (transaction: VersionedTransaction) => Promise<VersionedTransaction>;
  accessToken?: string;
  onStatus?: (status: string) => void;
};

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunk = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunk) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunk));
  }
  return btoa(binary);
}

function decodeHeader(value: string) {
  return JSON.parse(atob(value));
}

function settlementSignature(response: Response) {
  const header = response.headers.get("payment-response") || response.headers.get("x-payment-response");
  if (!header) return null;
  try {
    const decoded = decodeHeader(header);
    return typeof decoded.transaction === "string" ? decoded.transaction : null;
  } catch {
    return null;
  }
}

async function parseFailure(response: Response) {
  const text = await response.text().catch(() => "");
  try {
    const parsed = JSON.parse(text);
    return parsed.error || parsed.message || text || `HTTP ${response.status}`;
  } catch {
    return text || `HTTP ${response.status}`;
  }
}

export async function purchaseX402Output(input: X402ClientInput): Promise<X402Delivery> {
  const method = input.method || "GET";
  const operationId = crypto.randomUUID();
  const baseHeaders: Record<string, string> = { "X-Operation-Id": operationId };
  if (input.accessToken) baseHeaders.Authorization = `Bearer ${input.accessToken}`;
  let serializedBody: string | undefined;
  if (method === "POST") {
    baseHeaders["Content-Type"] = "application/json";
    serializedBody = JSON.stringify(input.body ?? {});
  }
  const request = (extraHeaders: Record<string, string> = {}) => fetch(input.endpoint, {
    method,
    headers: { ...baseHeaders, ...extraHeaders },
    body: serializedBody,
    cache: "no-store",
  });

  input.onStatus?.("REQUESTING DECLARED OUTPUT…");
  let response = await request();
  if (response.ok) {
    return {
      data: await response.json(),
      operationId: response.headers.get("x-operation-id") || operationId,
      receiptStored: response.headers.get("x-receipt-status") === "stored",
      transactionSignature: settlementSignature(response),
    };
  }
  if (response.status !== 402) throw new Error(await parseFailure(response));

  const challengeHeader = response.headers.get("payment-required") || response.headers.get("x-payment-required");
  if (!challengeHeader) throw new Error("The x402 gateway did not provide payment requirements.");
  const challenge = decodeHeader(challengeHeader);
  const accept = challenge.accepts?.find((candidate: any) => candidate.scheme === "exact" && String(candidate.network || "").startsWith("solana:"));
  if (!accept) throw new Error("No x402 v2 exact SVM payment option was offered.");
  const amount = String(accept.amount || "");
  const asset = String(accept.asset || "");
  const payTo = String(accept.payTo || "");
  const feePayer = String(accept.extra?.feePayer || "");
  if (!/^\d+$/.test(amount) || BigInt(amount) <= BigInt(0)) throw new Error("The x402 amount is invalid.");
  const mint = new PublicKey(asset);
  const recipient = new PublicKey(payTo);
  const payer = new PublicKey(feePayer);
  const isDevnet = String(accept.network).includes("EtWTRABZaYq6iMfeYKouRu166VU2xqa1") || String(accept.network).includes("devnet");
  input.onStatus?.("VERIFYING USDC AND NETWORK FEE…");
  const { connection, result: paymentState } = await withWorkingConnection(async (candidate) => {
    const [lamports, accounts] = await Promise.all([
      candidate.getBalance(input.publicKey),
      candidate.getParsedTokenAccountsByOwner(input.publicKey, { mint }),
    ]);
    return { lamports, accounts: accounts.value };
  }, isDevnet);
  const { lamports } = paymentState;
  if (lamports < 100_000) throw new Error("The connected wallet needs a small SOL balance for network fees.");
  const spendableAccounts = paymentState.accounts
    .map((account) => ({
      publicKey: account.pubkey,
      amount: BigInt((account.account.data as any)?.parsed?.info?.tokenAmount?.amount || "0"),
    }))
    .sort((left, right) => left.amount === right.amount ? 0 : left.amount > right.amount ? -1 : 1);
  const source = spendableAccounts.find((account) => account.amount >= BigInt(amount));
  if (!source) {
    const required = Number(amount) / 1_000_000;
    throw new Error(`Insufficient USDC. This operation requires ${required.toFixed(2)} USDC.`);
  }
  const sourceAccount = source.publicKey;
  const destinationAccount = await getAssociatedTokenAddress(mint, recipient);

  let decimals = 6;
  const mintInfo = await connection.getParsedAccountInfo(mint).catch(() => null);
  if (mintInfo?.value && typeof mintInfo.value.data === "object" && "parsed" in mintInfo.value.data) {
    decimals = Number((mintInfo.value.data as any).parsed?.info?.decimals ?? 6);
  }
  const instructions: TransactionInstruction[] = [
    ComputeBudgetProgram.setComputeUnitLimit({ units: 20_000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 5 }),
    createTransferCheckedInstruction(sourceAccount, mint, destinationAccount, input.publicKey, BigInt(amount), decimals),
  ];
  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  const transaction = new VersionedTransaction(new TransactionMessage({
    payerKey: payer,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message());

  input.onStatus?.(`APPROVE EXACT x402 PAYMENT · ${(Number(amount) / 1_000_000).toFixed(2)} USDC…`);
  const signed = await input.signTransaction(transaction);
  const paymentPayload = btoa(JSON.stringify({
    x402Version: 2,
    accepted: accept,
    payload: { transaction: bytesToBase64(signed.serialize()) },
  }));

  let lastError = "Facilitator did not confirm delivery.";
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    input.onStatus?.(`SETTLING AND DELIVERING · ${attempt}/8…`);
    response = await request({ "PAYMENT-SIGNATURE": paymentPayload });
    if (response.ok) {
      return {
        data: await response.json(),
        operationId: response.headers.get("x-operation-id") || operationId,
        receiptStored: response.headers.get("x-receipt-status") === "stored",
        transactionSignature: settlementSignature(response),
      };
    }
    lastError = await parseFailure(response);
    if (response.status !== 402) break;
    if (attempt < 8) await new Promise((resolve) => setTimeout(resolve, 2_500));
  }
  throw new Error(lastError);
}
