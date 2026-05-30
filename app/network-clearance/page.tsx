import Link from "next/link";

const RANKS = [
  {
    level: 1,
    name: "CIVILIAN",
    requirement: "No token holdings",
    access: "Public briefings only",
    attitude: "Coldly ignored",
    color: "#555",
    features: ["Basic threat awareness alerts", "Hub dashboard access", "Public Archives (redacted)", "No Terminal access"],
  },
  {
    level: 2,
    name: "SCOUT",
    requirement: "Any $THREAT holdings",
    access: "Terminal access unlocked",
    attitude: "Acknowledged — reluctantly",
    color: "#777",
    features: ["Full Terminal chat access", "BIO-SCORE assessment", "Basic survival product links", "Partial threat vector access"],
  },
  {
    level: 3,
    name: "OPERATIVE",
    requirement: "100K+ $THREAT tokens",
    access: "Partial classified intel",
    attitude: "Respectful — tactical",
    color: "#f0c929",
    features: ["All Level 2 features", "Intel priority queue", "Higher-detail threat briefings", "Weekly survival report"],
  },
  {
    level: 4,
    name: "OVERSEER",
    requirement: "500K+ $THREAT tokens",
    access: "Most classified files",
    attitude: "Cooperative — professional",
    color: "#ff884d",
    features: ["All Level 3 features", "Full threat vector access", "Classified survival routes", "Direct Red Queen briefings"],
  },
  {
    level: 5,
    name: "DIRECTOR",
    requirement: "1M+ $THREAT tokens",
    access: "Full unrestricted access",
    attitude: "Warm — tactical ally",
    color: "#ff4d4d",
    features: ["All Level 4 features", "Full classified database", "Red Queen treats you as ally", "Early threat warnings", "Solvival Corp emergency protocols"],
  },
];

export default function NetworkClearancePage() {
  return (
    <div style={{ padding: "60px 0 0", background: "#050505", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{
        borderBottom: "1px solid var(--border)",
        padding: "48px 24px",
        background: "var(--surface)",
      }}>
        <div className="container">
          <div className="tag tag-red" style={{ marginBottom: "16px" }}>RANK REGISTRY — CLASSIFIED</div>
          <h1 className="glow-text" style={{ fontSize: "clamp(28px, 5vw, 48px)", marginBottom: "8px", letterSpacing: "0.05em" }}>
            NETWORK <span style={{ color: "var(--accent)" }}>CLEARANCE</span>
          </h1>
          <p style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Wallet-based access and compute permissions
          </p>
          <p style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)", maxWidth: "600px", lineHeight: "1.8" }}>
            The RED QUEEN does not treat all survivors equally. Your access to classified intelligence —
            and her willingness to cooperate — is determined by your $THREAT token holdings on Solana.
          </p>
        </div>
      </div>

      <div className="container" style={{ padding: "48px 24px" }}>
        {/* How it works */}
        <div style={{ marginBottom: "48px" }}>
          <div className="section-header">
            <span className="section-line" />
            <span className="section-tag">HOW CLEARANCE WORKS</span>
            <span className="section-line" />
          </div>

          <div className="bento-grid bento-3" style={{ gap: "12px" }}>
            {[
              { step: "01", title: "Acquire $THREAT", desc: "Purchase $THREAT tokens on Solana via pump.fun. The more you hold, the higher your clearance level." },
              { step: "02", title: "Verify Wallet", desc: "Open the RED QUEEN Terminal. The node automatically scans your wallet for valid $THREAT credentials." },
              { step: "03", title: "Unlock Intelligence", desc: "The RED QUEEN adjusts her defensive protocols, access limits, and diagnostics according to your active tier." },
            ].map((s) => (
              <div key={s.step} className="panel" style={{ padding: "24px" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--accent)", letterSpacing: "0.2em", marginBottom: "12px" }}>
                  STEP {s.step}
                </div>
                <h3 style={{ fontSize: "16px", marginBottom: "8px" }}>{s.title}</h3>
                <p style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)", lineHeight: "1.7" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Rank cards */}
        <div className="section-header">
          <span className="section-line" />
          <span className="section-tag">5-TIER RANK SYSTEM</span>
          <span className="section-line" />
        </div>

        {/* Desktop table */}
        <div style={{ overflowX: "auto", marginBottom: "32px", display: "block" }}>
          <table className="clearance-table">
            <thead>
              <tr>
                <th>LEVEL</th>
                <th>RANK</th>
                <th>$THREAT REQUIREMENT</th>
                <th>ACCESS GRANTED</th>
                <th>RED QUEEN ATTITUDE</th>
              </tr>
            </thead>
            <tbody>
              {RANKS.map((r) => (
                <tr key={r.level}>
                  <td>
                    <span className="rank-badge" style={{
                      background: `${r.color}20`,
                      color: r.color,
                      border: `1px solid ${r.color}50`
                    }}>
                      LVL {r.level}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: r.color }}>{r.name}</td>
                  <td style={{ color: "var(--text-dim)" }}>{r.requirement}</td>
                  <td style={{ color: "var(--text-dim)" }}>{r.access}</td>
                  <td style={{ color: "var(--text-dim)", fontStyle: "italic" }}>{r.attitude}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detailed rank cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {RANKS.map((r) => (
            <div key={r.level} className="panel-red" style={{
              borderColor: `${r.color}25`,
              padding: "24px",
              display: "grid",
              gridTemplateColumns: "160px 1fr",
              gap: "24px",
              alignItems: "start"
            }}>
              <div>
                <div style={{
                  fontFamily: "var(--mono)",
                  fontSize: "36px",
                  fontWeight: 900,
                  color: r.color,
                  lineHeight: 1,
                  marginBottom: "8px"
                }}>0{r.level}</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "14px", fontWeight: 700, color: r.color, letterSpacing: "0.15em" }}>
                  {r.name}
                </div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)", marginTop: "6px", lineHeight: "1.6" }}>
                  {r.requirement}
                </div>
              </div>
              <div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)", letterSpacing: "0.2em", marginBottom: "12px" }}>
                  FEATURES INCLUDED
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {r.features.map((f, i) => (
                    <div key={i} style={{
                      background: `${r.color}10`,
                      border: `1px solid ${r.color}25`,
                      borderRadius: "2px",
                      padding: "5px 12px",
                      fontFamily: "var(--mono)",
                      fontSize: "11px",
                      color: "var(--text-dim)"
                    }}>
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{
          marginTop: "48px",
          padding: "40px",
          background: "rgba(255,77,77,0.04)",
          border: "1px solid rgba(255,77,77,0.15)",
          borderRadius: "2px",
          textAlign: "center"
        }}>
          <div className="tag tag-red" style={{ marginBottom: "16px" }}>$THREAT TOKEN — SOLANA</div>
          <h2 style={{ fontSize: "28px", marginBottom: "16px" }}>
            ACHIEVE <span style={{ color: "var(--accent)" }}>LEVEL 5 CLEARANCE</span>
          </h2>
          <p style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)", maxWidth: "480px", margin: "0 auto 28px", lineHeight: "1.8" }}>
            The RED QUEEN guards her most critical intelligence carefully.
            $THREAT token holders are recognized as Solvival Corp directors — treated with full cooperation and access.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/terminal" className="btn btn-primary">
              CLAIM YOUR RANK IN TERMINAL
            </Link>
            <a
              href="https://pump.fun/coin/3SBP25W239gQwTjTebshDcyNKBzM1J9ADRyqDqLQpump"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost"
            >
              BUY $THREAT ON PUMP.FUN ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
