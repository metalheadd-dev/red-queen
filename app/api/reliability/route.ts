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
  const preparedResources = resources.filter((product) => product.deliveryMode === "PREPARED_BEFORE_PAYMENT");
  const upstreamAfterPayment = resources.filter((product) => product.deliveryMode === "UPSTREAM_AFTER_PAYMENT");

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
      preparedBeforePayment: preparedResources.map((product) => product.id),
      upstreamAfterPayment: upstreamAfterPayment.map((product) => product.id),
      disclosure: "Prepared resources compute the complete declared output before settlement. Upstream-after-payment resources can still fail after customer settlement and require a durable fulfillment or refund policy before production launch.",
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
