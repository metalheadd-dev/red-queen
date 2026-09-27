import type { ThreatGraph } from "./threat-graph";

export const THREAT_CASEBOOK_KEY = "rq-threat-cases-v1";
const MAX_CASES = 6;

export interface SavedThreatCase {
  id: string;
  name: string;
  sourceUrl: string;
  observedAt: string;
  updatedAt: string;
  eventLabel: string;
  savedAt: string;
}

export type CaseChange = "UPDATED" | "UNCHANGED" | "STALE" | "NOT_IN_FEED";

function validUrl(value: unknown) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch { return false; }
}

export function parseThreatCases(value: string | null): SavedThreatCase[] {
  try {
    const parsed = JSON.parse(value || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (!item || typeof item !== "object" || !/^(usgs|nasa|gdacs|noaa|cisa|who|solana-status)-[A-Za-z0-9._:%-]{1,220}$/.test(item.id)
        || typeof item.name !== "string" || !validUrl(item.sourceUrl)
        || typeof item.observedAt !== "string" || !Number.isFinite(Date.parse(item.observedAt))
        || typeof item.updatedAt !== "string" || !Number.isFinite(Date.parse(item.updatedAt))
        || typeof item.eventLabel !== "string" || typeof item.savedAt !== "string") return [];
      return [{ id: item.id, name: item.name.slice(0, 180), sourceUrl: item.sourceUrl, observedAt: item.observedAt,
        updatedAt: item.updatedAt, eventLabel: item.eventLabel.slice(0, 360), savedAt: item.savedAt }];
    }).slice(0, MAX_CASES);
  } catch { return []; }
}

export function saveThreatCase(existing: SavedThreatCase[], graph: ThreatGraph, now = new Date()): SavedThreatCase[] {
  const eventLabel = graph.nodes.find((node) => node.stage === "EVENT")?.label || graph.name;
  const entry: SavedThreatCase = {
    id: graph.signalId, name: graph.name, sourceUrl: graph.sourceUrl,
    observedAt: graph.observedAt, updatedAt: graph.updatedAt, eventLabel,
    savedAt: now.toISOString(),
  };
  return [entry, ...existing.filter((item) => item.id !== entry.id)].slice(0, MAX_CASES);
}

export function caseChange(saved: SavedThreatCase, current: ThreatGraph | undefined): CaseChange {
  if (!current) return "NOT_IN_FEED";
  if (current.status !== "CURRENT") return "STALE";
  const eventLabel = current.nodes.find((node) => node.stage === "EVENT")?.label || current.name;
  return Date.parse(current.updatedAt) > Date.parse(saved.updatedAt) || eventLabel !== saved.eventLabel ? "UPDATED" : "UNCHANGED";
}
