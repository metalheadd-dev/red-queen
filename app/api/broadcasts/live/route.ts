import { NextResponse } from "next/server";
import { fetchFIRMS, fetchGDELT, fetchReliefWeb, fetchUSGS, fetchNASA, fetchWithTimeout } from "@/lib/threats-fetchers";

export const dynamic = "force-dynamic";

interface GDACSAlert {
  id: string;
  title: string;
  desc: string;
  link: string;
  pubDate: string;
  lat: number;
  lng: number;
  eventType: string;
  eventTypeName: string;
  alertLevel: "Green" | "Orange" | "Red" | "Unknown";
  alertScore: number;
  country: string;
  category?: "gdacs" | "realistic";
}

function cleanText(text: string): string {
  if (!text) return "";
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<\/?[^>]+(>|$)/g, "")
    .trim();
}

function mapEventTypeName(type: string): string {
  switch (type?.toUpperCase()) {
    case "EQ":
      return "Earthquake";
    case "TC":
      return "Tropical Cyclone";
    case "FL":
      return "Flood";
    case "VO":
      return "Volcanic Eruption";
    case "DR":
      return "Drought";
    case "WF":
      return "Wildfire";
    default:
      return type || "Natural Hazard";
  }
}

async function fetchGDACSAlerts(): Promise<GDACSAlert[]> {
  try {
    const res = await fetch("https://www.gdacs.org/xml/rss.xml", {
      next: { revalidate: 360 }, // Cache for 6 minutes (matching GDACS update cycle)
    });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch GDACS feed: ${res.status}`);
    }

    const xmlText = await res.text();
    const alerts: GDACSAlert[] = [];
    
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    
    while ((match = itemRegex.exec(xmlText)) !== null) {
      const item = match[1];
      
      const titleMatch = item.match(/<title>([\s\S]*?)<\/title>/i);
      const title = titleMatch ? cleanText(titleMatch[1]) : "Disaster Transmission";
      
      const descMatch = item.match(/<description>([\s\S]*?)<\/description>/i);
      const desc = descMatch ? cleanText(descMatch[1]) : "";
      
      const linkMatch = item.match(/<link>([\s\S]*?)<\/link>/i);
      const link = linkMatch ? cleanText(linkMatch[1]) : "https://www.gdacs.org";
      
      const pubDateMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
      const pubDate = pubDateMatch ? cleanText(pubDateMatch[1]) : new Date().toUTCString();
      
      const latMatch = item.match(/<geo:lat>([\s\S]*?)<\/geo:lat>/i) || item.match(/<gdacs:lat>([\s\S]*?)<\/gdacs:lat>/i);
      const lat = latMatch ? parseFloat(cleanText(latMatch[1])) : NaN;
      
      const lngMatch = item.match(/<geo:long>([\s\S]*?)<\/geo:long>/i) || item.match(/<gdacs:long>([\s\S]*?)<\/gdacs:long>/i);
      const lng = lngMatch ? parseFloat(cleanText(lngMatch[1])) : NaN;
      
      const idMatch = item.match(/<gdacs:eventid>([\s\S]*?)<\/gdacs:eventid>/i);
      const id = idMatch ? cleanText(idMatch[1]) : Math.random().toString(36).substring(7);
      
      const eventtypeMatch = item.match(/<gdacs:eventtype>([\s\S]*?)<\/gdacs:eventtype>/i);
      const eventType = eventtypeMatch ? cleanText(eventtypeMatch[1]) : "Hazard";
      
      const alertlevelMatch = item.match(/<gdacs:alertlevel>([\s\S]*?)<\/gdacs:alertlevel>/i);
      let alertLevel: "Green" | "Orange" | "Red" | "Unknown" = "Unknown";
      const parsedLevel = alertlevelMatch ? cleanText(alertlevelMatch[1]) : "";
      if (parsedLevel === "Green" || parsedLevel === "Orange" || parsedLevel === "Red") {
        alertLevel = parsedLevel;
      }
      
      const alertscoreMatch = item.match(/<gdacs:alertscore>([\s\S]*?)<\/gdacs:alertscore>/i);
      const alertScore = alertscoreMatch ? parseFloat(cleanText(alertscoreMatch[1])) : 0;
      
      const countryMatch = item.match(/<gdacs:country>([\s\S]*?)<\/gdacs:country>/i);
      const country = countryMatch ? cleanText(countryMatch[1]) : "GLB";

      if (!isNaN(lat) && !isNaN(lng)) {
        alerts.push({
          id,
          title,
          desc,
          link,
          pubDate,
          lat,
          lng,
          eventType,
          eventTypeName: mapEventTypeName(eventType),
          alertLevel,
          alertScore,
          country,
          category: "gdacs" as const
        });
      }
    }
    return alerts;
  } catch (error) {
    console.error("GDACS fetch error:", error);
    return [];
  }
}

export async function GET() {
  try {
    // Fetch all geo-sources (GDACS + FIRMS + GDELT + ReliefWeb + USGS + NASA EONET) in parallel
    const [gdacsResult, firmsResult, gdeltResult, reliefwebResult, usgsResult, nasaResult] = await Promise.allSettled([
      fetchGDACSAlerts(),
      fetchFIRMS(),
      fetchGDELT(),
      fetchReliefWeb(),
      fetchUSGS(),
      fetchNASA()
    ]);

    const gdacsAlerts = gdacsResult.status === "fulfilled" ? gdacsResult.value : [];
    const firmsAlerts = firmsResult.status === "fulfilled" ? firmsResult.value : [];
    const gdeltAlerts = gdeltResult.status === "fulfilled" ? gdeltResult.value : [];
    const reliefwebAlerts = reliefwebResult.status === "fulfilled" ? reliefwebResult.value : [];
    const usgsAlerts = usgsResult.status === "fulfilled" ? usgsResult.value : [];
    const nasaAlerts = nasaResult.status === "fulfilled" ? nasaResult.value : [];

    // Combine them into one array
    const combinedAlerts: GDACSAlert[] = [
      ...gdacsAlerts,
      ...firmsAlerts,
      ...gdeltAlerts,
      ...reliefwebAlerts,
      ...usgsAlerts,
      ...nasaAlerts
    ];

    return NextResponse.json({ success: true, alerts: combinedAlerts });
  } catch (error: any) {
    console.error("Combined live broadcast fetch error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load live broadcasts" },
      { status: 500 }
    );
  }
}
