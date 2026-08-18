import { NextRequest, NextResponse } from "next/server";
import { JUPITER_SWAP_V2_URL } from "@/lib/jupiter";

export const dynamic = "force-dynamic";

function validBase64(value: string) {
  return value.length >= 80 && value.length <= 240_000 && /^[A-Za-z0-9+/]+={0,2}$/.test(value);
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.JUPITER_API_KEY?.trim();
  if (!apiKey) return NextResponse.json({ error: "Jupiter Swap V2 is not configured." }, { status: 503 });
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const requestId = typeof body.requestId === "string" ? body.requestId.trim().slice(0, 180) : "";
  const signedTransaction = typeof body.signedTransaction === "string" ? body.signedTransaction.trim() : "";
  const lastValidBlockHeight = typeof body.lastValidBlockHeight === "string" || typeof body.lastValidBlockHeight === "number"
    ? String(body.lastValidBlockHeight)
    : undefined;
  if (!requestId) return NextResponse.json({ error: "Jupiter request ID is required." }, { status: 400 });
  if (!validBase64(signedTransaction)) return NextResponse.json({ error: "A valid signed Jupiter transaction is required." }, { status: 400 });

  try {
    const response = await fetch(`${JUPITER_SWAP_V2_URL}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", "x-api-key": apiKey },
      body: JSON.stringify({ signedTransaction, requestId, ...(lastValidBlockHeight ? { lastValidBlockHeight } : {}) }),
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.status !== "Success") {
      return NextResponse.json({
        success: false,
        status: data.status || "Failed",
        signature: data.signature || null,
        code: data.code ?? null,
        error: data.error || data.errorMessage || "Jupiter did not confirm the swap.",
      }, { status: response.status >= 400 ? response.status : 422 });
    }
    return NextResponse.json({
      success: true,
      status: data.status,
      signature: data.signature,
      slot: data.slot || null,
      inputAmountResult: data.inputAmountResult || data.totalInputAmount || null,
      outputAmountResult: data.outputAmountResult || data.totalOutputAmount || null,
      swapEvents: Array.isArray(data.swapEvents) ? data.swapEvents : [],
      explorer: `https://explorer.solana.com/tx/${data.signature}`,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error && error.name === "TimeoutError" ? "Jupiter execution timed out. Check the wallet signature in Explorer before retrying." : "Jupiter execution service is temporarily unavailable." }, { status: 503 });
  }
}
