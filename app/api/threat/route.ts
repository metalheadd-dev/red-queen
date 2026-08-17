import { NextResponse } from "next/server";
import { fetchSignalGrid, SignalGrid } from "@/lib/signal-engine";

export const dynamic = "force-dynamic";

function statusFor(severity: number) {
  if (severity >= 85) return "CRITICAL";
  if (severity >= 70) return "HIGH";
  if (severity >= 50) return "ELEVATED";
  return "MONITOR";
}

function sensorLimitedPayload(grid: SignalGrid) {
  return {
    schemaVersion: 4,
    codename: "RQ-SENSORS",
    name: "Live intelligence is temporarily limited",
    description: "RED QUEEN cannot verify enough current source data to issue a reliable daily assessment. No fictional event has been substituted.",
    assessment: "Sensor availability is not evidence of danger or safety. Use official local alerts while the intelligence grid reconnects.",
    countermeasure: "Check local emergency alerts and try the live scan again shortly.",
    severity: 0,
    status: "SENSORS LIMITED",
    location: "Global sensor grid",
    publishDate: grid.generatedAt,
    generatedAt: grid.generatedAt,
    source: "RED QUEEN sensor status",
    sourceUrl: "",
    confidence: 0,
    verified: false,
    isFallback: true,
    signalCount: 0,
    signals: [],
    sourceHealth: grid.sourceHealth,
    coverage: grid.coverage,
  };
}

export async function POST() {
  const grid = await fetchSignalGrid();
  const primary = grid.signals.find((signal) => signal.freshness !== "STALE") || grid.signals[0];

  if (!primary) {
    return NextResponse.json(sensorLimitedPayload(grid), {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  }

  const payload = {
    schemaVersion: 4,
    codename: primary.id.toUpperCase().slice(0, 28),
    name: primary.name,
    description: primary.fact,
    assessment: primary.assessment,
    countermeasure: primary.action,
    severity: primary.severity,
    priorityScore: primary.priorityScore,
    freshness: primary.freshness,
    status: statusFor(primary.severity),
    location: primary.location,
    publishDate: primary.observedAt,
    generatedAt: grid.generatedAt,
    source: primary.source,
    sourceUrl: primary.sourceUrl,
    confidence: primary.confidence,
    verified: true,
    isFallback: false,
    signalCount: grid.signals.length,
    signals: grid.signals.slice(0, 24),
    sourceHealth: grid.sourceHealth,
    coverage: grid.coverage,
  };

  return NextResponse.json(payload, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
}
