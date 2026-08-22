import Image from "next/image";
import {
  getRedQueenAgentIdentity,
  RED_QUEEN_AGENT_DOMAINS,
  RED_QUEEN_AGENT_SKILLS,
} from "@/lib/agent-registry";

function compact(value: string, lead = 7, tail = 7) {
  if (!value) return "ASSIGNED AFTER REGISTRATION";
  if (value.length <= lead + tail + 3) return value;
  return `${value.slice(0, lead)}…${value.slice(-tail)}`;
}

export default function AgentRegistryIdentity() {
  const identity = getRedQueenAgentIdentity();
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
            <div><dt>AGENT ASSET</dt><dd title={identity.asset}>{compact(identity.asset)}</dd></div>
            <div><dt>PROJECT WALLET</dt><dd title={identity.owner}>{compact(identity.owner)}</dd></div>
            <div><dt>METADATA</dt><dd>DOMAIN VERIFIED JSON</dd></div>
            <div><dt>REPUTATION</dt><dd>{identity.reputation}</dd></div>
          </dl>

          <div className="agent-identity-services">
            <article><span>MCP</span><strong>9 AGENT TOOLS</strong><p>Signals, Solana telemetry, wallet audits, incident dossiers and preparedness protocols.</p></article>
            <article><span>x402</span><strong>{identity.x402}</strong><p>Exact USDC compute payments with explicit approval, receipts and replay protection.</p></article>
            <article><span>OASF</span><strong>{RED_QUEEN_AGENT_SKILLS.length} SKILLS · {RED_QUEEN_AGENT_DOMAINS.length} DOMAINS</strong><p>Machine-readable survival intelligence, risk analysis and emergency-management capabilities.</p></article>
          </div>

          <div className="agent-identity-actions">
            <a href={identity.metadataUrl} target="_blank" rel="noreferrer">INSPECT METADATA ↗</a>
            <a href={identity.oasfUrl} target="_blank" rel="noreferrer">INSPECT CAPABILITIES ↗</a>
            <a href={explorerUrl} target="_blank" rel="noreferrer">{identity.registered ? "VIEW AGENT ASSET ↗" : "READ 8004 STANDARD ↗"}</a>
          </div>

          <small>NO BIO-SCORE, PRIVATE PLAN, PROFILE MEMORY OR USER LOCATION IS WRITTEN TO THE REGISTRY.</small>
        </div>
      </div>
    </section>
  );
}
