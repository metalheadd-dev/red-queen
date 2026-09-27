import { NextRequest, NextResponse } from "next/server";
import { findVerifiedSignalById } from "@/lib/signal-engine";
import { buildThreatGraph } from "@/lib/threat-graph";
import { sanitizeSignalId } from "@/lib/survival-context";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const signalId = sanitizeSignalId(request.nextUrl.searchParams.get("signalId"));
  if (!signalId) return NextResponse.json({ error: "A valid source signal ID is required." }, { status: 400 });
  const signal = await findVerifiedSignalById(signalId);
  const graph = signal ? buildThreatGraph(signal) : null;
  const available = graph?.status === "CURRENT";
  return NextResponse.json({
    available,
    price: "0.02 USDC",
    product: "Incident explained",
    checkedAt: new Date().toISOString(),
    signal: available ? {
      id: graph.signalId,
      name: graph.name,
      sourceUrl: graph.sourceUrl,
      observedAt: graph.observedAt,
      updatedAt: graph.updatedAt,
      sourceScore: graph.confidence,
    } : null,
    includes: ["Timestamped source fact", "Queen assessment and uncertainty", "Practical action protocol", "Exportable dossier and settlement receipt"],
    reason: available ? null : "This signal is missing or outside its source freshness window. No payment should be requested.",
    disclaimer: "This is a decision-support report, not proof of personal danger or an emergency instruction.",
  }, { headers: { "Cache-Control": "no-store" } });
}
