"use client";
import { useState } from "react";
import SolvivalIcon from "@/components/SolvivalIcon";

export default function SurvivalKitPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", paddingTop: "60px" }}>
      {/* Docs Layout */}
      <div style={{ display: "flex", flex: 1, position: "relative" }}>
        
        {/* Sidebar */}
        <aside style={{
          width: "280px",
          borderRight: "1px solid var(--border)",
          background: "var(--surface)",
          padding: "32px 24px",
          position: "sticky",
          top: "60px",
          height: "calc(100vh - 60px)",
          overflowY: "auto"
        }}>
          <div style={{ marginBottom: "32px", display: "flex", alignItems: "center", gap: "12px" }}>
            <SolvivalIcon size={32} />
            <span style={{ fontFamily: "var(--mono)", fontSize: "14px", fontWeight: "bold", color: "var(--accent)" }}>SURVIVAL KIT</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <button className={`doc-nav-btn ${activeTab === "overview" ? "active" : ""}`} onClick={() => setActiveTab("overview")}>
              1. Overview
            </button>
            <button className={`doc-nav-btn ${activeTab === "problem" ? "active" : ""}`} onClick={() => setActiveTab("problem")}>
              2. The Problem
            </button>
            <button className={`doc-nav-btn ${activeTab === "usage" ? "active" : ""}`} onClick={() => setActiveTab("usage")}>
              3. How to Use
            </button>
            <button className={`doc-nav-btn ${activeTab === "threats" ? "active" : ""}`} onClick={() => setActiveTab("threats")}>
              4. Threat Matrix
            </button>
            <button className={`doc-nav-btn ${activeTab === "token" ? "active" : ""}`} onClick={() => setActiveTab("token")}>
              5. Token Utility
            </button>
          </div>
        </aside>

        {/* Content */}
        <main style={{ flex: 1, padding: "48px 80px", maxWidth: "900px" }}>
          
          {activeTab === "overview" && (
            <div className="doc-section animation-fade-in">
              <h1 style={{ fontSize: "36px", marginBottom: "24px" }}>Who Are We?</h1>
              <p style={{ color: "var(--text-dim)", fontSize: "16px", lineHeight: "1.9", marginBottom: "24px" }}>
                Solvival Corp is an elite contingency organization. We built this platform as an advanced AI survival assessment tool powered by the <strong>Red Queen</strong>. It is designed to evaluate human readiness for civilization collapse, extinction-level events, and daily survival threats.
              </p>
              <div className="alert alert-red" style={{ background: "rgba(255,77,77,0.05)", borderLeft: "4px solid var(--accent)" }}>
                The Red Queen is not a standard assistant. She is a cold, calculating evaluator with the persona of a bunker expert and military strategist.
              </div>
            </div>
          )}

          {activeTab === "problem" && (
            <div className="doc-section animation-fade-in">
              <h1 style={{ fontSize: "36px", marginBottom: "24px" }}>The Complacency Crisis</h1>
              <p style={{ color: "var(--text-dim)", fontSize: "16px", lineHeight: "1.9", marginBottom: "24px" }}>
                Human complacency is the greatest threat to our species. When the grid fails, when pandemics mutate, or when society fractures, unprepared individuals become immediate liabilities.
              </p>
              <p style={{ color: "var(--text-dim)", fontSize: "16px", lineHeight: "1.9", marginBottom: "24px" }}>
                This platform solves the "complacency crisis" by forcing users to engage with survival tactics in an immersive, gamified, and highly realistic terminal environment. It turns apocalypse preparation into an engaging, daily mental exercise.
              </p>
            </div>
          )}

          {activeTab === "usage" && (
            <div className="doc-section animation-fade-in">
              <h1 style={{ fontSize: "36px", marginBottom: "24px" }}>How to Use the Terminal</h1>
              
              <div className="bento-card" style={{ marginBottom: "24px" }}>
                <h3 style={{ color: "var(--text)", marginBottom: "12px" }}>1. Connect Your Wallet</h3>
                <p style={{ color: "var(--text-dim)", fontSize: "14px" }}>Use the terminal to connect your Solana wallet. This creates your persistent identity in the Solvival Corp database.</p>
              </div>

              <div className="bento-card" style={{ marginBottom: "24px" }}>
                <h3 style={{ color: "var(--text)", marginBottom: "12px" }}>2. Interrogate the Red Queen</h3>
                <p style={{ color: "var(--text-dim)", fontSize: "14px" }}>Ask her how to survive an EMP, what to do if aliens invade, or how to purify water.</p>
              </div>

              <div className="bento-card" style={{ marginBottom: "24px" }}>
                <h3 style={{ color: "var(--text)", marginBottom: "12px" }}>3. Earn Your BIO-SCORE</h3>
                <p style={{ color: "var(--text-dim)", fontSize: "14px" }}>The Red Queen will respond with practical, no-nonsense advice and dynamically assign you a BIO-SCORE (0-100%) based on your intelligence.</p>
              </div>

              <div className="bento-card" style={{ marginBottom: "24px" }}>
                <h3 style={{ color: "var(--text)", marginBottom: "12px" }}>4. Rank Up</h3>
                <p style={{ color: "var(--text-dim)", fontSize: "14px" }}>Asking smart, tactical questions raises your score. Asking foolish questions lowers it. Your highest score is permanently saved to your profile.</p>
              </div>
            </div>
          )}

          {activeTab === "threats" && (
            <div className="doc-section animation-fade-in">
              <h1 style={{ fontSize: "36px", marginBottom: "24px" }}>The Threat Matrix</h1>
              <p style={{ color: "var(--text-dim)", fontSize: "16px", lineHeight: "1.9", marginBottom: "32px" }}>
                Originally designed to monitor just 5 scenarios, the Red Queen's neural network has been vastly expanded. She now possesses deep intelligence on <strong>dozens of extinction vectors</strong> across three distinct categories:
              </p>
              
              <div style={{ marginBottom: "32px" }}>
                <h3 style={{ color: "var(--accent)", fontSize: "14px", letterSpacing: "0.1em", marginBottom: "16px" }}>▶ REALISTIC THREATS</h3>
                <p style={{ color: "var(--text-dim)", lineHeight: "1.8", fontSize: "14px" }}>
                  Hantavirus outbreaks, Pandemics, Bird flu, Bioweapons, Nuclear war, Nuclear winter, EMP attacks, Cyber warfare, Global blackouts, Economic collapse, Hyperinflation, Food shortages, Water contamination, Climate catastrophe, Solar flares, Earthquakes, Tsunamis, Supervolcano eruptions, Chemical disasters, AI takeover, Infrastructure collapse, Civil wars, Riots, Martial law, Satellite collapse, and Supply chain failure.
                </p>
              </div>

              <div style={{ marginBottom: "32px" }}>
                <h3 style={{ color: "var(--accent)", fontSize: "14px", letterSpacing: "0.1em", marginBottom: "16px" }}>▶ FICTIONAL INVASIONS</h3>
                <p style={{ color: "var(--text-dim)", lineHeight: "1.8", fontSize: "14px" }}>
                  Alien invasions, Zombies, Mutant viruses, Robot uprisings, Android rebellions, Giant bug invasions, Intelligent insects, Parasite outbreaks, Vampire plagues, Demon invasions, Kaiju attacks, Dinosaur return, Moon collision, Asteroid impacts, Reality collapse, Simulation glitches, Time traveler wars, Sentient plants, Nanobot swarms, Underwater monsters, Shadow creatures, Haunted technology, Invisible predators, AI refrigerators becoming sentient, Internet demons, Killer clowns, and Evil cartoons becoming real.
                </p>
              </div>

              <div style={{ marginBottom: "32px" }}>
                <h3 style={{ color: "var(--accent)", fontSize: "14px", letterSpacing: "0.1em", marginBottom: "16px" }}>▶ SATIRICAL / CULTURAL COLLAPSE</h3>
                <p style={{ color: "var(--text-dim)", lineHeight: "1.8", fontSize: "14px" }}>
                  Invasion of dumb people, Meme brainrot pandemic, TikTok civilization collapse, Toilet paper wars, Influencer dictatorship, Reality TV apocalypse, Coffee shortage collapse, WiFi extinction event, NPC uprising, Smartphone dependency collapse, Cat domination era, Fast food wars, Infinite advertisement apocalypse, Government replaced by streamers, and Apocalypse caused by bad software update.
                </p>
              </div>
            </div>
          )}

          {activeTab === "token" && (
            <div className="doc-section animation-fade-in">
              <h1 style={{ fontSize: "36px", marginBottom: "24px" }}>The $RQAI Token</h1>
              <p style={{ color: "var(--text-dim)", fontSize: "16px", lineHeight: "1.9", marginBottom: "24px" }}>
                Survival is not a right; it is earned. Access to classified Solvival Corp dossiers, evacuation routes, and the Red Queen's full cooperation is gated by the <strong>$RQAI token</strong> on the Solana blockchain.
              </p>
              
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "24px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                    <th style={{ padding: "16px 8px", color: "var(--accent)", fontFamily: "var(--mono)" }}>CLEARANCE LEVEL</th>
                    <th style={{ padding: "16px 8px", color: "var(--accent)", fontFamily: "var(--mono)" }}>ACCESS RIGHTS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "16px 8px", fontWeight: "bold" }}>Level 1 (Civilian)</td>
                    <td style={{ padding: "16px 8px", color: "var(--text-dim)" }}>Standard access. The AI will likely ignore your pleas.</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "16px 8px", fontWeight: "bold" }}>Level 3 (Operative)</td>
                    <td style={{ padding: "16px 8px", color: "var(--text-dim)" }}>Partial access to classified threat data.</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "16px 8px", fontWeight: "bold" }}>Level 5 (Director)</td>
                    <td style={{ padding: "16px 8px", color: "var(--text-dim)" }}>Requires significant $RQAI holdings. Unlocks full terminal override, persistent memory, and absolute compliance.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

        </main>
      </div>

      <style jsx>{`
        .doc-nav-btn {
          display: block;
          width: 100%;
          text-align: left;
          padding: 12px 16px;
          background: transparent;
          border: none;
          color: var(--text-dim);
          font-family: var(--mono);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          border-left: 2px solid transparent;
        }
        .doc-nav-btn:hover {
          color: var(--text);
          background: rgba(255, 255, 255, 0.02);
        }
        .doc-nav-btn.active {
          color: var(--accent);
          border-left-color: var(--accent);
          background: rgba(255, 77, 77, 0.05);
          font-weight: bold;
        }
        .animation-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
