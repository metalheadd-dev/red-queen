import { supabase } from "./supabase";

const GUEST_LIMIT = 4;
const WINDOW_MS = 24 * 60 * 60 * 1_000;
const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

export interface GuestUsageDecision {
  allowed: boolean;
  count: number;
  resetAt: string;
  persistence: "SUPABASE_METADATA" | "INSTANCE_MEMORY";
}

function consumeMemoryBucket(identityHash: string): GuestUsageDecision {
  const now = Date.now();
  const current = memoryBuckets.get(identityHash);
  const bucket = !current || current.resetAt <= now
    ? { count: 1, resetAt: now + WINDOW_MS }
    : { count: current.count + 1, resetAt: current.resetAt };
  memoryBuckets.set(identityHash, bucket);
  if (memoryBuckets.size > 2_000) {
    for (const [key, value] of memoryBuckets) {
      if (value.resetAt <= now) memoryBuckets.delete(key);
    }
  }
  return {
    allowed: bucket.count <= GUEST_LIMIT,
    count: bucket.count,
    resetAt: new Date(bucket.resetAt).toISOString(),
    persistence: "INSTANCE_MEMORY",
  };
}

export async function consumeGuestAgentRequest(identityHash: string): Promise<GuestUsageDecision> {
  if (supabase) {
    const { data, error } = await supabase.rpc("consume_guest_agent_request", {
      p_identity_hash: identityHash,
      p_limit: GUEST_LIMIT,
    });
    const row = Array.isArray(data) ? data[0] : data;
    if (!error && row && typeof row === "object") {
      const decision = row as Record<string, unknown>;
      return {
        allowed: decision.allowed === true,
        count: Number(decision.request_count) || 0,
        resetAt: typeof decision.reset_at === "string" ? decision.reset_at : new Date(Date.now() + WINDOW_MS).toISOString(),
        persistence: "SUPABASE_METADATA",
      };
    }
    console.warn("Guest usage metadata store unavailable; using instance-local privacy-safe limiter.", error?.message);
  }
  return consumeMemoryBucket(identityHash);
}
