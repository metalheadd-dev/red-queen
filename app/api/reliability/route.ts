import { NextResponse } from "next/server";
import { X402_INTELLIGENCE_PRODUCTS } from "@/lib/intelligence-products";
import { checkX402OperationStore } from "@/lib/x402-operations";
import { isValidSolanaPublicKey } from "@/lib/solana";
import { RED_QUEEN_X402_NETWORK } from "@/lib/x402-discovery";

export const dynamic = "force-dynamic";

export async function GET() {
  const recipient = process.env.SVM_ADDRESS?.trim() || "";
  const receiptStore = await checkX402OperationStore();
  const recipientReady = isValidSolanaPublicKey(recipient);
  const resources = X402_INTELLIGENCE_PRODUCTS.filter(
    (product) => Boolean(product.endpoint) && product.status !== "RESEARCH",
  );

  return NextResponse.json({
    service: "RED QUEEN Intelligence Merchant",
    status: recipientReady && receiptStore.available ? "OPERATIONAL" : "DEGRADED",
    checkedAt: new Date().toISOString(),
    paymentRail: {
      protocol: "x402",
      version: 2,
      scheme: "exact",
      network: process.env.SVM_NETWORK || RED_QUEEN_X402_NETWORK,
      asset: "USDC",
      recipientConfigured: recipientReady,
    },
    catalog: {
      publishedResources: resources.length,
      discovery: "https://redqueen.space/.well-known/x402",
      openapi: "https://redqueen.space/openapi.json",
    },
    delivery: {
      receiptStore: receiptStore.available ? "AVAILABLE" : "UNAVAILABLE",
      replayProtection: "X-Operation-Id + request and payment fingerprints",
      idempotentDelivery: true,
      paymentWithoutDeclaredOutput: false,
    },
    trustBoundary: "No seed phrase, private key, custody, autonomous spending authority, XP or BIO-SCORE is exchanged for payment.",
  }, {
    status: recipientReady && receiptStore.available ? 200 : 503,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
    },
  });
}
