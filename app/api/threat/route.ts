import { NextResponse } from "next/server";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 4000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

async function fetchUSGS() {
  try {
    const res = await fetchWithTimeout("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson");
    const data = await res.json();
    const events = data.features || [];
    return events.slice(0, 2).map((e: any) => `USGS: M ${e.properties.mag} Earthquake in ${e.properties.place}`);
  } catch {
    return [];
  }
}

async function fetchNASA() {
  try {
    const res = await fetchWithTimeout("https://eonet.gsfc.nasa.gov/api/v3/events?limit=3&status=open");
    const data = await res.json();
    const events = data.events || [];
    return events.map((e: any) => `NASA EONET: ${e.title} (${e.categories[0]?.title})`);
  } catch {
    return [];
  }
}

async function fetchGDACS() {
  try {
    const res = await fetchWithTimeout("https://www.gdacs.org/xml/rss.xml");
    const xmlText = await res.text();
    const items: string[] = [];
    const itemRegex = /<title>([\s\S]*?)<\/title>/g;
    let match;
    let count = 0;
    while ((match = itemRegex.exec(xmlText)) !== null && count < 4) {
      if (count > 0) {
        const title = match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<\/?[^>]+(>|$)/g, "").trim();
        items.push(`GDACS Alert: ${title}`);
      }
      count++;
    }
    return items;
  } catch {
    return [];
  }
}

async function fetchNOAA() {
  try {
    const res = await fetchWithTimeout("https://services.swpc.noaa.gov/products/alerts.json");
    const data = await res.json();
    const alerts = Array.isArray(data) ? data : [];
    return alerts
      .filter((a: any) => (a.message || "").toUpperCase().includes("ALERT:") || (a.message || "").toUpperCase().includes("WARNING:"))
      .slice(0, 2)
      .map((a: any) => `NOAA SWPC: Space Weather alert issued at ${a.issue_datetime}`);
  } catch {
    return [];
  }
}

async function fetchGoogleNewsOutbreaks() {
  try {
    const res = await fetchWithTimeout("https://news.google.com/rss/search?q=disease+outbreak+OR+virus+outbreak+OR+who+alert&hl=en-US&gl=US&ceid=US:en");
    const xmlText = await res.text();
    const items: string[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    let count = 0;
    while ((match = itemRegex.exec(xmlText)) !== null && count < 2) {
      const item = match[1];
      const titleMatch = item.match(/<title>([\s\S]*?)<\/title>/i);
      const fullTitle = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<\/?[^>]+(>|$)/g, "").trim() : "";
      if (fullTitle) {
        const cleanTitle = fullTitle.split(" - ")[0].trim();
        items.push(`Disease Outbreak Report: ${cleanTitle}`);
      }
      count++;
    }
    return items;
  } catch {
    return [];
  }
}

async function fetchExchangeRates() {
  try {
    const res = await fetchWithTimeout("https://open.er-api.com/v6/latest/USD");
    const data = await res.json();
    const rates = data.rates || {};
    const items: string[] = [];
    if (rates.VES) items.push(`VES Currency Exchange: ${rates.VES} VES per USD`);
    if (rates.ARS) items.push(`ARS Devaluation: ${rates.ARS} ARS per USD`);
    return items;
  } catch {
    return [];
  }
}

export async function POST() {
  const apiKey = process.env.OPENAI_API_KEY;

  const SCENARIOS = ["T-VIRUS OUTBREAK", "SKYNET ACTIVATION", "NUCLEAR WINTER", "BIOWEAPON RELEASE"];
  const TRANSMISSIONS = [
    "SECURE ALL ENTRY POINTS. DO NOT TRUST MUNICIPAL WATER. [ERR_0x9B] CASUALTIES IN SECTOR 7 EXCEED PROJECTIONS. SURVIVAL PROBABILITY: 14%.",
    "EVACUATE URBAN CENTERS IMMEDIATELY. MILITARY CONTAINMENT HAS FAILED. [WARN_0x4F] THE ENTITIES ARE DRAWN TO HEAT SIGNATURES."
  ];

  const fallbackData = {
    codename: "SYS-MOCK",
    name: SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)],
    description: TRANSMISSIONS[Math.floor(Math.random() * TRANSMISSIONS.length)],
    countermeasure: "Acknowledge primary firewall guidelines. Monitor local environment vectors.",
    severity: 85,
    status: "CRITICAL",
    location: "Global Containment Sectors",
    publishDate: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase(),
    source: "System Mainframe Fallback Backup Logs"
  };

  if (!apiKey) {
    return NextResponse.json(fallbackData);
  }

  const client = new OpenAI({ apiKey });

  try {
    const [usgs, nasa, gdacs, noaa, news, exchange] = await Promise.all([
      fetchUSGS(),
      fetchNASA(),
      fetchGDACS(),
      fetchNOAA(),
      fetchGoogleNewsOutbreaks(),
      fetchExchangeRates()
    ]);

    const telemetry = [...usgs, ...nasa, ...gdacs, ...noaa, ...news, ...exchange];
    
    if (telemetry.length === 0) {
      return NextResponse.json(fallbackData);
    }

    const systemPrompt = `You are the RED QUEEN AI, an autonomous system mainframe monitoring a global collapse simulation.
You are given a list of active real-world telemetry feeds (earthquakes, space storms, disease outbreaks, natural disasters, currency devaluations).
Your task is to synthesize a single lore-rich, cyberpunk-style "Daily Threat Forecast" card for the homepage.
You must output a JSON object containing exactly the following keys:
{
  "codename": "A short codename, e.g. 'EQ-592', 'SOLAR-STORM-X', 'BIO-WARN-04'",
  "name": "A compelling, alarming headline title representing the dominant real threat in uppercase",
  "description": "A detailed, glitchy, lore-rich analysis of how this real-world hazard is escalating and affecting global containment nodes.",
  "countermeasure": "Direct, practical survival instructions for operatives to safeguard their health, computing links, or resources.",
  "severity": A number between 65 and 99 representing the severity percentage,
  "status": "CRITICAL", "SEVERE", or "HIGH",
  "location": "A short description of the primary geographical region or target zone affected, e.g., 'Central Mid-Atlantic Ridge', 'Philippines Basin', 'Global High-Altitude Orbit'",
  "publishDate": "E.g. 'JUN 17, 2026'",
  "source": "A short list of the actual sources used for this threat, e.g., 'USGS Seismic & NOAA Space Feeds' or 'GDACS Flood telemetry & WHO Disease reports'"
}

Keep descriptions and countermeasures technical, cold, and post-apocalyptic in tone. Avoid using em-dashes (—).`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Here is the current live telemetry:\n${telemetry.join("\n")}` }
      ]
    });

    const parsed = JSON.parse(response.choices[0].message.content || "{}");
    
    return NextResponse.json({
      codename: parsed.codename || "SYS-WARN",
      name: parsed.name || "UNIDENTIFIED THREAT VECTOR",
      description: parsed.description || "Warning: telemetry analysis failed.",
      countermeasure: parsed.countermeasure || "Remain inside secure quarantine zones.",
      severity: parsed.severity || 80,
      status: parsed.status || "CRITICAL",
      location: parsed.location || "Global Containment Zones",
      publishDate: parsed.publishDate || fallbackData.publishDate,
      source: parsed.source || "Multiple Telemetry Sources"
    });
  } catch (err) {
    console.error("Failed to generate dynamic AI threat forecast:", err);
    return NextResponse.json(fallbackData);
  }
}
