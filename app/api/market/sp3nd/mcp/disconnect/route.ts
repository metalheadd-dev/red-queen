import { NextResponse } from "next/server";
import { RED_QUEEN_ORIGIN, SP3ND_PROPOSAL_COOKIE, SP3ND_SESSION_COOKIE } from "@/lib/sp3nd-mcp";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (process.env.NODE_ENV === "production" && origin !== RED_QUEEN_ORIGIN) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const response = NextResponse.json({ disconnected: true });
  response.cookies.delete(SP3ND_SESSION_COOKIE);
  response.cookies.delete(SP3ND_PROPOSAL_COOKIE);
  return response;
}
