import {
  buildRegistrationFileJson,
  ServiceType,
  TrustModel,
  validateDomain,
  validateSkill,
} from "8004-solana";
import { SOLANA_MAINNET_CAIP2 } from "@/lib/onchain";
import { RED_QUEEN_AGENT_ASSET, RED_QUEEN_AGENT_ID } from "@/lib/agent-identity-public";
import {
  RED_QUEEN_MCP_PROTOCOL_VERSION,
  RED_QUEEN_MCP_TOOLS,
} from "@/lib/mcp-discovery";

export const RED_QUEEN_AGENT_SITE = "https://redqueen.space";
export const RED_QUEEN_AGENT_METADATA_PATH = "/.well-known/agent-registration.json";
export const RED_QUEEN_AGENT_MCP_PATH = "/api/mcp/mcp";
export const RED_QUEEN_AGENT_OASF_PATH = "/api/agent/oasf";
export const RED_QUEEN_AGENT_IDENTITY_PATH = "/api/agent/identity";
export const RED_QUEEN_AGENT_REGISTRY_PROGRAM = "8oo4dC4JvBLwy5tGgiH3WwK4B9PWxL9Z4XjA2jzkQMbQ";
export const RED_QUEEN_AGENT_INDEXER = "https://8004-indexer-main.qnt.sh";
export const RED_QUEEN_AGENT_DESCRIPTION =
  "RED QUEEN is an agentic survival intelligence system on Solana, developed and operated by SOLvival Corp. She synthesizes verified public, purchased geospatial, emergency, environmental, cyber, and on-chain evidence; explains relevance, provenance, and uncertainty; and converts findings into location-aware briefs, preparedness protocols, wallet-risk analysis, and provider-ready survival carts. Users and agents can approve paid intelligence operations in USDC through x402. RED QUEEN may procure metered data and prepare actions or transactions, but never holds user assets, signs on their behalf, checks out a physical order, or spends without explicit approval.";

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
  const asset = process.env.RED_QUEEN_AGENT_ASSET?.trim() || RED_QUEEN_AGENT_ASSET;
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

  return buildRegistrationFileJson({
    name: "RED QUEEN",
    description: RED_QUEEN_AGENT_DESCRIPTION,
    image: `${RED_QUEEN_AGENT_SITE}/art/red-queen-agent-registry-v1.png`,
    services: [
      {
        type: ServiceType.MCP,
        value: `${RED_QUEEN_AGENT_SITE}${RED_QUEEN_AGENT_MCP_PATH}`,
        meta: {
          version: RED_QUEEN_MCP_PROTOCOL_VERSION,
          transport: "streamable-http",
          tools: RED_QUEEN_MCP_TOOLS.length,
          capabilities: {
            tools: [...RED_QUEEN_MCP_TOOLS],
            prompts: [],
            resources: [],
          },
        },
      },
      {
        type: ServiceType.OASF,
        value: `${RED_QUEEN_AGENT_SITE}${RED_QUEEN_AGENT_OASF_PATH}`,
        meta: { version: "0.8" },
      },
      {
        type: ServiceType.WALLET,
        value: `${SOLANA_MAINNET_CAIP2}:${runtime.owner}`,
        meta: { purpose: "project-operational-wallet" },
      },
    ],
    skills: [...RED_QUEEN_AGENT_SKILLS],
    domains: [...RED_QUEEN_AGENT_DOMAINS],
    trustModels: [TrustModel.REPUTATION],
    active: true,
    x402Support: true,
  });
}

export function getRedQueenRegistryReadiness() {
  const runtime = getRedQueenAgentRuntime();
  const invalidSkills = RED_QUEEN_AGENT_SKILLS.filter((skill) => !validateSkill(skill));
  const invalidDomains = RED_QUEEN_AGENT_DOMAINS.filter((domain) => !validateDomain(domain));

  return {
    ready: invalidSkills.length === 0 && invalidDomains.length === 0,
    sdk: "8004-solana@0.8.2",
    cluster: "mainnet-beta",
    program: RED_QUEEN_AGENT_REGISTRY_PROGRAM,
    indexer: RED_QUEEN_AGENT_INDEXER,
    metadataUri: runtime.metadataUri,
    registrationCall: "registerAgent(metadataUri, { atomEnabled: false })",
    atomEnabled: false,
    requiresProjectWalletSignature: true,
    operationalWalletStep: "setAgentWallet(agentAsset, projectWallet)",
    invalidSkills,
    invalidDomains,
  };
}

export function getRedQueenAgentIdentity() {
  const runtime = getRedQueenAgentRuntime();

  return {
    ...runtime,
    name: "RED QUEEN",
    agentId: runtime.asset || RED_QUEEN_AGENT_ID,
    network: "SOLANA MAINNET",
    networkId: SOLANA_MAINNET_CAIP2,
    standard: "8004 SOLANA",
    metadataUrl: `${RED_QUEEN_AGENT_SITE}${RED_QUEEN_AGENT_METADATA_PATH}`,
    identityUrl: `${RED_QUEEN_AGENT_SITE}${RED_QUEEN_AGENT_IDENTITY_PATH}`,
    mcpUrl: `${RED_QUEEN_AGENT_SITE}${RED_QUEEN_AGENT_MCP_PATH}`,
    oasfUrl: `${RED_QUEEN_AGENT_SITE}${RED_QUEEN_AGENT_OASF_PATH}`,
    x402: "EXACT SVM V2",
    reputation: runtime.registered ? "UNRATED · AWAITING VERIFIED FEEDBACK" : "BEGINS AFTER REGISTRATION",
    state: runtime.registered ? "REGISTERED ON MAINNET" : "REGISTRATION PACKAGE READY",
  };
}
