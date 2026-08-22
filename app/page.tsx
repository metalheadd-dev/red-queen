import Link from "next/link";
import CopyThreatMint from "@/components/CopyThreatMint";
import SolvivalIcon from "@/components/SolvivalIcon";

const agentSteps = [
  {
    index: "01",
    verb: "SEE",
    title: "Verified signals, not noise.",
    copy: "Pulse and the live map monitor official threat, infrastructure, health, cyber and Solana sources.",
    href: "/pulse",
    label: "OPEN PULSE",
  },
  {
    index: "02",
    verb: "THINK",
    title: "One picture. One clear answer.",
    copy: "Ask RED QUEEN about a signal, a decision, your readiness or your wallet. She keeps facts, uncertainty and action separate.",
    href: "/red-queen",
    label: "ASK RED QUEEN",
  },
  {
    index: "03",
    verb: "ACT",
    title: "Turn intelligence into a protocol.",
    copy: "Save the next move, build a 72-hour plan and complete practical readiness checks outside the chat.",
    href: "/prepare",
    label: "OPEN PREPARE",
  },
  {
    index: "04",
    verb: "REMEMBER",
    title: "Your progress survives the session.",
    copy: "A SOLvivor profile keeps your plans, BIO-SCORE, XP, Signal Watch state, receipts and verified activity together.",
    href: "/profile",
    label: "OPEN MY PROFILE",
  },
] as const;

export default function LandingPage() {
  return (
    <div className="rq-landing">
      <section className="rq-landing-hero">
        <div className="rq-landing-grid" aria-hidden="true" />
        <div className="container rq-landing-hero-inner">
          <div className="rq-landing-copy">
            <div className="rq-landing-kicker"><i /> SOLVIVAL CORP // AGENTIC SURVIVAL INTELLIGENCE</div>
            <h1>
              RED QUEEN turns global risk into
              <span>your next move.</span>
            </h1>
            <p>
              An agentic survival intelligence system on Solana. RED QUEEN monitors verified signals, evaluates what matters
              to your context, builds actionable protocols, and delivers on-demand intelligence through x402.
            </p>
            <div className="rq-landing-actions">
              <Link className="btn btn-primary" href="/red-queen">ASK RED QUEEN</Link>
              <Link className="btn btn-ghost" href="/pulse">OPEN LIVE PULSE</Link>
            </div>
            <div className="rq-landing-proofline">
              <span>PUBLIC INTELLIGENCE</span>
              <span>VERIFIED SOURCES</span>
              <span>SOLANA NATIVE</span>
              <span>YOU APPROVE EVERY TRANSACTION</span>
            </div>
          </div>

          <div className="rq-agent-stage" aria-label="RED QUEEN agent capability preview">
            <div className="rq-agent-signal" aria-hidden="true">
              <i /><i /><i />
              <span>RQ</span>
              <b>AGENT SIGNAL // LOCKED</b>
            </div>
            <div className="rq-agent-window">
              <div className="rq-agent-window-bar">
                <span><i /><i /><i /></span>
                <strong>RED QUEEN // COGNITIVE CORE</strong>
                <b>ONLINE</b>
              </div>
              <div className="rq-agent-window-body">
                <aside>
                  <span className="active">MONITOR <small>LIVE</small></span>
                  <span>ANALYZE <small>READY</small></span>
                  <span>PREPARE <small>READY</small></span>
                  <span>TRANSACT <small>SOLANA</small></span>
                </aside>
                <div className="rq-agent-conversation">
                  <div className="rq-agent-query">
                    <small>SOLVIVOR</small>
                    <p>What changed near me, and what should I do next?</p>
                  </div>
                  <div className="rq-agent-answer">
                    <div><SolvivalIcon size={30} /><span><small>RED QUEEN</small><strong>I see three signals worth your attention.</strong></span></div>
                    <dl>
                      <div><dt>FACT</dt><dd>12 verified source records compared.</dd></div>
                      <div><dt>RELEVANCE</dt><dd>One local infrastructure signal elevated.</dd></div>
                      <div><dt>NEXT ACTION</dt><dd>Review the source, then save a 72-hour response plan.</dd></div>
                    </dl>
                  </div>
                  <div className="rq-agent-input"><span>Ask about a threat, decision, plan or wallet...</span><b>TRANSMIT</b></div>
                </div>
              </div>
              <div className="rq-agent-window-foot">
                <span>SOURCES LOCKED</span><span>CONTEXT READY</span><span>PLAN CAN BE SAVED</span><span>X402 AVAILABLE</span>
              </div>
            </div>
          </div>
        </div>

        <a className="rq-landing-scroll" href="#agentic-system">ENTER THE SYSTEM <span>↓</span></a>
      </section>

      <section id="agentic-system" className="container rq-agentic-system">
        <div className="rq-section-heading">
          <span>01 // AGENTIC CORE</span>
          <h2>She does more than answer.</h2>
          <p>RED QUEEN connects live intelligence to a decision, a plan and a record you can return to.</p>
        </div>
        <div className="rq-agent-step-grid">
          {agentSteps.map((step) => (
            <article key={step.verb}>
              <div><span>{step.index}</span><b>{step.verb}</b></div>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
              <Link href={step.href}>{step.label} →</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="rq-onchain-stage" id="agentic-economy">
        <div className="container rq-onchain-inner">
          <div className="rq-section-heading rq-section-heading-onchain">
            <span>02 // AGENTIC ECONOMY</span>
            <h2>A paid operation.<br /><em>Executed by the agent.</em></h2>
            <p>
              RED QUEEN can price an intelligence request, receive USDC through x402, use the required data and tools, then deliver a structured result with a verifiable receipt.
              USDC pays for the requested output; it does not change $THREAT clearance.
            </p>
            <div className="rq-landing-actions">
              <Link className="btn btn-primary" href="/onchain#queen-operations">OPEN x402 OPERATIONS</Link>
              <Link className="btn btn-ghost" href="/network-clearance">VIEW AGENT IDENTITY</Link>
            </div>
          </div>

          <div className="rq-agentic-economy-grid">
            <article className="rq-x402-feature">
              <div className="rq-economy-card-head">
                <span>AGENTIC PAYMENT RAIL</span>
                <b>LIVE</b>
              </div>
              <div className="rq-x402-mark">x402</div>
              <h3>The payment rail for work done by RED QUEEN.</h3>
              <p>Request a Local Delta Brief, 72-hour plan, incident dossier or transaction-risk report. The price is shown before approval; the result and receipt arrive after settlement.</p>
              <ol>
                <li><span>01</span><b>REQUEST</b><small>Choose the operation.</small></li>
                <li><span>02</span><b>PAY USDC</b><small>Approve the exact price.</small></li>
                <li><span>03</span><b>QUEEN EXECUTES</b><small>Tools and data become intelligence.</small></li>
                <li><span>04</span><b>RECEIVE</b><small>Result and receipt delivered.</small></li>
              </ol>
              <Link href="/onchain#queen-operations">OPEN x402 OPERATIONS →</Link>
            </article>

            <div className="rq-onchain-support">
              <Link href="/onchain#wallet-intelligence"><span>WALLET INTELLIGENCE</span><b>Explain risk before signing →</b></Link>
              <Link href="/network-clearance"><span>AGENT IDENTITY</span><b>Inspect capabilities and endpoints →</b></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="rq-token-stage" id="threat-utility">
        <div className="container rq-token-inner">
          <div className="rq-section-heading rq-section-heading-token">
            <span>03 // $THREAT UTILITY</span>
            <h2>One token.<br /><em>One clear role.</em></h2>
            <p>
              $THREAT is the native utility asset for RED QUEEN clearance. It expands agent context, monitoring capacity and analytical depth. It is separate from USDC payments and cannot buy BIO-SCORE or readiness.
            </p>
            <div className="rq-asset-roles" aria-label="Roles of assets in the RED QUEEN ecosystem">
              <span><b>SOL</b><small>NETWORK EXECUTION</small></span>
              <span><b>USDC</b><small>x402 SETTLEMENT</small></span>
              <span className="active"><b>$THREAT</b><small>ACCESS + CAPACITY</small></span>
            </div>
          </div>

          <article className="rq-threat-feature rq-threat-feature-standalone">
            <div className="rq-economy-card-head">
              <span>RED QUEEN // INTELLIGENCE CLEARANCE</span>
              <b>UTILITY LIVE</b>
            </div>
            <div className="rq-threat-symbol">$THREAT</div>
            <h3>Hold more. Unlock more of RED QUEEN.</h3>
            <div className="rq-threat-benefit-grid">
              <span><b>TRUSTED CONTEXT</b><small>Longer working context</small></span>
              <span><b>SIGNAL WATCH</b><small>More monitoring slots</small></span>
              <span><b>ANALYSIS DEPTH</b><small>Deeper comparisons</small></span>
              <span><b>AGENT CAPACITY</b><small>More simultaneous signals</small></span>
              <span><b>EARNED XP</b><small>Clearance multiplier</small></span>
              <span><b>QUEEN VISAGE</b><small>Branded PFP from 500K</small></span>
            </div>
            <div className="rq-clearance-rail">
              <span><b>SCOUT</b><small>1+</small></span>
              <span><b>ANALYST</b><small>500K+</small></span>
              <span><b>SENTINEL</b><small>1M+</small></span>
              <span><b>COMMAND</b><small>5M+</small></span>
            </div>
            <p className="rq-threat-integrity">Clearance expands access. Competence is still earned through evidence and completed readiness.</p>
            <CopyThreatMint />
            <div className="rq-threat-actions">
              <Link href="/onchain#buy-threat">BUY WITH JUPITER</Link>
              <Link href="/network-clearance">VIEW ALL UTILITY</Link>
            </div>
          </article>
        </div>
      </section>

      <section className="container rq-field-entry">
        <div className="rq-section-heading">
          <span>04 // ENTER THE FIELD</span>
          <h2>Start with one real question.</h2>
          <p>No account is required to inspect public intelligence or speak with RED QUEEN.</p>
        </div>
        <div className="rq-field-entry-grid">
          <Link href="/pulse">
            <span>PULSE // HER EYES</span>
            <h3>What changed in the verified signal field?</h3>
            <p>Open the Daily Pulse, choose a broad city or region and inspect the live map.</p>
            <b>LOOK →</b>
          </Link>
          <Link href="/red-queen">
            <span>RED QUEEN // HER MIND</span>
            <h3>What matters to me, and why?</h3>
            <p>Ask for a concise assessment with sources, uncertainty and one useful next move.</p>
            <b>ASK →</b>
          </Link>
          <Link href="/prepare">
            <span>PREPARE // HER HANDS</span>
            <h3>What can I finish before I need it?</h3>
            <p>Build a baseline, save a protocol and turn the next action into completed readiness.</p>
            <b>ACT →</b>
          </Link>
        </div>
      </section>

      <section className="rq-trust-band">
        <div className="container rq-trust-band-inner">
          <div>
            <SolvivalIcon size={42} />
            <span><small>THE QUEEN&apos;S DIRECTIVE</small><strong>She decides what deserves attention. You decide whether to act.</strong></span>
          </div>
          <ul>
            <li>Sources remain visible.</li>
            <li>Uncertainty remains labeled.</li>
            <li>No exact home address is requested.</li>
            <li>No transaction happens without approval.</li>
          </ul>
        </div>
      </section>

      <section className="container rq-final-call">
        <div className="rq-final-sigil" aria-hidden="true"><i /><i /><span>RQ</span></div>
        <div>
          <span>SOLVIVAL CORP // SYSTEM ONLINE</span>
          <h2>The world sends noise.<br />She returns a decision.</h2>
          <p>Enter as a visitor. Return as a SOLvivor.</p>
          <div className="rq-landing-actions">
            <Link className="btn btn-primary" href="/red-queen">MEET RED QUEEN</Link>
            <Link className="btn btn-ghost" href="/docs">UNDERSTAND THE SYSTEM</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
