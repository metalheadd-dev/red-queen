import { NextRequest, NextResponse } from "next/server";
import { withFriendlyX402 } from "@/lib/x402";
import { fetchSignalGrid, SignalSourceId } from "@/lib/signal-engine";

const svmAddress = process.env.SVM_ADDRESS || "";
const network = (process.env.SVM_NETWORK || "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp") as any;
const MINIMUM_REACHABLE_SOURCES = 4;

const SOURCE_URLS: Record<SignalSourceId, string> = {
  USGS: "https://earthquake.usgs.gov/earthquakes/map/",
  NASA_EONET: "https://eonet.gsfc.nasa.gov/",
  GDACS: "https://www.gdacs.org/",
  NOAA_SWPC: "https://www.swpc.noaa.gov/products/alerts-watches-and-warnings",
  CISA_KEV: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog",
  WHO_DON: "https://www.who.int/emergencies/disease-outbreak-news",
  SOLANA_STATUS: "https://status.solana.com/",
};

const handler = async (_req: NextRequest) => {
  try {
    const grid = await fetchSignalGrid();
    if (grid.coverage.online < MINIMUM_REACHABLE_SOURCES) {
      return NextResponse.json({
        success: false,
        error: `Only ${grid.coverage.online}/${grid.coverage.total} verified source families responded. Minimum paid-delivery coverage is ${MINIMUM_REACHABLE_SOURCES}/${grid.coverage.total}.`,
        sourceStatus: grid.sourceHealth,
        syntheticData: false,
        settlementRule: "HANDLER_FAILED_BEFORE_SETTLEMENT",
      }, { status: 503 });
    }

    const signals = grid.signals.slice(0, 12);
    const priority = signals[0] || null;
    const elevatedCount = grid.signals.filter((signal) => signal.severity >= 60).length;
    const sourceStatus = grid.sourceHealth.map((source) => ({
      id: source.id.toLowerCase().replaceAll("_", "-"),
      name: source.label,
      status: source.status === "OFFLINE" ? "UNAVAILABLE" : source.status === "NO_SIGNALS" ? "NO SIGNALS" : "LIVE",
      eventCount: source.signalCount,
      window: source.latestObservedAt ? `LATEST ${source.latestObservedAt}` : "CURRENT SOURCE WINDOW",
      url: SOURCE_URLS[source.id],
    }));

    return NextResponse.json({
      success: true,
      timestamp: grid.generatedAt,
      clearance: "PAID OUTPUT // x402 SETTLED",
      intel: {
        headline: `${grid.signals.length} verified signals normalized across ${grid.coverage.online}/${grid.coverage.total} reachable source families.`,
        summary: priority
          ? `RED QUEEN ranked the current source grid by severity, confidence, and freshness. ${elevatedCount} signals meet the elevated-attention threshold; the highest-ranked record is ${priority.name} from ${priority.source}.`
          : "The verified source grid responded, but no qualifying active signal was returned in the current source windows. This is not proof of safety or complete local coverage.",
        sourceCoverage: {
          liveSources: grid.coverage.online,
          totalSources: grid.coverage.total,
          label: `${grid.coverage.online}/${grid.coverage.total} SOURCES REACHABLE`,
          partial: grid.coverage.online < grid.coverage.total,
          minimumForDelivery: MINIMUM_REACHABLE_SOURCES,
        },
        sourceStatus,
        prioritySignal: priority
          ? `${priority.kind.replaceAll("_", " ")} · ${priority.severity}/100 · ${priority.name}`
          : "No qualifying active signal in the current verified windows.",
        signals: signals.map((signal) => ({
          id: signal.id,
          name: signal.name,
          kind: signal.kind,
          severity: signal.severity,
          confidence: signal.confidence,
          freshness: signal.freshness,
          observedAt: signal.observedAt,
          region: signal.region,
          source: signal.source,
          sourceUrl: signal.sourceUrl,
          fact: signal.fact,
          assessment: signal.assessment,
          recommendedAction: signal.action,
        })),
        nextAction: priority
          ? "Open the highest-ranked source record, compare its geography and official local guidance with your broad area, and change a preparedness plan only if relevance is justified."
          : "Check official local alerts and repeat the synthesis later if you need a fresh operational decision.",
        trustBoundary: "Source reachability is not complete local coverage. Fictional library scenarios are excluded. No BIO-SCORE or XP is awarded for this purchase.",
      },
    });
  } catch (error) {
    console.error("Global source synthesis failed:", error);
    return NextResponse.json({
      success: false,
      error: "The verified signal engine could not produce the minimum source-backed paid output. No synthetic telemetry was substituted.",
      sourceStatus: "UNAVAILABLE",
      syntheticData: false,
      settlementRule: "HANDLER_FAILED_BEFORE_SETTLEMENT",
    }, { status: 503 });
  }
};

export const GET = withFriendlyX402(
  handler,
  {
    productId: "global-source-synthesis",
    accepts: {
      scheme: "exact",
      price: "$0.01",
      network,
      payTo: svmAddress,
    },
    description: "Seven-source verified signal synthesis with explicit source health, confidence, freshness, and trust boundaries.",
    mimeType: "application/json",
    serviceName: "RED QUEEN Intelligence",
    tags: ["survival", "threat-signals", "verified-sources", "x402"],
    iconUrl: "https://redqueen.space/token-image.png",
  },
);
