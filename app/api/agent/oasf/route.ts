import { NextResponse } from "next/server";
import {
  RED_QUEEN_AGENT_DOMAINS,
  RED_QUEEN_AGENT_SKILLS,
} from "@/lib/agent-registry";

export async function GET() {
  return NextResponse.json({
    version: "0.8",
    agent: "RED QUEEN",
    skills: RED_QUEEN_AGENT_SKILLS,
    domains: RED_QUEEN_AGENT_DOMAINS,
    boundaries: [
      "Evidence and uncertainty remain visible.",
      "No seed phrases, private keys or custody.",
      "No automatic transaction approval.",
      "Paid intelligence never creates BIO-SCORE or readiness.",
    ],
  }, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
