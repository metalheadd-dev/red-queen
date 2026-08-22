import { NextResponse } from "next/server";
import { buildRedQueenRegistrationFile } from "@/lib/agent-registry";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(buildRedQueenRegistrationFile(), {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
