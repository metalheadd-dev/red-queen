import { NextResponse } from "next/server";
import { buildPreparednessRecheck, MINIMUM_PAID_SOURCE_COVERAGE } from "@/lib/intelligence-reports";
import { parsePreparednessRecheck } from "@/lib/preparedness-recheck";
import { fetchSignalGrid } from "@/lib/signal-engine";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const input = parsePreparednessRecheck(await request.json().catch(() => null));
  if (!input) return NextResponse.json({ error: "A valid saved preparedness-plan checkpoint is required." }, { status: 400 });
  try {
    const grid = await fetchSignalGrid();
    if (grid.coverage.online < MINIMUM_PAID_SOURCE_COVERAGE) {
      return NextResponse.json({ available: false, reason: `Only ${grid.coverage.online}/${grid.coverage.total} source families responded. Plan Recheck is paused until coverage recovers.`, sourceCoverage: grid.coverage });
    }
    const report = buildPreparednessRecheck(grid, input);
    return NextResponse.json({
      available: report.changes.length > 0,
      price: "0.01 USDC",
      checkedAt: grid.generatedAt,
      changeCount: report.changes.length,
      headline: report.headline,
      sourceCoverage: grid.coverage,
      reason: report.changes.length ? null : "Nothing material changed in the reachable current-source window. Keep the existing plan. No payment is needed.",
      privacy: "This free check receives the selected plan title, broad area, focus, dates and completion counts. It does not receive your account, exact address or wallet.",
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Preparedness recheck quote failed:", error);
    return NextResponse.json({ available: false, reason: "Current sources could not be checked. No payment is available." }, { status: 503 });
  }
}
