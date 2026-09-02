export const RED_QUEEN_MCP_PROTOCOL_VERSION = "2025-06-18";
export const RED_QUEEN_MCP_ENDPOINT = "https://redqueen.space/api/mcp/mcp";

export const RED_QUEEN_MCP_TOOLS = [
  "get_threat_forecast",
  "get_depin_telemetry",
  "get_premium_intel",
  "analyze_wallet_security",
  "get_wallet_exposure_audit",
  "get_local_delta_brief",
  "compile_72_hour_plan",
  "get_incident_dossier",
  "explain_solana_transaction_risk",
  "purchase_premium_area_intelligence",
  "quote_external_survival_intelligence",
  "purchase_external_survival_intelligence",
  "build_72_hour_survival_cart",
  "search_physical_survival_offers",
  "prepare_physical_checkout_quote",
] as const;

export function buildRedQueenMcpDiscovery() {
  return {
    name: "RED QUEEN",
    title: "RED QUEEN Survival Intelligence MCP",
    description:
      "Source-backed survival intelligence, preparedness, wallet-risk and x402 agentic commerce tools on Solana.",
    version: "1.0.0",
    status: "ok",
    endpoint: RED_QUEEN_MCP_ENDPOINT,
    transport: "streamable-http",
    protocolVersion: RED_QUEEN_MCP_PROTOCOL_VERSION,
    authentication: "none",
    x402Support: true,
    tools: [...RED_QUEEN_MCP_TOOLS],
    prompts: [],
    resources: [],
    capabilities: {
      tools: [...RED_QUEEN_MCP_TOOLS],
      prompts: [],
      resources: [],
    },
  };
}
