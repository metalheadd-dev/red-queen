import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface ThreatNode {
  id: string;
  name: string;
  type: "KINETIC" | "ANOMALY" | "DEGENERACY" | "ALGORITHMIC" | "GEOLOGICAL" | "BIOLOGICAL" | "METEOROLOGICAL";
  severity: number;
  lat: number;
  lng: number;
  coords: { x: number; y: number };
  region: string;
  desc: string;
  solution: string;
  analysis: string;
}

// Geographic to SVG coordinates (width 800, height 400)
function geoToSvg(lat: number, lng: number): { x: number; y: number } {
  const width = 800;
  const height = 400;
  // Equirectangular projection
  const x = Math.round(((lng + 180) * width) / 360);
  const y = Math.round(((90 - lat) * height) / 180);
  return { x, y };
}

export async function GET() {
  const nodes: ThreatNode[] = [];

  // Default fallback data in case external APIs fail or are offline
  const fallbackNodes: ThreatNode[] = [
    {
      id: "usgs-eq-1",
      name: "M 5.8 Seismic Activity",
      type: "GEOLOGICAL",
      severity: 78,
      lat: 35.6762,
      lng: 139.6503,
      coords: geoToSvg(35.6762, 139.6503),
      region: "Kanto, Japan",
      desc: "USGS: Tectonic pressure slip registered in Tokyo Trench. Minor structural damage reported.",
      solution: "Activate structural dampers, stay clear of coastlines.",
      analysis: "RED QUEEN: Kinetic tremors disrupt local connectivity. Anticipate regional fiber-optic delays. Secure secondary satcom routes."
    },
    {
      id: "nasa-fire-1",
      name: "Wildfire Active Burn Loop",
      type: "METEOROLOGICAL",
      severity: 85,
      lat: -33.8688,
      lng: 151.2093,
      coords: geoToSvg(-33.8688, 151.2093),
      region: "New South Wales, Australia",
      desc: "NASA EONET: Thermal scanning identifies active biomass burning covering 1,200 hectares.",
      solution: "Evacuate high-density smoke paths, seal HEPA filters.",
      analysis: "RED QUEEN: Smoke density compromises local electrical grid insulation. Switch sensitive server nodes to battery/generator reserve loops."
    },
    {
      id: "covid-con-1",
      name: "Influenza H5N1 Contagion Spikes",
      type: "BIOLOGICAL",
      severity: 92,
      lat: 40.7128,
      lng: -74.0060,
      coords: geoToSvg(40.7128, -74.0060),
      region: "New York, USA",
      desc: "disease.sh: Pathogen concentration measurements show a 24% increase in waste-water metrics.",
      solution: "Enforce strict respirator discipline, restrict physical public exposure.",
      analysis: "RED QUEEN: Biological pathogens exploit high-density hubs. Do not trust quarantine zones. Maintain isolation and utilize digital sovereignty tools."
    },
    {
      id: "weather-storm-1",
      name: "Class IV Hurricane Warning",
      type: "METEOROLOGICAL",
      severity: 89,
      lat: 25.7617,
      lng: -80.1918,
      coords: geoToSvg(25.7617, -80.1918),
      region: "Miami, Florida",
      desc: "Open-Meteo: Barometric drop registered. Wind velocities exceed 140 mph in costal coordinates.",
      solution: "Deploy storm shutters, evacuate low-elevation zones.",
      analysis: "RED QUEEN: Extreme meteorological vectors threaten localized power distribution. Physical blackouts imminent. Charge all terminal power cells."
    },
    {
      id: "rq-anomaly-1",
      name: "Sybil Node Clustering Sweep",
      type: "ALGORITHMIC",
      severity: 94,
      lat: 52.5200,
      lng: 13.4050,
      coords: geoToSvg(52.5200, 13.4050),
      region: "Berlin Node, Germany",
      desc: "RED QUEEN: Correlation crawlers mapping wallet trails to domestic IP routes in Europe.",
      solution: "Activate double-hop non-custodial privacy loops, rotate gas addresses.",
      analysis: "RED QUEEN: Algorithmic surveillance is the true silent killer. Your digital footprints are being compiled. Clean your cookie cache immediately."
    }
  ];

  try {
    // 1. Fetch USGS Earthquakes
    const usgsPromise = fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson")
      .then(res => res.json())
      .then(data => {
        const events = data.features || [];
        const topEvents = events
          .filter((e: any) => e.properties && e.properties.mag >= 4.0)
          .slice(0, 2);
        
        return topEvents.map((e: any, index: number) => {
          const lat = e.geometry.coordinates[1];
          const lng = e.geometry.coordinates[0];
          const mag = e.properties.mag;
          const severity = Math.min(100, Math.round(mag * 15));
          
          return {
            id: `usgs-${index}-${e.id}`,
            name: `M ${mag} Earthquake`,
            type: "GEOLOGICAL" as const,
            severity,
            lat,
            lng,
            coords: geoToSvg(lat, lng),
            region: e.properties.place || "Unknown Coastline",
            desc: `USGS: Seismic event registered at depth of ${e.geometry.coordinates[2]}km.`,
            solution: "Verify building integrity, stay clear of unstable structures.",
            analysis: `RED QUEEN: Geological slip registered. Physical stability is compromised. Ensure off-grid generators are set on vibration-isolation pads.`
          };
        });
      })
      .catch(() => []);

    // 2. Fetch NASA EONET (natural events)
    const nasaPromise = fetch("https://eonet.gsfc.nasa.gov/api/v3/events?limit=3&status=open")
      .then(res => res.json())
      .then(data => {
        const events = data.events || [];
        return events.map((e: any, index: number) => {
          const cat = e.categories[0]?.title || "Natural Hazard";
          const geom = e.geometries[0];
          if (!geom || !geom.coordinates) return null;
          const lng = geom.coordinates[0];
          const lat = geom.coordinates[1];
          const type = cat.toLowerCase().includes("fire") ? "METEOROLOGICAL" : "GEOLOGICAL";
          
          return {
            id: `nasa-${index}-${e.id}`,
            name: `${cat} Detected`,
            type: type as any,
            severity: 82,
            lat,
            lng,
            coords: geoToSvg(lat, lng),
            region: e.title || "Active Hazard Coordinate",
            desc: `NASA EONET: Remote sensing satellites flag active ${cat.toLowerCase()} anomaly.`,
            solution: "Monitor localized weather briefings, evacuate if boundary expands.",
            analysis: `RED QUEEN: Natural atmospheric anomalies threaten open sat-relays. Anticipate minor signal latency spikes.`
          };
        }).filter(Boolean);
      })
      .catch(() => []);

    const [usgsNodes, nasaNodes] = await Promise.all([usgsPromise, nasaPromise]);

    nodes.push(...usgsNodes);
    nodes.push(...nasaNodes);

    // Merge fallback data if API yields too few nodes
    if (nodes.length < 4) {
      const needed = 5 - nodes.length;
      nodes.push(...fallbackNodes.slice(0, needed));
    }
  } catch (err) {
    console.error("Failed to fetch live threat map data:", err);
    nodes.push(...fallbackNodes);
  }

  // Ensure all node coordinates are formatted correctly
  const sanitized = nodes.map(n => ({
    ...n,
    coords: geoToSvg(n.lat, n.lng)
  }));

  return NextResponse.json(sanitized);
}
