"use client";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div style={{ padding: "100px 24px 80px", minHeight: "100vh", background: "#050505" }}>
      <div className="container" style={{ maxWidth: "800px" }}>
        <div className="tag tag-red" style={{ marginBottom: "16px" }}>SOLVIVAL CORP — LEGAL</div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 40px)", color: "var(--accent)", marginBottom: "32px", fontFamily: "var(--mono)" }}>
          TERMS OF SERVICE
        </h1>

        <div style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.8", display: "flex", flexDirection: "column", gap: "24px" }}>
          <p>
            <strong>Last Updated: January 2026</strong>
          </p>
          <p style={{ marginTop: "16px" }}>
            Welcome to the Red Queen terminal. By accessing our services, connecting your wallet, or interacting with the AI system, you agree to be bound by these Terms of Service.
          </p>

          <h2 style={{ color: "#fff", fontSize: "18px", marginTop: "32px", marginBottom: "12px" }}>1. OPERATIVE ELIGIBILITY</h2>
          <p>
            You must be at least 18 years of age to access the Red Queen interface. By establishing connection, you verify that your access complies with all local regulations.
          </p>

          <h2 style={{ color: "#fff", fontSize: "18px", marginTop: "32px", marginBottom: "12px" }}>2. TOKEN GATING AND VERIFICATION</h2>
          <p>
            Red Queen Terminal utilizes the **$THREAT** token on the Solana network to gate premium features, archives, and Level 5 clearance levels. Possession of $THREAT is verifiable on-chain.
          </p>

          <h2 style={{ color: "#fff", fontSize: "18px", marginTop: "32px", marginBottom: "12px" }}>3. LIABILITY LIMITATIONS & RISK WARNING</h2>
          <p style={{ color: "var(--accent)", background: "rgba(255, 77, 77, 0.05)", padding: "16px", border: "1px solid rgba(255, 77, 77, 0.2)", borderRadius: "2px" }}>
            <strong>WARNING:</strong> All calculations, scenarios, and advice provided by the Red Queen are parts of a simulated emergency preparedness and entertainment scenario. Solvival Corp is not responsible for any actual loss, damages, or real-world events. Cryptographic token transactions carry high risk; participate responsibly.
          </p>

          <h2 style={{ color: "#fff", fontSize: "18px", marginTop: "32px", marginBottom: "12px" }}>4. SYSTEM MODIFICATIONS</h2>
          <p>
            Solvival Corp reserves the right to modify, adjust, update, or discontinue any aspect of the Red Queen platform, AI settings, or token integrations at any time without prior notification.
          </p>

          <h2 style={{ color: "#fff", fontSize: "18px", marginTop: "32px", marginBottom: "12px" }}>5. GOVERNING LAW</h2>
          <p>
            These terms are governed by standard commercial frameworks, and any unresolved disputes shall be submitted to standard binding arbitration.
          </p>

          <div style={{ marginTop: "48px", borderTop: "1px solid var(--border)", paddingTop: "24px" }}>
            <Link href="/" style={{ color: "var(--accent)", textDecoration: "none" }}>
              ← RETURN TO HUB
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
