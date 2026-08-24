"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { registerRedQueenServiceWorker, showRedQueenNotification } from "@/lib/mobile-experience";
import {
  parseSignalWatchMemory,
  SIGNAL_WATCH_EVENT,
  SIGNAL_WATCH_OPTIONS,
  SIGNAL_WATCH_REQUEST_EVENT,
  SIGNAL_WATCH_STORAGE_KEY,
  isSignalWatchType,
  SignalWatchMemory,
  SignalWatchType,
  writeSignalWatchMemory,
} from "@/lib/signal-watch";

export interface WatchableSignal {
  id: string;
  name: string;
  type: string;
  severity: number;
  lat?: number;
  lng?: number;
  region: string;
  source?: string;
  sourceUrl?: string;
  verified?: boolean;
}

interface SignalWatchPanelProps {
  nodes: WatchableSignal[];
  area?: string;
  location?: { lat: number; lng: number } | null;
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

function isWatched(signal: WatchableSignal, memory: SignalWatchMemory, location?: { lat: number; lng: number } | null) {
  const typeMatch = memory.types.includes(signal.type as SignalWatchType);
  const hasCoordinates = Number.isFinite(signal.lat) && Number.isFinite(signal.lng);
  const localMatch = Boolean(memory.localPriority && location && hasCoordinates && signal.severity >= 60
    && distanceInKm(location, { lat: signal.lat!, lng: signal.lng! }) <= 1_000);
  return signal.verified !== false && (typeMatch || localMatch);
}

function severityLabel(severity: number) {
  if (severity >= 80) return "HIGH";
  if (severity >= 60) return "ELEVATED";
  return "MONITOR";
}

function matchReason(signal: WatchableSignal, memory: SignalWatchMemory, location?: { lat: number; lng: number } | null) {
  const reasons: string[] = [];
  if (memory.types.includes(signal.type as SignalWatchType)) reasons.push("WATCHED CATEGORY");
  if (memory.localPriority && location && Number.isFinite(signal.lat) && Number.isFinite(signal.lng)) {
    const distance = Math.round(distanceInKm(location, { lat: signal.lat!, lng: signal.lng! }));
    if (distance <= 1_000 && signal.severity >= 60) reasons.push(`${distance.toLocaleString()} KM FROM LOCAL VIEW`);
  }
  return reasons.join(" · ") || "VERIFIED GRID MATCH";
}

export default function SignalWatchPanel({ nodes, area, location }: SignalWatchPanelProps) {
  const { session } = useAuth();
  const [memory, setMemory] = useState<SignalWatchMemory>({
    version: 1,
    types: [],
    localPriority: false,
    browserAlerts: false,
    knownSignalIds: [],
    acknowledgedSignalIds: [],
  });
  const [ready, setReady] = useState(false);
  const [reviewSignalIds, setReviewSignalIds] = useState<string[]>([]);
  const [watchSlots, setWatchSlots] = useState(2);
  const [comparisonSignals, setComparisonSignals] = useState(2);
  const [clearanceName, setClearanceName] = useState("CIVILIAN");
  const [limitMessage, setLimitMessage] = useState("");
  const [browserAlertPermission, setBrowserAlertPermission] = useState<NotificationPermission | "unsupported">("unsupported");

  useEffect(() => {
    const accessToken = session?.access_token;
    if (!accessToken) {
      setWatchSlots(2);
      setComparisonSignals(2);
      setClearanceName("CIVILIAN");
      return;
    }
    let active = true;
    fetch("/api/profile/verify-holder", {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({}),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Holder verification unavailable");
        if (!active) return;
        setWatchSlots(Number(data.signal_watch_slots) || 2);
        setComparisonSignals(Number(data.comparison_signals) || 2);
        setClearanceName(data.holder_status || "CIVILIAN");
      })
      .catch(() => {
        if (!active) return;
        setWatchSlots(2);
        setComparisonSignals(2);
        setClearanceName("UNVERIFIED");
      });
    return () => { active = false; };
  }, [session?.access_token]);

  useEffect(() => {
    setMemory(parseSignalWatchMemory(localStorage.getItem(SIGNAL_WATCH_STORAGE_KEY)));
    setBrowserAlertPermission("Notification" in window ? Notification.permission : "unsupported");
    setReady(true);
  }, []);

  const matchedSignals = useMemo(
    () => nodes.filter((node) => isWatched(node, memory, location)).sort((a, b) => b.severity - a.severity),
    [location, memory, nodes],
  );

  const watchKey = `${memory.localPriority}:${memory.types.join(",")}`;
  const nodeKey = nodes.map((node) => node.id).sort().join("|");

  useEffect(() => {
    if (!ready || (!memory.localPriority && memory.types.length === 0)) {
      setReviewSignalIds([]);
      return;
    }
    const stored = parseSignalWatchMemory(localStorage.getItem(SIGNAL_WATCH_STORAGE_KEY));
    const currentMatches = nodes.filter((node) => isWatched(node, memory, location));
    const newMatches = currentMatches.filter((node) => !stored.knownSignalIds.includes(node.id));
    setReviewSignalIds(currentMatches
      .filter((node) => !stored.acknowledgedSignalIds.includes(node.id))
      .map((node) => node.id));
    const scannedMemory: SignalWatchMemory = {
      ...memory,
      knownSignalIds: Array.from(new Set([...stored.knownSignalIds, ...currentMatches.map((node) => node.id)])).slice(-400),
      lastScanAt: new Date().toISOString(),
    };
    writeSignalWatchMemory(localStorage, scannedMemory);
    setMemory(scannedMemory);

    if (stored.browserAlerts && "Notification" in window && Notification.permission === "granted") {
      newMatches.slice(0, 3).forEach((signal) => {
        void showRedQueenNotification(`RED QUEEN ALERT · ${severityLabel(signal.severity)}`, {
          body: `${signal.name} · ${signal.source || "verified signal grid"}`,
          tag: `red-queen-${signal.id}`,
          data: { url: "/pulse#signal-watch" },
        });
      });
    }
  }, [location, nodeKey, ready, watchKey]);

  function updateMemory(next: SignalWatchMemory) {
    setMemory(next);
    writeSignalWatchMemory(localStorage, next);
    window.dispatchEvent(new Event(SIGNAL_WATCH_EVENT));
  }

  function toggleType(type: SignalWatchType) {
    const adding = !memory.types.includes(type);
    const usedSlots = memory.types.length + (memory.localPriority ? 1 : 0);
    if (adding && usedSlots >= watchSlots) {
      setLimitMessage(`${clearanceName} clearance supports ${watchSlots} simultaneous watches. Remove one or verify a higher $THREAT tier.`);
      return;
    }
    setLimitMessage("");
    updateMemory({
      ...memory,
      types: memory.types.includes(type) ? memory.types.filter((item) => item !== type) : [...memory.types, type],
    });
  }

  useEffect(() => {
    const handleRequestedWatch = (event: Event) => {
      const requestedType = (event as CustomEvent<{ type?: string }>).detail?.type;
      if (!requestedType || !isSignalWatchType(requestedType) || memory.types.includes(requestedType)) return;
      const usedSlots = memory.types.length + (memory.localPriority ? 1 : 0);
      if (usedSlots >= watchSlots) {
        setLimitMessage(`${clearanceName} clearance supports ${watchSlots} simultaneous watches. Remove one or verify a higher $THREAT tier.`);
        return;
      }
      setLimitMessage("");
      updateMemory({ ...memory, types: [...memory.types, requestedType] });
    };
    window.addEventListener(SIGNAL_WATCH_REQUEST_EVENT, handleRequestedWatch);
    return () => window.removeEventListener(SIGNAL_WATCH_REQUEST_EVENT, handleRequestedWatch);
  }, [clearanceName, memory, watchSlots]);

  function toggleLocal() {
    if (!location) return;
    const usedSlots = memory.types.length + (memory.localPriority ? 1 : 0);
    if (!memory.localPriority && usedSlots >= watchSlots) {
      setLimitMessage(`${clearanceName} clearance supports ${watchSlots} simultaneous watches. Remove one or verify a higher $THREAT tier.`);
      return;
    }
    setLimitMessage("");
    updateMemory({ ...memory, localPriority: !memory.localPriority });
  }

  function acknowledgeSignal(signalId: string) {
    const acknowledgedSignalIds = Array.from(new Set([...memory.acknowledgedSignalIds, signalId])).slice(-400);
    updateMemory({ ...memory, acknowledgedSignalIds });
    setReviewSignalIds((current) => current.filter((id) => id !== signalId));
  }

  function acknowledgeAll() {
    const acknowledgedSignalIds = Array.from(new Set([
      ...memory.acknowledgedSignalIds,
      ...matchedSignals.map((signal) => signal.id),
    ])).slice(-400);
    updateMemory({ ...memory, acknowledgedSignalIds });
    setReviewSignalIds([]);
  }

  async function enableBrowserAlerts() {
    if (!("Notification" in window)) {
      setBrowserAlertPermission("unsupported");
      return;
    }
    await registerRedQueenServiceWorker().catch(() => undefined);
    const permission = await Notification.requestPermission();
    setBrowserAlertPermission(permission);
    if (permission === "granted") {
      updateMemory({ ...memory, browserAlerts: true });
    }
  }

  function disableBrowserAlerts() {
    updateMemory({ ...memory, browserAlerts: false });
  }

  function queenReviewHref(signal?: WatchableSignal) {
    const subject = signal
      ? `${signal.name} (${signal.type}, severity ${signal.severity}, ${signal.region}, source: ${signal.source || "pending"})`
      : "the current signals in my Signal Watch";
    const params = new URLSearchParams({
      mode: "MONITOR",
      focus: "LOCAL_THREATS",
      area: area || "",
      prompt: `Review ${subject}. Separate verified facts from uncertainty, explain why it matters to my context, and give one proportionate action only if justified.`,
    });
    if (signal) params.set("signal", signal.id);
    else {
      const comparisonIds = displayedSignals.slice(0, comparisonSignals).map((item) => item.id);
      if (comparisonIds.length) params.set("signals", comparisonIds.join(","));
    }
    return `/red-queen?${params.toString()}`;
  }

  const hasWatches = memory.localPriority || memory.types.length > 0;
  const usedSlots = memory.types.length + (memory.localPriority ? 1 : 0);
  const displayedSignals = [...matchedSignals].sort((a, b) => {
    const newDifference = Number(reviewSignalIds.includes(b.id)) - Number(reviewSignalIds.includes(a.id));
    return newDifference || b.severity - a.severity;
  });

  return (
    <section id="signal-watch" className={`signal-watch-panel ${hasWatches ? "is-active" : ""}`}>
      <div className="signal-watch-heading">
        <div>
          <span>SIGNAL WATCH // PERSONAL FILTER</span>
          <h3>{hasWatches ? `${usedSlots} watch${usedSlots === 1 ? "" : "es"} active` : "Choose what I should watch."}</h3>
          <p>Pick up to {watchSlots}. I will hold new verified matches here for your review.</p>
        </div>
        <small>{clearanceName} · {usedSlots}/{watchSlots} SLOTS · COMPARE {comparisonSignals}</small>
      </div>
      <ol className="signal-watch-path" aria-label="How Signal Watch works">
        <li className={hasWatches ? "is-complete" : "is-current"}><span>1</span><div><strong>CHOOSE</strong><small>Location or category</small></div></li>
        <li className={memory.browserAlerts && browserAlertPermission === "granted" ? "is-complete" : hasWatches ? "is-current" : ""}><span>2</span><div><strong>ENABLE</strong><small>Optional browser alert</small></div></li>
        <li className={reviewSignalIds.length ? "is-current" : ""}><span>3</span><div><strong>REVIEW</strong><small>Open matched sources</small></div></li>
        <li><span>4</span><div><strong>ASK QUEEN</strong><small>Get one next action</small></div></li>
      </ol>
      <div className="signal-watch-controls">
        <button type="button" disabled={!location} className={memory.localPriority ? "active" : ""} onClick={toggleLocal}>
          <i>{memory.localPriority ? "WATCHING" : "ADD WATCH"}</i><strong>LOCAL PRIORITY</strong><span>{location ? `Within 1,000 km of ${area}` : "Set a broad area first"}</span>
        </button>
        {SIGNAL_WATCH_OPTIONS.map((option) => (
          <button key={option.id} type="button" className={memory.types.includes(option.id) ? "active" : ""} onClick={() => toggleType(option.id)}>
            <i>{memory.types.includes(option.id) ? "WATCHING" : "ADD WATCH"}</i>
            <strong>{option.label}</strong><span>{option.description}</span>
          </button>
        ))}
      </div>
      {limitMessage && <div className="signal-watch-limit"><span>{limitMessage}</span><Link href="/onchain">ONCHAIN · VERIFY CLEARANCE →</Link></div>}
      {hasWatches && (
        <div className={`signal-watch-delivery ${memory.browserAlerts && browserAlertPermission === "granted" ? "is-armed" : ""}`}>
          <div>
            <span>STEP 2 // OPTIONAL ALERT</span>
            <strong>
              {browserAlertPermission === "unsupported"
                ? "Notifications are unavailable in this browser."
                : browserAlertPermission === "denied"
                  ? "Notifications are blocked in browser settings."
                  : memory.browserAlerts
                    ? "Armed for new watched signals while RED QUEEN is open."
                    : "Get an alert when the open platform detects a new match."}
            </strong>
          </div>
          {browserAlertPermission !== "unsupported" && browserAlertPermission !== "denied" && (
            memory.browserAlerts
              ? <button type="button" onClick={disableBrowserAlerts}>DISARM</button>
              : <button type="button" onClick={enableBrowserAlerts}>ENABLE ALERTS</button>
          )}
        </div>
      )}
      {hasWatches && (
        <div className="signal-watch-results">
          <header>
            <div><span>STEP 3 // ACTIVE INBOX</span><strong>{reviewSignalIds.length ? `${reviewSignalIds.length} verified match${reviewSignalIds.length === 1 ? "" : "es"} need your review.` : "Watch active. Nothing new needs review."}</strong></div>
            {!!reviewSignalIds.length && <button type="button" onClick={acknowledgeAll}>MARK ALL REVIEWED</button>}
          </header>
          <div>
            {displayedSignals.slice(0, 5).map((signal) => (
              <article key={signal.id} className={reviewSignalIds.includes(signal.id) ? "is-new" : ""}>
                <div className="signal-watch-card-top">
                  <span>{reviewSignalIds.includes(signal.id) ? "NEEDS REVIEW" : "REVIEWED"}</span>
                  <b data-severity={severityLabel(signal.severity).toLowerCase()}>{severityLabel(signal.severity)} · {signal.severity}</b>
                </div>
                <strong>{signal.name}</strong>
                <small>{signal.source || "SOURCE PENDING"} · {signal.region}</small>
                <p>{matchReason(signal, memory, location)}</p>
                <div className="signal-watch-card-actions">
                  {signal.sourceUrl && <a href={signal.sourceUrl} target="_blank" rel="noopener noreferrer">SOURCE ↗</a>}
                  <Link href={queenReviewHref(signal)}>ASK QUEEN →</Link>
                  {reviewSignalIds.includes(signal.id) && <button type="button" onClick={() => acknowledgeSignal(signal.id)}>MARK REVIEWED</button>}
                </div>
              </article>
            ))}
            {!matchedSignals.length && <div className="signal-watch-empty"><strong>NO CURRENT MATCHES</strong><p>Your Watch is working. No loaded verified signal currently matches this filter. This is not proof of safety.</p><a href="#live-map">CHECK LIVE MAP ↑</a></div>}
          </div>
          <Link className="signal-watch-primary" href={queenReviewHref()}><span>STEP 4</span> ASK QUEEN TO REVIEW MY WATCH →</Link>
        </div>
      )}
      <footer><strong>ON THIS DEVICE</strong> Watch state stays in this browser · alerts work while RED QUEEN is open · background sync is coming later. <Link href="/profile">VIEW IN PROFILE →</Link></footer>
    </section>
  );
}
