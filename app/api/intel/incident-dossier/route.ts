import { NextRequest, NextResponse } from "next/server";
import { buildIncidentDossier } from "@/lib/intelligence-reports";
import { findVerifiedSignalById } from "@/lib/signal-engine";
import { buildThreatGraph } from "@/lib/threat-graph";
import { sanitizeSignalId } from "@/lib/survival-context";
import { withFriendlyX402 } from "@/lib/x402";

const svmAddress = process.env.SVM_ADDRESS || "";
const network = (process.env.SVM_NETWORK || "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp") as any;

const handler = async (_request: NextRequest, prepared?: unknown) => {
  if (!prepared) return NextResponse.json({ success: false, error: "The incident dossier was not prepared before settlement." }, { status: 503 });
  return NextResponse.json({
    success: true,
    clearance: "PAID OUTPUT // x402 SETTLED",
    dossier: prepared,
    trustBoundary: "Fictional and satirical archive records cannot enter this endpoint. Export reflects one timestamped source snapshot and may become stale.",
  });
};

export const GET = withFriendlyX402(handler, {
  productId: "incident-dossier",
  preflight: async (request: NextRequest) => {
    const signalId = sanitizeSignalId(request.nextUrl.searchParams.get("signalId"));
    if (!signalId) return NextResponse.json({ error: "A valid verified signal ID from Pulse or Map is required." }, { status: 400 });
    const signal = await findVerifiedSignalById(signalId);
    return signal && buildThreatGraph(signal)?.status === "CURRENT"
      ? { prepared: buildIncidentDossier(signal) }
      : NextResponse.json({ error: "This signal is no longer available in the verified source window. No payment was requested." }, { status: 404 });
  },
  accepts: { scheme: "exact", price: "$0.02", network, payTo: svmAddress },
  description: "Timestamped incident dossier with verified fact, RED QUEEN assessment, uncertainty, action protocol and export metadata.",
  mimeType: "application/json",
  serviceName: "RED QUEEN Intelligence",
  tags: ["survival", "incident", "dossier", "verified-source", "x402"],
  iconUrl: "https://redqueen.space/token-image.png",
});
