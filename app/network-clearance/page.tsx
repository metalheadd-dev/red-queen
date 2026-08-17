import Link from "next/link";
import { THREAT_CLEARANCE_LEVELS, THREAT_TOKEN_MINT } from "@/lib/threat-token";

const LEVEL_COLORS = ["#686868", "#8a8a8a", "#f0c929", "#ff884d", "#ff4d4d"];

function formatRequirement(threshold: number) {
  if (threshold === 0) return "No tokens required";
  if (threshold < 1_000) return `${threshold}+ $THREAT`;
  if (threshold >= 1_000_000) return `${threshold / 1_000_000}M+ $THREAT`;
  return `${threshold / 1_000}K+ $THREAT`;
}

export default function NetworkClearancePage() {
  return (
    <div style={{ padding: "60px 0 0", background: "#050505", minHeight: "100vh" }}>
      <div style={{ borderBottom: "1px solid var(--border)", padding: "48px 24px", background: "var(--surface)" }}>
        <div className="container">
          <div className="tag tag-red" style={{ marginBottom: "16px" }}>ON-CHAIN INTELLIGENCE ACCESS</div>
          <h1 className="glow-text" style={{ fontSize: "clamp(28px, 5vw, 48px)", marginBottom: "8px", letterSpacing: "0.05em" }}>
            $THREAT <span style={{ color: "var(--accent)" }}>CLEARANCE</span>
          </h1>
          <p style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)", maxWidth: "720px", lineHeight: "1.8" }}>
            RED QUEEN verifies $THREAT holdings on Solana and adjusts analysis depth, retained conversation context, and readiness progression. Holdings unlock intelligence capacity — they do not buy competence or BIO-SCORE.
          </p>
        </div>
      </div>

      <div className="container" style={{ padding: "48px 24px" }}>
        <div style={{ marginBottom: "48px" }}>
          <div className="section-header">
            <span className="section-line" />
            <span className="section-tag">HOW VERIFICATION WORKS</span>
            <span className="section-line" />
          </div>

          <div className="bento-grid bento-3" style={{ gap: "12px" }}>
            {[
              { step: "01", title: "Verify ownership", desc: "Sign a Solana wallet challenge. Connecting a wallet alone is not identity verification." },
              { step: "02", title: "Scan on-chain balance", desc: "The server checks the canonical $THREAT mint and maps the live balance to one clearance tier." },
              { step: "03", title: "Expand RED QUEEN", desc: "Higher tiers receive longer memory windows, deeper response modes, and a modest readiness multiplier." },
            ].map((item) => (
              <div key={item.step} className="panel" style={{ padding: "24px" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--accent)", letterSpacing: "0.2em", marginBottom: "12px" }}>STEP {item.step}</div>
                <h3 style={{ fontSize: "16px", marginBottom: "8px" }}>{item.title}</h3>
                <p style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)", lineHeight: "1.7" }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="section-header">
          <span className="section-line" />
          <span className="section-tag">LIVE 5-TIER SYSTEM</span>
          <span className="section-line" />
        </div>

        <div style={{ overflowX: "auto", marginBottom: "32px" }}>
          <table className="clearance-table">
            <thead>
              <tr>
                <th>LEVEL</th>
                <th>RANK</th>
                <th>REQUIREMENT</th>
                <th>ANALYSIS MODE</th>
                <th>CONTEXT WINDOW</th>
                <th>READINESS</th>
              </tr>
            </thead>
            <tbody>
              {THREAT_CLEARANCE_LEVELS.map((rank, index) => (
                <tr key={rank.level}>
                  <td><span className="rank-badge" style={{ background: `${LEVEL_COLORS[index]}20`, color: LEVEL_COLORS[index], border: `1px solid ${LEVEL_COLORS[index]}50` }}>LVL {rank.level}</span></td>
                  <td style={{ color: LEVEL_COLORS[index], fontWeight: 700 }}>{rank.name}</td>
                  <td style={{ color: "var(--text-dim)" }}>{formatRequirement(rank.threshold)}</td>
                  <td style={{ color: "var(--text-dim)", textTransform: "uppercase" }}>{rank.responseDepth}</td>
                  <td style={{ color: "var(--text-dim)" }}>{rank.contextMessages} messages</td>
                  <td style={{ color: "var(--text-dim)" }}>×{rank.readinessMultiplier.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {THREAT_CLEARANCE_LEVELS.map((rank, index) => (
            <div key={rank.level} className="panel-red clearance-tier-card" style={{ borderColor: `${LEVEL_COLORS[index]}25`, padding: "22px", display: "grid", gridTemplateColumns: "150px 1fr", gap: "24px" }}>
              <div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "32px", fontWeight: 900, color: LEVEL_COLORS[index] }}>0{rank.level}</div>
                <div style={{ fontFamily: "var(--mono)", color: LEVEL_COLORS[index], fontWeight: 700, letterSpacing: "0.14em" }}>{rank.name}</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)", marginTop: "6px" }}>{formatRequirement(rank.threshold)}</div>
              </div>
              <div>
                <p style={{ color: "var(--text-muted)", lineHeight: 1.65, marginTop: 0 }}>{rank.description}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {[`${rank.contextMessages}-message context`, `${rank.responseDepth} analysis`, `×${rank.readinessMultiplier.toFixed(2)} readiness`].map((feature) => (
                    <span key={feature} style={{ background: `${LEVEL_COLORS[index]}10`, border: `1px solid ${LEVEL_COLORS[index]}25`, padding: "5px 10px", fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)" }}>{feature}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="alert" style={{ marginTop: "32px", lineHeight: 1.7 }}>
          <strong>BIO-SCORE IS SEPARATE.</strong> It changes only when RED QUEEN detects a meaningful readiness decision or completed assessment. Asking questions and holding tokens do not automatically make a user more prepared.
        </div>

        <div style={{ marginTop: "36px", padding: "38px", background: "rgba(255,77,77,0.04)", border: "1px solid rgba(255,77,77,0.15)", textAlign: "center" }}>
          <div className="tag tag-red" style={{ marginBottom: "16px" }}>$THREAT · SOLANA</div>
          <h2 style={{ fontSize: "26px", marginBottom: "12px" }}>VERIFY YOUR INTELLIGENCE CLEARANCE</h2>
          <p style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)", maxWidth: "560px", margin: "0 auto 24px", lineHeight: "1.8" }}>
            Open Terminal, sign the ownership challenge, and RED QUEEN will read the current on-chain balance. No token transfer is required for verification.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/terminal" className="btn btn-primary">OPEN RED QUEEN</Link>
            <a href={`https://pump.fun/coin/${THREAT_TOKEN_MINT}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">VIEW $THREAT ↗</a>
          </div>
          <code style={{ display: "block", marginTop: "18px", color: "var(--text-dim)", fontSize: "9px", overflowWrap: "anywhere" }}>MINT: {THREAT_TOKEN_MINT}</code>
        </div>
      </div>
    </div>
  );
}
