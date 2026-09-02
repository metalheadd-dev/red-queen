import {
  createTransferCheckedInstruction,
  createTransferCheckedWithTransferHookInstruction,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  ComputeBudgetProgram,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";

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
  connection?: Connection;
  allowedAssets?: string[];
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

function paymentSymbol(asset: string) {
  if (asset === "2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo") return "PYUSD";
  if (asset === "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v") return "USDC";
  return "TOKEN";
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
  const challengeBody = await response.clone().json().catch(() => null);
  const challenge = challengeHeader ? decodeHeader(challengeHeader) : challengeBody;
  if (!challenge || !Array.isArray(challenge.accepts)) throw new Error("The x402 gateway did not provide payment requirements.");
  const allowedAssets = new Set(input.allowedAssets || ["EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"]);
  const accept = challenge.accepts.find((candidate: any) => {
    const network = String(candidate.network || "");
    return candidate.scheme === "exact"
      && (network === "solana" || network.startsWith("solana:"))
      && allowedAssets.has(String(candidate.asset || ""));
  });
  if (!accept) throw new Error("No supported exact Solana x402 payment option was offered.");
  const version = Number(challenge.x402Version || 2);
  const amount = String(accept.amount || accept.maxAmountRequired || "");
  const asset = String(accept.asset || "");
  const payTo = String(accept.payTo || "");
  const feePayer = String(accept.extra?.feePayer || "");
  if (!/^\d+$/.test(amount) || BigInt(amount) <= BigInt(0)) throw new Error("The x402 amount is invalid.");
  const mint = new PublicKey(asset);
  const payer = new PublicKey(feePayer);
  const symbol = paymentSymbol(asset);
  input.onStatus?.(`VERIFYING ${symbol} AND NETWORK FEE…`);
  const paymentStateResponse = await fetch("/api/x402/payment-state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      wallet: input.publicKey.toBase58(),
      asset,
      payTo,
      network: String(accept.network || ""),
      amount,
    }),
    cache: "no-store",
  });
  if (!paymentStateResponse.ok) throw new Error(await parseFailure(paymentStateResponse));
  const paymentState = await paymentStateResponse.json();
  const lamports = Number(paymentState.lamports || 0);
  if (lamports < 100_000) throw new Error("The connected wallet needs a small SOL balance for network fees.");
  if (!paymentState.sourceAccount || BigInt(String(paymentState.tokenAmount || "0")) < BigInt(amount)) {
    const required = Number(amount) / (10 ** Number(paymentState.decimals || 6));
    throw new Error(`Insufficient ${symbol}. This operation requires ${required.toFixed(2)} ${symbol}.`);
  }
  const sourceAccount = new PublicKey(paymentState.sourceAccount);
  const destinationAccount = new PublicKey(paymentState.destinationAccount);
  const decimals = Number(paymentState.decimals || 6);
  const tokenProgram = new PublicKey(String(paymentState.tokenProgram || TOKEN_PROGRAM_ID.toBase58()));
  let transferInstruction: TransactionInstruction;
  if (tokenProgram.equals(TOKEN_2022_PROGRAM_ID)) {
    if (!input.connection) throw new Error(`${symbol} checkout requires an active Solana connection.`);
    transferInstruction = await createTransferCheckedWithTransferHookInstruction(
      input.connection,
      sourceAccount,
      mint,
      destinationAccount,
      input.publicKey,
      BigInt(amount),
      decimals,
      [],
      "confirmed",
      TOKEN_2022_PROGRAM_ID,
    );
  } else {
    transferInstruction = createTransferCheckedInstruction(
      sourceAccount,
      mint,
      destinationAccount,
      input.publicKey,
      BigInt(amount),
      decimals,
      [],
      TOKEN_PROGRAM_ID,
    );
  }
  const instructions: TransactionInstruction[] = [
    ComputeBudgetProgram.setComputeUnitLimit({ units: 20_000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 5 }),
    transferInstruction,
  ];
  const memo = typeof accept.extra?.memo === "string" ? accept.extra.memo.slice(0, 256) : "";
  if (memo) {
    instructions.push(new TransactionInstruction({
      programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
      keys: [],
      data: Buffer.from(memo, "utf8"),
    }));
  }
  const transaction = new VersionedTransaction(new TransactionMessage({
    payerKey: payer,
    recentBlockhash: String(paymentState.blockhash),
    instructions,
  }).compileToV0Message());

  input.onStatus?.(`APPROVE EXACT x402 PAYMENT · ${(Number(amount) / (10 ** decimals)).toFixed(2)} ${symbol}…`);
  const signed = await input.signTransaction(transaction);
  const paymentPayload = btoa(JSON.stringify(version === 1 ? {
    x402Version: 1,
    scheme: accept.scheme,
    network: accept.network,
    payload: { transaction: bytesToBase64(signed.serialize()) },
  } : {
    x402Version: 2,
    accepted: accept,
    payload: { transaction: bytesToBase64(signed.serialize()) },
  }));
  const paymentHeader = version === 1 ? "X-PAYMENT" : "PAYMENT-SIGNATURE";

  let lastError = "Facilitator did not confirm delivery.";
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    input.onStatus?.(`SETTLING AND DELIVERING · ${attempt}/8…`);
    response = await request({ [paymentHeader]: paymentPayload });
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
