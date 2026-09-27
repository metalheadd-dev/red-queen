import { NextRequest, NextResponse } from "next/server";
import { buildPreparednessRecheck, MINIMUM_PAID_SOURCE_COVERAGE } from "@/lib/intelligence-reports";
import { parsePreparednessRecheck } from "@/lib/preparedness-recheck";
import { fetchSignalGrid } from "@/lib/signal-engine";
import { withFriendlyX402 } from "@/lib/x402";

const svmAddress = process.env.SVM_ADDRESS || "";
const network = (process.env.SVM_NETWORK || "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp") as any;

const handler = async (_request: NextRequest, prepared?: unknown) => {
  if (!prepared) return NextResponse.json({ error: "Plan Recheck was not prepared before settlement." }, { status: 503 });
  return NextResponse.json({ success: true, clearance: "PLAN RECHECK // x402 SETTLED", report: prepared, trustBoundary: "The selected plan was supplied by this device. RQ compared it only with currently reachable source records and did not put plan details on-chain." });
};

export const POST = withFriendlyX402(handler, {
  productId: "preparedness-recheck",
  preflight: async (request: NextRequest) => {
    const input = parsePreparednessRecheck(await request.clone().json().catch(() => null));
    if (!input) return NextResponse.json({ error: "A valid saved preparedness-plan checkpoint is required." }, { status: 400 });
    try {
      const grid = await fetchSignalGrid();
      if (grid.coverage.online < MINIMUM_PAID_SOURCE_COVERAGE) return NextResponse.json({ error: `Only ${grid.coverage.online}/${grid.coverage.total} source families responded. No payment was requested.` }, { status: 503 });
      const report = buildPreparednessRecheck(grid, input);
      if (!report.changes.length) return NextResponse.json({ error: "No current source revision matched this plan. Keep the existing plan. No payment was requested.", freeSummary: report.headline }, { status: 409 });
      return { prepared: report };
    } catch (error) {
      console.error("Preparedness recheck preflight failed:", error);
      return NextResponse.json({ error: "Current sources could not be checked. No payment was requested." }, { status: 503 });
    }
  },
  accepts: { scheme: "exact", price: "$0.01", network, payTo: svmAddress },
  description: "Compare a saved preparedness-plan checkpoint with current source revisions and return a bounded update protocol.",
  mimeType: "application/json",
  serviceName: "RED QUEEN Intelligence",
  tags: ["survival", "preparedness", "source-delta", "x402"],
  iconUrl: "https://redqueen.space/token-image.png",
});
