import { NextRequest, NextResponse } from "next/server";
import { withFriendlyX402 } from "@/lib/x402";
import { Connection } from "@solana/web3.js";

const svmAddress = process.env.SVM_ADDRESS || "AUCYMsSZXASMiXfjLNL26NF7sPehUA4ncEzTCx8MdSYg";
const network = (process.env.SVM_NETWORK || "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp") as any;

const handler = async (req: NextRequest) => {
  try {
    // Connect to Solana Mainnet Beta
    const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
    const voteAccounts = await connection.getVoteAccounts();
    
    const activeNodes = voteAccounts.current.length;
    const delinquentNodes = voteAccounts.delinquent.length;
    const totalNodes = activeNodes + delinquentNodes;
    const stabilityPercentage = ((activeNodes / totalNodes) * 100).toFixed(1);
    
    // Create live alerts based on delinquent (offline) validators
    const topDelinquent = voteAccounts.delinquent.slice(0, 2);
    const sensorAlerts = topDelinquent.map((node: any) => {
      const pubkeyStr = node.votePubkey;
      const shortPubkey = pubkeyStr.slice(0, 4) + "..." + pubkeyStr.slice(-4);
      return `Alert: Solana node ${shortPubkey} is delinquent (offline). Telemetry transmission interrupted.`;
    });
    
    if (sensorAlerts.length === 0) {
      sensorAlerts.push("All monitored DePIN nodes are broadcasting active status streams.");
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      clearance: "LEVEL 5 DIRECTOR (USDC-PAID)",
      depin: {
        scannerName: "Solana Mainnet DePIN Infrastructure Engine",
        onlineNodes: totalNodes,
        compromisedNodes: delinquentNodes,
        bandwidthTaintIndex: `${((delinquentNodes / totalNodes) * 100).toFixed(1)}%`,
        sensorAlerts,
        networkHealth: `${stabilityPercentage}% STABLE`
      }
    });
  } catch (error: any) {
    console.error("Failed to fetch live DePIN data from Solana mainnet:", error);
    // Fallback to static mock if connection is down/rate-limited
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      clearance: "LEVEL 5 DIRECTOR (USDC-PAID)",
      depin: {
        scannerName: "Sector 7 DePIN Mesh Scanner (Mainnet Fallback)",
        onlineNodes: 1420,
        compromisedNodes: 12,
        bandwidthTaintIndex: "0.8%",
        sensorAlerts: [
          "Anomaly detected on Node #097 (Berlin, DE) - unexpected outbound metadata burst.",
          "Node #304 (Tokyo, JP) experiencing homomorphic compute throttling.",
        ],
        networkHealth: "99.1% STABLE"
      }
    });
  }
};

export const GET = withFriendlyX402(
  handler,
  {
    accepts: {
      scheme: "exact",
      price: "$0.02",
      network,
      payTo: svmAddress,
    },
    description: "Real-time global DePIN mesh network sensor diagnostic telemetry.",
  }
);
