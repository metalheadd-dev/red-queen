import { NextRequest, NextResponse } from "next/server";
import { withFriendlyX402 } from "@/lib/x402";

const svmAddress = process.env.SVM_ADDRESS || "AUCYMsSZXASMiXfjLNL26NF7sPehUA4ncEzTCx8MdSYg";
const network = (process.env.SVM_NETWORK || "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp") as any;

const handler = async (req: NextRequest) => {
  try {
    // Fetch real-time physical seismic anomalies from USGS API
    const usgsRes = await fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson", {
      next: { revalidate: 60 } // Cache for 60 seconds
    });
    const usgsData = await usgsRes.json();
    const anomalyCount = usgsData.metadata.count || 0;
    const features = usgsData.features || [];
    
    // Sort features by magnitude descending to get the most severe ones
    const sortedFeatures = [...features].sort((a: any, b: any) => (b.properties.mag || 0) - (a.properties.mag || 0));
    
    const threatVectors = sortedFeatures.slice(0, 3).map((f: any) => {
      const place = f.properties.place || "Unknown Sector";
      const mag = f.properties.mag || 0.0;
      let status = "YELLOW";
      let trend = "STABLE";
      if (mag >= 5.0) {
        status = "RED";
        trend = "ACCELERATING";
      } else if (mag >= 3.0) {
        status = "YELLOW";
        trend = "ELEVATED";
      } else {
        status = "GREEN";
        trend = "DISSIPATING";
      }
      
      return {
        id: `SYS-SEISMIC-${f.id || Math.floor(Math.random() * 10000)}`,
        rating: `${(mag * 20).toFixed(0)}% SEVERITY`,
        trend,
        status,
        description: `Tectonic rupture alert: ${place} (M ${mag.toFixed(1)})`
      };
    });

    if (threatVectors.length === 0) {
      threatVectors.push({
        id: "SYS-SEISMIC-CLEAN",
        rating: "0% SEVERITY",
        trend: "STABLE",
        status: "GREEN",
        description: "Zero global tectonic anomalies detected in the last active epoch."
      });
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      clearance: "LEVEL 5 DIRECTOR (USDC-PAID)",
      intel: {
        headline: "CRITICAL EARTH CONTAINMENT & TECTONIC DECAY MULTIPLIERS",
        summary: `The global seismic monitoring matrix detected ${anomalyCount} containment field disruptions in the last hour. Tectonic plates are adjusting dynamically under pressure vectors. Verify sector airgaps.`,
        threatVectors,
        directive: `Tectonic event count is ${anomalyCount}. Prepare local generators and alert response teams in vulnerable coordinate blocks.`
      }
    });
  } catch (error) {
    console.error("Failed to fetch live USGS tectonic telemetry:", error);
    // Fallback to static mock if offline
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      clearance: "LEVEL 5 DIRECTOR (USDC-PAID)",
      intel: {
        headline: "CRITICAL VECTOR ESCALATION BRIEFING: GLOBAL DECAY MULTIPLIERS (Fallback)",
        summary: "Synthetic AI containment fields in Sector Delta are experiencing 14% higher adversarial pressure. Web2 metadata mapping shows active compliance tags being cross-referenced with on-chain wallet signatures. Prepare contingency airgaps.",
        threatVectors: [
          { id: "T-VIRUS", rating: "94%", trend: "STABLE", status: "RED" },
          { id: "AI-TAKEOVER", rating: "91%", trend: "ACCELERATING", status: "RED" },
          { id: "EMP-STRIKE", rating: "82%", trend: "ELEVATED", status: "YELLOW" },
        ],
        directive: "Implement adversarial prompt jitter. Purge active OAuth cookies every 24 hours. Limit outbound wallet trace paths."
      }
    });
  }
};

export const GET = withFriendlyX402(
  handler,
  {
    accepts: {
      scheme: "exact",
      price: "$0.01",
      network,
      payTo: svmAddress,
    },
    description: "Premium global apocalypse threat intelligence briefing.",
  }
);
