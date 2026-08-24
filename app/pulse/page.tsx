"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BootSequence from "@/components/BootSequence";
import DailyActionPanel from "@/components/DailyActionPanel";
import SignalWatchPanel from "@/components/SignalWatchPanel";
import CoreLoopGuide from "@/components/CoreLoopGuide";
import MobileCommandHeader from "@/components/MobileCommandHeader";
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
import { recordSignalScan, recordSignalScanSummary, SignalHistoryView, SignalScanSummary } from "@/lib/signal-history";

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
  sourceUpdatedAt?: string;
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
  kind: "GEOLOGICAL" | "WILDFIRE" | "DISASTER" | "SPACE_WEATHER" | "CYBER" | "HEALTH" | "SOLANA_NETWORK";
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

export default function PulsePage() {
  const router = useRouter();
  const [booted, setBooted] = useState(false);
  const [pulse, setPulse] = useState<PulseData>(SENSOR_LIMITED);
  const [pulseLoading, setPulseLoading] = useState(true);
  const [nodes, setNodes] = useState<MapNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
  const [signalHistory, setSignalHistory] = useState<Record<string, SignalHistoryView>>({});
  const [scanSummary, setScanSummary] = useState<SignalScanSummary | null>(null);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapFilter, setMapFilter] = useState<"local" | "priority" | "all" | "verified">("priority");
  const [showStart, setShowStart] = useState(false);
  const [startArea, setStartArea] = useState("");
  const [startFocus, setStartFocus] = useState<SurvivalFocus>("LOCAL_THREATS");
  const [startError, setStartError] = useState("");
  const [startResolving, setStartResolving] = useState(false);
  const [localContext, setLocalContext] = useState<SurvivalContext | null>(null);
  const [editingArea, setEditingArea] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("rq-booted") === "1") setBooted(true);
  }, []);

  useEffect(() => {
    if (!booted || window.location.hash !== "#live-map") return;
    const timer = window.setTimeout(() => {
      document.getElementById("live-map")?.scrollIntoView({ block: "start" });
    }, 150);
    return () => window.clearTimeout(timer);
  }, [booted, mapLoading, pulseLoading, showStart]);

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
        const scanTime = liveNodes[0]?.scannedAt || new Date().toISOString();
        const onlineSources = pulseResult.status === "fulfilled" ? Number(pulseResult.value.coverage?.online || 0) : 0;
        const comparableScan = onlineSources >= 4 && liveNodes.length > 0;
        setNodes(liveNodes);
        setSelectedNode(liveNodes[0] || null);
        setSignalHistory(recordSignalScan(
          localStorage,
          liveNodes,
          scanTime,
        ));
        setScanSummary(recordSignalScanSummary(localStorage, liveNodes, comparableScan, scanTime));
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
      .filter((signal) => signal.kind === "SPACE_WEATHER" || signal.kind === "CYBER" || signal.kind === "HEALTH" || signal.kind === "SOLANA_NETWORK")
      .map((signal) => ({
        id: signal.id,
        name: signal.name,
        type: signal.kind === "CYBER" || signal.kind === "SOLANA_NETWORK" ? "ALGORITHMIC" : signal.kind === "HEALTH" ? "BIOLOGICAL" : "SPACE_WEATHER",
        severity: signal.severity,
        region: signal.location,
        source: signal.source,
        sourceUrl: signal.sourceUrl,
        verified: signal.confidence >= 90,
      })),
    [pulse.signals],
  );

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
    const sanitizedArea = sanitizeArea(startArea);
    const area = sanitizedArea.length >= 2 ? sanitizedArea : "";
    setStartResolving(true);
    setStartError("");
    const focus = getFocusOption(startFocus);
    let location: SurvivalContext["location"];
    if (area.length >= 2) {
      try {
        location = await resolveBroadArea(area);
      } catch {
        location = undefined;
      }
    }
    const context: SurvivalContext = { area, focus: focus.id, mode: focus.mode, location };
    localStorage.setItem("rq-survival-context-v1", JSON.stringify(context));
    localStorage.setItem("rq-core-onboarding-v1", "done");
    setLocalContext(context);
    const params = new URLSearchParams({
      focus: focus.id,
      mode: focus.mode,
      first: "1",
      prompt: buildFirstContactPrompt(context),
    });
    if (area) params.set("area", area);
    router.push(`/red-queen?${params.toString()}`);
    setStartResolving(false);
  };

  async function activateLocalView() {
    const area = sanitizeArea(startArea || localContext?.area || "");
    if (area.length < 2) {
      setStartError("Enter a city or region. Never enter an exact address.");
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
      setEditingArea(false);
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

  if (!booted) return <BootSequence onComplete={finishBoot} />;

  const synthesisDate = relativeTime(pulse.generatedAt || pulse.publishDate);
  const sourceDate = relativeTime(pulse.sourceUpdatedAt || pulse.publishDate);
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
        <span>LAST SYNTHESIS: {synthesisDate.toUpperCase()}</span>
      </div>

      <MobileCommandHeader
        eyebrow="PULSE // LIVE INTELLIGENCE"
        title="What changed near me?"
        description="Choose a broad area, inspect verified signals, then ask RED QUEEN what deserves your attention."
        status={pulse.verified ? "LIVE SOURCES VERIFIED" : "SENSORS LIMITED"}
        actions={[
          { href: showStart ? "#first-contact" : "#live-map", label: showStart ? "GET MY FIRST BRIEF" : "OPEN LIVE MAP" },
          { href: "/red-queen", label: "ASK RED QUEEN", tone: "secondary" },
        ]}
        steps={["SET AREA", "REVIEW", "ASK QUEEN"]}
      />

      <header className="pulse-hero">
        <div className="container pulse-hero-grid">
          <div className="pulse-hero-copy">
            <div className="pulse-kicker">DAILY PULSE // RED QUEEN ONLINE</div>
            <h1>
              She sees the field.<br />
              <em>You choose the move.</em>
            </h1>
            <p className="pulse-lead">
              RED QUEEN is the AI survival intelligence system behind this platform. She watches verified threats,
              explains what may matter to you, and turns uncertainty into one useful next action. Pulse is her vision.
              The map is her nervous system. If you choose to prepare before a crisis decides for you, you are a SOLvivor.
            </p>
            <p className="pulse-queen-vow">“I do not promise safety. I make sure you do not choose blind.”</p>
            <div className="pulse-hero-actions">
              <Link className="btn btn-primary" href={showStart ? "#first-contact" : "/red-queen"}>{showStart ? "GET MY FIRST BRIEF" : "CONTINUE WITH RED QUEEN"}</Link>
              <a className="btn btn-ghost" href="#live-map">OPEN LIVE MAP</a>
            </div>
            <p className="pulse-entry-note">NO ACCOUNT · NO WALLET · NO EXACT ADDRESS REQUIRED</p>
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
              <span>APOCALYPSE INTELLIGENCE // ACTIVE</span>
              <strong>RED QUEEN</strong>
              <small>{pulse.verified ? "I SEE THE FIELD · YOU CHOOSE THE MOVE" : "SENSORS LIMITED · I WILL NOT INVENT CERTAINTY"}</small>
            </div>
          </div>
        </div>
        <div className="container pulse-system-line">
          <span>THIS PLATFORM IS HER SYSTEM</span>
          <p><strong>Pulse</strong> is what she sees. <strong>Map</strong> is where it happens. <strong>Library</strong> is what she remembers. <strong>Prepare</strong> is what you do next.</p>
          <Link href="/docs">HOW RED QUEEN WORKS →</Link>
        </div>
      </header>

      <div className="container">
        <CoreLoopGuide
          current="pulse"
          title="Choose a broad area. Review one signal."
          description="Start here without an account. Pulse shows what changed and hands one relevant signal to RED QUEEN."
          actionHref="#live-map"
          actionLabel="OPEN LIVE SIGNALS"
          accessNote="PUBLIC · NO WALLET · CITY OR REGION ONLY"
        />
      </div>

      {showStart && (
        <section id="first-contact" className="container pulse-onboarding" aria-label="Start with Red Queen">
          <div className="pulse-onboarding-copy">
            <span className="pulse-eyebrow">FIRST CONTACT // ABOUT 60 SECONDS</span>
            <h2>Get your first survival brief.</h2>
            <p>Answer two simple questions. RED QUEEN will open with a clear status, explain what matters, and give you one useful action.</p>
            <ol className="pulse-onboarding-steps">
              <li><span>1</span><div><strong>Tell her where to look</strong><small>A city or region is enough. This step is optional.</small></div></li>
              <li><span>2</span><div><strong>Choose what you need help with</strong><small>No specialist knowledge required.</small></div></li>
              <li><span>3</span><div><strong>Receive one clear next move</strong><small>Facts, uncertainty and action stay separate.</small></div></li>
            </ol>
          </div>
          <div className="pulse-first-contact">
            <div className="pulse-question-label"><span>QUESTION 1 OF 2</span><strong>Where should RED QUEEN look?</strong></div>
            <label htmlFor="first-contact-area">CITY OR REGION <small>OPTIONAL // LEAVE EMPTY FOR GLOBAL</small></label>
            <input
              id="first-contact-area"
              value={startArea}
              onChange={(event) => { setStartArea(event.target.value); setStartError(""); }}
              placeholder="Optional · Barcelona, Catalonia"
              maxLength={80}
              autoComplete="address-level2"
            />
            <span className="pulse-field-note">Use only a broad area. Never enter your street or exact address.</span>
            <div className="pulse-question-label pulse-question-label-second"><span>QUESTION 2 OF 2</span><strong>What do you want help with?</strong></div>
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
            <div className="pulse-brief-output"><span>YOUR BRIEF WILL CONTAIN</span><strong>Current status</strong><i>→</i><strong>Why it matters</strong><i>→</i><strong>One next action</strong></div>
            <div className="pulse-onboarding-actions">
              <button className="btn btn-primary" type="button" onClick={() => void beginFirstContact()} disabled={startResolving}>{startResolving ? "LOCATING BROAD AREA..." : "SHOW ME WHAT MATTERS"}</button>
              <button className="pulse-text-button" type="button" onClick={dismissStart}>I JUST WANT TO LOOK AROUND</button>
            </div>
            <small className="pulse-onboarding-trust">Public Pulse works without an account. Sign in later only if you want Queen to remember your plans and readiness.</small>
          </div>
        </section>
      )}

      <div className="container pulse-action-plan">
        <DailyActionPanel context="PULSE" />
      </div>

      {scanSummary && (
        <section className={`container pulse-scan-delta is-${scanSummary.state.toLowerCase()}`} aria-label="Changes since the previous verified scan">
          <div className="pulse-scan-delta-copy">
            <span>SINCE YOUR LAST VERIFIED SCAN // THIS DEVICE</span>
            <strong>
              {scanSummary.state === "LIMITED"
                ? scanSummary.previousScanAt
                  ? "Comparison paused. The previous baseline is preserved."
                  : "Comparison unavailable. A reliable baseline has not been captured yet."
                : scanSummary.state === "BASELINE"
                  ? "Baseline captured. Return after the next verified scan to see what changed."
                  : scanSummary.newCount + scanSummary.escalatedCount + scanSummary.reducedCount + scanSummary.absentCount === 0
                    ? "No changes detected in the current verified signal set."
                    : "The field changed. RED QUEEN separated movement from noise."}
            </strong>
            <small>{scanSummary.previousScanAt ? `PREVIOUS ${relativeTime(scanSummary.previousScanAt).toUpperCase()}` : "FIRST RELIABLE OBSERVATION"}</small>
          </div>
          <dl>
            <div><dt>ACTIVE</dt><dd>{scanSummary.activeCount}</dd></div>
            <div><dt>NEW</dt><dd>{scanSummary.newCount}</dd></div>
            <div><dt>ESCALATED</dt><dd>{scanSummary.escalatedCount}</dd></div>
            <div><dt>REDUCED</dt><dd>{scanSummary.reducedCount}</dd></div>
            <div><dt>OUT OF FEED</dt><dd>{scanSummary.absentCount}</dd></div>
          </dl>
          <p>“Out of feed” is not the same as resolved. Open the source before acting.</p>
        </section>
      )}

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
              <div><dt>SOURCE UPDATED</dt><dd>{sourceDate}</dd></div>
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
              <Link href="/red-queen">ASK A FOLLOW-UP →</Link>
              <Link href="/prepare">OPEN PREPAREDNESS →</Link>
            </div>
          </article>
        </div>

        {!!pulse.sourceHealth?.length && (
          <details className="pulse-source-grid">
            <summary>
              <div><span className="pulse-eyebrow">SOURCE GRID // LIVE COVERAGE</span><strong>{pulse.coverage?.online || 0}/{pulse.coverage?.total || pulse.sourceHealth.length} sources reachable</strong></div>
              <small>{pulse.coverage?.signalCount || 0} NORMALIZED SIGNALS · CHECKED {relativeTime(pulse.generatedAt).toUpperCase()}</small>
              <b>VIEW SOURCE HEALTH +</b>
            </summary>
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
            <p>Reachability confirms that the source responded. It does not mean every local event is covered. Always follow official alerts for your area.</p>
          </details>
        )}
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

        {(!hasResolvedArea || editingArea) && (
          <div className="pulse-local-setup">
            <div><span>{hasResolvedArea ? "CHANGE BROAD AREA" : "LOCAL RELEVANCE"}</span><strong>Center the signal field on a broad area.</strong><p>City or region only. RED QUEEN does not need an exact address.</p></div>
            <input
              value={startArea}
              onChange={(event) => { setStartArea(event.target.value); setStartError(""); }}
              placeholder="Barcelona, Spain"
              maxLength={80}
              aria-label="City or region for local signal relevance"
            />
            <div className="pulse-local-actions">
              <button type="button" onClick={() => void activateLocalView()} disabled={startResolving}>{startResolving ? "RESOLVING..." : hasResolvedArea ? "UPDATE CITY" : "SET LOCAL VIEW"}</button>
              {hasResolvedArea && <button type="button" className="is-quiet" onClick={() => { setStartArea(localContext?.area || ""); setStartError(""); setEditingArea(false); }}>CANCEL</button>}
            </div>
            {startError && <small role="alert">{startError}</small>}
          </div>
        )}

        {hasResolvedArea && !editingArea && (
          <div className="pulse-local-proof">
            <div><span>YOUR BROAD AREA</span><strong>{localContext!.area}</strong></div>
            <div><span>NEARBY SIGNALS</span><strong>{nearbyNodes.length}</strong></div>
            <div><span>PRIVACY MODE</span><strong>THIS DEVICE ONLY</strong></div>
            <button type="button" onClick={() => setEditingArea(true)}>CHANGE CITY</button>
            <small>Your broad area stays in this browser unless you change it or clear site data. Resolved with © OpenStreetMap contributors. Absence of a mapped signal is not proof of safety.</small>
          </div>
        )}

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
          ) : (
            <>
              <TacticalMap
                nodes={visibleNodes}
                onSelectNode={setSelectedNode}
                selectedNode={selectedNode}
                focus={localContext?.location || null}
                focusMode={mapFilter === "local"}
              />
              {!nodes.length && <div className="pulse-map-empty"><strong>NO VERIFIED SIGNALS AVAILABLE</strong><span>The field remains interactive. Source silence is not proof of safety. Check official local alerts.</span></div>}
            </>
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
                <small>Local memory only. This is not an official event timeline.</small>
              </div>
            </div>

            <footer className="pulse-selected-actions">
              {selectedNode.sourceUrl && <a href={selectedNode.sourceUrl} target="_blank" rel="noreferrer">OPEN PRIMARY SOURCE ↗</a>}
              {toWatchType(selectedNode.type) && <button type="button" onClick={() => requestSignalWatch(selectedNode.type)}>WATCH THIS CATEGORY</button>}
              <Link href={`/red-queen?${new URLSearchParams({
                mode: "ANALYZE",
                focus: "LOCAL_THREATS",
                area: localContext?.area || "",
                signal: selectedNode.id,
                prompt: `Explain the relevance of this live signal to my context: ${selectedNode.name}. Separate the verified source fact from assessment and give me one safe action.`,
              }).toString()}`}>ASK QUEEN ABOUT THIS →</Link>
              {selectedNode.verified && <Link href={`/onchain?${new URLSearchParams({
                product: "incident",
                signalId: selectedNode.id,
              }).toString()}#queen-operations`}>BUILD x402 INCIDENT DOSSIER →</Link>}
              <Link href={`/red-queen?${new URLSearchParams({
                mode: "PREPARE",
                focus: "LOCAL_THREATS",
                area: localContext?.area || "",
                signal: selectedNode.id,
                prompt: `Use the attached verified signal “${selectedNode.name}” only if it still resolves and is relevant to my context. If preparation is justified, build a concise 2-5 step protocol with one action I can complete now and a realistic review date. If it is not relevant, explain why and return no event-specific plan.`,
              }).toString()}`}>BUILD QUEEN PROTOCOL →</Link>
            </footer>
          </article>
        )}

        <SignalWatchPanel nodes={[...nodes, ...nonMapWatchSignals]} area={localContext?.area} location={localContext?.location || null} />
      </section>

      <section className="container pulse-final-cta">
        <div className="queen-core queen-core-small"><span /></div>
        <div><span className="pulse-eyebrow">RED QUEEN IS LISTENING</span><h2>Act now, or understand the system first.</h2></div>
        <div className="pulse-final-actions"><Link className="btn btn-primary" href="/red-queen">ASK RED QUEEN</Link><Link className="btn btn-ghost" href="/docs">OPEN PRODUCT GUIDE</Link></div>
      </section>
    </div>
  );
}
