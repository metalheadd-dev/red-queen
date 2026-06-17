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

  // Helper dictionary of coordinates for matching country names in news articles
  const COUNTRY_COORDS: Record<string, { lat: number; lng: number }> = {
    "usa": { lat: 37.0902, lng: -95.7129 },
    "united states": { lat: 37.0902, lng: -95.7129 },
    "china": { lat: 35.8617, lng: 104.1954 },
    "india": { lat: 20.5937, lng: 78.9629 },
    "brazil": { lat: -14.2350, lng: -51.9253 },
    "united kingdom": { lat: 55.3781, lng: -3.4360 },
    "uk": { lat: 55.3781, lng: -3.4360 },
    "germany": { lat: 51.1657, lng: 10.4515 },
    "france": { lat: 46.2276, lng: 2.2137 },
    "japan": { lat: 36.2048, lng: 138.2529 },
    "australia": { lat: -25.2744, lng: 133.7751 },
    "canada": { lat: 56.1304, lng: -106.3468 },
    "russia": { lat: 61.5240, lng: 105.3188 },
    "south africa": { lat: -30.5595, lng: 22.9375 },
    "argentina": { lat: -38.4161, lng: -63.6167 },
    "venezuela": { lat: 6.4238, lng: -66.5897 },
    "turkey": { lat: 38.9637, lng: 35.2433 },
    "lebanon": { lat: 33.8547, lng: 35.8623 },
    "congo": { lat: -4.0383, lng: 21.7587 },
    "uganda": { lat: 1.3733, lng: 32.2903 },
    "nigeria": { lat: 9.0820, lng: 8.6753 },
    "kenya": { lat: -0.0236, lng: 37.9062 },
    "saudi arabia": { lat: 23.8859, lng: 45.0792 },
    "iran": { lat: 32.4279, lng: 53.6880 },
    "egypt": { lat: 26.8206, lng: 30.8025 },
    "mexico": { lat: 23.6345, lng: -102.5528 },
    "colombia": { lat: 4.5709, lng: -74.2973 },
    "peru": { lat: -9.1900, lng: -75.0152 },
    "indonesia": { lat: -0.7893, lng: 113.9213 },
    "thailand": { lat: 15.8700, lng: 100.9925 },
    "vietnam": { lat: 14.0583, lng: 108.2772 },
    "philippines": { lat: 12.8797, lng: 121.7740 },
    "spain": { lat: 40.4637, lng: -3.7492 },
    "italy": { lat: 41.8719, lng: 12.5674 },
    "ukraine": { lat: 48.3794, lng: 31.1656 },
    "poland": { lat: 51.9194, lng: 19.1451 },
    "bolivia": { lat: -16.2902, lng: -63.5887 },
    "ecuador": { lat: -1.8312, lng: -78.1834 }
  };

  function detectCountry(text: string): { lat: number; lng: number; name: string } {
    const lower = text.toLowerCase();
    for (const [country, coords] of Object.entries(COUNTRY_COORDS)) {
      if (lower.includes(country)) {
        return { lat: coords.lat, lng: coords.lng, name: country.toUpperCase() };
      }
    }
    // Return slightly randomized location in mid-latitudes if unresolved
    return { lat: 15 + Math.random() * 15, lng: -25 + Math.random() * 30, name: "Global Health Network" };
  }

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

    // 3. Fetch NOAA Space Weather alerts
    const noaaPromise = fetch("https://services.swpc.noaa.gov/products/alerts.json")
      .then(res => res.json())
      .then(data => {
        const alerts = Array.isArray(data) ? data : [];
        const resultNodes: any[] = [];
        
        const stormAlerts = alerts
          .filter((a: any) => {
            const msg = (a.message || "").toUpperCase();
            return msg.includes("ALERT:") || msg.includes("WARNING:") || msg.includes("STORM") || msg.includes("FLUX");
          })
          .slice(0, 2);
          
        stormAlerts.forEach((a: any, idx: number) => {
          const message = a.message || "";
          const isFlare = message.toUpperCase().includes("FLUX") || message.toUpperCase().includes("FLARE");
          const title = isFlare ? "Active Solar Radiation Alert" : "Geomagnetic Storm Warning";
          
          // Place alerts near auroral oval centers (Alaska/Yukon or Svalbard)
          const isSvalbard = idx % 2 === 0;
          const lat = isSvalbard ? 78.2232 : 64.2008;
          const lng = isSvalbard ? 15.6469 : -149.4937;
          const region = isSvalbard ? "Svalbard Auroral Zone" : "Alaska Auroral Zone";
          
          const cleanMsg = message
            .replace(/\r\n/g, " ")
            .replace(/\n/g, " ")
            .substring(0, 160) + "...";
            
          resultNodes.push({
            id: `noaa-alert-${idx}`,
            name: title,
            type: "METEOROLOGICAL" as const,
            category: "realistic" as const,
            severity: message.toUpperCase().includes("SEVERE") || message.toUpperCase().includes("EXTREME") ? 92 : 78,
            lat,
            lng,
            coords: geoToSvg(lat, lng),
            region,
            desc: `NOAA SWPC: ${cleanMsg}`,
            solution: "Shield sensitive computing nodes in Faraday frames, transition satellite links to laser transponders.",
            analysis: `RED QUEEN: Solar geomagnetic influx registered at ${region}. Electromagnetic shielding factor downgraded by 8%.`
          });
        });
        
        return resultNodes;
      })
      .catch(() => []);

    // 4. Fetch Google News RSS for Disease Outbreaks
    const googleNewsPromise = fetch("https://news.google.com/rss/search?q=disease+outbreak+OR+virus+outbreak+OR+who+alert&hl=en-US&gl=US&ceid=US:en")
      .then(res => res.text())
      .then(xmlText => {
        const items: any[] = [];
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;
        let index = 0;
        
        while ((match = itemRegex.exec(xmlText)) !== null && index < 2) {
          const item = match[1];
          const titleMatch = item.match(/<title>([\s\S]*?)<\/title>/i);
          const fullTitle = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<\/?[^>]+(>|$)/g, "").trim() : "";
          
          if (!fullTitle) continue;
          const cleanTitle = fullTitle.split(" - ")[0].trim();
          
          const pubDateMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
          const pubDate = pubDateMatch ? pubDateMatch[1].trim() : new Date().toUTCString();
          
          const countryInfo = detectCountry(cleanTitle);
          const severity = 75 + Math.floor(Math.random() * 20);
          
          items.push({
            id: `news-outbreak-${index}`,
            name: cleanTitle,
            type: "BIOLOGICAL" as const,
            category: "realistic" as const,
            severity,
            lat: countryInfo.lat,
            lng: countryInfo.lng,
            coords: geoToSvg(countryInfo.lat, countryInfo.lng),
            region: countryInfo.name,
            desc: `Google News Outbreaks Feed: ${cleanTitle}. Reported date: ${pubDate}.`,
            solution: "Enforce standard respirator masks, avoid crowded gathering areas, follow local public health advisories.",
            analysis: `RED QUEEN: Active biological outbreak vector monitored in ${countryInfo.name}. Initiating biological quarantine scan protocols.`
          });
          index++;
        }
        return items;
      })
      .catch(() => []);

    // 5. Fetch Exchange Rates Volatility (Inflation metrics)
    const exchangePromise = fetch("https://open.er-api.com/v6/latest/USD")
      .then(res => res.json())
      .then(data => {
        const rates = data.rates || {};
        const resultNodes: any[] = [];
        
        const monitored = [
          { code: "VES", country: "Venezuela", lat: 6.4238, lng: -66.5897, name: "VES Currency Volatility", idKey: "ves" },
          { code: "ARS", country: "Argentina", lat: -38.4161, lng: -63.6167, name: "ARS Inflation Pressure", idKey: "ars" },
          { code: "TRY", country: "Turkey", lat: 38.9637, lng: 35.2433, name: "TRY Lira Devaluation", idKey: "try" }
        ];
        
        monitored.forEach((item) => {
          const rate = rates[item.code];
          if (rate) {
            resultNodes.push({
              id: `exchange-rate-${item.idKey}`,
              name: item.name,
              type: "KINETIC" as const,
              category: "realistic" as const,
              severity: 80,
              lat: item.lat,
              lng: item.lng,
              coords: geoToSvg(item.lat, item.lng),
              region: item.country,
              desc: `Exchange Rate API: Fiat value devalued to ${Number(rate).toLocaleString()} ${item.code} per USD. High inflationary volatility indexes flagged.`,
              solution: "Safeguard liquid assets in decentralized stablecoins, hedge reserves using tokenized hard commodities.",
              analysis: `RED QUEEN: Hyperinflationary feedback loops active in ${item.country}. Traditional monetary buffers are collapsing.`
            });
          }
        });
        
        return resultNodes;
      })
      .catch(() => []);

    const [usgsNodes, nasaNodes, noaaNodes, newsNodes, exchangeNodes] = await Promise.all([
      usgsPromise,
      nasaPromise,
      noaaPromise,
      googleNewsPromise,
      exchangePromise
    ]);

    nodes.push(...usgsNodes);
    nodes.push(...nasaNodes);
    nodes.push(...noaaNodes);
    nodes.push(...newsNodes);
    nodes.push(...exchangeNodes);

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
