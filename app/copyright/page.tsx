"use client";
import Link from "next/link";

export default function CopyrightPage() {
  return (
    <div style={{ padding: "100px 24px 80px", minHeight: "100vh", background: "#050505" }}>
      <div className="container" style={{ maxWidth: "800px" }}>
        <div className="tag tag-red" style={{ marginBottom: "16px" }}>SOLVIVAL CORP — LEGAL</div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 40px)", color: "var(--accent)", marginBottom: "32px", fontFamily: "var(--mono)" }}>
          COPYRIGHT NOTICE
        </h1>

        <div style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.8", display: "flex", flexDirection: "column", gap: "24px" }}>
          <p>
            <strong>Last Updated: January 2026</strong>
          </p>
          <p style={{ marginTop: "16px" }}>
            All content, database records, interface designs, brand imagery, and algorithms within the Red Queen platform are owned by Solvival Corp and are protected by international copyright, trademark, and intellectual property laws.
          </p>

          <h2 style={{ color: "#fff", fontSize: "18px", marginTop: "32px", marginBottom: "12px" }}>1. COPYRIGHT OWNERSHIP</h2>
          <p>
            © 2026 Solvival Corp. All rights reserved.
            <br />
            <br />
            The following assets are strictly copyrighted and proprietary to Solvival Corp:
            <br />• The terminal layout, visual theme, scanline shaders, and custom vector icons.
            <br />• The AI system prompt configuration, behavior parameters, and response logs.
            <br />• All text briefings, clearance protocols, and threat descriptions.
            <br />• Audio signals, system sounds, and logo designs.
          </p>

          <h2 style={{ color: "#fff", fontSize: "18px", marginTop: "32px", marginBottom: "12px" }}>2. TRADEMARK RESTRICTIONS</h2>
          <p>
            "Red Queen", "Solvival Corp", the Red Queen logo, and Solvival branding marks are registered trademarks. Any unauthorized use, replication, or distribution of these marks is strictly prohibited.
          </p>

          <h2 style={{ color: "#fff", fontSize: "18px", marginTop: "32px", marginBottom: "12px" }}>3. USER CONTRIBUTIONS</h2>
          <p>
            Any communication data, custom usernames, or messages submitted to the Red Queen terminal remain your intellectual property. However, by querying the terminal, you grant Solvival Corp a perpetual, worldwide, royalty-free, non-exclusive license to use, log, analyze, and display this data for threat assessment and model optimization.
          </p>

          <h2 style={{ color: "#fff", fontSize: "18px", marginTop: "32px", marginBottom: "12px" }}>4. REMOVAL OF WATERMARKS</h2>
          <p>
            Any attempt to remove, obscure, or alter classification labels, copyright watermarks, or system identification codes within the dashboard, terminal, or briefings will result in an immediate containment violation and suspension of access.
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
