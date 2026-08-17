import { fetchGDACS, fetchWithTimeout } from "@/lib/threats-fetchers";

export type SignalKind = "GEOLOGICAL" | "WILDFIRE" | "SPACE_WEATHER" | "CYBER" | "HEALTH" | "DISASTER";
export type SignalSourceId = "USGS" | "NASA_EONET" | "GDACS" | "NOAA_SWPC" | "CISA_KEV" | "WHO_DON";

export interface NormalizedSignal {
  id: string;
  name: string;
  kind: SignalKind;
  severity: number;
  location: string;
  region: string;
  observedAt: string;
  updatedAt?: string;
  sourceId: SignalSourceId;
  source: string;
  sourceUrl: string;
  fact: string;
  assessment: string;
  action: string;
  confidence: number;
  lat?: number;
  lng?: number;
  priorityScore: number;
  freshnessScore: number;
  freshness: "FRESH" | "CURRENT" | "AGING" | "STALE";
  ageHours: number;
}

export interface SignalSourceHealth {
  id: SignalSourceId;
  label: string;
  status: "ONLINE" | "NO_SIGNALS" | "OFFLINE";
  signalCount: number;
  checkedAt: string;
  latestObservedAt?: string;
}

export interface SignalGrid {
  generatedAt: string;
  signals: NormalizedSignal[];
  sourceHealth: SignalSourceHealth[];
  coverage: {
    online: number;
    total: number;
    signalCount: number;
  };
}

interface RawSignal extends Omit<NormalizedSignal, "priorityScore" | "freshnessScore" | "freshness" | "ageHours"> {}

interface SourceDefinition {
  id: SignalSourceId;
  label: string;
  fetcher: () => Promise<RawSignal[]>;
}

const SOURCE_LABELS: Record<SignalSourceId, string> = {
  USGS: "USGS",
  NASA_EONET: "NASA EONET",
  GDACS: "GDACS",
  NOAA_SWPC: "NOAA SWPC",
  CISA_KEV: "CISA KEV",
  WHO_DON: "WHO DON",
};

const FRESHNESS_WINDOWS_HOURS: Record<SignalKind, number> = {
  GEOLOGICAL: 24,
  WILDFIRE: 24 * 14,
  DISASTER: 24 * 7,
  SPACE_WEATHER: 48,
  CYBER: 24 * 14,
  HEALTH: 24 * 30,
};

const ACTIONS: Record<SignalKind, string> = {
  GEOLOGICAL: "Check official local guidance, identify a safe cover position, and keep shoes, light, water, and a charged power bank within reach.",
  WILDFIRE: "Check the local evacuation zone and air-quality index. Close outside-air intake, prepare an N95/FFP2 respirator, and keep a go-bag ready.",
  DISASTER: "Open the official event page, check local authority instructions, and confirm whether your area or route is affected before changing your plan.",
  SPACE_WEATHER: "Charge backup power, download essential information for offline access, and monitor official grid and communications advisories.",
  CYBER: "Check whether the affected product exists in your devices or organization, apply the vendor mitigation, revoke unused sessions, and never sign an unsolicited wallet transaction.",
  HEALTH: "Read the WHO notice and local public-health guidance. Do not self-diagnose or change treatment from a headline; prepare only measures justified for your area.",
};

const ASSESSMENTS: Record<SignalKind, string> = {
  GEOLOGICAL: "A verified seismic event is highly local. Distance, depth and official civil-protection guidance matter more than its global rank.",
  WILDFIRE: "Satellite tracking confirms an open natural event. Smoke, wind, road access and local evacuation orders determine personal relevance.",
  DISASTER: "GDACS establishes an official disaster signal. Alert level, distance and instructions from authorities determine whether action is justified.",
  SPACE_WEATHER: "An official space-weather notice is active. Direct physical risk is usually limited, while communications, navigation and power systems may require monitoring.",
  CYBER: "CISA has added this vulnerability to its known-exploited catalog. Exposure depends on whether the affected product is actually present.",
  HEALTH: "WHO published an acute public-health event notice. It is a global verified signal, not proof of personal exposure or complete local coverage.",
};

function stripHtml(value: unknown) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function excerpt(value: string, maxLength = 280) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).replace(/\s+\S*$/, "").trim()}…`;
}

function isoDate(value: unknown, fallback = new Date().toISOString()) {
  const date = new Date(value as string | number | Date);
  return Number.isFinite(date.getTime()) ? date.toISOString() : fallback;
}

function firstCoordinate(value: unknown): [number, number] | null {
  if (!Array.isArray(value)) return null;
  if (Number.isFinite(value[0]) && Number.isFinite(value[1])) return [Number(value[0]), Number(value[1])];
  for (const child of value) {
    const coordinate = firstCoordinate(child);
    if (coordinate) return coordinate;
  }
  return null;
}

function rankSignal(signal: RawSignal, now: number): NormalizedSignal {
  const observed = new Date(signal.observedAt).getTime();
  const ageHours = Number.isFinite(observed) ? Math.max(0, (now - observed) / 3_600_000) : FRESHNESS_WINDOWS_HOURS[signal.kind] * 2;
  const window = FRESHNESS_WINDOWS_HOURS[signal.kind];
  const freshnessScore = ageHours <= window * .25
    ? 100
    : ageHours <= window
      ? Math.round(100 - ((ageHours - window * .25) / (window * .75)) * 40)
      : ageHours <= window * 2
        ? Math.round(60 - ((ageHours - window) / window) * 40)
        : 10;
  const freshness = freshnessScore >= 85 ? "FRESH" : freshnessScore >= 60 ? "CURRENT" : freshnessScore >= 25 ? "AGING" : "STALE";
  const priorityScore = Math.min(100, Math.round(signal.severity * .55 + signal.confidence * .2 + freshnessScore * .25));
  return { ...signal, priorityScore, freshnessScore, freshness, ageHours: Math.round(ageHours * 10) / 10 };
}

async function fetchUSGS(): Promise<RawSignal[]> {
  const sourceUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson";
  const response = await fetchWithTimeout(sourceUrl);
  if (!response.ok) throw new Error(`USGS ${response.status}`);
  const data = await response.json();
  return (data.features || [])
    .filter((event: any) => Number(event?.properties?.mag) >= 4 && Array.isArray(event?.geometry?.coordinates))
    .sort((a: any, b: any) => Number(b.properties.mag) - Number(a.properties.mag))
    .slice(0, 12)
    .map((event: any) => {
      const magnitude = Number(event.properties.mag);
      const depth = Number(event.geometry.coordinates[2] || 0);
      const location = event.properties.place || "Location pending";
      return {
        id: `usgs-${event.id}`,
        name: `M${magnitude.toFixed(1)} earthquake near ${location}`,
        kind: "GEOLOGICAL" as const,
        severity: Math.min(92, Math.max(42, Math.round(magnitude * 12))),
        location,
        region: location,
        observedAt: isoDate(event.properties.time),
        updatedAt: isoDate(event.properties.updated || event.properties.time),
        sourceId: "USGS" as const,
        source: "USGS Earthquake Hazards Program",
        sourceUrl: event.properties.url || sourceUrl,
        fact: `Magnitude ${magnitude.toFixed(1)}; measured depth ${depth.toFixed(1)} km.`,
        assessment: ASSESSMENTS.GEOLOGICAL,
        action: ACTIONS.GEOLOGICAL,
        confidence: 98,
        lat: Number(event.geometry.coordinates[1]),
        lng: Number(event.geometry.coordinates[0]),
      };
    });
}

async function fetchNASA(): Promise<RawSignal[]> {
  const endpoint = "https://eonet.gsfc.nasa.gov/api/v3/events?limit=20&status=open";
  const response = await fetchWithTimeout(endpoint);
  if (!response.ok) throw new Error(`NASA EONET ${response.status}`);
  const data = await response.json();
  return (data.events || []).map((event: any): RawSignal | null => {
    const geometry = Array.isArray(event.geometry) ? event.geometry : Array.isArray(event.geometries) ? event.geometries : [];
    const latest = geometry.at(-1);
    const coordinate = firstCoordinate(latest?.coordinates);
    if (!coordinate) return null;
    const category = event.categories?.[0]?.title || "Natural event";
    const isFire = category.toLowerCase().includes("fire");
    const kind: SignalKind = isFire ? "WILDFIRE" : "DISASTER";
    return {
      id: `nasa-${event.id}`,
      name: event.title || `${category} detected`,
      kind,
      severity: isFire ? 62 : 55,
      location: event.title || "Satellite observation area",
      region: event.title || "Satellite observation area",
      observedAt: isoDate(latest?.date),
      updatedAt: isoDate(latest?.date),
      sourceId: "NASA_EONET",
      source: "NASA EONET",
      sourceUrl: event.sources?.[0]?.url || event.link || "https://eonet.gsfc.nasa.gov/",
      fact: `Open ${category.toLowerCase()} event tracked in NASA EONET.`,
      assessment: ASSESSMENTS[kind],
      action: ACTIONS[kind],
      confidence: 92,
      lng: coordinate[0],
      lat: coordinate[1],
    };
  }).filter((signal: RawSignal | null): signal is RawSignal => Boolean(signal));
}

async function fetchGDACSSignals(): Promise<RawSignal[]> {
  const alerts = await fetchGDACS({ throwOnError: true });
  return alerts.map((alert) => ({
    id: alert.id,
    name: alert.title,
    kind: (["EQ", "VO"].includes(alert.eventType.toUpperCase()) ? "GEOLOGICAL" : "DISASTER") as SignalKind,
    severity: alert.alertLevel === "Red" ? 92 : alert.alertLevel === "Orange" ? 72 : Math.max(35, Math.round(alert.alertScore * 20)),
    location: alert.country || "Global",
    region: alert.country || "Global",
    observedAt: isoDate(alert.pubDate),
    updatedAt: isoDate(alert.pubDate),
    sourceId: "GDACS" as const,
    source: "GDACS (EC JRC / UN)",
    sourceUrl: alert.link,
    fact: alert.desc || `${alert.eventTypeName} tracked by GDACS.`,
    assessment: ASSESSMENTS.DISASTER,
    action: ACTIONS.DISASTER,
    confidence: 96,
    lat: alert.lat,
    lng: alert.lng,
  }));
}

async function fetchNOAA(): Promise<RawSignal[]> {
  const sourceUrl = "https://services.swpc.noaa.gov/products/alerts.json";
  const response = await fetchWithTimeout(sourceUrl);
  if (!response.ok) throw new Error(`NOAA SWPC ${response.status}`);
  const data = await response.json();
  return (Array.isArray(data) ? data : [])
    .filter((alert: any) => /ALERT:|WARNING:|WATCH:/i.test(alert.message || ""))
    .slice(0, 4)
    .map((alert: any, index: number) => {
      const message = String(alert.message || "").replace(/\s+/g, " ").trim();
      const severe = /SEVERE|EXTREME|G4|G5|S4|S5|R4|R5/i.test(message);
      const observedAt = isoDate(alert.issue_datetime);
      return {
        id: `noaa-${alert.product_id || index}-${observedAt}`,
        name: excerpt(message, 100) || "Space-weather notice",
        kind: "SPACE_WEATHER" as const,
        severity: severe ? 78 : 54,
        location: "Global communications and power systems",
        region: "Global systems",
        observedAt,
        updatedAt: observedAt,
        sourceId: "NOAA_SWPC" as const,
        source: "NOAA Space Weather Prediction Center",
        sourceUrl,
        fact: excerpt(message, 240),
        assessment: ASSESSMENTS.SPACE_WEATHER,
        action: ACTIONS.SPACE_WEATHER,
        confidence: 97,
      };
    });
}

async function fetchCISA(): Promise<RawSignal[]> {
  const endpoint = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json";
  const response = await fetchWithTimeout(endpoint);
  if (!response.ok) throw new Error(`CISA KEV ${response.status}`);
  const data = await response.json();
  return (data.vulnerabilities || [])
    .slice()
    .sort((a: any, b: any) => String(b.dateAdded).localeCompare(String(a.dateAdded)))
    .slice(0, 4)
    .map((item: any) => ({
      id: `cisa-${item.cveID}`,
      name: `${item.cveID}: ${item.vulnerabilityName}`,
      kind: "CYBER" as const,
      severity: item.knownRansomwareCampaignUse === "Known" ? 76 : 68,
      location: "Internet-exposed systems",
      region: "Global digital exposure",
      observedAt: isoDate(item.dateAdded),
      updatedAt: isoDate(item.dateAdded),
      sourceId: "CISA_KEV" as const,
      source: "CISA Known Exploited Vulnerabilities",
      sourceUrl: `https://www.cisa.gov/known-exploited-vulnerabilities-catalog?search_api_fulltext=${encodeURIComponent(item.cveID)}`,
      fact: excerpt(`${item.vendorProject} ${item.product}: ${item.shortDescription}`),
      assessment: ASSESSMENTS.CYBER,
      action: excerpt(item.requiredAction || ACTIONS.CYBER),
      confidence: 99,
    }));
}

async function fetchWHO(): Promise<RawSignal[]> {
  const sourceUrl = "https://www.who.int/emergencies/disease-outbreak-news";
  const endpoint = "https://www.who.int/api/news/diseaseoutbreaknews?$top=4&$orderby=PublicationDate%20desc";
  const response = await fetchWithTimeout(endpoint);
  if (!response.ok) throw new Error(`WHO DON ${response.status}`);
  const data = await response.json();
  return (Array.isArray(data.value) ? data.value : []).slice(0, 4).map((item: any, index: number) => {
    const title = stripHtml(item.OverrideTitle || item.Title) || "WHO disease outbreak notice";
    const summary = stripHtml(item.Summary);
    const urgent = /intense transmission|rapidly|expanding|emergency|sustained transmission|increase in.+deaths/i.test(summary);
    const itemPath = typeof item.ItemDefaultUrl === "string" ? item.ItemDefaultUrl : "";
    let itemUrl = sourceUrl;
    try { if (itemPath) itemUrl = new URL(itemPath, "https://www.who.int").toString(); } catch {}
    return {
      id: `who-${item.DonId || item.Id || index}`,
      name: title,
      kind: "HEALTH" as const,
      severity: urgent ? 74 : 58,
      location: title.includes(" - ") ? title.split(" - ").at(-1) || "Global health watch" : "Global health watch",
      region: title.includes(" - ") ? title.split(" - ").at(-1) || "Global health watch" : "Global health watch",
      observedAt: isoDate(item.PublicationDate || item.LastModified),
      updatedAt: isoDate(item.LastModified || item.PublicationDate),
      sourceId: "WHO_DON" as const,
      source: "WHO Disease Outbreak News",
      sourceUrl: itemUrl,
      fact: excerpt(summary) || "WHO published a new acute public-health event notice.",
      assessment: ASSESSMENTS.HEALTH,
      action: ACTIONS.HEALTH,
      confidence: 99,
    };
  });
}

const SOURCES: SourceDefinition[] = [
  { id: "USGS", label: SOURCE_LABELS.USGS, fetcher: fetchUSGS },
  { id: "NASA_EONET", label: SOURCE_LABELS.NASA_EONET, fetcher: fetchNASA },
  { id: "GDACS", label: SOURCE_LABELS.GDACS, fetcher: fetchGDACSSignals },
  { id: "NOAA_SWPC", label: SOURCE_LABELS.NOAA_SWPC, fetcher: fetchNOAA },
  { id: "CISA_KEV", label: SOURCE_LABELS.CISA_KEV, fetcher: fetchCISA },
  { id: "WHO_DON", label: SOURCE_LABELS.WHO_DON, fetcher: fetchWHO },
];

export async function fetchSignalGrid(options: { sourceIds?: SignalSourceId[] } = {}): Promise<SignalGrid> {
  const generatedAt = new Date().toISOString();
  const now = new Date(generatedAt).getTime();
  const selectedSources = options.sourceIds?.length
    ? SOURCES.filter((source) => options.sourceIds!.includes(source.id))
    : SOURCES;
  const settled = await Promise.allSettled(selectedSources.map((source) => source.fetcher()));
  const signals: NormalizedSignal[] = [];
  const sourceHealth = settled.map((result, index): SignalSourceHealth => {
    const source = selectedSources[index];
    if (result.status === "rejected") {
      return { id: source.id, label: source.label, status: "OFFLINE", signalCount: 0, checkedAt: generatedAt };
    }
    const ranked = result.value.map((signal) => rankSignal(signal, now));
    signals.push(...ranked);
    const latestObservedAt = ranked
      .map((signal) => signal.observedAt)
      .sort((a, b) => b.localeCompare(a))[0];
    return {
      id: source.id,
      label: source.label,
      status: ranked.length ? "ONLINE" : "NO_SIGNALS",
      signalCount: ranked.length,
      checkedAt: generatedAt,
      latestObservedAt,
    };
  });
  signals.sort((a, b) => b.priorityScore - a.priorityScore || b.observedAt.localeCompare(a.observedAt));
  return {
    generatedAt,
    signals,
    sourceHealth,
    coverage: {
      online: sourceHealth.filter((source) => source.status !== "OFFLINE").length,
      total: sourceHealth.length,
      signalCount: signals.length,
    },
  };
}

export async function findVerifiedSignalById(signalId: string): Promise<NormalizedSignal | null> {
  const prefixToSource: Partial<Record<string, SourceDefinition>> = {
    usgs: SOURCES[0],
    nasa: SOURCES[1],
    gdacs: SOURCES[2],
  };
  const source = prefixToSource[signalId.split("-")[0]];
  if (!source) return null;
  try {
    const now = Date.now();
    const signals = (await source.fetcher()).map((signal) => rankSignal(signal, now));
    return signals.find((signal) => signal.id === signalId && signal.confidence >= 90) || null;
  } catch {
    return null;
  }
}
