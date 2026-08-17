import Link from "next/link";
import type { CSSProperties } from "react";
import OnchainClearanceClient from "@/components/OnchainClearanceClient";
import { SOLANA_MAINNET_CAIP2 } from "@/lib/onchain";
import { THREAT_CLEARANCE_LEVELS, THREAT_TOKEN_MINT } from "@/lib/threat-token";

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
      <header className="onchain-hero">
        <div className="container onchain-hero-grid">
          <div>
            <span className="pulse-eyebrow">SOLANA MAINNET // ON-CHAIN CONTROL PLANE</span>
            <h1>Proof before <em>privilege.</em></h1>
            <p>One place to see what RED QUEEN actually reads from Solana, what your $THREAT unlocks, and when a signature or USDC payment is required.</p>
            <div className="onchain-hero-tags"><span>SIWS IDENTITY</span><span>SPL BALANCE PROOF</span><span>x402 USDC</span><span>NO CUSTODY</span></div>
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
        <OnchainClearanceClient />

        <section className="onchain-contract">
          <div className="onchain-section-head"><span>01 // UTILITY CONTRACT</span><h2>Two assets. Two precise jobs.</h2><p>No vague ecosystem language: $THREAT controls persistent intelligence capacity; USDC pays for discrete AI compute through x402.</p></div>
          <div className="onchain-contract-grid">
            <article>
              <span>$THREAT · ACCESS LAYER</span>
              <h3>Hold to expand RED QUEEN.</h3>
              <ul><li>Longer trusted conversation context</li><li>Higher response and comparison depth</li><li>Multiplier on XP that was already earned through evidence</li><li>Planned holder-only alert and agent channels</li></ul>
              <small>HOLDINGS NEVER CREATE BIO-SCORE OR CLAIM COMPETENCE.</small>
            </article>
            <article>
              <span>USDC · COMPUTE LAYER</span>
              <h3>Pay only for a specific operation.</h3>
              <ul><li>Exact price shown before approval</li><li>Solana x402 SVM settlement</li><li>Premium report or autonomous agent request</li><li>Payment goes toward AI/API compute</li></ul>
              <small>CONNECTION AND SIWS SIGN-IN NEVER AUTHORIZE A PAYMENT.</small>
            </article>
          </div>
        </section>

        <section className="onchain-tiers">
          <div className="onchain-section-head"><span>02 // LIVE $THREAT CLEARANCE</span><h2>Utility you can measure.</h2><p>The server aggregates the canonical mint balance and maps it to the same tier used by the RED QUEEN agent.</p></div>
          <div className="onchain-tier-grid">
            {THREAT_CLEARANCE_LEVELS.map((tier, index) => (
              <article key={tier.level} style={{ "--tier-color": LEVEL_COLORS[index] } as CSSProperties}>
                <div><span>LVL 0{tier.level}</span><b>{formatRequirement(tier.threshold)} $THREAT</b></div>
                <h3>{tier.name}</h3>
                <p>{tier.description}</p>
                <ul>
                  <li><strong>{tier.contextMessages}</strong><span>context messages</span></li>
                  <li><strong>{tier.responseDepth.toUpperCase()}</strong><span>analysis depth</span></li>
                  <li><strong>×{tier.earnedXpMultiplier.toFixed(2)}</strong><span>earned XP only</span></li>
                </ul>
              </article>
            ))}
          </div>
          <div className="onchain-bio-rule"><strong>BIO-SCORE FIREWALL</strong><p>Token holdings may improve access and engagement rewards. Readiness domains change only after an evaluated decision, plan, or demonstrated preparedness action.</p></div>
        </section>

        <section className="onchain-stack">
          <div className="onchain-section-head"><span>03 // SOLANA STACK</span><h2>Live now. Next with purpose.</h2><p>Every label reflects implementation state, not marketing intent.</p></div>
          <div className="onchain-stack-grid">
            <article className="is-live"><span>LIVE</span><strong>Sign In With Solana</strong><p>Domain-bound, timestamped wallet authentication through Supabase Web3 Auth and the connected wallet adapter.</p></article>
            <article className="is-live"><span>LIVE</span><strong>SPL holder proof</strong><p>Server-side canonical mint read, aggregated token accounts, confirmed commitment, and fail-closed persistence.</p></article>
            <article className="is-beta"><span>BETA</span><strong>x402 exact SVM</strong><p>USDC-gated HTTP resources with exact prices. Available when the production facilitator and receiving wallet are configured.</p></article>
            <article className="is-next"><span>NEXT</span><strong>Seeker + Mobile Wallet Adapter</strong><p>Local Android wallet connection for the existing Seeker build, without browser-extension assumptions.</p></article>
            <article className="is-next"><span>NEXT</span><strong>Solana Actions / Blinks</strong><p>Share a verified RED QUEEN protocol or paid intelligence action as a wallet-readable link from X and mobile.</p></article>
            <article className="is-research"><span>RESEARCH</span><strong>Private readiness credentials</strong><p>Only if privacy can be preserved. Personal survival data will not be pushed on-chain for cosmetic gamification.</p></article>
          </div>
        </section>

        <section className="onchain-safety">
          <div><span>04 // SIGNATURE SAFETY</span><h2>RED QUEEN will never ask for a seed phrase.</h2></div>
          <ul><li><strong>CONNECT</strong><span>Expose one public address for read-only RPC calls.</span></li><li><strong>SIGN IN</strong><span>Prove address ownership with an off-chain SIWS message.</span></li><li><strong>PAY</strong><span>Approve a separately displayed transaction with network, asset, amount and destination.</span></li></ul>
          <div className="onchain-safety-actions"><Link href="/terminal" className="btn btn-primary">ASK RED QUEEN</Link><Link href="/operative" className="btn btn-ghost">OPEN MY READINESS</Link><a href={`https://explorer.solana.com/address/${THREAT_TOKEN_MINT}`} target="_blank" rel="noreferrer" className="btn btn-outline">VIEW MINT ↗</a></div>
          <code>CANONICAL $THREAT MINT · {THREAT_TOKEN_MINT}</code>
        </section>
      </div>
    </div>
  );
}
