import Link from "next/link";
import { RED_QUEEN_AGENT_ID_SHORT } from "@/lib/agent-identity-public";
import type { CSSProperties } from "react";
import OnchainClearanceClient from "@/components/OnchainClearanceClient";
import { SOLANA_MAINNET_CAIP2 } from "@/lib/onchain";
import { QUEEN_VISAGE_MIN_BALANCE, THREAT_CLEARANCE_LEVELS, THREAT_TOKEN_MINT } from "@/lib/threat-token";
import { X402_INTELLIGENCE_PRODUCTS } from "@/lib/intelligence-products";
import X402HealthBadge from "@/components/X402HealthBadge";
import IntelligenceOperationsClient from "@/components/IntelligenceOperationsClient";
import ThreatSwapClient from "@/components/ThreatSwapClient";
import AgentRegistryIdentity from "@/components/AgentRegistryIdentity";
import CoreLoopGuide from "@/components/CoreLoopGuide";
import MobileCommandHeader from "@/components/MobileCommandHeader";

const LEVEL_COLORS = ["#8a8a8a", "#d8d8d8", "#f0c929", "#ff884d", "#ff4d4d"];

function formatRequirement(threshold: number) {
  if (threshold === 0) return "PUBLIC";
  if (threshold >= 1_000_000) return `${threshold / 1_000_000}M+`;
  if (threshold >= 1_000) return `${threshold / 1_000}K+`;
  return `${threshold}+`;
}

export default function NetworkClearancePage() {
  return (
    <div className="onchain-page">
      <MobileCommandHeader
        eyebrow="MARKET // SOLANA"
        title="Choose an on-chain action."
        description="Pay for Queen intelligence, buy $THREAT or inspect wallet risk. You approve every transaction."
        status="SOLANA MAINNET · NO CUSTODY"
        actions={[
          { href: "#queen-operations", label: "OPEN x402" },
          { href: "#buy-threat", label: "BUY $THREAT", tone: "secondary" },
        ]}
        steps={["CHOOSE", "REVIEW", "APPROVE"]}
      />
      <header className="onchain-hero">
        <div className="container onchain-hero-grid">
          <div>
            <span className="pulse-eyebrow">SOLANA MAINNET // ON-CHAIN CONTROL PLANE</span>
            <h1>Proof before <em>privilege.</em></h1>
            <p>RED QUEEN does not sell destiny. This is the exact record of what she can verify on Solana, what your $THREAT expands, and when a separate signature or USDC payment is required.</p>
            <div className="onchain-hero-tags"><span>SIWS IDENTITY</span><span>SPL BALANCE PROOF</span><span>x402 USDC</span><span>JUPITER SWAP V2</span><span>NO CUSTODY</span></div>
          </div>
          <div className="onchain-network-card">
            <span>ACTIVE NETWORK</span>
            <strong>SOLANA MAINNET</strong>
            <p>{SOLANA_MAINNET_CAIP2}</p>
            <div><i /> READS USE CONFIRMED COMMITMENT</div>
          </div>
        </div>
      </header>

      <div className="container onchain-main">
        <CoreLoopGuide
          eyebrow="ONCHAIN // CHOOSE ONE OPERATION"
          title="Review first. Sign only what you understand."
          description="Connect for read-only checks. Every swap, payment or authority change shows its network, asset, amount and destination before approval."
          actionHref="#onchain-actions"
          actionLabel="OPEN ONCHAIN ACTIONS"
          accessNote="CONNECT ≠ SIGN IN ≠ PAY · RED QUEEN NEVER REQUESTS A SEED PHRASE"
        />
        <div id="onchain-actions" />
        <OnchainClearanceClient />

        <ThreatSwapClient />

        <section className="onchain-contract">
          <div className="onchain-section-head"><span>01 // UTILITY CONTRACT</span><h2>Two assets. Two precise jobs.</h2><p>No ritual without purpose: $THREAT expands persistent RED QUEEN intelligence capacity; USDC pays only for a discrete AI operation through x402.</p></div>
          <div className="onchain-contract-grid">
            <article>
              <span>$THREAT · ACCESS LAYER</span>
              <h3>Hold to expand RED QUEEN.</h3>
              <ul><li>Longer trusted conversation context</li><li>More simultaneous personal Signal Watch slots</li><li>More verified live signals in one Queen synthesis</li><li>Higher response and comparison depth</li><li>Queen Visage generation from 500,000 $THREAT</li><li>Multiplier on XP that was already earned through evidence</li></ul>
              <small>HOLDINGS NEVER CREATE BIO-SCORE OR CLAIM COMPETENCE.</small>
            </article>
            <article>
              <span>USDC · COMPUTE LAYER</span>
              <h3>Pay only for a specific operation.</h3>
              <ul><li>Exact price shown before approval</li><li>Solana x402 SVM settlement</li><li>Signal, network or wallet-intelligence report</li><li>Private receipt history for the paying wallet</li><li>Payment goes toward AI/API and data compute</li></ul>
              <small>CONNECTION AND SIWS SIGN-IN NEVER AUTHORIZE A PAYMENT.</small>
            </article>
          </div>
        </section>

        <section className="onchain-products">
          <div className="onchain-section-head"><span>02 // x402 OPERATION CATALOG</span><h2>Pay for an output, not a vague premium tier.</h2><p>Each operation must declare its source inputs, exact or capped price, expected output and failure behavior before a wallet asks for approval.</p></div>
          <X402HealthBadge />
          <div className="onchain-product-grid">
            {X402_INTELLIGENCE_PRODUCTS.map((product) => (
              <article key={product.id} className={`is-${product.status.toLowerCase()}`}>
                <div><span>{product.status}</span><b>{product.price}</b></div>
                <h3>{product.name}</h3>
                <p>{product.value}</p>
                <dl><div><dt>SCHEME</dt><dd>{product.scheme}</dd></div><div><dt>OUTPUT</dt><dd>{product.output}</dd></div></dl>
                {product.endpoint ? <code>{product.endpoint}</code> : <small>NOT EXPOSED AS A PAID ENDPOINT YET</small>}
              </article>
            ))}
          </div>
          <div className="onchain-production-gates">
            <div><span>LIVE RULE</span><strong>NO PAY-TO-EARN</strong><p>x402 purchases never award XP or BIO.</p></div>
            <div><span>LIVE RULE</span><strong>FAIL CLOSED</strong><p>Source failure returns unavailable, never synthetic paid intelligence.</p></div>
            <div><span>LIVE GATE</span><strong>RECEIPT + IDEMPOTENCY</strong><p>Every paid output gets an operation UUID, stored settlement proof and exact signed-request replay protection.</p></div>
            <div><span>LIVE GATE</span><strong>FACILITATOR + STORAGE HEALTH</strong><p>Purchase UI stays disabled unless the SVM scheme, receiving wallet and receipt store are all ready.</p></div>
          </div>
        </section>

        <IntelligenceOperationsClient />

        <section className="onchain-tiers">
          <div className="onchain-section-head"><span>04 // LIVE $THREAT CLEARANCE</span><h2>Utility you can measure.</h2><p>The server aggregates the canonical mint balance and maps it to the same tier used by the RED QUEEN agent and Signal Watch.</p></div>
          <div className="onchain-tier-grid">
            {THREAT_CLEARANCE_LEVELS.map((tier, index) => (
              <article key={tier.level} style={{ "--tier-color": LEVEL_COLORS[index] } as CSSProperties}>
                <div><span>LVL 0{tier.level}</span><b>{formatRequirement(tier.threshold)} $THREAT</b></div>
                <h3>{tier.name}</h3>
                <p>{tier.description}</p>
                <ul>
                  <li><strong>{tier.contextMessages}</strong><span>context messages</span></li>
                  <li><strong>{tier.signalWatchSlots}</strong><span>signal watches</span></li>
                  <li><strong>{tier.comparisonSignals}</strong><span>signals per synthesis</span></li>
                  <li><strong>{tier.responseDepth.toUpperCase()}</strong><span>analysis depth</span></li>
                  <li><strong>×{tier.earnedXpMultiplier.toFixed(2)}</strong><span>earned XP only</span></li>
                  <li><strong>{tier.threshold >= QUEEN_VISAGE_MIN_BALANCE ? "UNLOCKED" : "LOCKED"}</strong><span>Queen Visage · 500K required</span></li>
                </ul>
              </article>
            ))}
          </div>
          <div className="onchain-bio-rule"><strong>BIO-SCORE FIREWALL</strong><p>Token holdings may improve access and engagement rewards. Readiness domains change only after an evaluated decision, plan, or demonstrated preparedness action.</p></div>
        </section>

        <AgentRegistryIdentity />

        <section className="onchain-stack">
          <div className="onchain-section-head"><span>06 // SOLANA STACK</span><h2>Live now. Next with purpose.</h2><p>Every label reflects implementation state, not marketing intent.</p></div>
          <div className="onchain-stack-grid">
            <article className="is-live"><span>LIVE</span><strong>Sign In With Solana</strong><p>Domain-bound, timestamped wallet authentication through Supabase Web3 Auth and the connected wallet adapter.</p></article>
            <article className="is-live"><span>LIVE</span><strong>SPL holder proof</strong><p>Server-side canonical mint read, aggregated token accounts, confirmed commitment, and fail-closed persistence.</p></article>
            <article className="is-beta"><span>BETA</span><strong>x402 exact SVM</strong><p>USDC-gated HTTP resources with exact prices. Available when the production facilitator and receiving wallet are configured.</p></article>
            <article className="is-beta"><span>BETA</span><strong>Jupiter $THREAT swap</strong><p>SOL/USDC input, canonical output mint, fresh Swap V2 order, fee disclosure and explicit wallet approval. Runtime-gated by the server API key.</p></article>
            <article className="is-beta" id="wallet-intelligence"><span>BETA</span><strong>Wallet Intelligence</strong><p>Read-only SPL and Token-2022 authority scans, paid evidence-bounded audit, and feature-gated simulated delegate revocation.</p></article>
            <article className="is-live"><span>LIVE</span><strong>8004 Agent Registry · ID {RED_QUEEN_AGENT_ID_SHORT}</strong><p>The RED QUEEN Agent Asset is registered on Solana mainnet with public metadata, MCP tools, OASF capabilities and x402 support. Operational-wallet binding remains owner-controlled.</p></article>
            <article className="is-next"><span>AFTER CORE</span><strong>Solana Actions / Blinks</strong><p>Share a verified RED QUEEN protocol or paid intelligence action after the daily web loop is stable.</p></article>
            <article className="is-next"><span>NEXT</span><strong>Kora fee abstraction</strong><p>Sponsor fees only for allowlisted RED QUEEN transactions after Wallet Lockdown passes mainnet QA.</p></article>
            <article className="is-research"><span>LATER</span><strong>Seeker + Mobile Wallet Adapter</strong><p>Deferred until the web product, agent value and payment flow are production-ready.</p></article>
            <article className="is-research"><span>RESEARCH</span><strong>Private readiness credentials</strong><p>Only if privacy can be preserved. Personal survival data will not be pushed on-chain for cosmetic gamification.</p></article>
          </div>
        </section>

        <section className="onchain-safety">
          <div><span>07 // SIGNATURE SAFETY</span><h2>RED QUEEN will never ask for a seed phrase.</h2></div>
          <ul><li><strong>CONNECT</strong><span>Expose one public address for read-only RPC calls.</span></li><li><strong>SIGN IN</strong><span>Prove address ownership with an off-chain SIWS message.</span></li><li><strong>SIMULATE</strong><span>Inspect exact instructions and RPC simulation before an authority change.</span></li><li><strong>PAY</strong><span>Approve a separately displayed transaction with network, asset, amount and destination.</span></li></ul>
          <div className="onchain-safety-actions"><Link href="/red-queen" className="btn btn-primary">ASK RED QUEEN</Link><Link href="/profile" className="btn btn-ghost">OPEN MY READINESS</Link><a href={`https://explorer.solana.com/address/${THREAT_TOKEN_MINT}`} target="_blank" rel="noreferrer" className="btn btn-outline">VIEW MINT ↗</a></div>
          <code>CANONICAL $THREAT MINT · {THREAT_TOKEN_MINT}</code>
        </section>
      </div>
    </div>
  );
}
