import Link from "next/link";
import CopyThreatMint from "@/components/CopyThreatMint";
import SolvivalIcon from "@/components/SolvivalIcon";
import { getRedQueenAgentIdentity } from "@/lib/agent-registry";
import { RED_QUEEN_AGENT_ID_SHORT } from "@/lib/agent-identity-public";
import MobileDeviceControls from "@/components/MobileDeviceControls";

const paidOperations = [
  { title: "LOCAL DELTA", price: "0.01 USDC", copy: "What changed near one broad area." },
  { title: "TRANSACTION RISK", price: "0.01 USDC", copy: "Understand a Solana transaction before signing." },
  { title: "72-HOUR PLAN", price: "0.02 USDC", copy: "Turn your constraints into a phased protocol." },
  { title: "INCIDENT DOSSIER", price: "0.02 USDC", copy: "Receive sourced facts, uncertainty and action." },
] as const;

const primaryActions = [
  { index: "01", label: "MONITOR", title: "See what changed", copy: "Verified signals and a live map.", href: "/pulse", action: "OPEN PULSE" },
  { index: "02", label: "ASK", title: "Understand what matters", copy: "Context, uncertainty and one next move.", href: "/red-queen", action: "ASK RED QUEEN" },
  { index: "03", label: "ACT", title: "Finish one useful action", copy: "Save a plan and track readiness.", href: "/prepare", action: "OPEN PREPARE" },
] as const;

export default function LandingPage() {
  const agentIdentity = getRedQueenAgentIdentity();
  const agentExplorerUrl = agentIdentity.asset
    ? `https://explorer.solana.com/address/${agentIdentity.asset}`
    : "/onchain#agent-identity";

  return (
    <div className="rq-landing rq-landing-simple">
      <div className="rq-seeker-home">
        <section className="rq-seeker-hero" aria-label="RED QUEEN mobile command">
          <div className="rq-seeker-hero-scan" aria-hidden="true" />
          <div className="rq-seeker-hero-copy">
            <span><i /> RED QUEEN ONLINE</span>
            <h1>See the threat.<br /><em>Choose your move.</em></h1>
            <p>Verified signals, RED QUEEN analysis and Solana execution in one command surface.</p>
            <div>
              <Link href="/pulse">OPEN PULSE <b>→</b></Link>
              <Link href="/red-queen">ASK RED QUEEN</Link>
            </div>
          </div>
        </section>
        <div className="rq-seeker-loop" aria-label="RED QUEEN product loop">
          <span className="is-active">LOOK</span><i /><span>ASK</span><i /><span>ACT</span><i /><span>TRACK</span>
        </div>
        <nav className="rq-seeker-action-grid" aria-label="RED QUEEN core actions">
          <Link href="/pulse#live-map"><span>01 · PULSE</span><strong>See what changed</strong><small>Live map & signals</small><b>→</b></Link>
          <Link href="/prepare"><span>02 · PREPARE</span><strong>Continue my plan</strong><small>Readiness actions</small><b>→</b></Link>
          <Link href="/onchain#queen-operations" className="is-market"><span>03 · x402 MARKET</span><strong>Buy intelligence</strong><small>USDC settlement · receipts</small><b>→</b></Link>
          <Link href="/profile"><span>04 · PROFILE</span><strong>Track my progress</strong><small>XP · BIO · clearance</small><b>→</b></Link>
        </nav>
        <MobileDeviceControls />
        <Link href="/onchain#agent-identity" className="rq-seeker-trust">
          <span>8004 REGISTERED</span><strong>AGENT ID {RED_QUEEN_AGENT_ID_SHORT}</strong><small>VERIFY ON SOLANA →</small>
        </Link>
      </div>

      <section className="rq-landing-hero">
        <div className="rq-landing-grid" aria-hidden="true" />
        <div className="container rq-landing-hero-inner">
          <div className="rq-landing-copy">
            <div className="rq-landing-kicker"><i /> RED QUEEN // SURVIVAL INTELLIGENCE ON SOLANA</div>
            <h1>Know what matters.<span>Act before it matters.</span></h1>
            <p>RED QUEEN turns verified risk into a clear decision and a plan you can finish.</p>
            <div className="rq-landing-actions">
              <Link className="btn btn-primary" href="/red-queen">ASK RED QUEEN</Link>
              <Link className="btn btn-ghost" href="/pulse">SEE LIVE SIGNALS</Link>
            </div>
            <div className="rq-landing-proofline">
              <span>PUBLIC CORE</span><span>VERIFIED SOURCES</span><span>YOU APPROVE EVERY TRANSACTION</span>
            </div>
          </div>

          <div className="rq-agent-stage" aria-label="RED QUEEN cognitive core preview">
            <div className="rq-agent-signal" aria-hidden="true"><i /><i /><i /><span>RQ</span></div>
            <div className="rq-agent-window rq-agent-window-compact">
              <div className="rq-agent-window-bar">
                <span><i /><i /><i /></span><strong>RED QUEEN // COGNITIVE CORE</strong><b>ONLINE</b>
              </div>
              <div className="rq-agent-conversation">
                <div className="rq-agent-query"><small>SOLVIVOR</small><p>What changed near me?</p></div>
                <div className="rq-agent-answer">
                  <div><SolvivalIcon size={30} /><span><small>RED QUEEN</small><strong>Three signals deserve attention.</strong></span></div>
                  <dl>
                    <div><dt>FACT</dt><dd>12 verified records compared.</dd></div>
                    <div><dt>NEXT</dt><dd>Review one local signal and save the action.</dd></div>
                  </dl>
                </div>
                <div className="rq-agent-input"><span>Ask about a threat, plan or wallet...</span><b>TRANSMIT</b></div>
              </div>
              <div className="rq-agent-window-foot"><span>SOURCES VISIBLE</span><span>PLAN READY</span><span>x402 LIVE</span></div>
            </div>
          </div>
        </div>

        <nav className="container rq-home-actions" aria-label="Start with RED QUEEN">
          {primaryActions.map((item) => (
            <Link href={item.href} key={item.index}>
              <span>{item.index} // {item.label}</span><strong>{item.title}</strong><small>{item.copy}</small><b>{item.action} →</b>
            </Link>
          ))}
        </nav>
      </section>

      <section className="rq-agent-registry-trust" aria-label="RED QUEEN on-chain identity">
        <div className="container rq-agent-registry-trust-inner">
          <div><span className="rq-8004-badge">8004 REGISTERED</span><strong>AGENT ID {RED_QUEEN_AGENT_ID_SHORT}</strong><small>SOLANA MAINNET</small></div>
          <p>Her identity, tools and payment support are public.</p>
          <nav aria-label="Agent identity verification">
            <a href={agentExplorerUrl} target="_blank" rel="noreferrer">VERIFY ON SOLANA ↗</a>
            <Link href="/onchain#agent-identity">VIEW CAPABILITIES →</Link>
          </nav>
        </div>
      </section>

      <section className="rq-home-economy" id="agentic-economy">
        <div className="container rq-home-economy-grid">
          <div className="rq-home-economy-copy">
            <span>AGENTIC ECONOMY // x402</span>
            <h2>Request intelligence.<br /><em>Pay only for the result.</em></h2>
            <p>Choose a focused operation. RED QUEEN gathers the data, completes the work and returns the result with a receipt.</p>
            <div className="rq-agentic-flow" aria-label="x402 operation flow">
              <span><b>01</b> REQUEST</span><i>→</i><span><b>02</b> APPROVE USDC</span><i>→</i><span><b>03</b> RECEIVE</span>
            </div>
            <div className="rq-landing-actions">
              <Link className="btn btn-primary" href="/onchain#queen-operations">OPEN x402 MARKET</Link>
              <Link className="btn btn-ghost" href="/onchain#wallet-intelligence">CHECK WALLET RISK</Link>
            </div>
          </div>
          <article className="rq-home-operations">
            <header><span>AVAILABLE NOW</span><b>x402 LIVE</b></header>
            {paidOperations.map((operation) => (
              <Link href="/onchain#queen-operations" key={operation.title}>
                <span><strong>{operation.title}</strong><small>{operation.copy}</small></span><b>{operation.price}</b><i>→</i>
              </Link>
            ))}
          </article>
        </div>
      </section>

      <section className="rq-home-token" id="threat-utility">
        <div className="container rq-home-token-grid">
          <div>
            <span>$THREAT // INTELLIGENCE CLEARANCE</span>
            <h2>Expand her capacity.</h2>
            <p>$THREAT unlocks more context, more Signal Watch slots and deeper analysis. Readiness and BIO-SCORE remain earned.</p>
            <div className="rq-clearance-rail">
              <span><b>SCOUT</b><small>1+</small></span><span><b>ANALYST</b><small>500K+</small></span><span><b>SENTINEL</b><small>1M+</small></span><span><b>COMMAND</b><small>5M+</small></span>
            </div>
          </div>
          <div className="rq-home-token-actions">
            <CopyThreatMint />
            <div><Link className="btn btn-primary" href="/onchain#buy-threat">BUY WITH JUPITER</Link><Link className="btn btn-ghost" href="/network-clearance">SEE HOLDER BENEFITS</Link></div>
          </div>
        </div>
      </section>

      <section className="container rq-home-final">
        <div><span>SOLVIVAL CORP // SYSTEM ONLINE</span><h2>Start free. Connect only when you need Solana.</h2></div>
        <div className="rq-landing-actions"><Link className="btn btn-primary" href="/pulse">OPEN PULSE</Link><Link className="btn btn-ghost" href="/red-queen">MEET RED QUEEN</Link></div>
      </section>
    </div>
  );
}
