import { fetchGDACS } from "@/lib/threats-fetchers";

export interface VerifiedMapSignal {
  id: string;
  name: string;
  severity: number;
  region: string;
  description: string;
  assessment: string;
  countermeasure: string;
  source: string;
  sourceUrl: string;
  observedAt?: string;
}

async function fetchUsgsSignal(signalId: string): Promise<VerifiedMapSignal | null> {
  try {
    const response = await fetch(
      "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson",
      { next: { revalidate: 300 } },
    );
    if (!response.ok) return null;
    const data = await response.json();
    const event = (data.features || []).find((candidate: any) => `usgs-${candidate.id}` === signalId);
    if (!event?.properties || !Array.isArray(event.geometry?.coordinates)) return null;
    const magnitude = event.properties.mag;
    return {
      id: signalId,
      name: `M ${magnitude} Earthquake`,
      severity: Math.min(100, Math.round(magnitude * 15)),
      region: event.properties.place || "Unknown coastline",
      description: `USGS: Seismic event registered at depth of ${event.geometry.coordinates[2]}km.`,
      assessment: "Distance, depth and local instructions determine whether this event changes the user's plan.",
      countermeasure: "Verify building integrity, stay clear of unstable structures, and follow local authority guidance.",
      source: "USGS",
      sourceUrl: event.properties.url || "https://earthquake.usgs.gov/earthquakes/map/",
      observedAt: event.properties.time ? new Date(event.properties.time).toISOString() : undefined,
    };
  } catch {
    return null;
  }
}

async function fetchNasaSignal(signalId: string): Promise<VerifiedMapSignal | null> {
  try {
    const response = await fetch(
      "https://eonet.gsfc.nasa.gov/api/v3/events?limit=20&status=open",
      { next: { revalidate: 600 } },
    );
    if (!response.ok) return null;
    const data = await response.json();
    const event = (data.events || []).find((candidate: any) => `nasa-${candidate.id}` === signalId);
    if (!event) return null;
    const geometry = Array.isArray(event.geometry) ? event.geometry : Array.isArray(event.geometries) ? event.geometries : [];
    const latest = geometry.at(-1);
    const category = event.categories?.[0]?.title || "Natural Hazard";
    return {
      id: signalId,
      name: `${category} Detected`,
      severity: 82,
      region: event.title || "Active hazard coordinate",
      description: `NASA EONET: Remote sensing satellites flag an active ${category.toLowerCase()} event.`,
      assessment: "Satellite event tracking establishes a source-backed signal, but local impact still requires regional confirmation.",
      countermeasure: "Open the source event and verify current local authority guidance before acting.",
      source: "NASA EONET",
      sourceUrl: event.sources?.[0]?.url || "https://eonet.gsfc.nasa.gov/",
      observedAt: latest?.date,
    };
  } catch {
    return null;
  }
}

async function fetchGdacsSignal(signalId: string): Promise<VerifiedMapSignal | null> {
  try {
    const alert = (await fetchGDACS()).find((candidate) => candidate.id === signalId);
    if (!alert) return null;
    return {
      id: signalId,
      name: alert.title,
      severity: alert.alertLevel === "Red" ? 92 : alert.alertLevel === "Orange" ? 72 : Math.max(35, Math.round(alert.alertScore * 20)),
      region: alert.country || "Global",
      description: alert.desc || `${alert.eventTypeName} tracked by GDACS.`,
      assessment: "GDACS provides event-level disaster monitoring. Personal relevance depends on distance, alert level and local instructions.",
      countermeasure: "Review the GDACS event page and follow official instructions from authorities in the affected area.",
      source: "GDACS (EC JRC / UN)",
      sourceUrl: alert.link,
      observedAt: alert.pubDate,
    };
  } catch {
    return null;
  }
}

export async function findVerifiedLiveMapSignal(signalId: string): Promise<VerifiedMapSignal | null> {
  if (signalId.startsWith("usgs-")) return fetchUsgsSignal(signalId);
  if (signalId.startsWith("nasa-")) return fetchNasaSignal(signalId);
  if (signalId.startsWith("gdacs-")) return fetchGdacsSignal(signalId);
  return null;
}
