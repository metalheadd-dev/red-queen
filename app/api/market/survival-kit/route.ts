import { NextRequest, NextResponse } from "next/server";
import { buildSurvivalKit, parseSurvivalKitInput } from "@/lib/survival-market";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const input = parseSurvivalKitInput(await request.json().catch(() => null));
  if (!input) return NextResponse.json({ success: false, error: "Enter a broad city or region and a valid household size." }, { status: 400 });
  return NextResponse.json({ success: true, kit: buildSurvivalKit(input) }, { headers: { "Cache-Control": "private, no-store" } });
}
