import { NextResponse } from "next/server";
import { checkedPremiumProviderQuote } from "@/lib/premium-survival-intelligence";

export const dynamic = "force-dynamic";

export async function GET() {
  const quote = await checkedPremiumProviderQuote();
  return NextResponse.json({
    success: true,
    quote,
    notice: quote.eligible
      ? "Off-Nadir access and credits checked. No metered data call or payment has occurred. OpenWeather access is checked when the report runs."
      : quote.reason,
  }, { headers: { "Cache-Control": "private, no-store" } });
}
