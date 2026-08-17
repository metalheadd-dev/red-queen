"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  parseSignalWatchMemory,
  SIGNAL_WATCH_EVENT,
  SIGNAL_WATCH_OPTIONS,
  SIGNAL_WATCH_STORAGE_KEY,
  SignalWatchMemory,
  SignalWatchType,
  writeSignalWatchMemory,
} from "@/lib/signal-watch";

export interface WatchableSignal {
  id: string;
  name: string;
  type: string;
  severity: number;
  lat: number;
  lng: number;
  region: string;
  source?: string;
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
  const localMatch = Boolean(memory.localPriority && location && signal.severity >= 60 && distanceInKm(location, signal) <= 1_000);
  return signal.verified !== false && (typeMatch || localMatch);
}

function formatScanTime(value?: string) {
  if (!value) return "FIRST SCAN";
  const elapsed = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(elapsed) || elapsed < 60_000) return "LESS THAN 1M AGO";
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 60) return `${minutes}M AGO`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}H AGO`;
  return `${Math.floor(hours / 24)}D AGO`;
}

export default function SignalWatchPanel({ nodes, area, location }: SignalWatchPanelProps) {
  const { publicKey } = useWallet();
  const [memory, setMemory] = useState<SignalWatchMemory>({ version: 1, types: [], localPriority: false, knownSignalIds: [] });
  const [ready, setReady] = useState(false);
  const [newSignalIds, setNewSignalIds] = useState<string[]>([]);
  const [previousScanAt, setPreviousScanAt] = useState<string | undefined>();
  const [watchSlots, setWatchSlots] = useState(2);
  const [clearanceName, setClearanceName] = useState("CIVILIAN");
  const [limitMessage, setLimitMessage] = useState("");

  useEffect(() => {
    const address = publicKey?.toBase58();
    if (!address) {
      setWatchSlots(2);
      setClearanceName("CIVILIAN");
      return;
    }
    let active = true;
    fetch(`/api/onchain/wallet?address=${encodeURIComponent(address)}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "On-chain read unavailable");
        if (!active) return;
        setWatchSlots(Number(data.threat?.clearance?.signalWatchSlots) || 2);
        setClearanceName(data.threat?.clearance?.name || "CIVILIAN");
      })
      .catch(() => {
        if (!active) return;
        setWatchSlots(2);
        setClearanceName("UNVERIFIED");
      });
    return () => { active = false; };
  }, [publicKey]);

  useEffect(() => {
    setMemory(parseSignalWatchMemory(localStorage.getItem(SIGNAL_WATCH_STORAGE_KEY)));
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
      setNewSignalIds([]);
      return;
    }
    const stored = parseSignalWatchMemory(localStorage.getItem(SIGNAL_WATCH_STORAGE_KEY));
    const currentMatches = nodes.filter((node) => isWatched(node, memory, location));
    setPreviousScanAt(stored.lastScanAt);
    setNewSignalIds(currentMatches.filter((node) => !stored.knownSignalIds.includes(node.id)).map((node) => node.id));
    const scannedMemory: SignalWatchMemory = {
      ...memory,
      knownSignalIds: Array.from(new Set([...stored.knownSignalIds, ...currentMatches.map((node) => node.id)])).slice(-400),
      lastScanAt: new Date().toISOString(),
    };
    writeSignalWatchMemory(localStorage, scannedMemory);
    setMemory(scannedMemory);
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

  const hasWatches = memory.localPriority || memory.types.length > 0;

  return (
    <section className={`signal-watch-panel ${hasWatches ? "is-active" : ""}`}>
      <div className="signal-watch-heading">
        <div><span>MY SIGNAL WATCH // ON-DEVICE</span><h3>{hasWatches ? `${matchedSignals.length} current matches · ${newSignalIds.length} new` : "Choose what RED QUEEN should remember"}</h3></div>
        <small>{memory.types.length + (memory.localPriority ? 1 : 0)}/{watchSlots} WATCH SLOTS · {clearanceName} · LAST SCAN {formatScanTime(previousScanAt)}</small>
      </div>
      <div className="signal-watch-controls">
        <button type="button" disabled={!location} className={memory.localPriority ? "active" : ""} onClick={toggleLocal}>
          <strong>LOCAL PRIORITY</strong><span>{location ? `Within 1,000 km of ${area}` : "Set a broad area first"}</span>
        </button>
        {SIGNAL_WATCH_OPTIONS.map((option) => (
          <button key={option.id} type="button" className={memory.types.includes(option.id) ? "active" : ""} onClick={() => toggleType(option.id)}>
            <strong>{option.label}</strong><span>{option.description}</span>
          </button>
        ))}
      </div>
      {limitMessage && <div className="signal-watch-limit"><span>{limitMessage}</span><Link href="/network-clearance">VERIFY CLEARANCE →</Link></div>}
      {hasWatches && (
        <div className="signal-watch-results">
          <div>
            {matchedSignals.slice(0, 3).map((signal) => (
              <article key={signal.id} className={newSignalIds.includes(signal.id) ? "is-new" : ""}>
                <span>{newSignalIds.includes(signal.id) ? "NEW THIS SCAN" : signal.type}</span>
                <strong>{signal.name}</strong>
                <small>{signal.source || "SOURCE PENDING"} · {signal.region}</small>
              </article>
            ))}
            {!matchedSignals.length && <p>No current verified signals match this watch. This is not proof of safety; check official local alerts.</p>}
          </div>
          <Link href={`/terminal?${new URLSearchParams({
            mode: "MONITOR",
            focus: "LOCAL_THREATS",
            area: area || "",
            prompt: "Review the signal categories I monitor. Explain what changed, separate verified facts from uncertainty, and give me one action only if it is justified.",
          }).toString()}`}>ASK QUEEN TO REVIEW WATCH →</Link>
        </div>
      )}
      <footer>This compares source-backed signals when you open Pulse. Browser push notifications and account sync are not enabled yet.</footer>
    </section>
  );
}
