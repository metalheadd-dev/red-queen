import { NextRequest, NextResponse } from "next/server";
import { externalIntelligenceQuote, parseExternalIntelligenceInput } from "@/lib/external-survival-intelligence";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const input = parseExternalIntelligenceInput(await request.json().catch(() => null));
  if (!input) return NextResponse.json({ success: false, error: "A broad area and bounded survival-intelligence question are required." }, { status: 400 });
  const quote = externalIntelligenceQuote(input);
  return NextResponse.json({
    success: true,
    quote,
    notice: quote.eligible
      ? "Review the merchant, disclosed data and maximum upstream cost. No external call or payment has occurred."
      : "Buyer flow remains disabled until the dedicated buyer wallet and synthesis compute are configured.",
  }, { headers: { "Cache-Control": "private, no-store" } });
}
