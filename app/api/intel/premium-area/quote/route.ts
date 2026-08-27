import { NextResponse } from "next/server";
import { premiumProviderQuote } from "@/lib/premium-survival-intelligence";

export const dynamic = "force-dynamic";

export async function GET() {
  const quote = premiumProviderQuote();
  return NextResponse.json({
    success: true,
    quote,
    notice: quote.eligible
      ? "Premium procurement is ready. No provider call has been made and no payment has been requested."
      : "Premium procurement is not active until the required server-side data provider is configured.",
  }, { headers: { "Cache-Control": "private, no-store" } });
}
