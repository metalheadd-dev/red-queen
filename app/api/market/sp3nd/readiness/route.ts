import { NextResponse } from "next/server";
import { sp3ndReadiness } from "@/lib/sp3nd";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(sp3ndReadiness(), { headers: { "Cache-Control": "private, no-store" } });
}
