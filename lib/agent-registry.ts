import { SOLANA_MAINNET_CAIP2 } from "@/lib/onchain";

export const RED_QUEEN_AGENT_SITE = "https://redqueen.space";
export const RED_QUEEN_AGENT_METADATA_PATH = "/.well-known/agent-registration.json";
export const RED_QUEEN_AGENT_MCP_PATH = "/api/mcp";
export const RED_QUEEN_AGENT_OASF_PATH = "/api/agent/oasf";

export const RED_QUEEN_AGENT_SKILLS = [
  "advanced_reasoning_planning/strategic_planning",
  "evaluation_monitoring/anomaly_detection",
  "natural_language_processing/information_retrieval_synthesis/knowledge_synthesis",
  "natural_language_processing/information_retrieval_synthesis/question_answering",
  "natural_language_processing/natural_language_generation/summarization",
  "security_privacy/threat_detection",
  "security_privacy/vulnerability_analysis",
] as const;

export const RED_QUEEN_AGENT_DOMAINS = [
  "environmental_science/environmental_monitoring",
  "government_and_public_sector/emergency_management",
  "government_and_public_sector/public_infrastructure",
  "healthcare/health_information_systems",
  "technology/security/cybersecurity",
] as const;

const FALLBACK_PROJECT_WALLET = "Aed6MTmMetXMmJR4inuWQUo157xtEijqbGGWuyzNGRxg";

export function getRedQueenAgentRuntime() {
  const asset = process.env.RED_QUEEN_AGENT_ASSET?.trim() || "";
  const registrationSignature = process.env.RED_QUEEN_AGENT_REGISTRATION_TX?.trim() || "";
  const owner = process.env.RED_QUEEN_AGENT_OWNER?.trim()
    || process.env.SVM_ADDRESS?.trim()
    || FALLBACK_PROJECT_WALLET;
  const metadataUri = process.env.RED_QUEEN_AGENT_METADATA_URI?.trim()
    || `${RED_QUEEN_AGENT_SITE}${RED_QUEEN_AGENT_METADATA_PATH}`;

  return {
    asset,
    owner,
    metadataUri,
    registrationSignature,
    registered: Boolean(asset),
  };
}

export function buildRedQueenRegistrationFile() {
  const runtime = getRedQueenAgentRuntime();

  return {
    type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
    name: "RED QUEEN",
    description:
      "AI survival intelligence agent on Solana that synthesizes verified public threat signals, explains uncertainty, creates preparedness protocols, and provides bounded wallet and transaction risk analysis. RED QUEEN never claims certainty, custody, or automatic authority over user funds.",
    image: `${RED_QUEEN_AGENT_SITE}/art/red-queen-presence.png`,
    services: [
      {
        name: "MCP",
        endpoint: `${RED_QUEEN_AGENT_SITE}${RED_QUEEN_AGENT_MCP_PATH}`,
        version: "2025-06-18",
      },
      {
        name: "OASF",
        endpoint: `${RED_QUEEN_AGENT_SITE}${RED_QUEEN_AGENT_OASF_PATH}`,
        version: "0.8",
        skills: [...RED_QUEEN_AGENT_SKILLS],
        domains: [...RED_QUEEN_AGENT_DOMAINS],
      },
      {
        name: "agentWallet",
        endpoint: `${SOLANA_MAINNET_CAIP2}:${runtime.owner}`,
      },
    ],
    supportedTrust: ["reputation"],
    active: true,
    x402Support: true,
  };
}

export function getRedQueenAgentIdentity() {
  const runtime = getRedQueenAgentRuntime();

  return {
    ...runtime,
    name: "RED QUEEN",
    network: "SOLANA MAINNET",
    networkId: SOLANA_MAINNET_CAIP2,
    standard: "8004 SOLANA",
    metadataUrl: `${RED_QUEEN_AGENT_SITE}${RED_QUEEN_AGENT_METADATA_PATH}`,
    mcpUrl: `${RED_QUEEN_AGENT_SITE}${RED_QUEEN_AGENT_MCP_PATH}`,
    oasfUrl: `${RED_QUEEN_AGENT_SITE}${RED_QUEEN_AGENT_OASF_PATH}`,
    x402: "EXACT SVM V2",
    reputation: runtime.registered ? "UNRATED · AWAITING VERIFIED FEEDBACK" : "BEGINS AFTER REGISTRATION",
    state: runtime.registered ? "REGISTERED ON MAINNET" : "REGISTRATION PACKAGE READY",
  };
}
