import { THREAT_TOKEN_MINT } from "@/lib/threat-token";

export const SOL_MINT = "So11111111111111111111111111111111111111112";
export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const JUPITER_SWAP_V2_URL = "https://api.jup.ag/swap/v2";

export const THREAT_SWAP_INPUTS = {
  SOL: { mint: SOL_MINT, decimals: 9, minimum: "0.001", maximum: "10000" },
  USDC: { mint: USDC_MINT, decimals: 6, minimum: "0.10", maximum: "1000000" },
} as const;

export type ThreatSwapInputSymbol = keyof typeof THREAT_SWAP_INPUTS;

export function parseUiAmount(value: string, decimals: number) {
  const normalized = value.trim();
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) throw new Error("Enter a positive numeric amount.");
  const [whole, fraction = ""] = normalized.split(".");
  if (fraction.length > decimals) throw new Error(`This asset supports at most ${decimals} decimal places.`);
  const raw = `${whole}${fraction.padEnd(decimals, "0")}`.replace(/^0+(?=\d)/, "");
  return BigInt(raw || "0");
}

export function formatRawAmount(value: string | number | bigint, decimals: number, maximumDecimals = 6) {
  const raw = BigInt(value);
  const negative = raw < BigInt(0);
  const absolute = negative ? -raw : raw;
  const padded = absolute.toString().padStart(decimals + 1, "0");
  const whole = padded.slice(0, -decimals) || "0";
  const fraction = decimals ? padded.slice(-decimals).slice(0, maximumDecimals).replace(/0+$/, "") : "";
  return `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
}

export function getThreatSwapInput(symbol: string) {
  if (symbol !== "SOL" && symbol !== "USDC") return null;
  return THREAT_SWAP_INPUTS[symbol];
}

export { THREAT_TOKEN_MINT };
