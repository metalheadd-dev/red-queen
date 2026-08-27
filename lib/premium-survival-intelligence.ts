import "server-only";

import { sanitizeArea, SurvivalFocus } from "@/lib/survival-context";

export const PREMIUM_AREA_PRICE = "$0.05";
export const PREMIUM_AREA_PRICE_LABEL = "0.05 USDC";

export type PremiumAreaInput = {
  area: string;
  lat: number;
  lng: number;
  radiusKm: number;
  focus: SurvivalFocus;
};

export type ProcurementProvider = {
  id: "OFF_NADIR_DELTA" | "OPENWEATHER_ONE_CALL";
  name: string;
  configured: boolean;
  required: boolean;
  purchaseModel: string;
  estimatedUnits: string;
  dataShared: string[];
};

export type PremiumSignal = {
  id: string;
  title: string;
  summary: string;
  category: string;
  location: string;
  severity: number;
  sourceUrl?: string;
  observedAt?: string;
  escalation?: string;
  satelliteObservability?: string;
  informationGain?: number;
};

export type WeatherEvidence = {
  headline: string;
  description: string;
  severity: "WATCH" | "WARNING" | "CONDITIONS";
  startsAt?: string;
  endsAt?: string;
  source: string;
};

export type ProcurementRecord = {
  provider: string;
  status: "PURCHASED" | "OPTIONAL_NOT_CONFIGURED" | "FAILED";
  meteredUnits: string;
  recordsReceived: number;
  dataShared: string[];
  purchasedAt: string;
  error?: string;
};

const VALID_FOCUS: SurvivalFocus[] = ["LOCAL_THREATS", "BLACKOUT", "HOUSEHOLD", "DIGITAL_SECURITY", "HEALTH"];

function finiteCoordinate(value: unknown, min: number, max: number) {
  const coordinate = Number(value);
  return Number.isFinite(coordinate) && coordinate >= min && coordinate <= max ? coordinate : null;
}

export function parsePremiumAreaInput(value: unknown): PremiumAreaInput | null {
  if (!value || typeof value !== "object") return null;
  const body = value as Record<string, unknown>;
  const area = sanitizeArea(typeof body.area === "string" ? body.area : "");
  const lat = finiteCoordinate(body.lat, -90, 90);
  const lng = finiteCoordinate(body.lng, -180, 180);
  const rawRadius = Number(body.radiusKm);
  const radiusKm = Number.isFinite(rawRadius) ? Math.min(1_000, Math.max(25, Math.round(rawRadius))) : 250;
  const focus = typeof body.focus === "string" && VALID_FOCUS.includes(body.focus as SurvivalFocus)
    ? body.focus as SurvivalFocus
    : "LOCAL_THREATS";
  if (area.length < 2 || lat === null || lng === null) return null;
  return { area, lat, lng, radiusKm, focus };
}

export function premiumProviderQuote() {
  const providers: ProcurementProvider[] = [
    {
      id: "OFF_NADIR_DELTA",
      name: "Off-Nadir Delta",
      configured: Boolean(process.env.OFF_NADIR_API_KEY?.trim()),
      required: true,
      purchaseModel: "Metered provider token balance",
      estimatedUnits: "3 provider tokens · one signals page",
      dataShared: ["broad-area bounding box", "3-day observation window"],
    },
    {
      id: "OPENWEATHER_ONE_CALL",
      name: "OpenWeather One Call 3.0",
      configured: Boolean(process.env.OPENWEATHER_API_KEY?.trim()),
      required: false,
      purchaseModel: "Usage-metered API call",
      estimatedUnits: "1 provider API call",
      dataShared: ["approximate city coordinates", "metric units"],
    },
  ];
  const requiredReady = providers.filter((provider) => provider.required).every((provider) => provider.configured);
  return {
    eligible: requiredReady,
    userPrice: PREMIUM_AREA_PRICE_LABEL,
    settlement: "x402 exact USDC on Solana",
    providers,
    dataBoundary: "Off-Nadir receives only a broad-area bounding box and a 3-day window. OpenWeather, when enabled, receives approximate city coordinates. No exact address, profile, wallet balance or readiness history is shared.",
  };
}

function boundingBox(lat: number, lng: number, radiusKm: number) {
  const latDelta = radiusKm / 111.32;
  const cos = Math.max(0.15, Math.cos((lat * Math.PI) / 180));
  const lngDelta = radiusKm / (111.32 * cos);
  return [
    Math.max(-180, lng - lngDelta),
    Math.max(-90, lat - latDelta),
    Math.min(180, lng + lngDelta),
    Math.min(90, lat + latDelta),
  ].map((coordinate) => coordinate.toFixed(5)).join(",");
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : fallback;
}

function number(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function purchaseOffNadir(input: PremiumAreaInput) {
  const key = process.env.OFF_NADIR_API_KEY?.trim();
  if (!key) throw new Error("Off-Nadir Delta is not configured.");
  const baseUrl = process.env.OFF_NADIR_BASE_URL?.trim() || "https://offnadir-delta.com/api/v1";
  const endpoint = new URL(`${baseUrl.replace(/\/$/, "")}/signals`);
  endpoint.searchParams.set("bbox", boundingBox(input.lat, input.lng, input.radiusKm));
  endpoint.searchParams.set("days", "3");
  endpoint.searchParams.set("limit", "50");
  endpoint.searchParams.set("min_severity", "4");
  endpoint.searchParams.set("sort", "geoint");

  const response = await fetch(endpoint, {
    headers: { Accept: "application/json", Authorization: `Bearer ${key}` },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Off-Nadir Delta returned ${response.status}.`);
  const payload = await response.json() as Record<string, any>;
  const signals = (Array.isArray(payload.signals) ? payload.signals : []).slice(0, 25).map((signal: Record<string, any>): PremiumSignal => ({
    id: String(signal.id || signal.global_event_id || crypto.randomUUID()),
    title: text(signal.title, "Premium area signal"),
    summary: text(signal.summary || signal.event_summary || signal.description, "Provider summary unavailable."),
    category: text(signal.category || signal.event_type, "area-intelligence"),
    location: text(signal.location, input.area),
    severity: number(signal.severity_score ?? signal.severity, 0),
    sourceUrl: text(signal.source_url) || undefined,
    observedAt: text(signal.event_date || signal.observed_at || signal.last_updated_at) || undefined,
    escalation: text(signal.escalation_trend) || undefined,
    satelliteObservability: text(signal.intelligence?.satellite_observability) || undefined,
    informationGain: Number.isFinite(Number(signal.intelligence?.expected_information_gain)) ? Number(signal.intelligence.expected_information_gain) : undefined,
  }));
  const charged = number(payload.meta?.tokens?.charged, 3);
  return { signals, charged };
}

async function purchaseOpenWeather(input: PremiumAreaInput) {
  const key = process.env.OPENWEATHER_API_KEY?.trim();
  if (!key) return null;
  const endpoint = new URL("https://api.openweathermap.org/data/3.0/onecall");
  endpoint.searchParams.set("lat", String(input.lat));
  endpoint.searchParams.set("lon", String(input.lng));
  endpoint.searchParams.set("exclude", "minutely");
  endpoint.searchParams.set("units", "metric");
  endpoint.searchParams.set("appid", key);
  const response = await fetch(endpoint, { cache: "no-store", signal: AbortSignal.timeout(12_000) });
  if (!response.ok) throw new Error(`OpenWeather returned ${response.status}.`);
  const payload = await response.json() as Record<string, any>;
  const alerts = (Array.isArray(payload.alerts) ? payload.alerts : []).slice(0, 10).map((alert: Record<string, any>): WeatherEvidence => ({
    headline: text(alert.event, "Official weather alert"),
    description: text(alert.description, "Open the provider alert for details.").slice(0, 700),
    severity: "WARNING",
    startsAt: Number.isFinite(Number(alert.start)) ? new Date(Number(alert.start) * 1_000).toISOString() : undefined,
    endsAt: Number.isFinite(Number(alert.end)) ? new Date(Number(alert.end) * 1_000).toISOString() : undefined,
    source: text(alert.sender_name, "OpenWeather alert provider"),
  }));
  if (!alerts.length && payload.current) {
    const current = payload.current as Record<string, any>;
    alerts.push({
      headline: text(current.weather?.[0]?.description, "Current weather conditions"),
      description: `Temperature ${number(current.temp).toFixed(1)}°C · wind ${number(current.wind_speed).toFixed(1)} m/s · visibility ${Math.round(number(current.visibility) / 1_000)} km.`,
      severity: "CONDITIONS",
      source: "OpenWeather One Call 3.0",
    });
  }
  return { evidence: alerts };
}

function nextAction(signals: PremiumSignal[], weather: WeatherEvidence[]) {
  const top = [...signals].sort((a, b) => b.severity - a.severity)[0];
  if (weather.some((item) => item.severity === "WARNING")) return "Open the highest-priority weather alert, verify it against your local authority, and update your 72-hour plan before changing travel or evacuation decisions.";
  if (top?.category.includes("infrastructure")) return "Verify the affected service and local authority notice, then protect power, water and communications continuity for the next 72 hours.";
  if (top) return `Review the primary source behind “${top.title}”, confirm whether your specific area is affected, and save one justified action in Prepare.`;
  return "No premium provider record crossed the selected filter. Keep official local alerts enabled and reassess if conditions change.";
}

export async function procurePremiumArea(input: PremiumAreaInput) {
  const purchasedAt = new Date().toISOString();
  const procurement: ProcurementRecord[] = [];
  const offNadir = await purchaseOffNadir(input);
  procurement.push({
    provider: "Off-Nadir Delta",
    status: "PURCHASED",
    meteredUnits: `${offNadir.charged} provider tokens`,
    recordsReceived: offNadir.signals.length,
    dataShared: ["broad-area bounding box", "3-day window"],
    purchasedAt,
  });

  let weather: WeatherEvidence[] = [];
  try {
    const openWeather = await purchaseOpenWeather(input);
    if (openWeather) {
      weather = openWeather.evidence;
      procurement.push({
        provider: "OpenWeather One Call 3.0",
        status: "PURCHASED",
        meteredUnits: "1 provider API call",
        recordsReceived: weather.length,
        dataShared: ["approximate city coordinates", "metric units"],
        purchasedAt,
      });
    } else {
      procurement.push({ provider: "OpenWeather One Call 3.0", status: "OPTIONAL_NOT_CONFIGURED", meteredUnits: "0 calls", recordsReceived: 0, dataShared: [], purchasedAt });
    }
  } catch (error) {
    procurement.push({
      provider: "OpenWeather One Call 3.0",
      status: "FAILED",
      meteredUnits: "provider did not confirm a successful call",
      recordsReceived: 0,
      dataShared: ["approximate city coordinates", "metric units"],
      purchasedAt,
      error: error instanceof Error ? error.message : "Provider unavailable",
    });
  }

  const sortedSignals = [...offNadir.signals].sort((a, b) => b.severity - a.severity);
  return {
    report: {
      title: `Premium area intelligence · ${input.area}`,
      area: input.area,
      radiusKm: input.radiusKm,
      focus: input.focus,
      generatedAt: purchasedAt,
      headline: sortedSignals.length
        ? `${sortedSignals.length} purchased intelligence records were compared for ${input.area}.`
        : `No purchased record crossed the selected threshold for ${input.area}.`,
      assessment: sortedSignals[0]?.summary || weather[0]?.description || "Premium providers returned no matching event record. This is not proof of safety.",
      nextAction: nextAction(sortedSignals, weather),
      signals: sortedSignals.slice(0, 12),
      weather,
      uncertainty: "Premium data adds coverage, not certainty. Verify urgent decisions with local authorities and the linked primary source. RED QUEEN does not infer personal exposure from an area-level signal.",
    },
    procurementReceipt: {
      userPrice: PREMIUM_AREA_PRICE_LABEL,
      settlementAsset: "USDC on Solana",
      upstreamPurchases: procurement,
      dataBoundary: "Broad-area context only. No exact address, user profile, wallet holdings or preparedness history was disclosed to upstream providers.",
      purchasedAt,
    },
  };
}
