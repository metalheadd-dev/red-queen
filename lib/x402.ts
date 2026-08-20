import { facilitator } from "@payai/facilitator";
import { HTTPFacilitatorClient, x402ResourceServer } from "@x402/core/server";
import { registerExactSvmScheme } from "@x402/svm/exact/server";
import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";
import { randomUUID } from "crypto";
import {
  checkX402OperationStore,
  findX402Operation,
  fingerprint,
  persistX402Delivery,
} from "@/lib/x402-operations";
import { isValidSolanaPublicKey } from "@/lib/solana";

// Fallback to PayAI's default facilitator endpoint if not configured
const facilitatorUrl = process.env.PAYAI_FACILITATOR_URL || "https://facilitator.payai.network";

const config = {
  ...facilitator,
  url: facilitatorUrl,
};

let x402Server: x402ResourceServer | null = null;

function getX402Server() {
  if (x402Server) return x402Server;
  const facilitatorClient = new HTTPFacilitatorClient(config);
  x402Server = new x402ResourceServer(facilitatorClient);
  registerExactSvmScheme(x402Server);
  return x402Server;
}

/**
 * Enhanced x402 middleware wrapper.
 * Intercepts 402 (Payment Required) status responses.
 * If the request comes from a standard browser (Accepts text/html),
 * it serves a gorgeous, user-friendly, theme-compliant HTML gate page
 * directing the user to the on-chain hub, while maintaining necessary x402 headers.
 */
export function withFriendlyX402(
  routeHandler: (req: NextRequest) => Promise<NextResponse>,
  routeConfig: any
) {
  return async (req: NextRequest) => {
    const { preflight, ...paymentRouteConfig } = routeConfig || {};
    const payTo = paymentRouteConfig?.accepts?.payTo;
    if (typeof payTo !== "string" || !isValidSolanaPublicKey(payTo.trim())) {
      return NextResponse.json({
        error: "Paid intelligence is unavailable because the receiving SVM address is missing or invalid.",
      }, { status: 503 });
    }

    if (typeof preflight === "function") {
      // A NextRequest clone is a standard Request and no longer exposes
      // `nextUrl`. Preflight functions that validate GET query parameters
      // must receive the original request. POST preflights clone only their
      // body internally, so the protected handler can still read it later.
      const preflightResponse = await preflight(req);
      if (preflightResponse) return preflightResponse;
    }

    const requestedOperationId = req.headers.get("x-operation-id")?.trim();
    if (requestedOperationId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestedOperationId)) {
      return NextResponse.json({ error: "X-Operation-Id must be a valid UUID." }, { status: 400 });
    }

    const operationId = requestedOperationId || randomUUID();
    const receiptStore = await checkX402OperationStore();
    if (!receiptStore.available) {
      return NextResponse.json({
        error: receiptStore.reason || "x402 receipt storage is unavailable.",
        operationId,
      }, { status: 503, headers: { "X-Operation-Id": operationId } });
    }

    const productId = String(paymentRouteConfig?.productId || new URL(req.url).pathname);
    const requestBody = req.method === "GET" || req.method === "HEAD"
      ? ""
      : await req.clone().text().catch(() => "");
    const requestFingerprint = fingerprint(`${req.method}\n${new URL(req.url).pathname}${new URL(req.url).search}\n${requestBody}\n${productId}`);
    const paymentHeader = req.headers.get("payment-signature") || req.headers.get("x-payment");
    const paymentFingerprint = paymentHeader ? fingerprint(paymentHeader) : null;

    let existing;
    try {
      existing = await findX402Operation(operationId);
    } catch {
      return NextResponse.json({
        error: "x402 receipt lookup is unavailable. No payment was requested.",
        operationId,
      }, { status: 503, headers: { "X-Operation-Id": operationId } });
    }
    if (existing) {
      const exactReplay = paymentFingerprint
        && existing.product_id === productId
        && existing.request_fingerprint === requestFingerprint
        && existing.payment_fingerprint === paymentFingerprint;

      if (!exactReplay) {
        return NextResponse.json({
          error: "This operation ID is already bound to another delivered payment.",
          operationId,
        }, { status: 409, headers: { "X-Operation-Id": operationId } });
      }

      return NextResponse.json(existing.response_body, {
        status: 200,
        headers: {
          "X-Operation-Id": operationId,
          "X-Idempotent-Replay": "true",
          "X-Receipt-Status": "stored",
          "Payment-Response": Buffer.from(JSON.stringify(existing.settlement)).toString("base64"),
          "Cache-Control": "private, no-store",
        },
      });
    }

    // Initialize only for an actual paid resource request. Importing an API route
    // during build must never contact an external facilitator.
    const innerMiddleware = withX402(routeHandler, paymentRouteConfig, getX402Server());
    let res: NextResponse;

    try {
      res = await innerMiddleware(req);
    } catch (error) {
      console.error(`x402 gateway failure for ${productId}`, error);

      return NextResponse.json(
        {
          success: false,
          error:
            "The x402 payment gateway is temporarily unavailable. No payment was requested or settled. Please retry shortly.",
          operationId,
        },
        {
          status: 503,
          headers: {
            "X-Operation-Id": operationId,
            "Cache-Control": "private, no-store",
          },
        },
      );
    }

    res.headers.set("X-Operation-Id", operationId);
    res.headers.set("Cache-Control", "private, no-store");

    const settlementHeader = res.headers.get("payment-response") || res.headers.get("x-payment-response");
    if (res.status === 200 && paymentHeader && paymentFingerprint && settlementHeader) {
      try {
        const settlement = JSON.parse(Buffer.from(settlementHeader, "base64").toString("utf-8"));
        const responseBody = await res.clone().json();
        const receipt = await persistX402Delivery({
          operationId,
          productId,
          requestFingerprint,
          paymentFingerprint,
          scheme: String(paymentRouteConfig.accepts.scheme),
          network: String(paymentRouteConfig.accepts.network),
          price: String(paymentRouteConfig.accepts.price),
          payTo,
          settlement,
          responseBody,
        });
        res.headers.set("X-Receipt-Status", receipt.stored ? "stored" : "failed");
        if (!receipt.stored) console.error(`x402 operation ${operationId}: ${receipt.reason}`);
      } catch (error) {
        console.error(`x402 operation ${operationId}: receipt encoding failed`, error);
        res.headers.set("X-Receipt-Status", "failed");
      }
    }

    if (res.status === 402) {
        const acceptsHtml = req.headers.get("accept")?.includes("text/html");
      if (acceptsHtml) {
        const paymentRequiredHeader = res.headers.get("payment-required") || res.headers.get("x-payment-required");
        const configuredPrice = String(paymentRouteConfig.accepts?.price || "PRICE UNAVAILABLE");
        let amountStr = `${configuredPrice} USDC`;
        let destination = payTo;
        
        if (paymentRequiredHeader) {
          try {
            const paymentInfo = JSON.parse(Buffer.from(paymentRequiredHeader, "base64").toString("utf-8"));
            const accept = paymentInfo.accepts?.[0];
            if (accept) {
              const amount = accept.amount;
              const decimals = 6; // USDC decimals
              const uiAmount = (Number(amount) / Math.pow(10, decimals)).toFixed(2);
              amountStr = `$${uiAmount} USDC`;
              destination = accept.payTo;
            }
          } catch (e) {
            console.error("Failed to parse payment details:", e);
          }
        } else {
          amountStr = paymentRouteConfig.accepts?.price || "$0.01 USDC";
          destination = paymentRouteConfig.accepts?.payTo || destination;
        }

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RED QUEEN | Restricted Intelligence Dossier</title>
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;800;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #000000;
      --surface: #0a0a0a;
      --panel: #0f0f0f;
      --border: rgba(255, 77, 77, 0.2);
      --accent: #ff4d4d;
      --accent-glow: rgba(255, 77, 77, 0.15);
      --text: #e8e8e8;
      --text-dim: #b0b0b0;
      --mono: 'JetBrains Mono', monospace;
      --title-font: 'Orbitron', sans-serif;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--mono);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      overflow: hidden;
      position: relative;
    }

    /* Scanline overlay */
    body::before {
      content: "";
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: 
        linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%),
        linear-gradient(90deg, rgba(255, 0, 0, 0.04), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.04));
      background-size: 100% 4px, 6px 100%;
      pointer-events: none;
      z-index: 10;
    }

    body::after {
      content: "";
      position: absolute;
      top: -50%; left: -50%; right: -50%; bottom: -50%;
      background: radial-gradient(circle, rgba(255, 77, 77, 0.05) 0%, rgba(0, 0, 0, 0) 70%);
      pointer-events: none;
      z-index: 1;
    }

    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 2px;
      padding: 40px 32px;
      max-width: 520px;
      width: 100%;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8), 0 0 30px rgba(255, 77, 77, 0.03);
      z-index: 5;
      text-align: center;
      position: relative;
      border-top: 3px solid var(--accent);
    }

    .logo-container {
      margin-bottom: 24px;
      display: flex;
      justify-content: center;
    }

    .logo {
      width: 72px;
      height: 72px;
      filter: drop-shadow(0 0 6px var(--accent));
      animation: pulse 4s infinite ease-in-out;
    }

    @keyframes pulse {
      0%, 100% { opacity: 0.8; filter: drop-shadow(0 0 4px var(--accent)); }
      50% { opacity: 1; filter: drop-shadow(0 0 14px var(--accent)); }
    }

    .tag {
      display: inline-block;
      font-family: var(--mono);
      font-size: 11px;
      font-weight: bold;
      color: var(--accent);
      border: 1px solid var(--accent);
      padding: 3px 10px;
      letter-spacing: 0.15em;
      margin-bottom: 20px;
      background: rgba(255, 77, 77, 0.05);
    }

    h1 {
      font-family: var(--title-font);
      font-size: 22px;
      font-weight: 900;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 16px;
      color: #ffffff;
      text-shadow: 0 0 8px rgba(255, 77, 77, 0.25);
    }

    p {
      color: var(--text-dim);
      font-size: 13.5px;
      line-height: 1.7;
      margin-bottom: 28px;
      text-align: left;
    }

    .meta-box {
      background: rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.03);
      padding: 16px;
      margin-bottom: 28px;
      text-align: left;
      font-size: 12.5px;
      border-left: 2px solid var(--accent);
    }

    .meta-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
    }

    .meta-row:last-child {
      margin-bottom: 0;
    }

    .meta-label {
      color: rgba(255, 255, 255, 0.35);
      letter-spacing: 0.08em;
    }

    .meta-val {
      color: var(--accent);
      font-weight: bold;
      word-break: break-all;
    }

    .btn {
      display: block;
      width: 100%;
      text-align: center;
      background: var(--accent);
      color: #000000;
      font-family: var(--mono);
      font-size: 12.5px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      text-decoration: none;
      padding: 14px;
      border-radius: 2px;
      cursor: pointer;
      transition: all 0.18s ease;
      box-shadow: 0 4px 10px rgba(255, 77, 77, 0.15);
    }

    .btn:hover {
      background: #ff6666;
      box-shadow: 0 0 16px rgba(255, 77, 77, 0.4);
      transform: translateY(-1px);
    }

    .footnote {
      margin-top: 20px;
      font-size: 11px;
      color: rgba(255, 255, 255, 0.2);
      letter-spacing: 0.05em;
    }

    .footnote a {
      color: var(--accent);
      text-decoration: none;
    }

    .footnote a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>

  <div class="card">
    <div class="logo-container">
      <svg class="logo" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" stroke="var(--accent)" stroke-width="2" fill="none" stroke-dasharray="6, 6" />
        <circle cx="50" cy="50" r="25" stroke="var(--accent)" stroke-width="1.5" fill="none" opacity="0.6" />
        <path d="M 50 5 L 50 20 M 50 80 L 50 95 M 5 50 L 20 50 M 80 50 L 95 50" stroke="var(--accent)" stroke-width="2.5" />
        <circle cx="50" cy="50" r="5" fill="var(--accent)" />
      </svg>
    </div>

    <div class="tag">RESTRICTED APOCALYPSE BRIEFING // x402</div>

    <h1>Dossier Decryption Locked</h1>

    <p>
      This strategic briefing uses an on-chain x402 micropayment to fund the AI compute required to produce it. Review the network, exact USDC price and receiving wallet before approving any payment.
    </p>

    <div class="meta-box">
      <div class="meta-row">
        <span class="meta-label">GATEWAY METRIC:</span>
        <span class="meta-val">HTTP 402 PAYMENT REQUIRED</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">PROTOCOL STANDARD:</span>
        <span class="meta-val">x402 SVM EXACT SCHEME</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">FEE TO DECRYPT:</span>
        <span class="meta-val">${amountStr}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">TARGET TREASURY:</span>
        <span class="meta-val">${destination.slice(0, 8)}...${destination.slice(-8)}</span>
      </div>
    </div>

    <a href="/onchain" class="btn">Open Onchain Hub</a>

    <div class="footnote">
      A wallet connection alone does not authorize payment. Inspect and approve the exact request from the <a href="/onchain">Onchain Hub</a>.
    </div>
  </div>

</body>
</html>`;

        const headers = new Headers(res.headers);
        headers.set("Content-Type", "text/html");
        return new NextResponse(html, {
          status: 402,
          headers
        });
      }
    }

    return res;
  };
}

/**
 * Deprecated compatibility export. Payments must never create readiness or XP.
 * Kept temporarily so older integrations fail closed during migration.
 */
export async function awardXpForPaywall(
  _token: string,
  paywallId: string,
  _xpAmount = 50
): Promise<{ success: boolean; xpGained: number } | null> {
  console.warn(`Ignoring deprecated x402 XP request for ${paywallId}. Purchases do not award progression.`);
  return { success: false, xpGained: 0 };
}
