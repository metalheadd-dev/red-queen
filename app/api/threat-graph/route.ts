import { NextResponse } from "next/server";
import { fetchSignalGrid, findVerifiedSignalsByIds } from "@/lib/signal-engine";
import { buildThreatGraph } from "@/lib/threat-graph";
import { sanitizeSignalId, sanitizeSignalIds } from "@/lib/survival-context";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const rawId = params.get("id")?.trim();
  const id = sanitizeSignalId(rawId);
  if (rawId && !id) {
    return NextResponse.json({ error: "Invalid signal ID" }, { status: 400 });
  }
  const ids = id ? [id] : sanitizeSignalIds(params.get("ids"));
  const now = new Date();
  const grid = ids.length ? null : await fetchSignalGrid();
  const signals = ids.length ? await findVerifiedSignalsByIds(ids) : grid!.signals.slice(0, 30);
  const graphs = signals.flatMap((signal) => {
    const graph = buildThreatGraph(signal, now);
    return graph ? [graph] : [];
  }).slice(0, ids.length || 12);
  return NextResponse.json({
    generatedAt: now.toISOString(),
    coverage: grid?.coverage ?? null,
    graphs,
    note: "No matching graph is not proof of safety. Source outages and coverage gaps remain possible.",
  }, { headers: { "Cache-Control": "no-store" } });
}
