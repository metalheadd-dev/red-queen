import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import {
  getThreatSwapInput,
  JUPITER_SWAP_V2_URL,
  parseUiAmount,
  THREAT_TOKEN_MINT,
} from "@/lib/jupiter";
import { getWorkingConnection, isValidSolanaPublicKey } from "@/lib/solana";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const apiKey = process.env.JUPITER_API_KEY?.trim();
  if (!apiKey) return NextResponse.json({ error: "Jupiter Swap V2 is not configured." }, { status: 503 });
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const symbol = typeof body.inputSymbol === "string" ? body.inputSymbol.toUpperCase() : "";
  const input = getThreatSwapInput(symbol);
  const taker = typeof body.taker === "string" ? body.taker.trim() : "";
  const uiAmount = typeof body.amount === "string" || typeof body.amount === "number" ? String(body.amount) : "";
  if (!input) return NextResponse.json({ error: "Only SOL or USDC can be used in the RED QUEEN $THREAT swap." }, { status: 400 });
  if (!isValidSolanaPublicKey(taker)) return NextResponse.json({ error: "A valid connected Solana wallet is required." }, { status: 400 });

  let amount: bigint;
  try {
    amount = parseUiAmount(uiAmount, input.decimals);
    const minimum = parseUiAmount(input.minimum, input.decimals);
    const maximum = parseUiAmount(input.maximum, input.decimals);
    if (amount < minimum || amount > maximum) throw new Error(`Amount must be between ${input.minimum} and ${input.maximum} ${symbol}.`);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Swap amount is invalid." }, { status: 400 });
  }

  const params = new URLSearchParams({
    inputMint: input.mint,
    outputMint: THREAT_TOKEN_MINT,
    amount: amount.toString(),
    taker,
  });
  const referralAccount = process.env.JUPITER_REFERRAL_ACCOUNT?.trim() || "";
  const referralFee = Number(process.env.JUPITER_REFERRAL_FEE_BPS || 0);
  const referralEnabled = isValidSolanaPublicKey(referralAccount) && Number.isInteger(referralFee) && referralFee >= 50 && referralFee <= 255;
  if (referralEnabled) {
    params.set("referralAccount", referralAccount);
    params.set("referralFee", String(referralFee));
  }

  try {
    const [response, connection] = await Promise.all([
      fetch(`${JUPITER_SWAP_V2_URL}/order?${params}`, {
        headers: { Accept: "application/json", "x-api-key": apiKey },
        cache: "no-store",
        signal: AbortSignal.timeout(12_000),
      }),
      getWorkingConnection(false),
    ]);
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.transaction || !data.requestId) {
      return NextResponse.json({ error: data.errorMessage || data.error || "Jupiter could not find a safe executable route for this amount." }, { status: response.status >= 400 ? response.status : 502 });
    }
    const mintAccount = await connection.getParsedAccountInfo(new PublicKey(THREAT_TOKEN_MINT), "confirmed");
    const outputDecimals = Number((mintAccount.value?.data as any)?.parsed?.info?.decimals);
    if (!Number.isInteger(outputDecimals) || outputDecimals < 0 || outputDecimals > 18) {
      return NextResponse.json({ error: "The canonical $THREAT mint decimals could not be verified. No transaction was returned." }, { status: 503 });
    }
    return NextResponse.json({
      provider: "Jupiter Swap V2",
      network: "Solana Mainnet",
      inputSymbol: symbol,
      inputMint: input.mint,
      outputSymbol: "$THREAT",
      outputMint: THREAT_TOKEN_MINT,
      outputDecimals,
      inputAmount: data.inAmount || amount.toString(),
      outputAmount: data.outAmount,
      otherAmountThreshold: data.otherAmountThreshold || null,
      swapType: data.swapType || "EXACT_IN",
      router: data.router || "JUPITER META-AGGREGATOR",
      mode: data.mode || (referralEnabled ? "manual" : "ultra"),
      priceImpactPct: data.priceImpactPct ?? null,
      platformFee: data.platformFee || null,
      feeBps: data.feeBps ?? data.platformFee?.feeBps ?? 0,
      feeMint: data.feeMint || data.platformFee?.feeMint || null,
      referral: referralEnabled ? { enabled: true, feeBps: referralFee, routingTradeoff: "JupiterZ RFQ may be unavailable when integrator fees are enabled." } : { enabled: false, feeBps: 0 },
      requestId: data.requestId,
      transaction: data.transaction,
      lastValidBlockHeight: data.lastValidBlockHeight || null,
      expiresAt: data.expireAt || null,
      routePlan: Array.isArray(data.routePlan) ? data.routePlan : [],
      safety: {
        custody: false,
        serverSigner: false,
        userApprovalRequired: true,
        outputMintLocked: THREAT_TOKEN_MINT,
        note: "The transaction is unsigned. Verify the final wallet simulation before approval.",
      },
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error && error.name === "TimeoutError" ? "Jupiter order request timed out." : "Jupiter order service is temporarily unavailable." }, { status: 503 });
  }
}
