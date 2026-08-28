import { NextResponse } from "next/server";
import { buildX402Manifest } from "@/lib/x402-discovery";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Payment-Signature, X-Operation-Id",
};

export async function GET() {
  return NextResponse.json(buildX402Manifest(), {
    headers: {
      ...corsHeaders,
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
