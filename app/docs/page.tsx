import Image from "next/image";
import Link from "next/link";
import { RED_QUEEN_AGENT_ID_SHORT } from "@/lib/agent-identity-public";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Product Guide | RED QUEEN",
  description: "Understand RED QUEEN pages, readiness scoring, $THREAT utility, x402 payments, Queen Visage, and privacy controls.",
};

const PROFILE_TERMS = [
  {
    name: "Apocalyptic SOLvivor alias",
    meaning: "Your public RED QUEEN identity: a callsign, not your legal name.",
    changes: "Edit it from My Readiness. It appears publicly only if you join the SOLvivor board.",
  },
  {
    name: "Email or Solana identity",
    meaning: "The verified account that owns your private Queen memory.",
    changes: "Email and Sign In With Solana are authentication methods. Connecting a wallet alone does not sign in or approve payment.",
  },
  {
    name: "BIO-SCORE",
    meaning: "A 0-100 readiness estimate across seven survival-thinking domains.",
    changes: "It changes only after Queen evaluates a decision, plan, or demonstrated preparedness action. Holdings and chat volume never change it.",
  },
  {
    name: "XP / SOLvivor Points",
    meaning: "A participation record earned through eligible evaluated drills and evidence.",
    changes: "$THREAT can modestly multiply XP that was genuinely earned. Paid reports never award XP.",
  },
  {
    name: "Level",
    meaning: "A simple progression tier derived from permanent XP: every 100 XP advances one level.",
    changes: "Level shows sustained activity; it is not professional certification or proof of safety.",
  },
  {
    name: "Readiness domains",
    meaning: "Threat awareness, operational discipline, psychological stability, technical preparedness, adaptability, resourcefulness, and digital resilience.",
    changes: "Queen updates a domain only when your evaluated response contains relevant evidence.",
  },
  {
    name: "Weakest domain",
    meaning: "The lowest current readiness domain and the clearest place to improve next.",
    changes: "It automatically changes when new evaluated evidence changes your domain scores.",
  },
  {
    name: "Recommended next drill",
    meaning: "A short Queen simulation focused on your baseline or current weakest domain.",
    changes: "It gives you one decision at a time and waits for your answer before evaluating it.",
  },
  {
    name: "Active protocols",
    meaning: "Preparedness plans saved from Queen or created from a scenario.",
    changes: "Protocols live on this device and remain active until their observable steps are completed.",
  },
  {
    name: "Plan execution",
    meaning: "How many concrete protocol steps you marked complete.",
    changes: "A local completion is a memory aid. It does not change BIO until Queen evaluates the evidence.",
  },
  {
    name: "Signal Watch state",
    meaning: "The categories and broad-area relevance you asked Queen to monitor.",
    changes: "Watch preferences stay on-device. Current browser alerts work while RED QUEEN is open.",
  },
  {
    name: "Evaluated activity history",
    meaning: "Recent Queen responses that contained an explicit readiness evaluation and next action.",
    changes: "Ordinary questions do not enter this evidence log.",
  },
  {
    name: "$THREAT clearance",
    meaning: "The intelligence capacity unlocked by a verified canonical SPL balance.",
    changes: "Scout starts at 1 $THREAT, Analyst at 500,000, Sentinel at 1,000,000, and Command at 5,000,000. Higher clearance expands context, watch slots, signal comparison, analysis depth, and the earned-XP multiplier.",
  },
  {
    name: "Holder verification",
    meaning: "A fresh server-side Solana mainnet balance read for the canonical $THREAT mint.",
    changes: "It fails closed when RPC is unavailable. Queen Visage requires at least 500,000 $THREAT and a proof refreshed within 30 minutes.",
  },
  {
    name: "Memory / privacy summary",
    meaning: "A visible inventory of what exists in account memory and what stays only on this browser.",
    changes: "RED QUEEN never needs a seed phrase, private key, password, or exact home address.",
  },
  {
    name: "Community visibility",
    meaning: "Your explicit choice to appear on the public SOLvivor Readiness Board.",
    changes: "Private by default. The board shows alias, XP, level, BIO, clearance, and a broad activity band. It never shows email or wallet.",
  },
];

const PAGE_GUIDE = [
  ["Pulse", "What changed today, what deserves attention, and the first useful action.", "/"],
  ["Map", "Where verified signals are, how strong they are, and whether broad-area relevance is justified.", "/pulse#live-map"],
  ["Red Queen", "Ask, analyze, prepare, or run a decision simulation with context.", "/red-queen"],
  ["Prepare", "Private baseline checks, active protocols, completed steps, and action history.", "/prepare"],
  ["Library", "Preparedness references, digital security scenarios, fictional simulations, and labeled satire.", "/library"],
  ["Community", "Queen transmissions, field notes, lore, and the opt-in SOLvivor board.", "/community"],
  ["Onchain", "Solana identity, live $THREAT utility, x402 status, prices, and signature safety.", "/onchain"],
  ["My Readiness", "Your private identity, evidence, BIO, XP, plans, holder status, and network controls.", "/profile"],
];

export default function ProductGuidePage() {
  return (
    <div className="guide-page">
      <header className="guide-hero">
        <div className="container guide-hero-grid">
          <div>
            <span>PRODUCT GUIDE // START HERE</span>
            <h1>Understand the system.<br /><em>Then make it useful.</em></h1>
            <p>RED QUEEN turns verified signals into one assessment, one action, and a readiness record you control. This guide explains every score, page, token gate, and payment boundary without lore getting in the way.</p>
            <div><Link className="btn btn-primary" href="/pulse">OPEN TODAY&apos;S PULSE</Link><Link className="btn btn-ghost" href="/red-queen">ASK RED QUEEN</Link></div>
            <Link className="rq-8004-badge guide-8004-badge" href="/onchain#agent-identity">8004 REGISTERED · AGENT ID {RED_QUEEN_AGENT_ID_SHORT} · SOLANA MAINNET</Link>
          </div>
          <div className="guide-queen" aria-hidden="true">
            <div className="guide-queen-halo" />
            <Image src="/art/red-queen-presence.png" alt="" width={1199} height={1312} priority />
          </div>
        </div>
      </header>

      <main className="container guide-main">
        <section className="guide-start">
          <div><span>THE DAILY LOOP</span><h2>Four steps. Less than a minute to begin.</h2></div>
          <ol>
            <li><b>01</b><strong>Detect</strong><p>Open Pulse and see what changed in verified sources.</p></li>
            <li><b>02</b><strong>Understand</strong><p>Open a signal or ask Queen why it matters to your context.</p></li>
            <li><b>03</b><strong>Act</strong><p>Save one justified next action or build a short protocol.</p></li>
            <li><b>04</b><strong>Improve</strong><p>Complete the action and let Queen evaluate real evidence.</p></li>
          </ol>
        </section>

        <section className="guide-section" id="pages">
          <div className="guide-section-head"><span>01 // PLATFORM MAP</span><h2>What every page is for</h2><p>If a page cannot answer one clear user question, it does not belong in the core journey.</p></div>
          <div className="guide-page-grid">
            {PAGE_GUIDE.map(([name, description, href]) => <Link key={name} href={href}><strong>{name}</strong><p>{description}</p><span>OPEN →</span></Link>)}
          </div>
        </section>

        <section className="guide-section" id="readiness">
          <div className="guide-section-head"><span>02 // MY READINESS</span><h2>Every profile field, explained</h2><p>Your profile separates activity, evidence, preparedness memory, token access, and public visibility. They are related, but they are not the same score.</p></div>
          <div className="guide-term-list">
            {PROFILE_TERMS.map((term, index) => (
              <details key={term.name} open={index < 3}>
                <summary><span>{String(index + 1).padStart(2, "0")}</span><strong>{term.name}</strong><i>+</i></summary>
                <div><p>{term.meaning}</p><small>HOW IT WORKS</small><p>{term.changes}</p></div>
              </details>
            ))}
          </div>
          <div className="guide-score-contract"><strong>THE SCORING FIREWALL</strong><p>BIO measures evaluated readiness. XP records eligible participation. $THREAT expands intelligence capacity. USDC pays for discrete compute. None of these may impersonate another.</p></div>
        </section>

        <section className="guide-section guide-two-column" id="token">
          <div>
            <div className="guide-section-head"><span>03 // $THREAT</span><h2>Access utility, not purchased competence</h2></div>
            <ul><li>Scout from 1 $THREAT.</li><li>Analyst from 500,000 $THREAT.</li><li>Sentinel from 1,000,000 $THREAT.</li><li>Command from 5,000,000 $THREAT.</li><li>Longer trusted Queen context.</li><li>More Signal Watch slots.</li><li>More verified signals in one synthesis.</li><li>Deeper analysis and comparison.</li><li>A modest multiplier on XP already earned through evidence.</li><li>Queen Visage generation from 500,000 $THREAT.</li></ul>
            <Link href="/onchain">VIEW LIVE CLEARANCE LEVELS →</Link>
          </div>
          <div id="x402">
            <div className="guide-section-head"><span>04 // x402</span><h2>Pay for a declared output</h2></div>
            <p>x402 uses a separate wallet approval for an exact USDC amount. A connected or signed-in wallet cannot silently pay. Each live request receives an operation ID, settlement receipt, replay protection, and a private receipt summary in My Readiness.</p>
            <ul><li>0.01 USDC global verified-source synthesis.</li><li>0.01 USDC 24-hour Local Delta.</li><li>0.02 USDC personalized 72-hour preparedness plan.</li><li>0.02 USDC verified Incident Dossier.</li><li>0.01 USDC pre-sign Solana transaction risk explanation.</li><li>0.02 USDC Solana network health or wallet authority audit.</li><li>0.05 USDC Premium Area Intelligence, including metered external geospatial evidence and an upstream procurement receipt.</li><li>0.08 USDC Queen Buyer Intelligence: up to 0.03 USDC purchases Agent402 search and extraction; the final delivery includes the assessment and both upstream receipts.</li><li>Disabled automatically when recipient, facilitator, required source data, provider readiness, buyer wallet, or receipt storage is not healthy.</li></ul>
            <p>Premium operations do not replace RED QUEEN&apos;s free official-source layer. Before Queen Buyer runs, it displays the merchant, exact resources, maximum upstream cost and every field that will be shared. A short-lived quote binds that disclosure to the separately approved x402 payment.</p>
            <Link href="/onchain">CHECK SETTLEMENT STATUS →</Link>
          </div>
        </section>

        <section className="guide-section guide-two-column" id="survival-market">
          <div>
            <div className="guide-section-head"><span>05 // SURVIVAL MARKET</span><h2>Build the cart before approving commerce</h2></div>
            <p>RED QUEEN can turn household size, broad-area context and constraints into a practical 72-hour supply cart. The preview is free and does not contact a seller, reserve inventory, transmit a delivery address or move funds.</p>
          </div>
          <div>
            <div className="guide-section-head"><span>CHECKOUT BOUNDARY</span><h2>Discovery and purchase stay separate</h2></div>
            <ul><li>Review quantities, reasons and cautions first.</li><li>Search live verified physical listings through the x402 Market catalog.</li><li>Use a retailer search when no agent-native offer exists.</li><li>Every future checkout requires a new quote, disclosed seller and explicit wallet approval.</li></ul>
            <Link href="/onchain#survival-market">BUILD A 72-HOUR CART →</Link>
          </div>
        </section>

        <section className="guide-section guide-visage" id="visage">
          <div><span>06 // SOLVIVOR AVATAR · RQ VISAGE / V2</span><h2>Your face. Her visual language.</h2><p>Any SOLvivor can choose a personal avatar; it is cropped locally to a square and can stay on that device or be explicitly saved to a private profile. Queen Visage generation unlocks at Analyst clearance with a freshly verified balance of at least 500,000 $THREAT. It follows a stricter visual contract: preserve identity, use a deep black silhouette, precise white facial linework, sparse red circuitry, luminous eyes and a restrained circular crown halo.</p><p>No text, logo, weapon, gore or extra person may appear. The source portrait is sent only after Generate and is never stored by RED QUEEN. Only the final 1:1 result can be saved privately, downloaded or shared to X, Discord and other profiles.</p></div>
          <Image src="/art/red-queen-sigil.png" alt="RED QUEEN visual language reference" width={1536} height={1536} />
        </section>

        <section className="guide-section guide-roadmap" id="next-solana">
          <div className="guide-section-head"><span>07 // SOLANA EXECUTION LAYER</span><h2>What is beta now, and what comes next</h2><p>Every label below is an implementation state, not a decorative promise.</p></div>
          <div>
            <article><span>BETA</span><strong>Wallet Lockdown</strong><p>Inspect SPL authorities now; simulate and explicitly approve delegate revocation only after the mainnet feature gate is enabled.</p></article>
            <article><span>BETA</span><strong>Jupiter $THREAT swap</strong><p>Request a fresh Swap V2 order, lock output to the canonical mint, inspect output and fees, then sign explicitly in the wallet.</p></article>
            <article><span>NEXT</span><strong>Actions / Blinks</strong><p>Share a verified protocol or paid Queen operation from X, Discord, or compatible wallets.</p></article>
            <article><span>LIVE</span><strong>8004 Agent Registry · ID {RED_QUEEN_AGENT_ID_SHORT}</strong><p>RED QUEEN is registered on Solana mainnet. Her Agent Asset, metadata, MCP tools, OASF capabilities and x402 support are publicly inspectable; operational-wallet binding always requires explicit owner approvals.</p><Link href="/onchain#agent-identity">VERIFY IDENTITY →</Link></article>
            <article><span>NEXT</span><strong>Kora fee abstraction</strong><p>Sponsor first Solana actions so onboarding does not require a pre-funded SOL balance.</p></article>
            <article><span>LATER</span><strong>Seeker / Mobile</strong><p>Rebuild the mobile shell around the proven Pulse → Queen → Action loop and Mobile Wallet Adapter.</p></article>
            <article><span>RESEARCH</span><strong>Agent budget</strong><p>A user-capped allowance for multiple AI/data calls with a per-operation ledger and strict spend ceiling.</p></article>
          </div>
        </section>

        <section className="guide-safety"><div><span>QUEEN DIRECTIVE</span><strong>Give me context. Never give me your keys.</strong><p>Use broad location only. Verify critical guidance with authorities. RED QUEEN is decision support, not an emergency service.</p></div><Link className="btn btn-primary" href="/privacy">PRIVACY CONTROLS</Link></section>
      </main>
    </div>
  );
}
