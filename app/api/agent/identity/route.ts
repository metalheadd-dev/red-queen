import { NextResponse } from "next/server";
import {
  buildRedQueenRegistrationFile,
  getRedQueenAgentIdentity,
} from "@/lib/agent-registry";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    identity: getRedQueenAgentIdentity(),
    registrationFile: buildRedQueenRegistrationFile(),
  }, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=60, s-maxage=60",
    },
  });
}
