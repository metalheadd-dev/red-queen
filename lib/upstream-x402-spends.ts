import "server-only";

import { supabase } from "@/lib/supabase";

export type UpstreamSpendReservation = {
  operationKey: string;
  amountAtomic: bigint;
};

export async function checkUpstreamSpendStore() {
  if (!supabase) return { available: false, reason: "Supabase service storage is not configured." };
  const { error } = await supabase.from("upstream_x402_spends").select("id").limit(1);
  return error
    ? { available: false, reason: "The upstream buyer-spend ledger is unavailable or not migrated." }
    : { available: true, reason: null };
}

export async function reserveUpstreamSpend(input: {
  operationKey: string;
  merchant: string;
  resource: string;
  network: string;
  asset: string;
  amountAtomic: bigint;
  dailyLimitAtomic: bigint;
}) {
  if (!supabase) throw new Error("The upstream buyer-spend ledger is not configured.");
  const { data, error } = await supabase.rpc("reserve_upstream_x402_spend", {
    p_operation_key: input.operationKey,
    p_merchant: input.merchant,
    p_resource: input.resource,
    p_network: input.network,
    p_asset: input.asset,
    p_amount_atomic: input.amountAtomic.toString(),
    p_daily_limit_atomic: input.dailyLimitAtomic.toString(),
  });
  if (error) {
    console.error("Upstream x402 spend reservation failed:", error.message);
    throw new Error("The upstream buyer-spend ledger rejected the reservation.");
  }
  if (data !== true) throw new Error("The RED QUEEN buyer-wallet daily spending limit has been reached.");
  return { operationKey: input.operationKey, amountAtomic: input.amountAtomic } satisfies UpstreamSpendReservation;
}

export async function settleUpstreamSpend(reservation: UpstreamSpendReservation, transactionSignature: string | null) {
  if (!supabase) return false;
  const { error } = await supabase
    .from("upstream_x402_spends")
    .update({
      status: "settled",
      transaction_signature: transactionSignature,
      settled_at: new Date().toISOString(),
    })
    .eq("operation_key", reservation.operationKey)
    .eq("amount_atomic", reservation.amountAtomic.toString())
    .eq("status", "reserved");
  if (error) console.error("Upstream x402 spend settlement persistence failed:", error.message);
  return !error;
}

export async function releaseUpstreamSpend(reservation: UpstreamSpendReservation) {
  if (!supabase) return false;
  const { error } = await supabase
    .from("upstream_x402_spends")
    .update({ status: "released" })
    .eq("operation_key", reservation.operationKey)
    .eq("amount_atomic", reservation.amountAtomic.toString())
    .eq("status", "reserved");
  if (error) console.error("Upstream x402 spend reservation release failed:", error.message);
  return !error;
}
