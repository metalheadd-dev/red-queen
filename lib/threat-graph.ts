import type { NormalizedSignal, SignalKind } from "./signal-engine";

const MAX_AGE_HOURS: Record<SignalKind, number> = {
  GEOLOGICAL: 24,
  WILDFIRE: 24 * 14,
  DISASTER: 24 * 7,
  SPACE_WEATHER: 48,
  CYBER: 24 * 14,
  HEALTH: 24 * 30,
  SOLANA_NETWORK: 72,
};

const EXPOSURES: Record<SignalKind, string> = {
  GEOLOGICAL: "Potential exposure depends on distance, local conditions and official alerts.",
  WILDFIRE: "Potential exposure depends on smoke, wind, road access and evacuation zones.",
  DISASTER: "Potential exposure depends on the event boundary and local authority instructions.",
  SPACE_WEATHER: "Possible disruption to communications, navigation or power requires separate confirmation.",
  CYBER: "Exposure requires the affected product or service to be present in your environment.",
  HEALTH: "A reported outbreak is not evidence of personal exposure or local spread.",
  SOLANA_NETWORK: "A network incident can affect transaction delivery, not prove that a wallet is compromised.",
};

export interface ThreatGraphNode {
  id: string;
  stage: "EVENT" | "PLACE" | "EXPOSURE" | "ASSESSMENT" | "ACTION" | "SOURCE";
  label: string;
  verified: boolean;
}

export interface ThreatGraph {
  signalId: string;
  name: string;
  kind: SignalKind;
  status: "CURRENT" | "STALE";
  observedAt: string;
  updatedAt: string;
  expiresAt: string;
  confidence: number;
  sourceUrl: string;
  nodes: ThreatGraphNode[];
  edges: Array<{ from: string; to: string }>;
  caveat: string;
}

/** A source-backed event and clearly labeled, non-personal inferences. */
export function buildThreatGraph(signal: NormalizedSignal, now = new Date()): ThreatGraph | null {
  const observed = Date.parse(signal.observedAt);
  const currentTime = now.getTime();
  if (!Number.isFinite(observed) || !Number.isFinite(currentTime) || observed > currentTime + 300_000 || signal.confidence < 90) return null;
  let sourceUrl: URL;
  try {
    sourceUrl = new URL(signal.sourceUrl);
  } catch {
    return null;
  }
  if (sourceUrl.protocol !== "https:" && sourceUrl.protocol !== "http:") return null;
  const reportedUpdate = Date.parse(signal.updatedAt || signal.observedAt);
  const updatedAt = Number.isFinite(reportedUpdate) && reportedUpdate >= observed && reportedUpdate <= currentTime + 300_000
    ? new Date(reportedUpdate).toISOString() : signal.observedAt;
  // An official update can renew an ongoing event without changing its original observation time.
  const expiresAt = new Date(Date.parse(updatedAt) + MAX_AGE_HOURS[signal.kind] * 3_600_000);
  const current = currentTime <= expiresAt.getTime();
  const nodes: ThreatGraphNode[] = [
    { id: "event", stage: "EVENT", label: `${signal.name}. ${signal.fact}`, verified: true },
    { id: "place", stage: "PLACE", label: signal.location || "Location not reported", verified: Boolean(signal.location) },
    { id: "exposure", stage: "EXPOSURE", label: EXPOSURES[signal.kind], verified: false },
    { id: "assessment", stage: "ASSESSMENT", label: signal.assessment, verified: false },
    { id: "action", stage: "ACTION", label: signal.action, verified: false },
    { id: "source", stage: "SOURCE", label: `${signal.source} · observed ${signal.observedAt}`, verified: true },
  ];
  return {
    signalId: signal.id,
    name: signal.name,
    kind: signal.kind,
    status: current ? "CURRENT" : "STALE",
    observedAt: signal.observedAt,
    updatedAt,
    expiresAt: expiresAt.toISOString(),
    confidence: signal.confidence,
    sourceUrl: sourceUrl.toString(),
    nodes,
    edges: [
      { from: "source", to: "event" },
      { from: "event", to: "place" },
      { from: "place", to: "exposure" },
      { from: "exposure", to: "assessment" },
      { from: "assessment", to: "action" },
    ],
    caveat: current
      ? "Only the reported event and source are verified. Exposure, assessment and action are guidance, not proof of personal risk. RQ's source score is a heuristic, not a probability. Check local authorities."
      : "This event is outside its freshness window. Treat it as historical context, not a current alert. RQ's source score is a heuristic, not a probability. Recheck the primary source.",
  };
}
