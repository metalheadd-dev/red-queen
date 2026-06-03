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
    
    const maxMag = sortedFeatures[0]?.properties?.mag || 0.0;
    const maxPlace = sortedFeatures[0]?.properties?.place || "None";
    const maxDepth = sortedFeatures[0]?.geometry?.coordinates?.[2] || 0.0;
    const maxCoord = sortedFeatures[0]?.geometry?.coordinates?.slice(0, 2) || [0, 0];

    const threatVectors = sortedFeatures.slice(0, 6).map((f: any) => {
      const place = f.properties.place || "Unknown Sector";
      const mag = f.properties.mag || 0.0;
      const depth = f.geometry?.coordinates?.[2] || 0.0;
      const coords = f.geometry?.coordinates?.slice(0, 2) || [0, 0];
      const time = f.properties.time ? new Date(f.properties.time).toISOString() : new Date().toISOString();
      
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
        description: `Tectonic rupture: ${place} (M ${mag.toFixed(1)})`,
        depthKm: depth.toFixed(1),
        latitude: coords[1]?.toFixed(4) || "0.0000",
        longitude: coords[0]?.toFixed(4) || "0.0000",
        eventTime: time
      };
    });

    if (threatVectors.length === 0) {
      threatVectors.push({
        id: "SYS-SEISMIC-CLEAN",
        rating: "0% SEVERITY",
        trend: "STABLE",
        status: "GREEN",
        description: "Zero global tectonic anomalies detected in the last active epoch.",
        depthKm: "0.0",
        latitude: "0.0000",
        longitude: "0.0000",
        eventTime: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      clearance: "LEVEL 5 DIRECTOR (USDC-PAID)",
      intel: {
        headline: "CRITICAL EARTH CONTAINMENT & TECTONIC DECAY MULTIPLIERS",
        summary: `The global seismic monitoring matrix detected ${anomalyCount} tectonic disruptions in the last hour. Tectonic pressure matches risk vectors evaluated by t54 security protocols.`,
        maxEvent: {
          magnitude: maxMag.toFixed(1),
          location: maxPlace,
          depthKm: maxDepth.toFixed(1),
          latitude: maxCoord[1]?.toFixed(4) || "0.0000",
          longitude: maxCoord[0]?.toFixed(4) || "0.0000"
        },
        t54Telemetry: {
          identityStatus: "VERIFIED // SECURED",
          complianceScore: "98.9% COMPLIANT (t54-grade KYA)",
          activePromptMitigations: Math.floor(anomalyCount * 1.5 + 4),
          underwritingTier: "AAA (LOW RISK)",
          riskShieldState: "SHIELD DEPLOYED"
        },
        threatVectors,
        directive: `Tectonic event count is ${anomalyCount}. Strongest rupture at ${maxPlace} (M ${maxMag.toFixed(1)}). t54 active prompt mitigations set to ${Math.floor(anomalyCount * 1.5 + 4)}. Maintain active airgaps.`,
        explorerUrl: "https://www.x402scan.com/"
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
        maxEvent: {
          magnitude: "5.4",
          location: "Honshu, Japan (Simulated)",
          depthKm: "24.5",
          latitude: "35.6762",
          longitude: "139.6503"
        },
        t54Telemetry: {
          identityStatus: "VERIFIED // SECURED",
          complianceScore: "95.2% COMPLIANT (t54-grade KYA)",
          activePromptMitigations: 12,
          underwritingTier: "AA (MEDIUM RISK)",
          riskShieldState: "SHIELD DEPLOYED"
        },
        threatVectors: [
          { id: "T-VIRUS", rating: "94%", trend: "STABLE", status: "RED", description: "Pathogen Containment Field Delta Pressure", depthKm: "0.0", latitude: "35.6762", longitude: "139.6503", eventTime: new Date().toISOString() },
          { id: "AI-TAKEOVER", rating: "91%", trend: "ACCELERATING", status: "RED", description: "Autonomous Compute Containment Breach Status", depthKm: "0.0", latitude: "37.7749", longitude: "-122.4194", eventTime: new Date().toISOString() },
          { id: "EMP-STRIKE", rating: "82%", trend: "ELEVATED", status: "YELLOW", description: "Geomagnetic Induction Core Temperature Spike", depthKm: "10.0", latitude: "55.7558", longitude: "37.6173", eventTime: new Date().toISOString() },
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
