import { NextRequest, NextResponse } from "next/server";
import { withFriendlyX402 } from "@/lib/x402";

const svmAddress = process.env.SVM_ADDRESS || "AUCYMsSZXASMiXfjLNL26NF7sPehUA4ncEzTCx8MdSYg";
const network = (process.env.SVM_NETWORK || "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp") as any;

const handler = async (req: NextRequest) => {
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    clearance: "LEVEL 5 DIRECTOR (USDC-PAID)",
    intel: {
      headline: "CRITICAL VECTOR ESCALATION BRIEFING: GLOBAL DECAY MULTIPLIERS",
      summary: "Synthetic AI containment fields in Sector Delta are experiencing 14% higher adversarial pressure. Web2 metadata mapping shows active compliance tags being cross-referenced with on-chain wallet signatures. Prepare contingency airgaps.",
      threatVectors: [
        { id: "T-VIRUS", rating: "94%", trend: "STABLE", status: "RED" },
        { id: "AI-TAKEOVER", rating: "91%", trend: "ACCELERATING", status: "RED" },
        { id: "EMP-STRIKE", rating: "82%", trend: "ELEVATED", status: "YELLOW" },
      ],
      directive: "Implement adversarial prompt jitter. Purge active OAuth cookies every 24 hours. Limit outbound wallet trace paths."
    }
  });
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
