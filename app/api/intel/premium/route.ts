import { NextRequest, NextResponse } from "next/server";
import { withFriendlyX402 } from "@/lib/x402";

const svmAddress = process.env.SVM_ADDRESS || "";
const network = (process.env.SVM_NETWORK || "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp") as any;

const USGS_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson";
const NASA_URL = "https://eonet.gsfc.nasa.gov/api/v3/events?limit=12&status=open";

const handler = async (_req: NextRequest) => {
  try {
    const [usgsRes, nasaRes] = await Promise.all([
      fetch(USGS_URL, { next: { revalidate: 60 } }),
      fetch(NASA_URL, { next: { revalidate: 120 } }).catch(() => null),
    ]);

    if (!usgsRes.ok) throw new Error(`USGS returned ${usgsRes.status}`);

    const usgsData = await usgsRes.json();
    const features = Array.isArray(usgsData.features) ? usgsData.features : [];
    const sortedFeatures = [...features].sort(
      (a: any, b: any) => Number(b.properties?.mag || 0) - Number(a.properties?.mag || 0),
    );

    const threatVectors = sortedFeatures.slice(0, 8).map((feature: any) => {
      const magnitude = Number(feature.properties?.mag || 0);
      const coordinates = feature.geometry?.coordinates || [];
      return {
        id: `usgs-${feature.id}`,
        magnitude,
        rating: `M ${magnitude.toFixed(1)}`,
        status: magnitude >= 6 ? "RED" : magnitude >= 4.5 ? "YELLOW" : "GREEN",
        description: feature.properties?.place || "USGS earthquake event",
        depthKm: Number(coordinates[2] || 0).toFixed(1),
        latitude: Number(coordinates[1] || 0).toFixed(4),
        longitude: Number(coordinates[0] || 0).toFixed(4),
        observedAt: feature.properties?.time
          ? new Date(feature.properties.time).toISOString()
          : null,
        sourceUrl: feature.properties?.url || "https://earthquake.usgs.gov/earthquakes/map/",
      };
    });

    const nasaAvailable = Boolean(nasaRes?.ok);
    const nasaData = nasaAvailable
      ? await nasaRes!.json().catch(() => ({ events: [] }))
      : { events: [] };
    const nasaEvents = (Array.isArray(nasaData.events) ? nasaData.events : []).map((event: any) => {
      const geometry = event.geometry?.[0];
      const coordinates = Array.isArray(geometry?.coordinates) ? geometry.coordinates : [];
      return {
        id: event.id,
        title: event.title,
        category: event.categories?.[0]?.title || "Natural event",
        date: geometry?.date || null,
        longitude: Number(coordinates[0] || 0),
        latitude: Number(coordinates[1] || 0),
        source: event.sources?.[0]?.id || "NASA EONET",
        sourceUrl: event.sources?.[0]?.url || `https://eonet.gsfc.nasa.gov/api/v3/events/${event.id}`,
      };
    });

    const strongest = threatVectors[0] || null;
    const highAttentionQuakes = threatVectors.filter((event: any) => event.magnitude >= 4.5);
    const liveSources = nasaAvailable ? 2 : 1;
    const totalSignals = features.length + nasaEvents.length;
    const prioritySignal = highAttentionQuakes[0]
      ? `${highAttentionQuakes[0].rating} earthquake near ${highAttentionQuakes[0].description}`
      : nasaEvents[0]
        ? `${nasaEvents[0].category}: ${nasaEvents[0].title}`
        : "No high-attention signal was identified in this source window.";

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      clearance: "PAID OUTPUT // x402 SETTLED",
      intel: {
        headline: `${totalSignals} source events reviewed. ${highAttentionQuakes.length} seismic signals need closer attention.`,
        summary: `RED QUEEN compared the latest one-hour USGS earthquake feed with NASA EONET open events. ${prioritySignal}`,
        sourceCoverage: {
          liveSources,
          totalSources: 2,
          label: `${liveSources}/2 SOURCES LIVE`,
          partial: liveSources < 2,
        },
        sourceStatus: [
          {
            id: "usgs",
            name: "USGS Earthquake Hazards Program",
            status: "LIVE",
            eventCount: features.length,
            window: "PAST HOUR",
            url: "https://earthquake.usgs.gov/earthquakes/map/",
          },
          {
            id: "nasa-eonet",
            name: "NASA EONET",
            status: nasaAvailable ? "LIVE" : "UNAVAILABLE",
            eventCount: nasaEvents.length,
            window: "OPEN EVENTS",
            url: "https://eonet.gsfc.nasa.gov/",
          },
        ],
        prioritySignal,
        maxEvent: strongest ? {
          magnitude: strongest.magnitude.toFixed(1),
          location: strongest.description,
          depthKm: strongest.depthKm,
          latitude: strongest.latitude,
          longitude: strongest.longitude,
          observedAt: strongest.observedAt,
          sourceUrl: strongest.sourceUrl,
        } : null,
        threatVectors,
        nasaEvents,
        nextAction: "Open the live map, compare the priority signal with your broad area, and change a preparedness plan only if distance and official local guidance make it relevant.",
      },
    });
  } catch (error) {
    console.error("Global source synthesis failed:", error);
    return NextResponse.json({
      success: false,
      error: "Required USGS source data is temporarily unavailable. No paid synthesis was generated.",
      sourceStatus: "UNAVAILABLE",
      syntheticData: false,
    }, { status: 503 });
  }
};

export const GET = withFriendlyX402(
  handler,
  {
    productId: "global-source-synthesis",
    accepts: {
      scheme: "exact",
      price: "$0.01",
      network,
      payTo: svmAddress,
    },
    description: "Source-backed synthesis of current USGS and NASA EONET signals.",
  },
);
