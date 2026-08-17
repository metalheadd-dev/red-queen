"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BootSequence from "@/components/BootSequence";
import DailyActionPanel from "@/components/DailyActionPanel";
import SignalWatchPanel from "@/components/SignalWatchPanel";
import {
  buildFirstContactPrompt,
  getFocusOption,
  sanitizeArea,
  SURVIVAL_FOCUS_OPTIONS,
  SurvivalContext,
  SurvivalFocus,
} from "@/lib/survival-context";

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
}

interface PulseSignal {
  id: string;
  name: string;
  kind: "GEOLOGICAL" | "WILDFIRE" | "SPACE_WEATHER" | "CYBER";
  severity: number;
  location: string;
  observedAt: string;
  source: string;
  sourceUrl: string;
  fact: string;
  confidence: number;
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
  updatedAt?: string;
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

export default function HomePage() {
  const router = useRouter();
  const [booted, setBooted] = useState(false);
  const [pulse, setPulse] = useState<PulseData>(SENSOR_LIMITED);
  const [pulseLoading, setPulseLoading] = useState(true);
  const [nodes, setNodes] = useState<MapNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
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
        setNodes(mapResult.value);
        setSelectedNode(mapResult.value[0] || null);
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
      .filter((signal) => signal.kind === "SPACE_WEATHER" || signal.kind === "CYBER")
      .map((signal) => ({
        id: signal.id,
        name: signal.name,
        type: signal.kind === "CYBER" ? "ALGORITHMIC" : "SPACE_WEATHER",
        severity: signal.severity,
        region: signal.location,
        source: signal.source,
        sourceUrl: signal.sourceUrl,
        verified: signal.confidence >= 90,
      })),
    [pulse.signals],
  );

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
              RED QUEEN turns verified global signals into one clear assessment and one practical action for you.
              No panic feed. No fictional alerts disguised as reality.
            </p>
            <div className="pulse-hero-actions">
              <Link className="btn btn-primary" href="/terminal">ASK RED QUEEN</Link>
              <a className="btn btn-ghost" href="#live-map">OPEN LIVE MAP</a>
            </div>
          </div>
          <div className="queen-presence" aria-label="Red Queen is online">
            <div className="queen-halo queen-halo-one" />
            <div className="queen-halo queen-halo-two" />
            <div className="queen-core"><span /></div>
            <div className="queen-presence-copy">
              <span>CONTEXT AWARE</span>
              <strong>RED QUEEN</strong>
              <small>{pulse.verified ? "SOURCES LOCKED" : "SENSOR GRID LIMITED"}</small>
            </div>
          </div>
        </div>
      </section>

      {showStart && (
        <section className="container pulse-onboarding" aria-label="Start with Red Queen">
          <div className="pulse-onboarding-copy">
            <span className="pulse-eyebrow">FIRST CONTACT // 60 SECONDS</span>
            <h2>Get one useful action for your situation</h2>
            <p>Choose a broad area and your immediate priority. RED QUEEN will separate live facts from general guidance and produce one action — without requesting an exact address.</p>
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
            <strong>{pulse.verified ? `${pulse.confidence ?? 0}% SOURCE CONFIDENCE` : "NO CLAIM ISSUED"}</strong>
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
          <article className="pulse-selected-signal">
            <div>
              <span className="pulse-eyebrow">SELECTED SIGNAL // {selectedNode.type}</span>
              <h3>{selectedNode.name}</h3>
              <p>{selectedNode.desc}</p>
            </div>
            <div className="pulse-signal-side">
              <strong>{selectedNode.severity}</strong><span>RELEVANCE INDEX</span>
              <small>{selectedNode.source || "SOURCE PENDING"} · {selectedNode.region}</small>
              <Link href={`/terminal?${new URLSearchParams({
                mode: "ANALYZE",
                focus: "LOCAL_THREATS",
                area: localContext?.area || "",
                prompt: `Explain the relevance of this live signal to my context: ${selectedNode.name}. Separate the verified source fact from assessment and give me one safe action.`,
              }).toString()}`}>ASK QUEEN ABOUT THIS →</Link>
            </div>
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
