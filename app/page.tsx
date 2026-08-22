import Image from "next/image";
import Link from "next/link";
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

const onchainCapabilities = [
  ["x402", "Request a premium intelligence operation and pay its exact price in USDC. Queen gathers the data and delivers the report."],
  ["$THREAT", "Verify your holdings to expand trusted context, Signal Watch capacity and intelligence clearance."],
  ["JUPITER", "Review a live quote and buy $THREAT from the platform with a wallet approval you control."],
  ["WALLET INTELLIGENCE", "Inspect exposure, explain transaction risk and preview dangerous SPL delegate revocations before signing."],
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
              An agent that sees the threat.
              <span>And stays for what comes next.</span>
            </h1>
            <p>
              RED QUEEN is an AI survival intelligence agent on Solana. She monitors verified signals, explains what matters,
              turns answers into plans, and can deliver paid intelligence through x402.
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
            <Image
              className="rq-agent-stage-queen"
              src="/art/red-queen-presence.png"
              alt="RED QUEEN, the survival intelligence agent"
              width={1199}
              height={1312}
              priority
            />
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

      <section className="rq-onchain-stage">
        <div className="container rq-onchain-inner">
          <div className="rq-section-heading rq-section-heading-onchain">
            <span>02 // AGENTIC ECONOMY</span>
            <h2>Built to reason.<br /><em>Ready to transact.</em></h2>
            <p>
              Start without a wallet. Connect one only when you want Queen to verify access, prepare an operation or request a transaction.
            </p>
            <div className="rq-landing-actions">
              <Link className="btn btn-primary" href="/onchain">OPEN ONCHAIN HUB</Link>
              <Link className="btn btn-ghost" href="/network-clearance">VIEW AGENT IDENTITY</Link>
            </div>
          </div>
          <div className="rq-onchain-console">
            <div className="rq-onchain-console-head">
              <span>SOLANA MAINNET // HUMAN APPROVAL REQUIRED</span>
              <i>LIVE</i>
            </div>
            {onchainCapabilities.map(([name, description], index) => (
              <article key={name}>
                <span>0{index + 1}</span>
                <div><h3>{name}</h3><p>{description}</p></div>
                <b>↗</b>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container rq-field-entry">
        <div className="rq-section-heading">
          <span>03 // ENTER THE FIELD</span>
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
        <Image src="/art/red-queen-throne-v2.png" alt="" width={1200} height={1200} aria-hidden="true" />
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
