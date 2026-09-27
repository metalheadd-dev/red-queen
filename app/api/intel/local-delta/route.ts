import { NextRequest, NextResponse } from "next/server";
import { buildLocalDelta, MINIMUM_PAID_SOURCE_COVERAGE } from "@/lib/intelligence-reports";
import { fetchSignalGrid } from "@/lib/signal-engine";
import { withFriendlyX402 } from "@/lib/x402";

const svmAddress = process.env.SVM_ADDRESS || "";
const network = (process.env.SVM_NETWORK || "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp") as any;

function readInput(request: NextRequest) {
  const area = (request.nextUrl.searchParams.get("area") || "").replace(/\s+/g, " ").trim().slice(0, 80);
  const latValue = request.nextUrl.searchParams.get("lat");
  const lngValue = request.nextUrl.searchParams.get("lng");
  const radiusValue = Number(request.nextUrl.searchParams.get("radiusKm") || 250);
  const lat = latValue === null || latValue === "" ? undefined : Number(latValue);
  const lng = lngValue === null || lngValue === "" ? undefined : Number(lngValue);
  const radiusKm = Number.isFinite(radiusValue) ? Math.min(1_000, Math.max(25, Math.round(radiusValue))) : 250;
  return { area, lat, lng, radiusKm };
}

function validateInput(request: NextRequest) {
  const input = readInput(request);
  if (input.area.length < 2) return "A broad city or region label is required.";
  const oneCoordinateMissing = (input.lat === undefined) !== (input.lng === undefined);
  if (oneCoordinateMissing) return "Latitude and longitude must be supplied together.";
  if (input.lat !== undefined && (!Number.isFinite(input.lat) || input.lat < -90 || input.lat > 90)) return "Latitude is invalid.";
  if (input.lng !== undefined && (!Number.isFinite(input.lng) || input.lng < -180 || input.lng > 180)) return "Longitude is invalid.";
  return "";
}

const handler = async (_request: NextRequest, prepared?: unknown) => {
  if (!prepared) return NextResponse.json({ success: false, error: "Local Delta was not prepared before settlement." }, { status: 503 });
  return NextResponse.json({
    success: true,
    clearance: "PAID OUTPUT // x402 SETTLED",
    ...(prepared as Record<string, unknown>),
    trustBoundary: "No fictional archive records are included. No match is not proof of safety, and exact home location is neither required nor retained by this endpoint.",
  });
};

export const GET = withFriendlyX402(handler, {
  productId: "local-delta-brief",
  preflight: async (request: NextRequest) => {
    const error = validateInput(request);
    if (error) return NextResponse.json({ error }, { status: 400 });
    try {
      const grid = await fetchSignalGrid();
      if (grid.coverage.online < MINIMUM_PAID_SOURCE_COVERAGE) {
        return NextResponse.json({ error: `Only ${grid.coverage.online}/${grid.coverage.total} source families responded. Paid Local Delta requires ${MINIMUM_PAID_SOURCE_COVERAGE}. No payment was requested.`, sourceStatus: grid.sourceHealth, syntheticData: false }, { status: 503 });
      }
      const report = buildLocalDelta(grid, readInput(request));
      if (!report.changes.length) {
        return NextResponse.json({
          error: "No current, source-backed change matched this area in the last 24 hours. No payment was requested.",
          freeSummary: report.headline,
          sourceCoverage: grid.coverage,
          uncertainty: report.uncertainty,
        }, { status: 409 });
      }
      return { prepared: { generatedAt: grid.generatedAt, report, sourceCoverage: grid.coverage, sourceStatus: grid.sourceHealth } };
    } catch (error) {
      console.error("Local Delta preflight failed:", error);
      return NextResponse.json({ error: "The source grid could not prepare a Local Delta. No payment was requested." }, { status: 503 });
    }
  },
  accepts: { scheme: "exact", price: "$0.01", network, payTo: svmAddress },
  description: "24-hour source-backed signal changes around a user-supplied broad location or approximate coordinates.",
  mimeType: "application/json",
  serviceName: "RED QUEEN Intelligence",
  tags: ["survival", "local-intelligence", "verified-sources", "x402"],
  iconUrl: "https://redqueen.space/token-image.png",
});
