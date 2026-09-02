import { NextRequest, NextResponse } from "next/server";
import {
  EXTERNAL_INTELLIGENCE_PRICE,
  externalIntelligenceQuote,
  parseExternalIntelligenceInput,
  procureExternalIntelligence,
  verifyExternalQuote,
} from "@/lib/external-survival-intelligence";
import { withFriendlyX402 } from "@/lib/x402";

export const maxDuration = 60;

const svmAddress = process.env.SVM_ADDRESS || "";
const network = (process.env.SVM_NETWORK || "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp") as any;

async function readBody(request: NextRequest) {
  return parseExternalIntelligenceInput(await request.clone().json().catch(() => null));
}

const handler = async (request: NextRequest) => {
  const input = parseExternalIntelligenceInput(await request.json().catch(() => null));
  if (!input || !verifyExternalQuote(input)) {
    return NextResponse.json({ success: false, error: "The reviewed procurement quote is missing, expired or does not match this request." }, { status: 409 });
  }
  try {
    const delivery = await procureExternalIntelligence(input);
    return NextResponse.json({
      success: true,
      clearance: "QUEEN BUYER // UPSTREAM x402 SETTLED",
      ...delivery,
      trustBoundary: "The dedicated RED QUEEN buyer wallet paid only the two disclosed Agent402 resources. No treasury key, user wallet authority or autonomous budget was used.",
    });
  } catch (error) {
    console.error("External intelligence procurement failed:", error);
    return NextResponse.json({
      success: false,
      error: "The upstream merchant or RED QUEEN synthesis did not deliver the declared operation. No free result was relabeled as purchased intelligence.",
      providerError: error instanceof Error ? error.message : "External procurement unavailable",
    }, { status: 503 });
  }
};

export const POST = withFriendlyX402(handler, {
  productId: "external-survival-intelligence",
  preflight: async (request: NextRequest) => {
    const input = await readBody(request);
    if (!input) return NextResponse.json({ error: "A broad area and bounded survival-intelligence question are required." }, { status: 400 });
    const quote = await externalIntelligenceQuote(input);
    if (!quote.eligible) return NextResponse.json({ error: "The Queen Buyer flow is not configured. No payment was requested.", quote }, { status: 503 });
    if (!verifyExternalQuote(input)) return NextResponse.json({ error: "Fetch and review a fresh procurement quote before payment.", quoteEndpoint: "/api/intel/external-intelligence/quote" }, { status: 409 });
    return null;
  },
  accepts: { scheme: "exact", price: EXTERNAL_INTELLIGENCE_PRICE, network, payTo: svmAddress },
  description: "RED QUEEN buys paid web discovery and article extraction from an allowlisted x402 merchant, then delivers one evidence-bounded survival-intelligence report with both receipts.",
  mimeType: "application/json",
  serviceName: "RED QUEEN Buyer Intelligence",
  tags: ["survival", "external-intelligence", "agent-to-agent", "procurement", "x402"],
  iconUrl: "https://redqueen.space/token-image.png",
});
