import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";
import { x402Server } from "@/lib/x402";

const svmAddress = process.env.SVM_ADDRESS || "AUCYMsSZXASMiXfjLNL26NF7sPehUA4ncEzTCx8MdSYg";
const network = (process.env.SVM_NETWORK || "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1") as any;

const handler = async (req: NextRequest) => {
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    clearance: "LEVEL 5 DIRECTOR (USDC-PAID)",
    depin: {
      scannerName: "Sector 7 DePIN Mesh Scanner",
      onlineNodes: 412,
      compromisedNodes: 3,
      bandwidthTaintIndex: "4.8%",
      sensorAlerts: [
        "Anomaly detected on Node #097 (Berlin, DE) - unexpected outbound metadata burst.",
        "Node #304 (Tokyo, JP) experiencing homomorphic compute throttling.",
      ],
      networkHealth: "98.2% STABLE"
    }
  });
};

export const GET = withX402(
  handler,
  {
    accepts: {
      scheme: "exact",
      price: "$0.02",
      network,
      payTo: svmAddress,
    },
    description: "Real-time global DePIN mesh network sensor diagnostic telemetry.",
  },
  x402Server
);
