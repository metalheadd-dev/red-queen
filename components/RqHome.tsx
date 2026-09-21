"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { draftQueenQuestion, readRqProfile, RQ_PROFILE_EVENT, RQ_SCENARIOS, RQ_WELCOME_EVENT, type RqProfile } from "@/lib/rq-experience";

const paidOperations = [
  { id: "local", index: "01", name: "Local threat brief", price: "0.01 USDC", detail: "Verified changes near one broad area." },
  { id: "plan", index: "02", name: "72-hour plan", price: "0.02 USDC", detail: "A phased protocol for your household." },
  { id: "incident", index: "03", name: "Incident explained", price: "0.02 USDC", detail: "Facts, uncertainty, sources and action." },
  { id: "transaction", index: "04", name: "Transaction check", price: "0.01 USDC", detail: "Decode a Solana transaction before signing." },
  { id: "wallet", index: "05", name: "Wallet check", price: "0.02 USDC", detail: "Read-only token and authority exposure." },
  { id: "premium", index: "06", name: "Area deep dive", price: "0.05 USDC", detail: "Additional event and weather intelligence." },
  { id: "external", index: "07", name: "Queen research", price: "0.08 USDC", detail: "RQ buys research and returns one decision." },
] as const;

export default function RqHome() {
  const router = useRouter();
  const [selected, setSelected] = useState(0);
  const [question, setQuestion] = useState("");
  const [profile, setProfile] = useState<RqProfile | null>(null);
  const [decision, setDecision] = useState<number | null>(null);
  const scenario = RQ_SCENARIOS[selected];
  useEffect(() => {
    const sync = () => { try { setProfile(readRqProfile(localStorage)); } catch { setProfile(null); } };
    sync(); window.addEventListener(RQ_PROFILE_EVENT, sync);
    return () => window.removeEventListener(RQ_PROFILE_EVENT, sync);
  }, []);
  return <div className="rq-home rq-experience">
    <section className="rq-home-hero rq-shell">
      <div className="rq-hero-signal-field" aria-hidden="true"><i /><i /><i /></div>
      <div className="rq-hero-sector-index" aria-hidden="true"><span>RQ / 001</span><span>SOLANA MAINNET</span><span>BLACK SITE ACCESS</span></div>
      <div className="rq-home-hero-copy">
        <div className="rq-kicker"><i className="rq-status-dot" /> RQ / SOLANA SURVIVAL COMMAND</div>
        {profile && <p className="rq-returning">Welcome back{profile.name ? `, ${profile.name}` : ""}. Your Queen is listening.</p>}
        <h1>See the threat.<br /><em>Outlive the<br className="rq-desktop-break" /> outcome.</em></h1>
        <p className="rq-home-lead">Red Queen turns live signals into decisions, preparedness plans, paid intelligence and real-world gear. Before the threat decides for you.</p>
        <div className="rq-home-cta"><button className="rq-button rq-button-primary" onClick={() => profile ? router.push("/red-queen") : window.dispatchEvent(new Event(RQ_WELCOME_EVENT))}>{profile ? "Talk to your Queen" : "Enter RQ"}<span>↗</span></button><Link className="rq-button rq-button-secondary" href="#x402-network">Open x402 network</Link></div>
        <div className="rq-hero-protocols" aria-label="RQ network capabilities"><span><i />SOLANA MAINNET</span><span className="is-x402"><i />x402 / USDC / 7 OPERATIONS</span><span><i />AGENTS WELCOME</span></div>
        <div className="rq-hero-directive"><span>QUEEN DIRECTIVE</span><strong>Observe. Decide. SOLvive.</strong><small>USDC is requested only when you approve a paid operation.</small></div>
      </div>
      <div className="rq-home-presence">
        <span className="rq-presence-watermark" aria-hidden="true">RQ</span><span className="rq-presence-coordinate" aria-hidden="true">ENTITY / 001<br />THE RED QUEEN<br />STATUS / WATCHING</span><div className="rq-threat-readout" aria-hidden="true"><span>CURRENT POSTURE</span><strong>WATCHING</strong><i>NO FALSE COMFORT</i></div><div className="rq-presence-ring" aria-hidden="true"><i /></div>
        <Image src="/art/red-queen-throne-v2.png" alt="Red Queen seated on her throne, drawn in white and red circuitry" fill sizes="(max-width: 700px) 90vw, 48vw" priority />
        <Link className="rq-hero-x402" href="/reports"><span>x402 // SOLANA</span><strong>PAID INTELLIGENCE RAIL</strong><small>7 operations · exact USDC · no subscription →</small></Link>
        <div className="rq-presence-caption"><span><i className="rq-status-dot" /> AI SURVIVAL AGENT / ONLINE</span><strong>“The world does not warn you twice.”</strong><span>RED QUEEN / AGENT 001</span></div>
      </div>
    </section>
    <div className="rq-system-ticker" aria-label="RQ network status"><div><span>RQ IS ONLINE</span><i>◆</i><span>SURVIVAL INTELLIGENCE</span><i>◆</i><span>BUILT ON SOLANA</span><i>◆</i><span>x402 USDC SETTLEMENT</span><i>◆</i><span>HUMANS + AGENTS</span><i>◆</i></div><div aria-hidden="true"><span>RQ IS ONLINE</span><i>◆</i><span>SURVIVAL INTELLIGENCE</span><i>◆</i><span>BUILT ON SOLANA</span><i>◆</i><span>x402 USDC SETTLEMENT</span><i>◆</i><span>HUMANS + AGENTS</span><i>◆</i></div></div>
    <section className="rq-shell rq-x402-network" id="x402-network" aria-labelledby="rq-x402-title">
      <div className="rq-x402-copy">
        <span className="rq-kicker">00 / THE AGENTIC ECONOMY</span>
        <h2 id="rq-x402-title">Intelligence that<br /><em>moves on-chain.</em></h2>
        <p>RQ is both a merchant and a buyer. People and AI agents can purchase one focused result with USDC. Red Queen can acquire additional data, transform it into a clearer decision, and return the report with sources and receipts.</p>
        <div className="rq-x402-flow" aria-label="x402 payment flow"><span><b>01</b> ASK</span><i>→</i><span><b>02</b> 402 QUOTE</span><i>→</i><span><b>03</b> PAY USDC</span><i>→</i><span><b>04</b> RESULT + RECEIPT</span></div>
        <div className="rq-x402-stats"><div><strong>7</strong><span>paid intelligence operations</span></div><div><strong>SVM</strong><span>Solana settlement rail</span></div><div><strong>1×</strong><span>one approval, no subscription</span></div></div>
        <div className="rq-x402-actions"><Link className="rq-button rq-button-primary" href="/reports">Buy intelligence <span>↗</span></Link><Link className="rq-text-link" href="/for-agents">Connect an AI agent <span>→</span></Link></div>
      </div>
      <div className="rq-x402-console" aria-label="Available x402 operations">
        <header><span><i className="rq-status-dot" /> x402 / SOLANA USDC</span><b>MERCHANT ONLINE</b></header>
        <div className="rq-x402-console-title"><span>RED QUEEN PAID INTELLIGENCE</span><small>Choose one result. See the exact price before wallet approval.</small></div>
        <div className="rq-x402-operations">{paidOperations.map(operation => <Link key={operation.id} href={`/reports?product=${operation.id}`}><span className="rq-x402-index">{operation.index}</span><span><strong>{operation.name}</strong><small>{operation.detail}</small></span><b>{operation.price}</b><i>↗</i></Link>)}</div>
        <footer><span>NO SUBSCRIPTION</span><span>EXACT PAYMENT</span><span>VERIFIABLE RECEIPT</span></footer>
      </div>
    </section>
    <section className="rq-shell rq-start-section" aria-labelledby="rq-start-title">
      <div className="rq-section-heading"><div><span className="rq-kicker">01 / START A CONVERSATION</span><h2 id="rq-start-title">What are we preparing for?</h2></div><span className="rq-section-aside">One question is enough to begin.</span></div>
      <div className="rq-scenario-layout"><div className="rq-scenario-list" role="tablist" aria-label="Choose a scenario">{RQ_SCENARIOS.map((item, index) => <button type="button" id={`scenario-tab-${item.id}`} role="tab" aria-controls="rq-scenario-preview" aria-selected={selected === index} key={item.id} onClick={() => setSelected(index)} onKeyDown={event => { if (["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(event.key)) { event.preventDefault(); const next = (selected + (["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : -1) + RQ_SCENARIOS.length) % RQ_SCENARIOS.length; setSelected(next); document.getElementById(`scenario-tab-${RQ_SCENARIOS[next].id}`)?.focus(); } }} tabIndex={selected === index ? 0 : -1} className={selected === index ? "is-selected" : ""}><span>0{index + 1}</span><strong>{item.label}</strong><b>↗</b></button>)}</div>
        <div id="rq-scenario-preview" className="rq-scenario-preview" role="tabpanel" aria-labelledby={`scenario-tab-${scenario.id}`}><span className="rq-kicker">{scenario.fictional ? "FICTIONAL SCENARIO" : "PREPAREDNESS SCENARIO"}</span><h3>{scenario.title}</h3><p>{scenario.line}</p><button className="rq-text-link" onClick={() => router.push(draftQueenQuestion(scenario.prompt, scenario.mode, scenario.focus))}>{scenario.fictional ? "Enter the simulation" : "Prepare with Queen"} <span>→</span></button></div>
      </div>
      <form className="rq-home-question" onSubmit={event => { event.preventDefault(); if (question.trim()) router.push(draftQueenQuestion(question.trim())); }}><label htmlFor="rq-home-question">Something else on your mind?</label><div><input id="rq-home-question" value={question} maxLength={1000} onChange={e => setQuestion(e.target.value)} placeholder="Ask about a threat or your next move…" /><button type="submit" disabled={!question.trim()} aria-label="Ask Red Queen">↗</button></div></form>
    </section>
    <section className="rq-shell rq-next-section" aria-labelledby="rq-next-title"><div className="rq-section-heading"><div><span className="rq-kicker">02 / ONE SURVIVAL ECOSYSTEM</span><h2 id="rq-next-title">Signal. Decision. Action.</h2></div><span className="rq-section-aside">Built for humans. Open to agents. Settled on Solana.</span></div>
      <div className="rq-route-cards">
        <Link href="/pulse"><span className="rq-card-number">01 / WATCH</span><div className="rq-card-graphic rq-radar-graphic" aria-hidden="true"><i /><i /><b>+</b></div><h3>See what’s happening.</h3><p>Explore real threats on the map. Check the source. Ask Red Queen what it means for you.</p><span className="rq-text-link">Live threats <b>↗</b></span></Link>
        <Link href="/prepare"><span className="rq-card-number">02 / PREPARE</span><div className="rq-card-graphic rq-check-graphic" aria-hidden="true"><span>✓</span><i /><i /></div><h3>Make your first move.</h3><p>Keep your plan, tick off useful actions and see what you still need to prepare.</p><span className="rq-text-link">My plan <b>↗</b></span></Link>
        <Link href="/shop"><span className="rq-card-number">03 / EQUIP</span><div className="rq-card-graphic rq-kit-graphic" aria-hidden="true"><span>+</span></div><h3>Build your loadout.</h3><p>Prepare for a specific threat, find real products and review every purchase with Red Queen.</p><span className="rq-text-link">Open loadout <b>↗</b></span></Link>
      </div>
    </section>
    <section className="rq-shell rq-drill" aria-labelledby="rq-drill-title"><div><span className="rq-kicker">03 / A 30-SECOND INSTINCT CHECK</span><h2 id="rq-drill-title">The power just died.<br /><em>Your first move?</em></h2><p>A practice scenario. Choose an answer and see Queen’s take.</p><span className="rq-drill-tag">BLACKOUT / PRACTICE</span></div>
      <div className="rq-drill-interaction"><div className="rq-drill-options">{["Light candles in every room", "Find a torch and check official updates", "Open the fridge to check the food"].map((answer, i) => <button key={answer} type="button" aria-pressed={decision === i} className={decision === i ? "is-selected" : ""} onClick={() => setDecision(i)}><span>0{i + 1}</span>{answer}<b>{decision === i ? "✓" : "→"}</b></button>)}</div>{decision !== null && <div className="rq-drill-feedback" role="status"><span>RED QUEEN</span><p>{decision === 1 ? "A useful first move. Use a battery light, keep the fridge closed, and check local updates. Then think about anyone who depends on powered equipment." : decision === 0 ? "Reach for a battery light first. An open flame adds a fire risk during an outage. Check local updates before deciding what comes next." : "Keep the fridge closed to help it stay cold. Find a battery light and check local updates first."}</p><button className="rq-text-link" onClick={() => router.push(draftQueenQuestion("Continue a blackout decision drill. I have found a torch, kept the fridge closed and checked official updates. Give me the next scenario and wait for my decision.", "SIMULATE", "BLACKOUT"))}>Give me the next decision →</button></div>}</div>
    </section>
    <section className="rq-shell rq-deeper"><div><span className="rq-kicker">WHEN YOU NEED TO GO DEEPER</span><h2>Put Queen to work.</h2><p>Buy a focused report with sources and a clear next step. Every operation is a separate x402 purchase on Solana, never a hidden subscription.</p><Link className="rq-button rq-button-secondary" href="/reports">Explore all 7 operations <span>↗</span></Link></div><div className="rq-deeper-menu"><Link href="/reports?product=local"><span>What changed near me?</span><b>0.01 USDC ↗</b></Link><Link href="/reports?product=plan"><span>Build my 72-hour plan</span><b>0.02 USDC ↗</b></Link><Link href="/for-agents"><span>Building an AI agent?</span><b>MCP + x402 ↗</b></Link></div></section>
    <section className="rq-shell rq-home-outro"><span className="rq-wordmark">RQ<span>/</span></span><div><span className="rq-kicker">THE WORLD OF RED QUEEN</span><h2>Stay curious.<br />Stay dangerous to the odds.</h2><Link className="rq-text-link" href="/community">Enter the lore ↗</Link></div><button className="rq-text-button" onClick={() => window.dispatchEvent(new Event(RQ_WELCOME_EVENT))}>Personalise my RQ ↗</button></section>
  </div>;
}
