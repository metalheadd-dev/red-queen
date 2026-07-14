import { NextResponse } from "next/server";
import { fetchCNEOS, fetchCISAKEV, fetchFearGreed, fetchDefiLlamaTVL, fetchWithTimeout } from "@/lib/threats-fetchers";

export const dynamic = "force-dynamic";

// Fetch NOAA Space Weather
async function fetchNOAA() {
  try {
    const res = await fetchWithTimeout("https://services.swpc.noaa.gov/products/alerts.json");
    const data = await res.json();
    const alerts = Array.isArray(data) ? data : [];
    return alerts
      .filter((a: any) => (a.message || "").toUpperCase().includes("ALERT:") || (a.message || "").toUpperCase().includes("WARNING:"))
      .slice(0, 3)
      .map((a: any) => `Space Weather alert issued at ${a.issue_datetime}`);
  } catch {
    return [];
  }
}

// Fetch Fiat Exchange Rates
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

export async function GET() {
  try {
    const [cneos, cisakev, fearGreed, defiLlama, noaa, exchange] = await Promise.allSettled([
      fetchCNEOS(),
      fetchCISAKEV(),
      fetchFearGreed(),
      fetchDefiLlamaTVL(),
      fetchNOAA(),
      fetchExchangeRates()
    ]);

    const cneosData = cneos.status === "fulfilled" ? cneos.value : [];
    const cisakevData = cisakev.status === "fulfilled" ? cisakev.value : [];
    const fearGreedData = fearGreed.status === "fulfilled" ? fearGreed.value : [];
    const defiLlamaData = defiLlama.status === "fulfilled" ? defiLlama.value : [];
    const noaaData = noaa.status === "fulfilled" ? noaa.value : [];
    const exchangeData = exchange.status === "fulfilled" ? exchange.value : [];

    const items = [];
    for (const msg of cneosData) {
      items.push({ source: "NASA JPL CNEOS", category: "Cosmic", message: msg, color: "#a855f7" });
    }
    for (const msg of cisakevData) {
      items.push({ source: "CISA KEV", category: "Cybersecurity", message: msg, color: "#ff4d4d" });
    }
    for (const msg of fearGreedData) {
      items.push({ source: "Fear & Greed Index", category: "Finance", message: msg, color: "#f0c929" });
    }
    for (const msg of defiLlamaData) {
      items.push({ source: "DefiLlama TVL", category: "DeFi Analytics", message: msg, color: "#00ffcc" });
    }
    for (const msg of noaaData) {
      items.push({ source: "NOAA Space Weather", category: "Space Weather", message: msg, color: "#3b82f6" });
    }
    for (const msg of exchangeData) {
      items.push({ source: "Exchange Rates", category: "Fiat Devaluation", message: msg, color: "#ec4899" });
    }

    return NextResponse.json({ success: true, additional: items });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to load additional data" }, { status: 500 });
  }
}
