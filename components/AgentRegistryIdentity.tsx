import Image from "next/image";
import {
  getRedQueenAgentIdentity,
  getRedQueenRegistryReadiness,
  RED_QUEEN_AGENT_REGISTRY_PROGRAM,
  RED_QUEEN_AGENT_DOMAINS,
  RED_QUEEN_AGENT_SKILLS,
} from "@/lib/agent-registry";
import AgentRegistrationConsole from "@/components/AgentRegistrationConsole";
import { RED_QUEEN_MCP_TOOLS } from "@/lib/mcp-discovery";

function compact(value: string, lead = 7, tail = 7) {
  if (!value) return "ASSIGNED AFTER REGISTRATION";
  if (value.length <= lead + tail + 3) return value;
  return `${value.slice(0, lead)}…${value.slice(-tail)}`;
}

export default function AgentRegistryIdentity() {
  const identity = getRedQueenAgentIdentity();
  const readiness = getRedQueenRegistryReadiness();
  const explorerUrl = identity.asset
    ? `https://explorer.solana.com/address/${identity.asset}`
    : "https://solana.com/agent-registry";

  return (
    <section className={`agent-identity ${identity.registered ? "is-registered" : "is-prepared"}`} id="agent-identity">
      <div className="onchain-section-head">
        <span>05 // RED QUEEN AGENT IDENTITY</span>
        <h2>Her identity leaves the application.</h2>
        <p>8004 gives RED QUEEN a discoverable Solana identity for agents, applications and SOLvivors. Her endpoints, capabilities and future reputation become independently verifiable without exposing user readiness data.</p>
      </div>

      <div className="agent-identity-shell">
        <div className="agent-identity-portrait" aria-hidden="true">
          <Image src="/art/red-queen-presence.png" alt="" width={760} height={920} sizes="(max-width: 760px) 80vw, 420px" />
          <span>8004</span>
        </div>

        <div className="agent-identity-core">
          <div className="agent-identity-status">
            <div><i /><span>{identity.standard} // {identity.network}</span></div>
            <strong>{identity.state}</strong>
            <p>{identity.registered
              ? "The Agent Asset is live. Ownership, metadata and service endpoints can now be verified independently."
              : "Metadata, MCP, OASF and x402 declarations are live. The Agent Asset will appear only after an explicit project-wallet registration signature."}</p>
          </div>

          <dl className="agent-identity-ledger">
            <div><dt>AGENT ID</dt><dd title={identity.agentId}>{compact(identity.agentId)}</dd></div>
            <div><dt>ASSET STANDARD</dt><dd>METAPLEX CORE</dd></div>
            <div><dt>PROJECT WALLET</dt><dd title={identity.owner}>{compact(identity.owner)}</dd></div>
            <div><dt>METADATA</dt><dd>DOMAIN VERIFIED JSON</dd></div>
            <div><dt>REPUTATION</dt><dd>{identity.reputation}</dd></div>
            <div><dt>NETWORK</dt><dd>SOLANA MAINNET</dd></div>
          </dl>

          {!identity.registered && (
            <>
              <div className="agent-registration-preview">
                <span>REGISTRATION PREVIEW</span>
                <strong>{readiness.ready ? "READY FOR PROJECT-WALLET SIGNATURE" : "METADATA REQUIRES REVIEW"}</strong>
                <p>Mainnet Agent Asset · canonical 8004 metadata · ATOM reputation off at launch · no user data written on-chain.</p>
              </div>
              {readiness.ready && (
                <AgentRegistrationConsole
                  owner={identity.owner}
                  metadataUri={readiness.metadataUri}
                  program={RED_QUEEN_AGENT_REGISTRY_PROGRAM}
                />
              )}
            </>
          )}

          <div className="agent-identity-services">
            <article><span>MCP</span><strong>{RED_QUEEN_MCP_TOOLS.length} AGENT TOOLS</strong><p>Signals, wallet audits, paid evidence, physical offer search, held checkout quotes and preparedness protocols.</p></article>
            <article><span>x402</span><strong>{identity.x402}</strong><p>Exact USDC intelligence payments and owner-approved PYUSD physical checkout on Solana.</p></article>
            <article><span>OASF</span><strong>{RED_QUEEN_AGENT_SKILLS.length} SKILLS · {RED_QUEEN_AGENT_DOMAINS.length} DOMAINS</strong><p>Machine-readable survival intelligence, risk analysis and emergency-management capabilities.</p></article>
          </div>

          <div className="agent-identity-actions">
            <a href={identity.metadataUrl} target="_blank" rel="noreferrer">INSPECT METADATA ↗</a>
            <a href={identity.oasfUrl} target="_blank" rel="noreferrer">INSPECT CAPABILITIES ↗</a>
            <a href={identity.identityUrl} target="_blank" rel="noreferrer">INSPECT PUBLIC IDENTITY ↗</a>
            <a href={explorerUrl} target="_blank" rel="noreferrer">{identity.registered ? "VERIFY ON SOLANA ↗" : "READ 8004 STANDARD ↗"}</a>
          </div>

          <small>NO BIO-SCORE, PRIVATE PLAN, PROFILE MEMORY OR USER LOCATION IS WRITTEN TO THE REGISTRY.</small>
        </div>
      </div>
    </section>
  );
}
