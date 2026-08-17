import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { fetchWithTimeout } from "@/lib/threats-fetchers";

export const dynamic = "force-dynamic";

type SignalKind = "GEOLOGICAL" | "WILDFIRE" | "SPACE_WEATHER" | "CYBER";

interface SourceSignal {
  id: string;
  name: string;
  kind: SignalKind;
  severity: number;
  location: string;
  observedAt: string;
  source: string;
  sourceUrl: string;
  fact: string;
  confidence: number;
}

const ACTIONS: Record<SignalKind, string> = {
  GEOLOGICAL:
    "Check official local guidance, identify a safe cover position, and keep shoes, light, water, and a charged power bank within reach.",
  WILDFIRE:
    "Check the local evacuation zone and air-quality index. Close outside-air intake, prepare an N95/FFP2 respirator, and keep a go-bag ready.",
  SPACE_WEATHER:
    "Charge backup power, download essential information for offline access, and monitor official grid and communications advisories.",
  CYBER:
    "Update exposed software, revoke unused sessions, verify wallet approvals, and never sign a transaction prompted by an unsolicited alert.",
};

const ASSESSMENTS: Record<SignalKind, string> = {
  GEOLOGICAL:
    "A verified seismic event is the strongest current signal. Impact is highly local, so proximity and official civil-protection guidance matter more than the global score.",
  WILDFIRE:
    "Satellite monitoring confirms an active natural hazard. Smoke direction, wind, road access, and local evacuation orders determine personal relevance.",
  SPACE_WEATHER:
    "An official space-weather notice is active. Most people face low direct physical risk, but communications, navigation, and power systems may require monitoring.",
  CYBER:
    "A vulnerability has been added to the official exploited-vulnerabilities catalog. Exposure depends on whether the affected product exists in your devices or organization.",
};

function statusFor(severity: number) {
  if (severity >= 85) return "CRITICAL";
  if (severity >= 70) return "HIGH";
  if (severity >= 50) return "ELEVATED";
  return "MONITOR";
}

function formatDate(value: string | number | Date) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}

async function fetchUSGS(): Promise<SourceSignal[]> {
  try {
    const sourceUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson";
    const res = await fetchWithTimeout(sourceUrl);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.features || [])
      .filter((event: any) => Number(event?.properties?.mag) >= 4)
      .slice(0, 5)
      .map((event: any) => {
        const magnitude = Number(event.properties.mag);
        const depth = Number(event.geometry?.coordinates?.[2] || 0);
        return {
          id: `usgs-${event.id}`,
          name: `M${magnitude.toFixed(1)} earthquake near ${event.properties.place || "an unconfirmed region"}`,
          kind: "GEOLOGICAL" as const,
          severity: Math.min(92, Math.max(42, Math.round(magnitude * 12))),
          location: event.properties.place || "Location pending",
          observedAt: formatDate(event.properties.time),
          source: "USGS Earthquake Hazards Program",
          sourceUrl: event.properties.url || sourceUrl,
          fact: `Magnitude ${magnitude.toFixed(1)}; measured depth ${depth.toFixed(1)} km.`,
          confidence: 98,
        };
      });
  } catch {
    return [];
  }
}

async function fetchNASA(): Promise<SourceSignal[]> {
  try {
    const sourceUrl = "https://eonet.gsfc.nasa.gov/api/v3/events?limit=10&status=open";
    const res = await fetchWithTimeout(sourceUrl);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.events || []).slice(0, 5).map((event: any) => {
      const category = event.categories?.[0]?.title || "Natural event";
      const isFire = category.toLowerCase().includes("fire");
      const latestGeometry = event.geometry?.at?.(-1);
      return {
        id: `nasa-${event.id}`,
        name: event.title || `${category} detected`,
        kind: (isFire ? "WILDFIRE" : "GEOLOGICAL") as SignalKind,
        severity: isFire ? 62 : 55,
        location: event.title || "Satellite observation area",
        observedAt: formatDate(latestGeometry?.date || new Date()),
        source: "NASA EONET",
        sourceUrl: event.link || sourceUrl,
        fact: `Open ${category.toLowerCase()} event tracked by NASA Earth Observatory data.`,
        confidence: 92,
      };
    });
  } catch {
    return [];
  }
}

async function fetchNOAA(): Promise<SourceSignal[]> {
  try {
    const sourceUrl = "https://services.swpc.noaa.gov/products/alerts.json";
    const res = await fetchWithTimeout(sourceUrl);
    if (!res.ok) return [];
    const data = await res.json();
    return (Array.isArray(data) ? data : [])
      .filter((alert: any) => /ALERT:|WARNING:|WATCH:/i.test(alert.message || ""))
      .slice(0, 4)
      .map((alert: any, index: number) => {
        const message = String(alert.message || "").replace(/\s+/g, " ").trim();
        const severe = /SEVERE|EXTREME|G4|G5|S4|S5|R4|R5/i.test(message);
        return {
          id: `noaa-${alert.product_id || index}-${alert.issue_datetime || index}`,
          name: message.split("\n")[0].slice(0, 100) || "Space-weather notice",
          kind: "SPACE_WEATHER" as const,
          severity: severe ? 78 : 54,
          location: "Global communications and power systems",
          observedAt: formatDate(alert.issue_datetime || new Date()),
          source: "NOAA Space Weather Prediction Center",
          sourceUrl,
          fact: message.slice(0, 220),
          confidence: 97,
        };
      });
  } catch {
    return [];
  }
}

async function fetchCISA(): Promise<SourceSignal[]> {
  try {
    const sourceUrl = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json";
    const res = await fetchWithTimeout(sourceUrl);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.vulnerabilities || [])
      .slice()
      .sort((a: any, b: any) => String(b.dateAdded).localeCompare(String(a.dateAdded)))
      .slice(0, 3)
      .map((item: any) => ({
        id: `cisa-${item.cveID}`,
        name: `${item.cveID}: ${item.vulnerabilityName}`,
        kind: "CYBER" as const,
        severity: 68,
        location: "Internet-exposed systems",
        observedAt: formatDate(item.dateAdded),
        source: "CISA Known Exploited Vulnerabilities",
        sourceUrl: `https://www.cisa.gov/known-exploited-vulnerabilities-catalog?search_api_fulltext=${encodeURIComponent(item.cveID)}`,
        fact: `${item.vendorProject} ${item.product}: ${item.shortDescription}`,
        confidence: 99,
      }));
  } catch {
    return [];
  }
}

function sensorLimitedPayload() {
  const generatedAt = new Date().toISOString();
  return {
    schemaVersion: 2,
    codename: "RQ-SENSORS",
    name: "Live intelligence is temporarily limited",
    description:
      "RED QUEEN cannot verify enough current source data to issue a reliable daily assessment. No fictional event has been substituted.",
    assessment:
      "Sensor availability is not evidence of danger or safety. Use official local alerts while the intelligence grid reconnects.",
    countermeasure: "Check local emergency alerts and try the live scan again shortly.",
    severity: 0,
    status: "SENSORS LIMITED",
    location: "Global sensor grid",
    publishDate: generatedAt,
    generatedAt,
    source: "RED QUEEN sensor status",
    sourceUrl: "",
    confidence: 0,
    verified: false,
    isFallback: true,
    signalCount: 0,
  };
}

export async function POST() {
  const today = new Date().toISOString().split("T")[0];

  if (supabase) {
    try {
      const { data: cached, error } = await supabase
        .from("daily_threats")
        .select("payload")
        .eq("date", today)
        .single();
      if (!error && cached?.payload?.schemaVersion === 2) {
        return NextResponse.json(cached.payload);
      }
    } catch (error) {
      console.warn("Daily intelligence cache unavailable:", error);
    }
  }

  const settled = await Promise.allSettled([fetchUSGS(), fetchNASA(), fetchNOAA(), fetchCISA()]);
  const signals = settled.flatMap((result) => (result.status === "fulfilled" ? result.value : []));

  if (signals.length === 0) {
    return NextResponse.json(sensorLimitedPayload());
  }

  const primary = [...signals].sort((a, b) => {
    if (b.severity !== a.severity) return b.severity - a.severity;
    return new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime();
  })[0];
  const generatedAt = new Date().toISOString();
  const payload = {
    schemaVersion: 2,
    codename: primary.id.toUpperCase().slice(0, 28),
    name: primary.name,
    description: primary.fact,
    assessment: ASSESSMENTS[primary.kind],
    countermeasure: ACTIONS[primary.kind],
    severity: primary.severity,
    status: statusFor(primary.severity),
    location: primary.location,
    publishDate: primary.observedAt,
    generatedAt,
    source: primary.source,
    sourceUrl: primary.sourceUrl,
    confidence: primary.confidence,
    verified: true,
    isFallback: false,
    signalCount: signals.length,
  };

  if (supabase) {
    try {
      await supabase.from("daily_threats").upsert({ date: today, payload }, { onConflict: "date" });
    } catch (error) {
      console.warn("Failed to cache daily intelligence:", error);
    }
  }

  return NextResponse.json(payload);
}
