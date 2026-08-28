import {
  declareDiscoveryExtension,
  type DeclareDiscoveryExtensionInput,
} from "@x402/extensions/bazaar";
import { X402_INTELLIGENCE_PRODUCTS } from "@/lib/intelligence-products";
import { RED_QUEEN_AGENT_ID } from "@/lib/agent-identity-public";

export const RED_QUEEN_ORIGIN = "https://redqueen.space";
export const RED_QUEEN_X402_NETWORK = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";

type ProductDiscovery = {
  method: "GET" | "POST";
  input?: Record<string, unknown>;
  inputSchema?: Record<string, unknown>;
  bodyType?: "json";
  output: {
    example: Record<string, unknown>;
    schema: Record<string, unknown>;
  };
};

const jsonObjectOutput = (example: Record<string, unknown>) => ({
  example,
  schema: {
    type: "object",
    properties: {
      success: { type: "boolean" },
      clearance: { type: "string" },
    },
    required: ["success"],
    additionalProperties: true,
  },
});

export const X402_PRODUCT_DISCOVERY: Record<string, ProductDiscovery> = {
  "global-source-synthesis": {
    method: "GET",
    output: jsonObjectOutput({
      success: true,
      clearance: "PAID OUTPUT // x402 SETTLED",
      intel: { headline: "Verified source synthesis", signals: [] },
    }),
  },
  "solana-network-health": {
    method: "GET",
    output: jsonObjectOutput({
      success: true,
      clearance: "PAID OUTPUT // x402 SETTLED",
      network: { name: "Solana Mainnet", sourceCoverage: "6/6 RPC METRICS LIVE" },
    }),
  },
  "local-delta-brief": {
    method: "GET",
    input: { area: "Madrid", lat: 40.4168, lng: -3.7038, radiusKm: 250 },
    inputSchema: {
      properties: {
        area: { type: "string", description: "Broad city or region; never an exact address." },
        lat: { type: "number", minimum: -90, maximum: 90 },
        lng: { type: "number", minimum: -180, maximum: 180 },
        radiusKm: { type: "integer", minimum: 25, maximum: 1000, default: 250 },
      },
      required: ["area"],
    },
    output: jsonObjectOutput({
      success: true,
      clearance: "PAID OUTPUT // x402 SETTLED",
      report: { title: "Local Delta", meaningfulChanges: [], nextAction: "Review official local guidance." },
    }),
  },
  "premium-area-intelligence": {
    method: "POST",
    bodyType: "json",
    input: { area: "Valencia", lat: 39.4699, lng: -0.3763, radiusKm: 250, focus: "LOCAL_THREATS" },
    inputSchema: {
      properties: {
        area: { type: "string", description: "Broad city or region." },
        lat: { type: "number", minimum: -90, maximum: 90 },
        lng: { type: "number", minimum: -180, maximum: 180 },
        radiusKm: { type: "integer", minimum: 25, maximum: 1000 },
        focus: {
          type: "string",
          enum: ["LOCAL_THREATS", "BLACKOUT", "HOUSEHOLD", "DIGITAL_SECURITY", "HEALTH"],
          default: "LOCAL_THREATS",
        },
      },
      required: ["area", "lat", "lng", "radiusKm"],
    },
    output: jsonObjectOutput({
      success: true,
      clearance: "PREMIUM PROCUREMENT // x402 SETTLED",
      report: { title: "Premium Area Intelligence", sources: [], assessment: "" },
      procurementReceipt: { provider: "metered upstream provider", delivered: true },
    }),
  },
  "preparedness-compiler": {
    method: "POST",
    bodyType: "json",
    input: {
      area: "Berlin",
      focus: "HOUSEHOLD",
      household: "One adult and one child",
      constraints: "Limited storage; no car",
    },
    inputSchema: {
      properties: {
        area: { type: "string", description: "Optional broad city or region." },
        focus: {
          type: "string",
          enum: ["LOCAL_THREATS", "BLACKOUT", "HOUSEHOLD", "DIGITAL_SECURITY", "HEALTH"],
        },
        household: { type: "string", maxLength: 320 },
        constraints: { type: "string", maxLength: 320 },
      },
      required: ["focus"],
    },
    output: jsonObjectOutput({
      success: true,
      clearance: "PAID OUTPUT // x402 SETTLED",
      plan: { title: "72-hour protocol", phases: [], sources: [] },
    }),
  },
  "incident-dossier": {
    method: "GET",
    input: { signalId: "verified-signal-id" },
    inputSchema: {
      properties: {
        signalId: { type: "string", description: "Current verified signal ID returned by RED QUEEN Pulse or Map." },
      },
      required: ["signalId"],
    },
    output: jsonObjectOutput({
      success: true,
      clearance: "PAID OUTPUT // x402 SETTLED",
      dossier: { fact: "", assessment: "", uncertainty: "", action: "", sources: [] },
    }),
  },
  "transaction-risk-explanation": {
    method: "POST",
    bodyType: "json",
    input: { transaction: "BASE64_SERIALIZED_VERSIONED_TRANSACTION", wallet: "OPTIONAL_EXPECTED_SIGNER" },
    inputSchema: {
      properties: {
        transaction: { type: "string", description: "Base64 serialized Solana versioned transaction." },
        wallet: { type: "string", description: "Optional expected signer public key." },
      },
      required: ["transaction"],
    },
    output: jsonObjectOutput({
      success: true,
      clearance: "PAID OUTPUT // x402 SETTLED",
      report: { simulation: {}, signerSurface: [], risks: [], explanation: "" },
      transactionSubmitted: false,
    }),
  },
  "wallet-exposure-audit": {
    method: "GET",
    input: { address: "SOLANA_PUBLIC_KEY" },
    inputSchema: {
      properties: {
        address: { type: "string", description: "Public Solana wallet address. Never a seed phrase or private key." },
      },
      required: ["address"],
    },
    output: jsonObjectOutput({
      success: true,
      clearance: "PAID OUTPUT // x402 SETTLED",
      audit: { status: "", delegates: [], frozenAccounts: [], nextAction: "" },
    }),
  },
};

export function discoveryExtensionsFor(productId: string) {
  const discovery = X402_PRODUCT_DISCOVERY[productId];
  if (!discovery) return {};

  const input: DeclareDiscoveryExtensionInput = discovery.bodyType
    ? {
        bodyType: discovery.bodyType,
        input: discovery.input,
        inputSchema: discovery.inputSchema,
        output: discovery.output,
      }
    : {
        input: discovery.input,
        inputSchema: discovery.inputSchema,
        output: discovery.output,
      };

  return declareDiscoveryExtension(input);
}

export function buildX402Manifest() {
  const resources = X402_INTELLIGENCE_PRODUCTS
    .filter((product) => product.endpoint && product.status !== "RESEARCH")
    .map((product) => {
      const discovery = X402_PRODUCT_DISCOVERY[product.id];
      const path = product.endpoint!.split("?")[0];
      return {
        id: product.id,
        name: product.name,
        description: product.value,
        method: discovery?.method || product.method || "GET",
        resource: `${RED_QUEEN_ORIGIN}${path}`,
        price: product.price,
        network: RED_QUEEN_X402_NETWORK,
        scheme: "exact",
        mimeType: "application/json",
        output: product.output,
        discovery: discovery
          ? {
              input: discovery.input || {},
              inputSchema: discovery.inputSchema || { properties: {} },
              output: discovery.output,
            }
          : null,
        openapi: `${RED_QUEEN_ORIGIN}/openapi.json`,
      };
    });

  return {
    x402Version: 2,
    name: "RED QUEEN Intelligence",
    description: "Paid, source-bounded survival intelligence delivered by RED QUEEN through x402 exact-SVM settlement on Solana.",
    provider: "SOLvival Corp",
    origin: RED_QUEEN_ORIGIN,
    network: RED_QUEEN_X402_NETWORK,
    paymentAsset: "USDC",
    agent: {
      standard: "8004",
      id: RED_QUEEN_AGENT_ID,
      registryStatus: "REGISTERED ON SOLANA MAINNET",
      metadata: `${RED_QUEEN_ORIGIN}/.well-known/agent-registration.json`,
      mcp: `${RED_QUEEN_ORIGIN}/api/mcp/mcp`,
    },
    documentation: `${RED_QUEEN_ORIGIN}/for-agents`,
    openapi: `${RED_QUEEN_ORIGIN}/openapi.json`,
    reliability: `${RED_QUEEN_ORIGIN}/api/reliability`,
    resources,
    trustBoundary: "Every paid call requires explicit x402 settlement. RED QUEEN never requests a seed phrase, holds user funds, or awards XP for payment.",
  };
}
