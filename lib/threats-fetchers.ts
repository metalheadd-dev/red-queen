export interface LiveMapNode {
  id: string;
  title: string;
  desc: string;
  link: string;
  lat: number;
  lng: number;
  eventType: string;
  eventTypeName: string;
  alertLevel: "Green" | "Orange" | "Red" | "Unknown";
  alertScore: number;
  country: string;
  category: "realistic";
  pubDate: string;
}

export const COUNTRY_COORDS: Record<string, { lat: number; lng: number; name: string }> = {
  "UNITED STATES": { lat: 37.0902, lng: -95.7129, name: "United States" },
  "UNITED KINGDOM": { lat: 55.3781, lng: -3.4360, name: "United Kingdom" },
  "CHINA": { lat: 35.8617, lng: 104.1954, name: "China" },
  "RUSSIA": { lat: 61.5240, lng: 105.3188, name: "Russia" },
  "GERMANY": { lat: 51.1657, lng: 10.4515, name: "Germany" },
  "FRANCE": { lat: 46.2276, lng: 2.2137, name: "France" },
  "JAPAN": { lat: 36.2048, lng: 138.2529, name: "Japan" },
  "CANADA": { lat: 56.1304, lng: -106.3468, name: "Canada" },
  "AUSTRALIA": { lat: -25.2744, lng: 133.7751, name: "Australia" },
  "GEORGIA": { lat: 42.3154, lng: 43.3569, name: "Georgia" },
  "HAITI": { lat: 18.9712, lng: -72.2852, name: "Haiti" },
  "INDONESIA": { lat: -0.7893, lng: 113.9213, name: "Indonesia" },
  "AFGHANISTAN": { lat: 33.9391, lng: 67.7100, name: "Afghanistan" },
  "BANGLADESH": { lat: 23.6850, lng: 90.3563, name: "Bangladesh" },
  "BRAZIL": { lat: -14.2350, lng: -51.9253, name: "Brazil" },
  "COLOMBIA": { lat: 4.5709, lng: -74.2973, name: "Colombia" },
  "CONGO": { lat: -0.2280, lng: 15.8277, name: "Congo" },
  "DR CONGO": { lat: -4.0383, lng: 21.7587, name: "DR Congo" },
  "ECUADOR": { lat: -1.8312, lng: -78.1834, name: "Ecuador" },
  "ETHIOPIA": { lat: 9.1450, lng: 40.4897, name: "Ethiopia" },
  "INDIA": { lat: 20.5937, lng: 78.9629, name: "India" },
  "KENYA": { lat: -0.0236, lng: 37.9062, name: "Kenya" },
  "MADAGASCAR": { lat: -18.7669, lng: 46.8691, name: "Madagascar" },
  "MOZAMBIQUE": { lat: -18.6657, lng: 35.5296, name: "Mozambique" },
  "MYANMAR": { lat: 21.9162, lng: 95.9560, name: "Myanmar" },
  "NEPAL": { lat: 28.3949, lng: 84.1240, name: "Nepal" },
  "NIGERIA": { lat: 9.0820, lng: 8.6753, name: "Nigeria" },
  "PAKISTAN": { lat: 30.3753, lng: 69.3451, name: "Pakistan" },
  "PERU": { lat: -9.1900, lng: -75.0152, name: "Peru" },
  "PHILIPPINES": { lat: 12.8797, lng: 121.7740, name: "Philippines" },
  "SOMALIA": { lat: 5.1521, lng: 46.1996, name: "Somalia" },
  "SOUTH SUDAN": { lat: 6.8770, lng: 31.3070, name: "South Sudan" },
  "SUDAN": { lat: 12.8628, lng: 30.2176, name: "Sudan" },
  "SYRIA": { lat: 34.8021, lng: 38.9968, name: "Syria" },
  "UKRAINE": { lat: 48.3794, lng: 31.1656, name: "Ukraine" },
  "VIETNAM": { lat: 14.0583, lng: 108.2772, name: "Vietnam" },
  "YEMEN": { lat: 15.5527, lng: 48.5164, name: "Yemen" },
  "ZIMBABWE": { lat: -19.0154, lng: 29.1549, name: "Zimbabwe" },
};

export async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 4000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

function cleanXmlText(text: string): string {
  if (!text) return "";
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<\/?[^>]+(>|$)/g, "")
    .trim();
}

// 1. NASA FIRMS (Wildfire active cluster data with 0.5 deg cluster mapping)
export async function fetchFIRMS(): Promise<LiveMapNode[]> {
  const apiKey = process.env.FIRMS_MAP_KEY;
  if (!apiKey) return [];
  try {
    const res = await fetchWithTimeout(`https://firms.modaps.eosdis.nasa.gov/api/area/csv/${apiKey}/VIIRS_NOAA20_NRT/world/1`);
    if (!res.ok) return [];
    const text = await res.text();
    const lines = text.trim().split("\n");
    if (lines.length <= 1) return [];
    const headers = lines[0].split(",");
    const latIdx = headers.indexOf("latitude");
    const lngIdx = headers.indexOf("longitude");
    const acqDateIdx = headers.indexOf("acq_date");
    const confidenceIdx = headers.indexOf("confidence");
    const frpIdx = headers.indexOf("frp");

    if (latIdx === -1 || lngIdx === -1) return [];

    const clusters: Record<string, { lat: number; lng: number; totalFrp: number; count: number; date: string; confidence: string }> = {};

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",");
      if (cols.length < headers.length) continue;
      const lat = parseFloat(cols[latIdx]);
      const lng = parseFloat(cols[lngIdx]);
      const frp = parseFloat(cols[frpIdx]) || 0;
      const date = cols[acqDateIdx] || "";
      const confidence = cols[confidenceIdx] || "N/A";

      if (isNaN(lat) || isNaN(lng)) continue;

      // Group into 0.5 degree grids (~50km)
      const roundedLat = Math.round(lat * 2) / 2;
      const roundedLng = Math.round(lng * 2) / 2;
      const key = `${roundedLat},${roundedLng}`;

      if (!clusters[key]) {
        clusters[key] = {
          lat: roundedLat,
          lng: roundedLng,
          totalFrp: 0,
          count: 0,
          date,
          confidence,
        };
      }
      clusters[key].totalFrp += frp;
      clusters[key].count += 1;
    }

    const nodes = Object.entries(clusters).map(([key, c]) => {
      const frpVal = Math.round(c.totalFrp);
      return {
        id: `firms-${key}`,
        title: `Active Wildfire Cluster`,
        desc: `Thermal anomaly detected by NOAA-20 satellite. Fire Radiative Power (FRP): ${frpVal} MW across ${c.count} localized hotspots. Confidence: ${c.confidence}.`,
        link: "https://firms.modaps.eosdis.nasa.gov",
        lat: c.lat,
        lng: c.lng,
        eventType: "WF",
        eventTypeName: "Wildfire",
        alertLevel: (frpVal > 150 ? "Red" : frpVal > 40 ? "Orange" : "Green") as "Red" | "Orange" | "Green",
        alertScore: Math.min(3.0, frpVal / 50),
        country: "Global",
        category: "realistic" as const,
        pubDate: c.date,
      };
    });

    // Return the top 15 most severe fire clusters
    return nodes.sort((a, b) => b.alertScore - a.alertScore).slice(0, 15);
  } catch {
    return [];
  }
}

// 2. GDELT (Conflict/Incident news data)
export async function fetchGDELT(): Promise<LiveMapNode[]> {
  try {
    const res = await fetchWithTimeout("https://api.gdeltproject.org/api/v2/doc/doc?query=disaster&mode=artlist&format=json");
    const text = await res.text();
    if (text.includes("Please limit requests")) {
      return [];
    }
    const data = JSON.parse(text);
    const articles = data.articles || [];
    const nodes: LiveMapNode[] = [];

    for (const art of articles) {
      const countryName = (art.sourcecountry || "").toUpperCase();
      const coords = COUNTRY_COORDS[countryName];
      // Filter strictly: skip if no recognized coordinates can be assigned
      if (coords) {
        nodes.push({
          id: `gdelt-${art.url}`,
          title: art.title || "GDELT Event Alert",
          desc: `Geopolitical event or natural disaster documented in local media source: ${art.url}`,
          link: art.url || "https://gdeltproject.org",
          lat: coords.lat,
          lng: coords.lng,
          eventType: "KINETIC",
          eventTypeName: "Kinetic Incident",
          alertLevel: "Orange" as const,
          alertScore: 1.5,
          country: coords.name,
          category: "realistic" as const,
          pubDate: art.seendate || new Date().toUTCString(),
        });
      }
    }
    return nodes.slice(0, 15);
  } catch {
    return [];
  }
}

// 3. ReliefWeb UN OCHA (Humanitarian alerts XML feed)
export async function fetchReliefWeb(): Promise<LiveMapNode[]> {
  try {
    const res = await fetchWithTimeout("https://reliefweb.int/disasters/rss.xml");
    const xmlText = await res.text();
    const nodes: LiveMapNode[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    let count = 0;

    while ((match = itemRegex.exec(xmlText)) !== null && count < 15) {
      const item = match[1];
      const titleMatch = item.match(/<title>([\s\S]*?)<\/title>/i);
      const title = titleMatch ? cleanXmlText(titleMatch[1]) : "ReliefWeb Disaster Alert";
      
      const descMatch = item.match(/<description>([\s\S]*?)<\/description>/i);
      const descHtml = descMatch ? descMatch[1] : "";
      
      const countryMatch = descHtml.match(/Affected country:\s*([^<]+)/i);
      const country = countryMatch ? cleanXmlText(countryMatch[1]) : "";
      const cleanDesc = cleanXmlText(descHtml);
      
      const linkMatch = item.match(/<link>([\s\S]*?)<\/link>/i);
      const link = linkMatch ? cleanXmlText(linkMatch[1]) : "";
      
      const pubDateMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
      const pubDate = pubDateMatch ? cleanXmlText(pubDateMatch[1]) : "";

      const countryUpper = country.toUpperCase();
      const coords = COUNTRY_COORDS[countryUpper];
      if (coords) {
        nodes.push({
          id: `reliefweb-${link || title}`,
          title,
          desc: cleanDesc.slice(0, 300),
          link: link || "https://reliefweb.int",
          lat: coords.lat,
          lng: coords.lng,
          eventType: "METEOROLOGICAL",
          eventTypeName: "Humanitarian Alert",
          alertLevel: "Red" as const,
          alertScore: 2.2,
          country: coords.name,
          category: "realistic" as const,
          pubDate,
        });
        count++;
      }
    }
    return nodes;
  } catch {
    return [];
  }
}

// 4. NASA JPL CNEOS (Near-Earth asteroid close approaches)
export async function fetchCNEOS(): Promise<string[]> {
  try {
    const res = await fetchWithTimeout("https://ssd-api.jpl.nasa.gov/cad.api?dist-max=10LD&date-min=2026-01-01&sort=dist");
    if (!res.ok) return [];
    const data = await res.json();
    const entries = data.data || [];
    const fields = data.fields || [];
    
    const desIdx = fields.indexOf("des");
    const cdIdx = fields.indexOf("cd");
    const distIdx = fields.indexOf("dist");
    const vRelIdx = fields.indexOf("v_rel");
    
    return entries.slice(0, 3).map((row: any) => {
      const name = row[desIdx];
      const date = row[cdIdx];
      const dist = parseFloat(row[distIdx]).toFixed(2);
      const speed = parseFloat(row[vRelIdx]).toFixed(2);
      return `Asteroid Close Approach: Object ${name} will approach Earth on ${date} at a distance of ${dist} Lunar Distances traveling at ${speed} km/s.`;
    });
  } catch {
    return [];
  }
}

// 5. CISA KEV (Actively exploited cyber vulnerabilities)
export async function fetchCISAKEV(): Promise<string[]> {
  const primaryUrl = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json";
  const mirrorUrl = "https://raw.githubusercontent.com/aboutcode-org/aboutcode-mirror-kev/main/known_exploited_vulnerabilities.json";
  try {
    let res = await fetchWithTimeout(primaryUrl);
    if (!res.ok) {
      res = await fetchWithTimeout(mirrorUrl);
    }
    const data = await res.json();
    const vulns = data.vulnerabilities || [];
    return vulns.slice(-3).map((v: any) => 
      `Cyber Threat: CVE ${v.cveID} exploiting ${v.vendorProject} ${v.product} added on ${v.dateAdded} (${v.vulnerabilityName})`
    );
  } catch {
    try {
      const res = await fetchWithTimeout(mirrorUrl);
      const data = await res.json();
      const vulns = data.vulnerabilities || [];
      return vulns.slice(-3).map((v: any) => 
        `Cyber Threat: CVE ${v.cveID} exploiting ${v.vendorProject} ${v.product} added on ${v.dateAdded} (${v.vulnerabilityName})`
      );
    } catch {
      return [];
    }
  }
}

// 6. Crypto market Fear & Greed Index
export async function fetchFearGreed(): Promise<string[]> {
  try {
    const res = await fetchWithTimeout("https://api.alternative.me/fng/");
    const data = await res.json();
    const entry = data.data?.[0];
    if (entry) {
      return [`Crypto Market Sentiment: Index value ${entry.value} (${entry.value_classification})`];
    }
    return [];
  } catch {
    return [];
  }
}

// 7. DefiLlama protocol TVL contraction alerts
export async function fetchDefiLlamaTVL(): Promise<string[]> {
  try {
    const res = await fetchWithTimeout("https://api.llama.fi/protocols");
    const data = await res.json();
    const largeDrops = data
      .filter((p: any) => p.tvl > 10000000 && p.change_1d !== null && p.change_1d < 0)
      .sort((a: any, b: any) => a.change_1d - b.change_1d)
      .slice(0, 3)
      .map((p: any) => 
        `DefiLlama Protocol Alert: ${p.name} TVL contracted by ${(p.change_1d * 100).toFixed(2)}% in the last 24 hours (Current TVL: $${Math.round(p.tvl).toLocaleString()})`
      );
    return largeDrops;
  } catch {
    return [];
  }
}
