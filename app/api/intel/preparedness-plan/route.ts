import { NextRequest, NextResponse } from "next/server";
import { buildPreparednessPlan, MINIMUM_PAID_SOURCE_COVERAGE } from "@/lib/intelligence-reports";
import { fetchSignalGrid } from "@/lib/signal-engine";
import { isSurvivalFocus, sanitizeArea, SurvivalFocus } from "@/lib/survival-context";
import { withFriendlyX402 } from "@/lib/x402";

const svmAddress = process.env.SVM_ADDRESS || "";
const network = (process.env.SVM_NETWORK || "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp") as any;

async function readInput(request: Request) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const rawFocus = typeof body.focus === "string" ? body.focus : "HOUSEHOLD";
  return {
    area: sanitizeArea(typeof body.area === "string" ? body.area : ""),
    focus: (isSurvivalFocus(rawFocus) ? rawFocus : "HOUSEHOLD") as SurvivalFocus,
    household: typeof body.household === "string" ? body.household.trim().slice(0, 320) : "",
    constraints: typeof body.constraints === "string" ? body.constraints.trim().slice(0, 320) : "",
    rawFocus,
  };
}

const handler = async (_request: NextRequest, prepared?: unknown) => {
  if (!prepared) return NextResponse.json({ success: false, error: "Preparedness plan was not compiled before settlement." }, { status: 503 });
  return NextResponse.json({
    success: true,
    clearance: "PAID OUTPUT // x402 SETTLED",
    ...(prepared as Record<string, unknown>),
    trustBoundary: "The plan is a personal memory aid and decision-support artifact, not an emergency order, medical advice or proof of readiness. This purchase awards no BIO-SCORE or survival XP.",
  });
};

export const POST = withFriendlyX402(handler, {
  productId: "preparedness-compiler",
  preflight: async (request: NextRequest) => {
    const input = await readInput(request.clone());
    if (!isSurvivalFocus(input.rawFocus)) return NextResponse.json({ error: "A supported preparedness focus is required." }, { status: 400 });
    if (!input.household && !input.constraints) return NextResponse.json({ error: "Provide at least one household detail or constraint so the paid plan is meaningfully personalized." }, { status: 400 });
    try {
      const grid = await fetchSignalGrid();
      if (grid.coverage.online < MINIMUM_PAID_SOURCE_COVERAGE) {
        return NextResponse.json({ error: `Only ${grid.coverage.online}/${grid.coverage.total} source families responded. Paid plan delivery requires ${MINIMUM_PAID_SOURCE_COVERAGE}. No payment was requested.`, syntheticData: false }, { status: 503 });
      }
      return { prepared: { generatedAt: grid.generatedAt, plan: buildPreparednessPlan({ ...input, grid }), sourceCoverage: grid.coverage } };
    } catch (error) {
      console.error("Preparedness plan preflight failed:", error);
      return NextResponse.json({ error: "Queen could not compile the plan before payment. No payment was requested." }, { status: 503 });
    }
  },
  accepts: { scheme: "exact", price: "$0.02", network, payTo: svmAddress },
  description: "Personalized, source-bounded 72-hour preparedness protocol with phased actions and exportable sources.",
  mimeType: "application/json",
  serviceName: "RED QUEEN Intelligence",
  tags: ["survival", "preparedness", "72-hour-plan", "x402"],
  iconUrl: "https://redqueen.space/token-image.png",
});
