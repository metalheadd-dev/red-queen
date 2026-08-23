import { validateDomain, validateSkill } from "8004-solana";

const arg = process.argv.find((value) => value.startsWith("--base-url="));
const baseUrl = (arg?.slice("--base-url=".length) || process.env.AGENT_REGISTRY_BASE_URL || "https://redqueen.space").replace(/\/$/, "");

const expected = {
  metadata: `${baseUrl}/.well-known/agent-registration.json`,
  identity: `${baseUrl}/api/agent/identity`,
  wallet: `${baseUrl}/api/agent/wallet`,
  oasf: `${baseUrl}/api/agent/oasf`,
  mcp: `${baseUrl}/api/mcp/mcp`,
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function getJson(url) {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  assert(response.ok, `${url} returned HTTP ${response.status}`);
  return response.json();
}

async function main() {
  const [metadata, identity, oasf] = await Promise.all([
    getJson(expected.metadata),
    getJson(expected.identity),
    getJson(expected.oasf),
  ]);

  assert(metadata.type === "https://eips.ethereum.org/EIPS/eip-8004#registration-v1", "Registration type is not canonical 8004 v1");
  assert(metadata.name === "RED QUEEN", "Unexpected agent name");
  assert(typeof metadata.description === "string" && metadata.description.length >= 80, "Agent description is missing or too short");
  assert(Array.isArray(metadata.services), "Registration services are missing");

  const mcp = metadata.services.find((service) => service.name === "MCP");
  const oasfService = metadata.services.find((service) => service.name === "OASF");
  const wallet = metadata.services.find((service) => service.name === "wallet" || service.name === "agentWallet");
  assert(new URL(mcp?.endpoint || "https://invalid.local").pathname === "/api/mcp/mcp", "MCP endpoint must use /api/mcp/mcp");
  assert(new URL(oasfService?.endpoint || "https://invalid.local").pathname === "/api/agent/oasf", "OASF endpoint must use /api/agent/oasf");
  assert(typeof wallet?.endpoint === "string" && wallet.endpoint.startsWith("solana:"), "Solana operational wallet declaration is missing");

  const skills = oasfService.skills || oasf.skills || [];
  const domains = oasfService.domains || oasf.domains || [];
  const invalidSkills = skills.filter((skill) => !validateSkill(skill));
  const invalidDomains = domains.filter((domain) => !validateDomain(domain));
  assert(skills.length > 0 && invalidSkills.length === 0, `Invalid OASF skills: ${invalidSkills.join(", ") || "none declared"}`);
  assert(domains.length > 0 && invalidDomains.length === 0, `Invalid OASF domains: ${invalidDomains.join(", ") || "none declared"}`);
  assert(metadata.x402Support === true, "x402 support is not declared");
  assert(identity.registration?.ready === true, "Registration readiness is false");
  assert(identity.registration?.atomEnabled === false, "ATOM must remain off for the initial registration");
  assert(identity.identity?.registered === true, "RED QUEEN Agent Asset is not marked as registered");
  assert(identity.identity?.agentId === 1474, "Unexpected RED QUEEN Agent ID");
  assert(typeof identity.identity?.asset === "string" && identity.identity.asset.length >= 32, "Registered Agent Asset is missing");

  const mcpResponse = await fetch(expected.mcp, {
    method: "POST",
    headers: {
      Accept: "application/json, text/event-stream",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-06-18",
        capabilities: {},
        clientInfo: { name: "red-queen-registry-check", version: "1.0.0" },
      },
    }),
  });
  assert(mcpResponse.ok, `${expected.mcp} returned HTTP ${mcpResponse.status}`);

  console.log(`RED QUEEN 8004 identity is registered at ${baseUrl}`);
  console.log(`- Metadata: canonical registration-v1`);
  console.log(`- MCP: ${expected.mcp}`);
  console.log(`- OASF: ${skills.length} skills, ${domains.length} domains`);
  console.log(`- x402: declared`);
  console.log(`- ATOM: disabled for initial registration`);
  console.log(`- Agent ID: ${identity.identity.agentId}`);
  console.log(`- Agent Asset: ${identity.identity.asset}`);
  console.log(`- Operational wallet: inspect ${expected.wallet}`);
}

main().catch((error) => {
  console.error(`Agent Registry check failed: ${error.message}`);
  process.exitCode = 1;
});
