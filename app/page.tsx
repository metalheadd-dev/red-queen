"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BootSequence from "@/components/BootSequence";
import DailyActionPanel from "@/components/DailyActionPanel";
import SignalWatchPanel from "@/components/SignalWatchPanel";
import {
  isSignalWatchType,
  SIGNAL_WATCH_REQUEST_EVENT,
  SignalWatchType,
} from "@/lib/signal-watch";
import {
  buildFirstContactPrompt,
  getFocusOption,
  sanitizeArea,
  SURVIVAL_FOCUS_OPTIONS,
  SurvivalContext,
  SurvivalFocus,
} from "@/lib/survival-context";
import { recordSignalScan, SignalHistoryView } from "@/lib/signal-history";

interface PulseData {
  codename: string;
  name: string;
  description: string;
  assessment?: string;
  countermeasure: string;
  severity: number;
  status: string;
  location: string;
  publishDate: string;
  generatedAt?: string;
  source: string;
  sourceUrl?: string;
  confidence?: number;
  verified?: boolean;
  isFallback?: boolean;
  signalCount?: number;
  signals?: PulseSignal[];
  sourceHealth?: SourceHealth[];
  coverage?: { online: number; total: number; signalCount: number };
  priorityScore?: number;
  freshness?: "FRESH" | "CURRENT" | "AGING" | "STALE";
}

interface SourceHealth {
  id: string;
  label: string;
  status: "ONLINE" | "NO_SIGNALS" | "OFFLINE";
  signalCount: number;
  checkedAt: string;
  latestObservedAt?: string;
}

interface PulseSignal {
  id: string;
  name: string;
  kind: "GEOLOGICAL" | "WILDFIRE" | "DISASTER" | "SPACE_WEATHER" | "CYBER" | "HEALTH";
  severity: number;
  location: string;
  observedAt: string;
  source: string;
  sourceUrl: string;
  fact: string;
  confidence: number;
  priorityScore?: number;
  freshness?: "FRESH" | "CURRENT" | "AGING" | "STALE";
  ageHours?: number;
}

interface RankedSignal {
  id: string;
  name: string;
  type: string;
  severity: number;
  region: string;
  source: string;
  sourceUrl?: string;
  verified: boolean;
  score: number;
  reason: string;
  freshness?: string;
  node?: MapNode;
}

interface MapNode {
  id: string;
  name: string;
  type: string;
  category?: string;
  severity: number;
  lat: number;
  lng: number;
  region: string;
  desc: string;
  solution: string;
  analysis: string;
  source?: string;
  sourceUrl?: string;
  confidence?: number;
  verified?: boolean;
  observedAt?: string;
  updatedAt?: string;
  scannedAt?: string;
  priorityScore?: number;
  freshness?: "FRESH" | "CURRENT" | "AGING" | "STALE";
  ageHours?: number;
}

const TacticalMap = dynamic(() => import("@/components/TacticalMap"), {
  ssr: false,
  loading: () => <div className="pulse-map-loading">CONNECTING TO VERIFIED SIGNAL GRID...</div>,
});

const SENSOR_LIMITED: PulseData = {
  codename: "RQ-SENSORS",
  name: "Live intelligence is temporarily limited",
  description: "RED QUEEN could not verify enough current source data for a reliable assessment.",
  assessment: "Sensor silence is not evidence of safety. Check official local alerts while the grid reconnects.",
  countermeasure: "Check local emergency alerts and try the live scan again shortly.",
  severity: 0,
  status: "SENSORS LIMITED",
  location: "Global sensor grid",
  publishDate: new Date().toISOString(),
  source: "RED QUEEN sensor status",
  verified: false,
  isFallback: true,
  signalCount: 0,
  signals: [],
  sourceHealth: [],
  coverage: { online: 0, total: 0, signalCount: 0 },
};

function relativeTime(value?: string) {
  if (!value) return "just now";
  const milliseconds = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(milliseconds) || milliseconds < 60_000) return "just now";
  const minutes = Math.floor(milliseconds / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function distanceInKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const radius = 6_371;
  const toRadians = (value: number) => value * Math.PI / 180;
  const latitudeDelta = toRadians(b.lat - a.lat);
  const longitudeDelta = toRadians(b.lng - a.lng);
  const value = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(longitudeDelta / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function absoluteSignalTime(value?: string) {
  if (!value) return "NOT PROVIDED BY SOURCE";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "NOT PROVIDED BY SOURCE";
  return `${date.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

function toWatchType(type: string): SignalWatchType | null {
  const normalized = type === "WILDFIRE"
    ? "METEOROLOGICAL"
    : type === "CYBER"
      ? "ALGORITHMIC"
      : type === "HEALTH"
        ? "BIOLOGICAL"
        : type;
  return isSignalWatchType(normalized) ? normalized : null;
}

export default function HomePage() {
  const router = useRouter();
  const [booted, setBooted] = useState(false);
  const [pulse, setPulse] = useState<PulseData>(SENSOR_LIMITED);
  const [pulseLoading, setPulseLoading] = useState(true);
  const [nodes, setNodes] = useState<MapNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
  const [signalHistory, setSignalHistory] = useState<Record<string, SignalHistoryView>>({});
  const [mapLoading, setMapLoading] = useState(true);
  const [mapFilter, setMapFilter] = useState<"local" | "priority" | "all" | "verified">("priority");
  const [showStart, setShowStart] = useState(false);
  const [startArea, setStartArea] = useState("");
  const [startFocus, setStartFocus] = useState<SurvivalFocus>("LOCAL_THREATS");
  const [startError, setStartError] = useState("");
  const [startResolving, setStartResolving] = useState(false);
  const [localContext, setLocalContext] = useState<SurvivalContext | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem("rq-booted") === "1") setBooted(true);
  }, []);

  useEffect(() => {
    if (!booted) return;
    const onboardingState = localStorage.getItem("rq-core-onboarding-v1");
    setShowStart(onboardingState !== "done" && onboardingState !== "skipped");
    try {
      const saved = JSON.parse(localStorage.getItem("rq-survival-context-v1") || "null") as SurvivalContext | null;
      if (saved?.area) {
        setLocalContext(saved);
        setStartArea(saved.area);
        if (Number.isFinite(saved.location?.lat) && Number.isFinite(saved.location?.lng)) setMapFilter("local");
      }
    } catch {
      setLocalContext(null);
    }

    async function loadIntelligence() {
      setPulseLoading(true);
      setMapLoading(true);
      const [pulseResult, mapResult] = await Promise.allSettled([
        fetch("/api/threat", { method: "POST" }).then((response) => {
          if (!response.ok) throw new Error("Pulse request failed");
          return response.json();
        }),
        fetch("/api/threat-map?scope=live").then((response) => {
          if (!response.ok) throw new Error("Map request failed");
          return response.json();
        }),
      ]);

      if (pulseResult.status === "fulfilled") setPulse(pulseResult.value);
      if (mapResult.status === "fulfilled" && Array.isArray(mapResult.value)) {
        const liveNodes = mapResult.value as MapNode[];
        setNodes(liveNodes);
        setSelectedNode(liveNodes[0] || null);
        setSignalHistory(recordSignalScan(
          localStorage,
          liveNodes,
          liveNodes[0]?.scannedAt || new Date().toISOString(),
        ));
      }
      setPulseLoading(false);
      setMapLoading(false);
    }

    loadIntelligence();
  }, [booted]);

  const visibleNodes = useMemo(() => {
    if (mapFilter === "local" && localContext?.location) {
      return nodes
        .filter((node) => distanceInKm(localContext.location!, node) <= 1_000)
        .sort((a, b) => distanceInKm(localContext.location!, a) - distanceInKm(localContext.location!, b));
    }
    if (mapFilter === "priority") return nodes.filter((node) => node.severity >= 60);
    if (mapFilter === "verified") return nodes.filter((node) => node.verified);
    return nodes;
  }, [localContext, mapFilter, nodes]);

  const nearbyNodes = useMemo(() => {
    if (!localContext?.location) return [];
    return nodes
      .filter((node) => distanceInKm(localContext.location!, node) <= 1_000)
      .sort((a, b) => distanceInKm(localContext.location!, a) - distanceInKm(localContext.location!, b));
  }, [localContext, nodes]);

  const nonMapWatchSignals = useMemo(
    () => (pulse.signals || [])
      .filter((signal) => signal.kind === "SPACE_WEATHER" || signal.kind === "CYBER" || signal.kind === "HEALTH")
      .map((signal) => ({
        id: signal.id,
        name: signal.name,
        type: signal.kind === "CYBER" ? "ALGORITHMIC" : signal.kind === "HEALTH" ? "BIOLOGICAL" : "SPACE_WEATHER",
        severity: signal.severity,
        region: signal.location,
        source: signal.source,
        sourceUrl: signal.sourceUrl,
        verified: signal.confidence >= 90,
      })),
    [pulse.signals],
  );

  const rankedSignals = useMemo<RankedSignal[]>(() => {
    const location = localContext?.location;
    const mapped: RankedSignal[] = nodes.map((node) => {
      const distance = location ? distanceInKm(location, node) : undefined;
      const proximity = distance === undefined ? 0 : distance <= 100 ? 30 : distance <= 300 ? 24 : distance <= 1_000 ? 16 : 0;
      const score = Math.min(100, (node.priorityScore ?? node.severity * .65 + (node.verified ? 12 : 0)) + proximity);
      const reason = distance !== undefined && distance <= 1_000
        ? `${Math.round(distance)} km from your broad area`
        : node.verified
          ? `${node.freshness || "CURRENT"} · verified source`
          : "Elevated global signal";
      return {
        id: node.id,
        name: node.name,
        type: node.type,
        severity: node.severity,
        region: node.region,
        source: node.source || "SOURCE PENDING",
        sourceUrl: node.sourceUrl,
        verified: node.verified === true,
        score,
        reason,
        freshness: node.freshness,
        node,
      };
    });
    const nonMapped: RankedSignal[] = (pulse.signals || [])
      .filter((signal) => signal.kind === "SPACE_WEATHER" || signal.kind === "CYBER" || signal.kind === "HEALTH")
      .map((signal) => ({
        id: signal.id,
        name: signal.name,
        type: signal.kind,
        severity: signal.severity,
        region: signal.location,
        source: signal.source,
        sourceUrl: signal.sourceUrl,
        verified: signal.confidence >= 90,
        score: signal.priorityScore ?? signal.severity * .65 + (signal.confidence >= 90 ? 12 : 0),
        reason: signal.kind === "HEALTH"
          ? `${signal.freshness || "CURRENT"} · WHO public-health notice`
          : signal.kind === "CYBER"
            ? `${signal.freshness || "CURRENT"} · actively exploited vulnerability`
            : `${signal.freshness || "CURRENT"} · official global systems notice`,
        freshness: signal.freshness,
      }));
    return [...mapped, ...nonMapped].sort((a, b) => b.score - a.score).slice(0, 3);
  }, [localContext, nodes, pulse.signals]);

  const signalRail = useMemo(
    () => [...visibleNodes].sort((a, b) => b.severity - a.severity).slice(0, 6),
    [visibleNodes],
  );
  const selectedHistory = selectedNode ? signalHistory[selectedNode.id] : undefined;

  const finishBoot = () => {
    sessionStorage.setItem("rq-booted", "1");
    setBooted(true);
  };

  const dismissStart = () => {
    localStorage.setItem("rq-core-onboarding-v1", "skipped");
    setShowStart(false);
  };

  async function resolveBroadArea(area: string): Promise<SurvivalContext["location"]> {
    const response = await fetch(`/api/location/resolve?q=${encodeURIComponent(area)}`);
    const data = await response.json();
    if (!response.ok || !Number.isFinite(data.lat) || !Number.isFinite(data.lng)) {
      throw new Error(data.error || "Broad area could not be resolved.");
    }
    return { lat: data.lat, lng: data.lng, label: data.label || area };
  }

  const beginFirstContact = async () => {
    const area = sanitizeArea(startArea);
    if (area.length < 2) {
      setStartError("Enter a city or region — never an exact address.");
      return;
    }
    setStartResolving(true);
    const focus = getFocusOption(startFocus);
    let location: SurvivalContext["location"];
    try {
      location = await resolveBroadArea(area);
    } catch {
      location = undefined;
    }
    const context: SurvivalContext = { area, focus: focus.id, mode: focus.mode, location };
    localStorage.setItem("rq-survival-context-v1", JSON.stringify(context));
    localStorage.setItem("rq-core-onboarding-v1", "done");
    setLocalContext(context);
    const params = new URLSearchParams({
      area,
      focus: focus.id,
      mode: focus.mode,
      first: "1",
      prompt: buildFirstContactPrompt(context),
    });
    router.push(`/terminal?${params.toString()}`);
    setStartResolving(false);
  };

  async function activateLocalView() {
    const area = sanitizeArea(startArea || localContext?.area || "");
    if (area.length < 2) {
      setStartError("Enter a city or region — never an exact address.");
      return;
    }
    setStartResolving(true);
    setStartError("");
    try {
      const location = await resolveBroadArea(area);
      const context: SurvivalContext = {
        area,
        focus: localContext?.focus || "LOCAL_THREATS",
        mode: localContext?.mode || "MONITOR",
        location,
      };
      localStorage.setItem("rq-survival-context-v1", JSON.stringify(context));
      setLocalContext(context);
      setMapFilter("local");
    } catch (error) {
      setStartError(error instanceof Error ? error.message : "Area lookup is temporarily unavailable.");
    } finally {
      setStartResolving(false);
    }
  }

  function requestSignalWatch(type: string) {
    const watchType = toWatchType(type);
    if (!watchType) return;
    window.dispatchEvent(new CustomEvent(SIGNAL_WATCH_REQUEST_EVENT, { detail: { type: watchType } }));
    window.requestAnimationFrame(() => document.getElementById("signal-watch")?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }

  function focusRankedSignal(signal: RankedSignal) {
    if (!signal.node) return;
    setSelectedNode(signal.node);
    setMapFilter("all");
    document.getElementById("live-map")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (!booted) return <BootSequence onComplete={finishBoot} />;

  const pulseDate = relativeTime(pulse.generatedAt || pulse.publishDate);
  const hasResolvedArea = Boolean(localContext?.area && localContext.location);
  const globalPriorityCount = nodes.filter((node) => node.severity >= 60).length;
  const localHeadline = hasResolvedArea
    ? nearbyNodes.length
      ? `${localContext!.area}: ${nearbyNodes.length} nearby signal${nearbyNodes.length === 1 ? "" : "s"} deserve attention.`
      : `${localContext!.area}: no nearby verified escalation detected.`
    : `${nodes.length} active signals monitored globally.`;
  const mapFilters: Array<"local" | "priority" | "all" | "verified"> = hasResolvedArea
    ? ["local", "priority", "all", "verified"]
    : ["priority", "all", "verified"];

  return (
    <div className="pulse-page">
      <div className="pulse-alert-strip">
        <span className="pulse-alert-dot" />
        RED QUEEN ONLINE
        <span>VERIFIED SOURCES ONLY IN LIVE INTELLIGENCE</span>
        <span>LAST SYNTHESIS: {pulseDate.toUpperCase()}</span>
      </div>

      <section className="pulse-hero container">
        <div className="pulse-kicker">DAILY INTELLIGENCE PULSE // CORE NETWORK</div>
        <div className="pulse-hero-grid">
          <div>
            <h1>
              Know what matters.<br />
              <span>Prepare before it does.</span>
            </h1>
            <p className="pulse-lead">
              RED QUEEN listens beneath the noise — turning verified global signals into one clear assessment
              and one practical move. She cannot choose survival for you. But if you choose to prepare, she will
              not leave you guessing.
            </p>
            <p className="pulse-queen-vow">“I cannot promise safety. I can make sure you do not choose blind.”</p>
            <div className="pulse-hero-actions">
              <Link className="btn btn-primary" href="/terminal">ASK RED QUEEN</Link>
              <a className="btn btn-ghost" href="#live-map">OPEN LIVE MAP</a>
            </div>
          </div>
          <div className="queen-presence" aria-label="Red Queen is online">
            <div className="queen-halo queen-halo-one" />
            <div className="queen-halo queen-halo-two" />
            <Image
              className="queen-presence-art"
              src="/art/red-queen-presence.png"
              alt=""
              width={1199}
              height={1312}
              priority
              aria-hidden="true"
            />
            <div className="queen-presence-copy">
              <span>THE SIGNAL FIELD IS LISTENING</span>
              <strong>RED QUEEN</strong>
              <small>{pulse.verified ? "SOURCES LOCKED · I AM HERE" : "SENSOR GRID LIMITED · STAY AWAKE"}</small>
            </div>
          </div>
        </div>
      </section>

      {showStart && (
        <section className="container pulse-onboarding" aria-label="Start with Red Queen">
          <div className="pulse-onboarding-copy">
            <span className="pulse-eyebrow">FIRST CONTACT // 60 SECONDS</span>
            <h2>Tell the Queen what you want to survive</h2>
            <p>Choose a broad area and your immediate priority. RED QUEEN will separate evidence from noise and give you one action you can take now — without requesting an exact address.</p>
          </div>
          <div className="pulse-first-contact">
            <label htmlFor="first-contact-area">CITY OR REGION</label>
            <input
              id="first-contact-area"
              value={startArea}
              onChange={(event) => { setStartArea(event.target.value); setStartError(""); }}
              placeholder="Barcelona, Catalonia"
              maxLength={80}
              autoComplete="address-level2"
            />
            <span className="pulse-field-note">Saved on this device. Sent only with your RED QUEEN requests. Never enter a street address.</span>
            <div className="pulse-focus-grid" role="radiogroup" aria-label="Preparedness priority">
              {SURVIVAL_FOCUS_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={startFocus === option.id}
                  className={startFocus === option.id ? "active" : ""}
                  onClick={() => setStartFocus(option.id)}
                >
                  <strong>{option.label}</strong>
                  <span>{option.description}</span>
                </button>
              ))}
            </div>
            {startError && <div className="pulse-field-error" role="alert">{startError}</div>}
            <div className="pulse-onboarding-actions">
              <button className="btn btn-primary" type="button" onClick={() => void beginFirstContact()} disabled={startResolving}>{startResolving ? "LOCATING BROAD AREA..." : "RUN FIRST BRIEF"}</button>
              <button className="pulse-text-button" type="button" onClick={dismissStart}>EXPLORE WITHOUT SETUP</button>
            </div>
          </div>
        </section>
      )}

      <div className="container pulse-action-plan">
        <DailyActionPanel context="PULSE" />
      </div>

      <section className="container pulse-daily" aria-busy={pulseLoading}>
        <div className="pulse-section-heading">
          <div>
            <span className="pulse-eyebrow">TODAY // GLOBAL</span>
            <h2>{pulseLoading ? "Synthesizing verified signals..." : pulse.name}</h2>
          </div>
          <div className={`pulse-trust ${pulse.verified ? "is-verified" : "is-limited"}`}>
            <span>{pulse.verified ? "VERIFIED" : "LIMITED"}</span>
            <strong>{pulse.verified ? `${pulse.confidence ?? 0}% SOURCE CONFIDENCE · ${pulse.freshness || "CURRENT"}` : "NO CLAIM ISSUED"}</strong>
          </div>
        </div>

        <div className="pulse-daily-grid">
          <article className="pulse-card pulse-assessment-card">
            <div className="pulse-card-topline">
              <span>{pulse.codename}</span>
              <span className={`pulse-status pulse-status-${pulse.status.toLowerCase().replaceAll(" ", "-")}`}>{pulse.status}</span>
            </div>
            <p className="pulse-fact">{pulse.description}</p>
            <p>{pulse.assessment}</p>
            <dl className="pulse-metadata">
              <div><dt>AREA</dt><dd>{pulse.location}</dd></div>
              <div><dt>UPDATED</dt><dd>{pulseDate}</dd></div>
              <div>
                <dt>SOURCE</dt>
                <dd>{pulse.sourceUrl ? <a href={pulse.sourceUrl} target="_blank" rel="noreferrer">{pulse.source} ↗</a> : pulse.source}</dd>
              </div>
            </dl>
          </article>

          <article className="pulse-card pulse-action-card">
            <span className="pulse-eyebrow">RED QUEEN // RECOMMENDED ACTION</span>
            <div className="pulse-action-index">01</div>
            <h3>Do this now</h3>
            <p>{pulse.countermeasure}</p>
            <div className="pulse-action-links">
              <Link href="/terminal">ASK A FOLLOW-UP →</Link>
              <Link href="/survival-kit">OPEN PREPAREDNESS →</Link>
            </div>
          </article>
        </div>

        {!!pulse.sourceHealth?.length && (
          <div className="pulse-source-grid">
            <header>
              <div><span className="pulse-eyebrow">SOURCE GRID // LIVE COVERAGE</span><strong>{pulse.coverage?.online || 0}/{pulse.coverage?.total || pulse.sourceHealth.length} sources reachable</strong></div>
              <small>{pulse.coverage?.signalCount || 0} NORMALIZED SIGNALS · CHECKED {relativeTime(pulse.generatedAt).toUpperCase()}</small>
            </header>
            <div>
              {pulse.sourceHealth.map((source) => (
                <article key={source.id} data-status={source.status}>
                  <i />
                  <span>{source.label}</span>
                  <strong>{source.status === "NO_SIGNALS" ? "NO CURRENT SIGNALS" : source.status}</strong>
                  <small>{source.signalCount} SIGNALS{source.latestObservedAt ? ` · LATEST ${relativeTime(source.latestObservedAt).toUpperCase()}` : ""}</small>
                </article>
              ))}
            </div>
            <p>Reachability confirms the source responded — not that every local event is covered. Always follow official alerts for your area.</p>
          </div>
        )}

        <div className="pulse-ranked-signals">
          <div className="pulse-ranked-heading">
            <div><span className="pulse-eyebrow">QUEEN PRIORITY // PERSONAL TOP 3</span><h3>{hasResolvedArea ? `What deserves attention near ${localContext!.area}` : "What deserves attention in the signal field"}</h3></div>
            <small>RANKED BY SEVERITY · CONFIDENCE · FRESHNESS{hasResolvedArea ? " · PROXIMITY" : ""}</small>
          </div>
          <div className="pulse-ranked-grid">
            {rankedSignals.map((signal, index) => (
              <article key={signal.id} className={signal.node ? "is-mapped" : "is-global"}>
                <button type="button" onClick={() => focusRankedSignal(signal)} disabled={!signal.node} aria-label={signal.node ? `Show ${signal.name} on map` : undefined}>
                  <span>0{index + 1} // {signal.type}</span>
                  <strong>{signal.name}</strong>
                  <p>{signal.reason}</p>
                  <small>{signal.source} · INDEX {Math.round(signal.score)}</small>
                </button>
                <div>
                  {signal.node && <button type="button" onClick={() => focusRankedSignal(signal)}>SHOW ON MAP</button>}
                  <Link href={`/terminal?${new URLSearchParams({
                    mode: "ANALYZE",
                    focus: "LOCAL_THREATS",
                    area: localContext?.area || "",
                    ...(signal.node ? { signal: signal.node.id } : {}),
                    prompt: `Brief me on this signal: ${signal.name}. Explain why it matters to my context, separate verified fact from assessment, and give one justified action.`,
                  }).toString()}`}>ASK QUEEN →</Link>
                </div>
              </article>
            ))}
            {!rankedSignals.length && <p className="pulse-ranked-empty">The verified grid is temporarily limited. Queen will not invent a priority.</p>}
          </div>
        </div>
      </section>

      <section id="live-map" className="container pulse-map-section">
        <div className="pulse-section-heading">
          <div>
            <span className="pulse-eyebrow">DAILY INTELLIGENCE PULSE // {hasResolvedArea ? "LOCAL RELEVANCE" : "GLOBAL VIEW"}</span>
            <h2>{mapLoading ? "Scanning verified sources" : localHeadline}</h2>
            <p>{hasResolvedArea
              ? `Broad-area relevance uses a 1,000 km monitoring radius. ${globalPriorityCount} priority signals remain visible in the global view.`
              : "Set a broad city or region during First Contact to add local relevance. Live telemetry stays separate from simulations and archive content."}</p>
          </div>
          <div className="pulse-filter-group" aria-label="Map filters">
            {mapFilters.map((filter) => (
              <button
                key={filter}
                className={mapFilter === filter ? "active" : ""}
                onClick={() => {
                  setMapFilter(filter);
                  if (filter === "local") setSelectedNode(nearbyNodes[0] || null);
                }}
              >
                {filter === "local" ? "RELEVANT" : filter === "priority" ? "PRIORITY" : filter === "all" ? "ALL LIVE" : "VERIFIED"}
              </button>
            ))}
          </div>
        </div>

        {!hasResolvedArea && (
          <div className="pulse-local-setup">
            <div><span>LOCAL RELEVANCE</span><strong>Center the signal field on a broad area.</strong><p>City or region only. RED QUEEN does not need an exact address.</p></div>
            <input
              value={startArea}
              onChange={(event) => { setStartArea(event.target.value); setStartError(""); }}
              placeholder="Barcelona, Spain"
              maxLength={80}
              aria-label="City or region for local signal relevance"
            />
            <button type="button" onClick={() => void activateLocalView()} disabled={startResolving}>{startResolving ? "RESOLVING..." : "SET LOCAL VIEW"}</button>
            {startError && <small role="alert">{startError}</small>}
          </div>
        )}

        {hasResolvedArea && (
          <div className="pulse-local-proof">
            <div><span>YOUR BROAD AREA</span><strong>{localContext!.area}</strong></div>
            <div><span>NEARBY SIGNALS</span><strong>{nearbyNodes.length}</strong></div>
            <div><span>PRIVACY MODE</span><strong>NO EXACT ADDRESS</strong></div>
            <small>Area resolved with © OpenStreetMap contributors · absence of a mapped signal is not proof of safety.</small>
          </div>
        )}

        <SignalWatchPanel nodes={[...nodes, ...nonMapWatchSignals]} area={localContext?.area} location={localContext?.location || null} />

        {!!signalRail.length && (
          <div className="pulse-signal-rail" aria-label="Visible map signals">
            <div><span>VISIBLE SIGNALS</span><small>SELECT TO FOCUS THE MAP</small></div>
            {signalRail.map((node) => (
              <button key={node.id} type="button" className={selectedNode?.id === node.id ? "active" : ""} onClick={() => setSelectedNode(node)}>
                <i data-severity={node.severity >= 75 ? "high" : node.severity >= 60 ? "elevated" : "monitor"} />
                <span><strong>{node.name}</strong><small>{node.type} · {node.region}</small></span>
                <b>{node.severity}</b>
              </button>
            ))}
          </div>
        )}

        <div className="pulse-map-shell">
          {mapLoading ? (
            <div className="pulse-map-loading">CONNECTING TO VERIFIED SIGNAL GRID...</div>
          ) : nodes.length || localContext?.location ? (
            <TacticalMap
              nodes={visibleNodes}
              onSelectNode={setSelectedNode}
              selectedNode={selectedNode}
              focus={localContext?.location || null}
              focusMode={mapFilter === "local"}
            />
          ) : (
            <div className="pulse-map-loading">NO VERIFIED SIGNALS AVAILABLE // CHECK OFFICIAL LOCAL ALERTS</div>
          )}
        </div>

        {selectedNode && (
          <article className="pulse-signal-dossier">
            <header className="pulse-dossier-header">
              <div>
                <span className="pulse-eyebrow">SIGNAL DOSSIER // {selectedNode.type} · {selectedNode.verified ? "VERIFIED SOURCE" : "SOURCE REVIEW"}</span>
                <h3>{selectedNode.name}</h3>
                <p>{selectedNode.region}</p>
              </div>
              <div className="pulse-signal-side">
                <strong>{selectedNode.severity}</strong><span>PRIORITY INDEX</span>
                <small>{selectedNode.source || "SOURCE PENDING"}</small>
              </div>
            </header>

            <div className="pulse-dossier-grid">
              <section><span>01 // SOURCE FACT</span><p>{selectedNode.desc}</p></section>
              <section><span>02 // QUEEN ASSESSMENT</span><p>{selectedNode.analysis}</p></section>
              <section className="is-action"><span>03 // SAFEST NEXT MOVE</span><p>{selectedNode.solution}</p></section>
            </div>

            <div className="pulse-dossier-evidence">
              <dl>
                <div><dt>SOURCE</dt><dd>{selectedNode.sourceUrl ? <a href={selectedNode.sourceUrl} target="_blank" rel="noreferrer">{selectedNode.source || "OPEN SOURCE"} ↗</a> : selectedNode.source || "PENDING"}</dd></div>
                <div><dt>CONFIDENCE</dt><dd>{selectedNode.confidence ? `${selectedNode.confidence}%` : "NOT SCORED"}</dd></div>
                <div><dt>EVENT OBSERVED</dt><dd>{absoluteSignalTime(selectedNode.observedAt)}</dd></div>
                <div><dt>SOURCE UPDATED</dt><dd>{absoluteSignalTime(selectedNode.updatedAt)}</dd></div>
                <div><dt>QUEEN SCANNED</dt><dd>{absoluteSignalTime(selectedNode.scannedAt)}</dd></div>
              </dl>
              <div className="pulse-device-history">
                <span>THIS DEVICE // SCAN HISTORY</span>
                <strong data-change={selectedHistory?.change || "NEW"}>{selectedHistory?.change || "NEW"}</strong>
                <p>{selectedHistory?.change === "ESCALATED"
                  ? `Priority moved from ${selectedHistory.previousSeverity} to ${selectedNode.severity} since this device's previous scan.`
                  : selectedHistory?.change === "REDUCED"
                    ? `Priority moved from ${selectedHistory.previousSeverity} to ${selectedNode.severity} since this device's previous scan.`
                    : selectedHistory?.change === "STEADY"
                      ? `No priority change across ${selectedHistory.observations} local observations.`
                      : "First observed by this browser. A change state will appear after a later scan."}</p>
                <small>Local memory only — not an official event timeline.</small>
              </div>
            </div>

            <footer className="pulse-selected-actions">
              {selectedNode.sourceUrl && <a href={selectedNode.sourceUrl} target="_blank" rel="noreferrer">OPEN PRIMARY SOURCE ↗</a>}
              {toWatchType(selectedNode.type) && <button type="button" onClick={() => requestSignalWatch(selectedNode.type)}>WATCH THIS CATEGORY</button>}
              <Link href={`/terminal?${new URLSearchParams({
                mode: "ANALYZE",
                focus: "LOCAL_THREATS",
                area: localContext?.area || "",
                signal: selectedNode.id,
                prompt: `Explain the relevance of this live signal to my context: ${selectedNode.name}. Separate the verified source fact from assessment and give me one safe action.`,
              }).toString()}`}>ASK QUEEN ABOUT THIS →</Link>
              <Link href={`/terminal?${new URLSearchParams({
                mode: "PREPARE",
                focus: "LOCAL_THREATS",
                area: localContext?.area || "",
                signal: selectedNode.id,
                prompt: `Use the attached verified signal “${selectedNode.name}” only if it still resolves and is relevant to my context. If preparation is justified, build a concise 2-5 step protocol with one action I can complete now and a realistic review date. If it is not relevant, explain why and return no event-specific plan.`,
              }).toString()}`}>BUILD QUEEN PROTOCOL →</Link>
            </footer>
          </article>
        )}
      </section>

      <section className="container pulse-loop-section">
        <div className="pulse-section-heading">
          <div>
            <span className="pulse-eyebrow">THE SOLVIVAL LOOP</span>
            <h2>Intelligence that leads to action</h2>
          </div>
          <p className="pulse-heading-copy">Come for the current signal. Return because RED QUEEN remembers your context and helps you become harder to surprise.</p>
        </div>
        <div className="pulse-loop-grid">
          <Link href="#live-map" className="pulse-loop-card"><span>01</span><strong>Detect</strong><p>See verified global signals without mixing them with fiction.</p></Link>
          <Link href="/terminal" className="pulse-loop-card"><span>02</span><strong>Understand</strong><p>Ask what a signal means for your location, wallet, devices, or family.</p></Link>
          <Link href="/survival-kit" className="pulse-loop-card"><span>03</span><strong>Prepare</strong><p>Turn analysis into a checklist, protocol, and concrete next action.</p></Link>
          <Link href="/operative" className="pulse-loop-card"><span>04</span><strong>Improve</strong><p>Build BIO-SCORE and a personal readiness record over time.</p></Link>
        </div>
      </section>

      <section className="container pulse-token-section">
        <div>
          <span className="pulse-eyebrow">$THREAT // INTELLIGENCE ACCESS PROTOCOL</span>
          <h2>Utility must unlock better survival intelligence</h2>
          <p>Holdings determine RED QUEEN context and analysis depth. Solana identity, live balance proof and x402 payments are separate, inspectable layers — never decorative wallet gating.</p>
        </div>
        <div className="pulse-utility-grid">
          <div><span>LIVE</span><strong>On-chain holder proof</strong><p>Canonical SPL balance, signed identity and measurable agent clearance.</p></div>
          <div><span>BETA</span><strong>x402 compute payments</strong><p>Exact USDC pricing for specific premium AI operations on Solana.</p></div>
          <div><span>AFTER CORE</span><strong>Solana Actions / Blinks</strong><p>Shareable RED QUEEN protocols after the daily product loop is stable.</p></div>
        </div>
        <Link className="pulse-inline-link" href="/network-clearance">OPEN SOLANA CONTROL PLANE →</Link>
      </section>

      <section className="container pulse-final-cta">
        <div className="queen-core queen-core-small"><span /></div>
        <div><span className="pulse-eyebrow">RED QUEEN IS LISTENING</span><h2>What are you preparing for?</h2></div>
        <Link className="btn btn-primary" href="/terminal">OPEN SECURE CHANNEL</Link>
      </section>
    </div>
  );
}
