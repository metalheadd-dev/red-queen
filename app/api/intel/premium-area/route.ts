import { NextRequest, NextResponse } from "next/server";
import {
  parsePremiumAreaInput,
  PREMIUM_AREA_PRICE,
  premiumProviderQuote,
  procurePremiumArea,
} from "@/lib/premium-survival-intelligence";
import { withFriendlyX402 } from "@/lib/x402";

const svmAddress = process.env.SVM_ADDRESS || "";
const network = (process.env.SVM_NETWORK || "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp") as any;

async function readBody(request: NextRequest) {
  return parsePremiumAreaInput(await request.clone().json().catch(() => null));
}

const handler = async (request: NextRequest) => {
  const input = parsePremiumAreaInput(await request.json().catch(() => null));
  if (!input) return NextResponse.json({ success: false, error: "A valid broad area, approximate coordinates and radius are required." }, { status: 400 });
  try {
    const purchased = await procurePremiumArea(input);
    return NextResponse.json({
      success: true,
      clearance: "PREMIUM PROCUREMENT // x402 SETTLED",
      ...purchased,
      trustBoundary: "RED QUEEN purchased provider-metered area intelligence only after this operation was approved. Provider credentials remain server-side and no synthetic premium record is substituted on failure.",
    });
  } catch (error) {
    console.error("Premium area procurement failed:", error);
    return NextResponse.json({
      success: false,
      error: "The premium provider did not deliver the purchased data. RED QUEEN did not substitute the free signal grid as premium intelligence.",
      providerError: error instanceof Error ? error.message : "Premium provider unavailable",
    }, { status: 503 });
  }
};

export const POST = withFriendlyX402(handler, {
  productId: "premium-area-intelligence",
  preflight: async (request: NextRequest) => {
    const input = await readBody(request);
    if (!input) return NextResponse.json({ error: "A valid broad area, approximate coordinates and radius are required." }, { status: 400 });
    const quote = premiumProviderQuote();
    if (!quote.eligible) {
      return NextResponse.json({
        error: "Premium Area Intelligence is not active until Off-Nadir Delta is configured server-side. No payment was requested.",
        quote,
      }, { status: 503 });
    }
    return null;
  },
  accepts: { scheme: "exact", price: PREMIUM_AREA_PRICE, network, payTo: svmAddress },
  description: "RED QUEEN purchases provider-metered geospatial and optional weather intelligence for a broad area, then returns one sourced assessment and procurement receipt.",
  mimeType: "application/json",
  serviceName: "RED QUEEN Premium Procurement",
  tags: ["survival", "premium-data", "geospatial-intelligence", "agentic-commerce", "x402"],
  iconUrl: "https://redqueen.space/token-image.png",
});
