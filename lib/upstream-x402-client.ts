import "server-only";

import { createKeyPairSignerFromBytes } from "@solana/kit";
import { x402Client, x402HTTPClient } from "@x402/core/client";
import { toClientSvmSigner, USDC_MAINNET_ADDRESS } from "@x402/svm";
import { registerExactSvmScheme } from "@x402/svm/exact/client";
import bs58 from "bs58";
import {
  releaseUpstreamSpend,
  reserveUpstreamSpend,
  settleUpstreamSpend,
  type UpstreamSpendReservation,
} from "@/lib/upstream-x402-spends";

const SOLANA_MAINNET = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";
export const RED_QUEEN_BUYER_ADDRESS = "GVf6gQpmAcc45aGxmFKu1mdVmyYcVKB7AckLAK1WVtFb";

export type UpstreamX402Receipt = {
  merchant: string;
  resource: string;
  network: string;
  asset: string;
  amountAtomic: string;
  amountUsdc: string;
  payTo: string;
  transaction: string | null;
  idempotencyKey: string;
  settledAt: string;
};

type PaidFetchInput = {
  url: string;
  method?: "GET" | "POST";
  body?: unknown;
  idempotencyKey: string;
  maxAmountAtomic: bigint;
  expectedPayTo?: string;
  timeoutMs?: number;
};

function parseSecretKey(raw: string) {
  const value = raw.trim();
  const bytes = value.startsWith("[")
    ? Uint8Array.from(JSON.parse(value) as number[])
    : bs58.decode(value);
  if (bytes.length !== 64) throw new Error("RED_QUEEN_BUYER_PRIVATE_KEY must contain a 64-byte Solana keypair.");
  return bytes;
}

function buyerSecret() {
  const value = process.env.RED_QUEEN_BUYER_PRIVATE_KEY?.trim();
  if (!value) throw new Error("RED_QUEEN_BUYER_PRIVATE_KEY is not configured.");
  return value;
}

function expectedBuyerAddress() {
  return process.env.RED_QUEEN_BUYER_ADDRESS?.trim() || RED_QUEEN_BUYER_ADDRESS;
}

function atomicUsdcLimit(name: string, fallback: string) {
  const raw = process.env[name]?.trim() || fallback;
  if (!/^\d+(\.\d{1,6})?$/.test(raw)) return BigInt(0);
  const [whole, fraction = ""] = raw.split(".");
  return BigInt(whole) * BigInt(1_000_000) + BigInt(fraction.padEnd(6, "0"));
}

export function upstreamBuyerReadiness() {
  const expectedAddress = expectedBuyerAddress();
  const configuredSecret = process.env.RED_QUEEN_BUYER_PRIVATE_KEY?.trim() || "";
  try {
    const bytes = parseSecretKey(configuredSecret || buyerSecret());
    const derivedAddress = bs58.encode(bytes.slice(32));
    const addressMatches = derivedAddress === expectedAddress;
    return {
      ready: addressMatches,
      keyConfigured: true,
      expectedAddress,
      derivedAddress,
      addressMatches,
      reason: addressMatches ? null : "The configured buyer key does not match the approved RED QUEEN buyer address.",
    };
  } catch {
    return {
      ready: false,
      keyConfigured: Boolean(configuredSecret),
      expectedAddress,
      derivedAddress: null,
      addressMatches: false,
      reason: "The dedicated RED QUEEN buyer key is not configured.",
    };
  }
}

export function upstreamBuyerPolicy() {
  const perCallAtomic = atomicUsdcLimit("RED_QUEEN_BUYER_MAX_CALL_USDC", "0.03");
  const dailyAtomic = atomicUsdcLimit("RED_QUEEN_BUYER_DAILY_LIMIT_USDC", "1.00");
  return {
    asset: "USDC",
    network: SOLANA_MAINNET,
    maxPerCall: `${(Number(perCallAtomic) / 1_000_000).toFixed(2)} USDC`,
    dailyLimit: `${(Number(dailyAtomic) / 1_000_000).toFixed(2)} USDC`,
    autonomousBudget: false,
  };
}

function parseJsonSafely(text: string) {
  if (!text) return null;
  try { return JSON.parse(text); } catch { return { raw: text.slice(0, 2_000) }; }
}

function assertAllowedUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.hostname !== "agent402.tools") {
    throw new Error("Upstream x402 merchant is not allowlisted.");
  }
  if (url.pathname !== "/api/search" && url.pathname !== "/api/extract") {
    throw new Error("Upstream x402 resource is not allowlisted.");
  }
  return url;
}

export function upstreamBuyerReady() {
  return upstreamBuyerReadiness().ready;
}

export async function paidAgent402Fetch(input: PaidFetchInput) {
  const url = assertAllowedUrl(input.url);
  const method = input.method || "GET";
  const serializedBody = method === "POST" ? JSON.stringify(input.body ?? {}) : undefined;
  const baseHeaders: Record<string, string> = {
    Accept: "application/json",
    "Idempotency-Key": input.idempotencyKey,
  };
  if (serializedBody) baseHeaders["Content-Type"] = "application/json";

  const request = (extraHeaders: Record<string, string> = {}) => fetch(url, {
    method,
    headers: { ...baseHeaders, ...extraHeaders },
    body: serializedBody,
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(input.timeoutMs || 25_000),
  });

  let response = await request();
  if (response.ok) {
    return { data: parseJsonSafely(await response.text()), receipt: null as UpstreamX402Receipt | null };
  }
  if (response.status !== 402) {
    throw new Error(`Agent402 preflight returned HTTP ${response.status}.`);
  }

  const challengeBody = parseJsonSafely(await response.clone().text());
  const keypair = await createKeyPairSignerFromBytes(parseSecretKey(buyerSecret()));
  if (String(keypair.address) !== expectedBuyerAddress()) {
    throw new Error("The configured buyer signer does not match the approved RED QUEEN buyer address.");
  }
  const coreClient = new x402Client();
  registerExactSvmScheme(coreClient, {
    signer: toClientSvmSigner(keypair),
    networks: [SOLANA_MAINNET],
    policies: [(_version, requirements) => requirements.filter((requirement) => {
      const amount = typeof requirement.amount === "string" && /^\d+$/.test(requirement.amount)
        ? BigInt(requirement.amount)
        : BigInt(0);
      return requirement.scheme === "exact"
        && requirement.network === SOLANA_MAINNET
        && requirement.asset === USDC_MAINNET_ADDRESS
        && amount > BigInt(0)
        && amount <= input.maxAmountAtomic
        && (!input.expectedPayTo || requirement.payTo === input.expectedPayTo);
    })],
  });
  const httpClient = new x402HTTPClient(coreClient);
  const paymentRequired = httpClient.getPaymentRequiredResponse(
    (name) => response.headers.get(name),
    challengeBody,
  );
  const accepted = paymentRequired.accepts.find((requirement) => (
    requirement.scheme === "exact"
    && requirement.network === SOLANA_MAINNET
    && requirement.asset === USDC_MAINNET_ADDRESS
    && /^\d+$/.test(requirement.amount)
    && BigInt(requirement.amount) <= input.maxAmountAtomic
    && (!input.expectedPayTo || requirement.payTo === input.expectedPayTo)
  ));
  if (!accepted) throw new Error("Agent402 did not offer an allowlisted Solana USDC payment within the operation cap.");

  const configuredCallLimit = atomicUsdcLimit("RED_QUEEN_BUYER_MAX_CALL_USDC", "0.03");
  const dailyLimit = atomicUsdcLimit("RED_QUEEN_BUYER_DAILY_LIMIT_USDC", "1.00");
  if (configuredCallLimit <= BigInt(0) || dailyLimit <= BigInt(0) || BigInt(accepted.amount) > configuredCallLimit) {
    throw new Error("The upstream payment exceeds the configured RED QUEEN buyer-wallet spending policy.");
  }

  let reservation: UpstreamSpendReservation | null = await reserveUpstreamSpend({
    operationKey: input.idempotencyKey,
    merchant: "Agent402.Tools",
    resource: `${url.origin}${url.pathname}`,
    network: String(accepted.network),
    asset: accepted.asset,
    amountAtomic: BigInt(accepted.amount),
    dailyLimitAtomic: dailyLimit,
  });

  try {
    const paymentPayload = await httpClient.createPaymentPayload(paymentRequired);
    const paymentHeaders = httpClient.encodePaymentSignatureHeader(paymentPayload);
    for (let attempt = 1; attempt <= 4; attempt += 1) {
      response = await request(paymentHeaders);
      if (response.status !== 402 || attempt === 4) break;
      await new Promise((resolve) => setTimeout(resolve, 1_250 * attempt));
    }
    const paymentResult = await httpClient.processPaymentResult(
      paymentPayload,
      (name) => response.headers.get(name),
      response.status,
    );
    const responseText = await response.text();
    if (!response.ok) {
      const failure = parseJsonSafely(responseText) as Record<string, unknown> | null;
      throw new Error(String(failure?.error || failure?.message || `Agent402 settlement returned HTTP ${response.status}.`));
    }
    if (paymentResult.settleResponse && !paymentResult.settleResponse.success) {
      throw new Error(paymentResult.settleResponse.errorReason || "Agent402 settlement was not confirmed.");
    }

    const receipt: UpstreamX402Receipt = {
      merchant: "Agent402.Tools",
      resource: `${url.origin}${url.pathname}`,
      network: String(accepted.network),
      asset: accepted.asset,
      amountAtomic: accepted.amount,
      amountUsdc: (Number(accepted.amount) / 1_000_000).toFixed(3),
      payTo: accepted.payTo,
      transaction: paymentResult.settleResponse?.transaction || null,
      idempotencyKey: input.idempotencyKey,
      settledAt: new Date().toISOString(),
    };
    await settleUpstreamSpend(reservation, receipt.transaction);
    reservation = null;
    return { data: parseJsonSafely(responseText), receipt };
  } finally {
    if (reservation) await releaseUpstreamSpend(reservation);
  }
}
