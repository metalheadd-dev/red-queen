import { SOLANA_MAINNET_CAIP2 } from "@/lib/onchain";

export const dynamic = "force-dynamic";

const facilitatorUrl = process.env.PAYAI_FACILITATOR_URL || "https://facilitator.payai.network";
const configuredNetwork = process.env.SVM_NETWORK || SOLANA_MAINNET_CAIP2;
const configuredRecipient = process.env.SVM_ADDRESS?.trim() || "";

function facilitatorHost() {
  try {
    return new URL(facilitatorUrl).host;
  } catch {
    return "INVALID FACILITATOR URL";
  }
}

export async function GET() {
  if (!configuredRecipient) {
    return Response.json({
      available: false,
      x402Version: 2,
      scheme: "exact",
      network: configuredNetwork,
      facilitator: facilitatorHost(),
      checkedAt: new Date().toISOString(),
      reason: "SVM_ADDRESS is not configured. Paid operations are disabled.",
    }, { headers: { "Cache-Control": "no-store" } });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4_000);
  try {
    const response = await fetch(`${facilitatorUrl.replace(/\/$/, "")}/supported`, {
      signal: controller.signal,
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Facilitator returned ${response.status}`);
    const data = await response.json();
    const kinds = Array.isArray(data.kinds) ? data.kinds : [];
    const exactSvm = kinds.some((kind: Record<string, unknown>) => (
      kind.scheme === "exact" && kind.network === configuredNetwork && Number(kind.x402Version) === 2
    ));
    return Response.json({
      available: exactSvm,
      x402Version: 2,
      scheme: "exact",
      network: configuredNetwork,
      facilitator: facilitatorHost(),
      checkedAt: new Date().toISOString(),
      reason: exactSvm ? null : "Configured facilitator does not advertise x402 v2 exact SVM for this network.",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({
      available: false,
      x402Version: 2,
      scheme: "exact",
      network: configuredNetwork,
      facilitator: facilitatorHost(),
      checkedAt: new Date().toISOString(),
      reason: error instanceof Error && error.name === "AbortError"
        ? "Facilitator health check timed out."
        : "Facilitator health check failed.",
    }, { headers: { "Cache-Control": "no-store" } });
  } finally {
    clearTimeout(timeout);
  }
}
