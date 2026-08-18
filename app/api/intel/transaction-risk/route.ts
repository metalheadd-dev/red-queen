import { NextRequest, NextResponse } from "next/server";
import { VersionedTransaction } from "@solana/web3.js";
import { isValidSolanaPublicKey } from "@/lib/solana";
import { inspectSolanaTransaction } from "@/lib/transaction-risk";
import { withFriendlyX402 } from "@/lib/x402";

const svmAddress = process.env.SVM_ADDRESS || "";
const network = (process.env.SVM_NETWORK || "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp") as any;

async function readInput(request: NextRequest) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  return {
    transaction: typeof body.transaction === "string" ? body.transaction.trim() : "",
    wallet: typeof body.wallet === "string" ? body.wallet.trim() : "",
  };
}

function looksLikeBase64(value: string) {
  return value.length >= 40 && value.length <= 240_000 && /^[A-Za-z0-9+/]+={0,2}$/.test(value);
}

const handler = async (request: NextRequest) => {
  try {
    const input = await readInput(request);
    const report = await inspectSolanaTransaction(input.transaction, input.wallet);
    return NextResponse.json({
      success: true,
      clearance: "PAID OUTPUT // x402 SETTLED",
      report,
      transactionSubmitted: false,
      signatureRequestedForInspectedTransaction: false,
      trustBoundary: "RED QUEEN inspected and simulated the supplied transaction but did not sign or submit it. The separate x402 USDC payment cannot authorize the inspected payload.",
    });
  } catch (error) {
    console.error("Transaction risk inspection failed:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Transaction inspection failed." }, { status: 422 });
  }
};

export const POST = withFriendlyX402(handler, {
  productId: "transaction-risk-explanation",
  preflight: async (request: NextRequest) => {
    const input = await readInput(request);
    if (!looksLikeBase64(input.transaction)) return NextResponse.json({ error: "Paste a valid base64 serialized Solana versioned transaction." }, { status: 400 });
    try {
      VersionedTransaction.deserialize(Buffer.from(input.transaction, "base64"));
    } catch {
      return NextResponse.json({ error: "The supplied base64 does not contain a valid Solana versioned transaction. No payment was requested." }, { status: 400 });
    }
    if (input.wallet && !isValidSolanaPublicKey(input.wallet)) return NextResponse.json({ error: "The optional expected signer wallet is invalid." }, { status: 400 });
    return null;
  },
  accepts: { scheme: "exact", price: "$0.01", network, payTo: svmAddress },
  description: "Pre-sign Solana transaction simulation, signer surface, known instruction decoding and bounded risk explanation.",
  mimeType: "application/json",
  serviceName: "RED QUEEN Intelligence",
  tags: ["solana", "transaction-simulation", "wallet-safety", "x402"],
  iconUrl: "https://redqueen.space/token-image.png",
});
