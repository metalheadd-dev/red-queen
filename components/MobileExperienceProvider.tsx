"use client";

import { useEffect, useState } from "react";
import BootSequence from "@/components/BootSequence";
import {
  mobileSoundEnabled,
  playMobileTone,
  registerRedQueenServiceWorker,
  showRedQueenNotification,
} from "@/lib/mobile-experience";
import {
  parseSignalWatchMemory,
  SIGNAL_WATCH_EVENT,
  SIGNAL_WATCH_STORAGE_KEY,
  SignalWatchMemory,
  SignalWatchType,
  writeSignalWatchMemory,
} from "@/lib/signal-watch";

interface MobileSignal {
  id: string;
  name: string;
  type: SignalWatchType;
  severity: number;
  source?: string;
  lat?: number;
  lng?: number;
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

function normalizeSignalType(type: string): SignalWatchType | null {
  const normalized = type === "WILDFIRE" ? "METEOROLOGICAL"
    : type === "CYBER" || type === "SOLANA_NETWORK" ? "ALGORITHMIC"
      : type === "HEALTH" ? "BIOLOGICAL"
        : type === "DISASTER" ? "KINETIC" : type;
  const supported = new Set<SignalWatchType>(["GEOLOGICAL", "METEOROLOGICAL", "KINETIC", "ALGORITHMIC", "SPACE_WEATHER", "BIOLOGICAL"]);
  return supported.has(normalized as SignalWatchType) ? normalized as SignalWatchType : null;
}

function matchesWatch(signal: MobileSignal, memory: SignalWatchMemory, location?: { lat: number; lng: number }) {
  if (memory.types.includes(signal.type)) return true;
  return Boolean(memory.localPriority && location && Number.isFinite(signal.lat) && Number.isFinite(signal.lng)
    && signal.severity >= 60 && distanceInKm(location, { lat: signal.lat!, lng: signal.lng! }) <= 1_000);
}

export default function MobileExperienceProvider() {
  const [showBoot, setShowBoot] = useState(false);

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 700px)").matches;
    if (mobile && sessionStorage.getItem("rq-app-booted-v2") !== "1") setShowBoot(true);
    void registerRedQueenServiceWorker().catch(() => undefined);
  }, []);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!window.matchMedia("(max-width: 700px)").matches || !mobileSoundEnabled()) return;
      const target = event.target instanceof Element ? event.target.closest("a,button") : null;
      if (!target || target.hasAttribute("data-rq-silent") || target.hasAttribute("disabled")) return;
      playMobileTone(target.classList.contains("is-primary") ? "confirm" : "tap");
    };
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  useEffect(() => {
    let timer: number | undefined;
    let scanning = false;

    async function scanWatches() {
      if (scanning || document.visibilityState === "hidden" || !window.matchMedia("(max-width: 700px)").matches) return;
      const memory = parseSignalWatchMemory(localStorage.getItem(SIGNAL_WATCH_STORAGE_KEY));
      if (!("Notification" in window) || !memory.browserAlerts || Notification.permission !== "granted" || (!memory.localPriority && memory.types.length === 0)) return;
      scanning = true;
      try {
        const [mapResult, pulseResult] = await Promise.allSettled([
          fetch("/api/threat-map?scope=live", { cache: "no-store" }).then(async (response): Promise<unknown> => response.ok ? response.json() : []),
          fetch("/api/threat", { method: "POST", cache: "no-store" }).then(async (response): Promise<unknown> => response.ok ? response.json() : {}),
        ]);
        const mapSignals = mapResult.status === "fulfilled" && Array.isArray(mapResult.value) ? mapResult.value : [];
        const pulsePayload = pulseResult.status === "fulfilled" && pulseResult.value && typeof pulseResult.value === "object"
          ? pulseResult.value as { signals?: unknown }
          : {};
        const pulseSignals = Array.isArray(pulsePayload.signals) ? pulsePayload.signals : [];
        const rawSignals = [...mapSignals, ...pulseSignals] as Array<Record<string, unknown>>;
        const normalizedSignals: MobileSignal[] = rawSignals.flatMap((signal) => {
          const type = normalizeSignalType(String(signal.type || signal.kind || ""));
          if (!type || !signal.id) return [];
          return [{
            id: String(signal.id),
            name: String(signal.name || "Verified signal"),
            type,
            severity: Number(signal.severity) || 0,
            source: typeof signal.source === "string" ? signal.source : undefined,
            lat: Number.isFinite(Number(signal.lat)) ? Number(signal.lat) : undefined,
            lng: Number.isFinite(Number(signal.lng)) ? Number(signal.lng) : undefined,
          }];
        });
        const signals = Array.from(new Map(normalizedSignals.map((signal) => [signal.id, signal])).values());
        const savedContext = JSON.parse(localStorage.getItem("rq-survival-context-v1") || "null") as { location?: { lat: number; lng: number } } | null;
        const matches = signals.filter((signal) => matchesWatch(signal, memory, savedContext?.location));
        const firstScan = !memory.lastScanAt;
        const newMatches = firstScan ? [] : matches.filter((signal) => !memory.knownSignalIds.includes(signal.id));
        writeSignalWatchMemory(localStorage, {
          ...memory,
          knownSignalIds: Array.from(new Set([...memory.knownSignalIds, ...matches.map((signal) => signal.id)])).slice(-400),
          lastScanAt: new Date().toISOString(),
        });
        for (const signal of newMatches.slice(0, 2)) {
          await showRedQueenNotification(`RED QUEEN ALERT · ${signal.severity >= 80 ? "HIGH" : "MONITOR"}`, {
            body: `${signal.name} · ${signal.source || "verified signal grid"}`,
            tag: `red-queen-${signal.id}`,
            data: { url: "/pulse#signal-watch" },
          });
        }
      } catch {
        // Monitoring is best-effort. Pulse remains the authoritative visible status.
      } finally {
        scanning = false;
      }
    }

    const start = () => {
      void scanWatches();
      window.clearInterval(timer);
      timer = window.setInterval(() => void scanWatches(), 180_000);
    };
    start();
    window.addEventListener(SIGNAL_WATCH_EVENT, start);
    document.addEventListener("visibilitychange", start);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener(SIGNAL_WATCH_EVENT, start);
      document.removeEventListener("visibilitychange", start);
    };
  }, []);

  function finishBoot() {
    sessionStorage.setItem("rq-app-booted-v2", "1");
    sessionStorage.setItem("rq-booted", "1");
    setShowBoot(false);
  }

  return showBoot ? <BootSequence onComplete={finishBoot} /> : null;
}
