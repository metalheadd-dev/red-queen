import { createHash } from "crypto";
import { supabase } from "@/lib/supabase";

export type StoredX402Operation = {
  operation_id: string;
  product_id: string;
  request_fingerprint: string;
  payment_fingerprint: string;
  status: "delivered";
  transaction_signature: string | null;
  settlement: Record<string, unknown>;
  response_body: unknown;
};

export type X402ReceiptSummary = {
  operation_id: string;
  product_id: string;
  status: "delivered";
  scheme: string;
  network: string;
  price: string;
  payer: string | null;
  transaction_signature: string | null;
  created_at: string;
  delivered_at: string;
};

export function fingerprint(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function checkX402OperationStore() {
  if (!supabase) {
    return { available: false, reason: "Supabase service storage is not configured." };
  }

  const { error } = await supabase.from("x402_operations").select("operation_id").limit(1);
  return error
    ? { available: false, reason: "x402 receipt storage is unavailable or not migrated." }
    : { available: true, reason: null };
}

export async function findX402Operation(operationId: string) {
  if (!supabase) throw new Error("Supabase service storage is not configured.");
  const { data, error } = await supabase
    .from("x402_operations")
    .select("operation_id, product_id, request_fingerprint, payment_fingerprint, status, transaction_signature, settlement, response_body")
    .eq("operation_id", operationId)
    .maybeSingle();

  if (error) {
    console.error("x402 receipt lookup failed:", error.message);
    throw new Error("x402 receipt lookup failed.");
  }
  return data as StoredX402Operation | null;
}

export async function listX402ReceiptsForPayer(payer: string, limit = 12) {
  if (!supabase) throw new Error("Supabase service storage is not configured.");
  const { data, error } = await supabase
    .from("x402_operations")
    .select("operation_id, product_id, status, scheme, network, price, payer, transaction_signature, created_at, delivered_at")
    .eq("payer", payer)
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 50));
  if (error) {
    console.error("x402 receipt history lookup failed:", error.message);
    throw new Error("x402 receipt history is unavailable.");
  }
  return (data || []) as X402ReceiptSummary[];
}

export async function persistX402Delivery(input: {
  operationId: string;
  productId: string;
  requestFingerprint: string;
  paymentFingerprint: string;
  scheme: string;
  network: string;
  price: string;
  payTo: string;
  settlement: Record<string, unknown>;
  responseBody: unknown;
}) {
  if (!supabase) return { stored: false, reason: "Supabase service storage is not configured." };

  const transaction = typeof input.settlement.transaction === "string"
    ? input.settlement.transaction
    : null;
  const payer = typeof input.settlement.payer === "string" ? input.settlement.payer : null;

  const { error } = await supabase.from("x402_operations").insert({
    operation_id: input.operationId,
    product_id: input.productId,
    request_fingerprint: input.requestFingerprint,
    payment_fingerprint: input.paymentFingerprint,
    status: "delivered",
    scheme: input.scheme,
    network: input.network,
    price: input.price,
    pay_to: input.payTo,
    payer,
    transaction_signature: transaction,
    settlement: input.settlement,
    response_body: input.responseBody,
    delivered_at: new Date().toISOString(),
  });

  if (!error) return { stored: true, reason: null };
  if (error.code === "23505") {
    try {
      const existing = await findX402Operation(input.operationId);
      const sameDelivery = existing
        && existing.product_id === input.productId
        && existing.request_fingerprint === input.requestFingerprint
        && existing.payment_fingerprint === input.paymentFingerprint;
      return sameDelivery
        ? { stored: true, reason: null }
        : { stored: false, reason: "Operation ID is already bound to another payment request." };
    } catch {
      return { stored: false, reason: "Existing receipt could not be verified." };
    }
  }

  console.error("x402 receipt persistence failed:", error.message);
  return { stored: false, reason: "Receipt persistence failed." };
}
