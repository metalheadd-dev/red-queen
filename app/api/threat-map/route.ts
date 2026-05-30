import { NextResponse } from "next/server";
import { REALISTIC, FICTIONAL, SATIRICAL, ALGORITHMIC, Threat } from "@/lib/threats";

export const dynamic = "force-dynamic";

interface ThreatNode {
  id: string;
  name: string;
  type: "KINETIC" | "ANOMALY" | "DEGENERACY" | "ALGORITHMIC" | "GEOLOGICAL" | "BIOLOGICAL" | "METEOROLOGICAL";
  category: "realistic" | "fictional" | "satirical" | "algorithmic";
  severity: number;
  lat: number;
  lng: number;
  coords: { x: number; y: number };
  region: string;
  desc: string;
  solution: string;
  analysis: string;
}

// Geographic to SVG coordinates (width 800, height 400) - used for fallback SVG views
function geoToSvg(lat: number, lng: number): { x: number; y: number } {
  const width = 800;
  const height = 400;
  const x = Math.round(((lng + 180) * width) / 360);
  const y = Math.round(((90 - lat) * height) / 180);
  return { x, y };
}

// Specific themed geolocations for the threat archives
const THREAT_LOCATIONS: Record<string, { lat: number; lng: number; region: string }> = {
  // Sector Alpha (Kinetic / Realistic)
  "T-VIRUS": { lat: 38.6272, lng: -90.1978, region: "Raccoon City, USA" },
  "HANTAVIRUS": { lat: 35.8308, lng: -106.1250, region: "New Mexico, USA" },
  "PANDEMIC": { lat: 31.2304, lng: 121.4737, region: "Shanghai, China" },
  "BIRD-FLU": { lat: 13.7563, lng: 100.5018, region: "Bangkok, Thailand" },
  "BIOWEAPON": { lat: 49.4077, lng: 8.6908, region: "Heidelberg Lab, Germany" },
  "NUCLEAR-WAR": { lat: 38.9072, lng: -77.0369, region: "Washington D.C., USA" },
  "NUCLEAR-WINTER": { lat: 78.2232, lng: 15.6469, region: "Svalbard, Norway" },
  "EMP-STRIKE": { lat: 37.5665, lng: 126.9780, region: "Seoul, South Korea" },
  "CYBER-WAR": { lat: 39.9042, lng: 116.4074, region: "Beijing, China" },
  "BLACKOUT": { lat: 40.7128, lng: -74.0060, region: "New York City, USA" },
  "ECON-COLLAPSE": { lat: 51.5074, lng: -0.1278, region: "London, UK" },
  "HYPERINFLATION": { lat: 10.4806, lng: -66.9036, region: "Caracas, Venezuela" },
  "FOOD-SHORT": { lat: -1.2921, lng: 36.8219, region: "Nairobi, Kenya" },
  "WATER-CONTAM": { lat: 22.3193, lng: 114.1694, region: "Hong Kong" },
  "CLIMATE-CAT": { lat: -22.9068, lng: -43.1729, region: "Rio de Janeiro, Brazil" },
  "SOLAR-FLARE": { lat: -33.9249, lng: 18.4241, region: "Cape Town, South Africa" },
  "EARTHQUAKE": { lat: 35.6762, lng: 139.6503, region: "Tokyo, Japan" },
  "TSUNAMI": { lat: -8.4095, lng: 115.1889, region: "Bali, Indonesia" },
  "SUPERVOLCANO": { lat: 44.4280, lng: -110.5885, region: "Yellowstone, USA" },
  "CHEM-DISASTER": { lat: 19.0760, lng: 72.8777, region: "Mumbai, India" },
  "AI-TAKEOVER": { lat: 37.4275, lng: -122.1697, region: "Palo Alto, USA" },
  "INFRA-COLLAPSE": { lat: 55.7558, lng: 37.6173, region: "Moscow, Russia" },

  // Sector Beta (Anomalies / Fictional)
  "SKYNET": { lat: 61.5240, lng: 105.3188, region: "Siberia, Russia" },
  "ALIEN-INV": { lat: 34.0522, lng: -118.2437, region: "Los Angeles, USA" },
  "XENO-PROTO": { lat: -89.9976, lng: -139.2729, region: "Amundsen-Scott, Antarctica" },
  "ZOMBIE-APOC": { lat: 33.7490, lng: -84.3880, region: "Atlanta, USA" },
  "MUTANT-VIRUS": { lat: 41.8818, lng: -87.6278, region: "Chicago Lab, USA" },
  "ROBOT-RISE": { lat: 48.8566, lng: 2.3522, region: "Paris, France" },
  "ANDROID-REB": { lat: 35.7090, lng: 139.7320, region: "Tokyo Neo, Japan" },
  "BUG-APOC": { lat: -25.2744, lng: 133.7751, region: "Outback, Australia" },
  "PARASITE": { lat: -3.4653, lng: -62.2159, region: "Amazon Rainforest, Brazil" },
  "VAMPIRE-PLAGUE": { lat: 45.7597, lng: 25.0408, region: "Transylvania, Romania" },
  "DEMON-INV": { lat: 46.2044, lng: 6.1432, region: "CERN, Switzerland" },
  "KAIJU": { lat: 11.3493, lng: 142.1996, region: "Mariana Trench, Pacific Ocean" },
  "DINO-RETURN": { lat: -0.1862, lng: -78.4305, region: "Isla Nublar, Costa Rica" },
  "MOON-COLLISION": { lat: 0.0, lng: 0.0, region: "Prime Meridian Tidal Zone" },
  "ASTEROID": { lat: 20.8931, lng: -89.5165, region: "Yucatan Peninsula, Mexico" },
  "NANOBOT-SWARM": { lat: 40.4168, lng: -3.7038, region: "Madrid Defense Lab, Spain" },
  "SENTIENT-PLANTS": { lat: -2.1631, lng: -55.1266, region: "Amazonian Rainforest Depths" },
  "UNDERWATER-MONSTER": { lat: -48.8767, lng: -123.3933, region: "Point Nemo, Pacific" },
  "HAUNTED-TECH": { lat: 37.7749, lng: -122.4194, region: "San Francisco, USA" },
  "INVISIBLE-PRED": { lat: 60.1699, lng: 24.9384, region: "Helsinki Forests, Finland" },
  "INTERNET-DEMONS": { lat: 52.5200, lng: 13.4050, region: "Berlin Server Hub, Germany" },
  "KILLER-CLOWNS": { lat: 40.0601, lng: -80.7204, region: "Ohio, USA" },

  // Sector Gamma (Degeneracy / Satirical)
  "DUMB-PPL": { lat: 34.0522, lng: -118.2437, region: "Hollywood, USA" },
  "TIKTOK-COLLAPSE": { lat: 37.7749, lng: -122.4194, region: "Silicon Valley, USA" },
  "MEME-PANDEMIC": { lat: 40.7061, lng: -74.0092, region: "Wall Street, USA" },
  "TOILET-PAPER": { lat: 45.4215, lng: -75.6972, region: "Ottawa Retailers, Canada" },
  "INFLUENCER-DICT": { lat: 25.2048, lng: 55.2708, region: "Dubai Marina, UAE" },
  "REALITY-TV-APOC": { lat: 36.1699, lng: -115.1398, region: "Las Vegas Strip, USA" },
  "COFFEE-COLLAPSE": { lat: -23.5505, lng: -46.6333, region: "Sao Paulo, Brazil" },
  "WIFI-EXTINCTION": { lat: 51.5074, lng: -0.1278, region: "Telecom Hub, London" },
  "NPC-UPRISING": { lat: 40.7580, lng: -73.9855, region: "Times Square, NYC" },
  "SMARTPHONE-COLLAPSE": { lat: 37.5665, lng: 126.9780, region: "Seoul Tech Hub, South Korea" },
  "CAT-DOMINATION": { lat: 30.0444, lng: 31.2357, region: "Cairo, Egypt" },
  "FAST-FOOD-WARS": { lat: 39.7392, lng: -104.9903, region: "Denver, Colorado" },
  "AD-APOC": { lat: 40.7589, lng: -73.9851, region: "Broadway Theater District, NYC" },
  "STREAMER-GOV": { lat: 34.1425, lng: -118.2550, region: "Glendale, California" },
  "SOFTWARE-UPDATE": { lat: 47.6062, lng: -122.3321, region: "Seattle Corporate Grid, USA" },

  // Sector Delta (Algorithmic / Algorithmic Warfare)
  "WALLET-TRAIL": { lat: 47.3769, lng: 8.5417, region: "Zurich Finance Center, Switzerland" },
  "AI-PROFILING": { lat: 37.4419, lng: -122.1430, region: "Palo Alto Tech Node, USA" },
  "FEED-MANIP": { lat: 37.4879, lng: -122.1470, region: "Menlo Park Timeline Grid, USA" },
  "DEEPFAKE-SE": { lat: 34.0522, lng: -118.2437, region: "Burbank Studios, USA" },
  "REPUTATION-X": { lat: 1.3521, lng: 103.8198, region: "Crypto Compliance Node, Singapore" },
  "META-LEAK": { lat: 51.5074, lng: -0.1278, region: "Government District, London" },
  "SYBIL-ATTACK": { lat: 52.5200, lng: 13.4050, region: "Berlin Node, Germany" },
  "MEV-EXPLOIT": { lat: 35.6762, lng: 139.6503, region: "Akihabara Memory Pool, Japan" },
  "PHISHING-NET": { lat: 22.3193, lng: 114.1694, region: "Kowloon Network Node, Hong Kong" },
  "COMPUTE-HIJACK": { lat: 55.7558, lng: 37.6173, region: "Moscow Cyber Division, Russia" }
};

// Generates a deterministic location for a threat ID to avoid overlays and guarantee coordinates
function getDeterministicLocation(id: string): { lat: number; lng: number; region: string } {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Centered latitudes [-55, 68] to keep markers on main landmasses
  const lat = -55 + (Math.abs(hash) % 123);
  const lng = -180 + (Math.abs(hash >> 8) % 360);
  return { lat, lng, region: "Sector Boundary Grid Zone" };
}

// Maps a realistic threat ID keyword to its matching Mapbox visual type
function resolveRealisticType(id: string): "BIOLOGICAL" | "GEOLOGICAL" | "METEOROLOGICAL" | "KINETIC" {
  const lowercase = id.toLowerCase();
  if (
    lowercase.includes("virus") || 
    lowercase.includes("pandemic") || 
    lowercase.includes("flu") || 
    lowercase.includes("bio") || 
    lowercase.includes("water")
  ) {
    return "BIOLOGICAL";
  }
  if (
    lowercase.includes("earthquake") || 
    lowercase.includes("tsunami") || 
    lowercase.includes("volcano") ||
    lowercase.includes("seismic")
  ) {
    return "GEOLOGICAL";
  }
  if (
    lowercase.includes("winter") || 
    lowercase.includes("solar") || 
    lowercase.includes("climate") || 
    lowercase.includes("blackout") ||
    lowercase.includes("flare") ||
    lowercase.includes("storm")
  ) {
    return "METEOROLOGICAL";
  }
  return "KINETIC";
}

export async function GET() {
  const nodes: ThreatNode[] = [];

  // Default fallback data in case external APIs fail or are offline
  const fallbackNodes: ThreatNode[] = [
    {
      id: "usgs-eq-1",
      name: "M 5.8 Seismic Activity",
      type: "GEOLOGICAL",
      category: "realistic",
      severity: 78,
      lat: 35.6762,
      lng: 139.6503,
      coords: geoToSvg(35.6762, 139.6503),
      region: "Kanto, Japan",
      desc: "USGS: Tectonic pressure slip registered in Tokyo Trench. Minor structural damage reported.",
      solution: "Activate structural dampers, stay clear of coastlines.",
      analysis: "RED QUEEN: Kinetic tremors disrupt local connectivity. Secure secondary satcom routes."
    },
    {
      id: "nasa-fire-1",
      name: "Wildfire Active Burn Loop",
      type: "METEOROLOGICAL",
      category: "realistic",
      severity: 85,
      lat: -33.8688,
      lng: 151.2093,
      coords: geoToSvg(-33.8688, 151.2093),
      region: "New South Wales, Australia",
      desc: "NASA EONET: Thermal scanning identifies active biomass burning covering 1,200 hectares.",
      solution: "Evacuate smoke paths, seal HEPA filters.",
      analysis: "RED QUEEN: Smoke density compromises local electrical grids. Switch sensitive server nodes to battery reserve loops."
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
            category: "realistic" as const,
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
            category: "realistic" as const,
            severity: 82,
            lat,
            lng,
            coords: geoToSvg(lat, lng),
            region: e.title || "Active Hazard Coordinate",
            desc: `NASA EONET: Remote sensing satellites flag active ${cat.toLowerCase()} anomaly.`,
            solution: "Monitor localized weather briefings, evacuate if boundaries expand.",
            analysis: `RED QUEEN: Natural atmospheric anomalies threaten open sat-relays. Anticipate minor signal latency spikes.`
          };
        }).filter(Boolean);
      })
      .catch(() => []);

    // 3. Fetch disease.sh (biological contagion events)
    const diseasePromise = fetch("https://disease.sh/v3/covid-19/countries?sort=todayCases")
      .then(res => res.json())
      .then(data => {
        const countries = Array.isArray(data) ? data.slice(0, 2) : [];
        return countries.map((c: any, index: number) => {
          const lat = c.countryInfo?.lat || 0;
          const lng = c.countryInfo?.long || 0;
          const todayCases = c.todayCases || 0;
          const active = c.active || 0;
          const severity = Math.min(95, Math.max(60, Math.round((todayCases / Math.max(1, c.population)) * 100000) + 70));
          
          return {
            id: `disease-${index}-${c.countryInfo?.iso2 || c.country}`,
            name: `${c.country} Pathogen Spike`,
            type: "BIOLOGICAL" as const,
            category: "realistic" as const,
            severity,
            lat,
            lng,
            coords: geoToSvg(lat, lng),
            region: c.country,
            desc: `disease.sh: Pathogen transmission load elevated. Today cases: ${todayCases.toLocaleString()}, active caseload: ${active.toLocaleString()}.`,
            solution: "Enforce strict respirator discipline, isolate from high-density transit nodes.",
            analysis: `RED QUEEN: Biological vector registered in ${c.country}. Ensure HEPA filtration is active in local shelter modules.`
          };
        });
      })
      .catch(() => []);

    const [usgsNodes, nasaNodes, diseaseNodes] = await Promise.all([usgsPromise, nasaPromise, diseasePromise]);

    nodes.push(...usgsNodes);
    nodes.push(...nasaNodes);
    nodes.push(...diseaseNodes);

    // Merge fallback data if API yields too few nodes
    if (nodes.length < 2) {
      nodes.push(...fallbackNodes);
    }
  } catch (err) {
    console.error("Failed to fetch live threat map data:", err);
    nodes.push(...fallbackNodes);
  }

  // --- Dynamic Mapping of the Entire Threat Archive ---
  const archiveMapping = (threatList: Threat[], categoryKey: "realistic" | "fictional" | "satirical" | "algorithmic") => {
    return threatList.map((threat) => {
      const loc = THREAT_LOCATIONS[threat.id] || getDeterministicLocation(threat.id);
      
      let type: "KINETIC" | "ANOMALY" | "DEGENERACY" | "ALGORITHMIC" | "GEOLOGICAL" | "BIOLOGICAL" | "METEOROLOGICAL" = "KINETIC";
      if (categoryKey === "realistic") {
        type = resolveRealisticType(threat.id);
      } else if (categoryKey === "fictional") {
        type = "ANOMALY";
      } else if (categoryKey === "satirical") {
        type = "DEGENERACY";
      } else if (categoryKey === "algorithmic") {
        type = "ALGORITHMIC";
      }

      return {
        id: `archive-${categoryKey}-${threat.id.toLowerCase()}`,
        name: threat.name,
        type,
        category: categoryKey,
        severity: threat.level,
        lat: loc.lat,
        lng: loc.lng,
        coords: geoToSvg(loc.lat, loc.lng),
        region: loc.region,
        desc: `${threat.classification}: Symptoms include ${threat.symptoms.slice(0, 2).join(", ")}.`,
        solution: `DEFENSE PROTOCOL: ${threat.survival.slice(0, 2).join(". ")}`,
        analysis: `RED QUEEN: ${threat.classified}`
      };
    });
  };

  // Convert and push all archives
  nodes.push(...archiveMapping(REALISTIC, "realistic"));
  nodes.push(...archiveMapping(FICTIONAL, "fictional"));
  nodes.push(...archiveMapping(SATIRICAL, "satirical"));
  nodes.push(...archiveMapping(ALGORITHMIC, "algorithmic"));

  // Ensure all node coordinates are formatted correctly
  const sanitized = nodes.map(n => ({
    ...n,
    coords: geoToSvg(n.lat, n.lng)
  }));

  return NextResponse.json(sanitized);
}
