"use client";
import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { generateApocalypticName } from "@/lib/names";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false }
);

// ─── All Scenarios ─────────────────────────────────────────────────────────────
const ALL_SCENARIOS = [
  // Realistic
  { id: "T-VIRUS", label: "T-Virus / Zombie Outbreak", cat: "REALISTIC" },
  { id: "PANDEMIC", label: "Global Pandemic", cat: "REALISTIC" },
  { id: "NUCLEAR-WAR", label: "Nuclear War", cat: "REALISTIC" },
  { id: "NUCLEAR-WINTER", label: "Nuclear Winter", cat: "REALISTIC" },
  { id: "EMP-STRIKE", label: "EMP Attack", cat: "REALISTIC" },
  { id: "AI-TAKEOVER", label: "AI Takeover", cat: "REALISTIC" },
  { id: "ECON-COLLAPSE", label: "Economic Collapse", cat: "REALISTIC" },
  { id: "BIOWEAPON", label: "Bioweapon Release", cat: "REALISTIC" },
  { id: "BLACKOUT", label: "Global Blackout", cat: "REALISTIC" },
  { id: "FOOD-SHORT", label: "Global Food Shortage", cat: "REALISTIC" },
  { id: "WATER-CONTAM", label: "Water Contamination", cat: "REALISTIC" },
  { id: "SOLAR-FLARE", label: "Solar Flare (Carrington)", cat: "REALISTIC" },
  { id: "CLIMATE-CAT", label: "Climate Catastrophe", cat: "REALISTIC" },
  { id: "SUPERVOLCANO", label: "Supervolcano Eruption", cat: "REALISTIC" },
  { id: "CYBER-WAR", label: "Cyber Warfare Collapse", cat: "REALISTIC" },
  { id: "BIRD-FLU", label: "Bird Flu H5N1 Mutation", cat: "REALISTIC" },
  { id: "HANTAVIRUS", label: "Hantavirus Outbreak", cat: "REALISTIC" },
  { id: "INFRA-COLLAPSE", label: "Infrastructure Collapse", cat: "REALISTIC" },
  // Fictional
  { id: "ALIEN-INV", label: "Alien Invasion", cat: "FICTIONAL" },
  { id: "XENO-PROTO", label: "Alien Xenomorph Protocol", cat: "FICTIONAL" },
  { id: "SKYNET", label: "Skynet — AI Uprising", cat: "FICTIONAL" },
  { id: "ZOMBIE-APOC", label: "Zombie Apocalypse", cat: "FICTIONAL" },
  { id: "ROBOT-RISE", label: "Robot Uprising", cat: "FICTIONAL" },
  { id: "ASTEROID", label: "Asteroid Impact", cat: "FICTIONAL" },
  { id: "NANOBOT-SWARM", label: "Nanobot Swarm", cat: "FICTIONAL" },
  { id: "KAIJU", label: "Kaiju Attack", cat: "FICTIONAL" },
  { id: "VAMPIRE-PLAGUE", label: "Vampire Plague", cat: "FICTIONAL" },
  { id: "PARASITE", label: "Parasite Outbreak", cat: "FICTIONAL" },
  { id: "MOON-COLLISION", label: "Moon Collision", cat: "FICTIONAL" },
  { id: "DEMON-INV", label: "Demon Invasion", cat: "FICTIONAL" },
  // Satirical
  { id: "DUMB-PPL", label: "Invasion of Dumb People", cat: "SATIRICAL" },
  { id: "TIKTOK-COLLAPSE", label: "TikTok Civilisation Collapse", cat: "SATIRICAL" },
  { id: "MEME-PANDEMIC", label: "Meme Brainrot Pandemic", cat: "SATIRICAL" },
  { id: "WIFI-EXTINCTION", label: "WiFi Extinction Event", cat: "SATIRICAL" },
  { id: "INFLUENCER-DICT", label: "Influencer Dictatorship", cat: "SATIRICAL" },
  { id: "COFFEE-COLLAPSE", label: "Coffee Shortage Collapse", cat: "SATIRICAL" },
  { id: "SOFTWARE-UPDATE", label: "Apocalypse by Bad Software Update", cat: "SATIRICAL" },
  { id: "STREAMER-GOV", label: "Government Replaced by Streamers", cat: "SATIRICAL" },
];

const CAT_COLORS: Record<string, string> = {
  REALISTIC: "#ff4d4d",
  FICTIONAL: "#a855f7",
  SATIRICAL: "#f0c929",
};

type Profile = {
  wallet_address: string;
  apocalyptic_name: string | null;
  chosen_scenarios: string[];
  last_bio_score: number | null;
  last_interaction: string | null;
};

export default function ProfilePage() {
  const { publicKey, connected } = useWallet();
  const wallet = publicKey?.toString() ?? null;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [chosenScenarios, setChosenScenarios] = useState<string[]>([]);
  const [customName, setCustomName] = useState<string>("");
  const [editingName, setEditingName] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");

  const generatedName = wallet ? generateApocalypticName(wallet) : "";

  const fetchProfile = useCallback(async () => {
    if (!wallet) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/profile?wallet=${wallet}`);
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
        setChosenScenarios(data.profile.chosen_scenarios || []);
        setCustomName(data.profile.apocalyptic_name || generatedName);
      } else {
        setCustomName(generatedName);
      }
    } catch {
      setCustomName(generatedName);
    }
    setLoading(false);
  }, [wallet, generatedName]);

  useEffect(() => {
    if (connected && wallet) fetchProfile();
  }, [connected, wallet, fetchProfile]);

  function toggleScenario(id: string) {
    setChosenScenarios((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
    setSaved(false);
  }

  async function saveProfile() {
    if (!wallet) return;
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet_address: wallet,
          apocalyptic_name: customName || generatedName,
          chosen_scenarios: chosenScenarios,
        }),
      });
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  }

  async function confirmName(nameToSave: string) {
    setEditingName(false);
    if (!wallet) return;
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet_address: wallet,
          apocalyptic_name: nameToSave || generatedName,
          chosen_scenarios: chosenScenarios,
        }),
      });
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  }

  const displayName = customName || generatedName;
  const scoreNum = profile?.last_bio_score ?? null;
  const scoreColor = scoreNum === null ? "var(--text-dim)" : scoreNum < 20 ? "#ff4d4d" : scoreNum < 60 ? "#f0c929" : "#2ecc40";

  const filteredScenarios = activeFilter === "ALL"
    ? ALL_SCENARIOS
    : ALL_SCENARIOS.filter((s) => s.cat === activeFilter);

  if (!connected) {
    return (
      <div style={{ padding: "60px 0 0", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", maxWidth: "480px", padding: "48px 24px" }}>
          <div className="tag tag-red" style={{ marginBottom: "24px" }}>IDENTITY VERIFICATION REQUIRED</div>
          <h1 style={{ fontSize: "36px", marginBottom: "16px" }}>
            CONNECT YOUR <span style={{ color: "var(--accent)" }}>WALLET</span>
          </h1>
          <p style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.8", marginBottom: "32px" }}>
            The RED QUEEN cannot assess an anonymous subject. Connect your Phantom wallet to receive your classified operative designation and build your survival profile.
          </p>
          <WalletMultiButton style={{
            background: "var(--accent)",
            border: "none",
            color: "#000",
            fontFamily: "var(--mono)",
            fontSize: "13px",
            padding: "12px 28px",
            height: "auto",
            lineHeight: "1.5",
            fontWeight: "bold",
            cursor: "pointer",
          }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "60px 0 0", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid var(--border)", padding: "40px 24px", background: "var(--surface)" }}>
        <div className="container">
          <div className="tag tag-red" style={{ marginBottom: "12px" }}>OPERATIVE DOSSIER — CLASSIFIED</div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "32px", flexWrap: "wrap" }}>
            {/* Avatar */}
            <div style={{
              width: "96px", height: "96px", borderRadius: "2px",
              border: "2px solid var(--accent)", background: "rgba(255,77,77,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, position: "relative", overflow: "hidden"
            }}>
              <div style={{
                fontFamily: "var(--mono)", fontSize: "32px", fontWeight: 900,
                color: "var(--accent)", lineHeight: 1,
              }}>
                {displayName.charAt(0)}
              </div>
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                height: "2px", background: "var(--accent)", opacity: 0.4
              }} />
            </div>

            {/* Name + wallet */}
            <div style={{ flex: 1, minWidth: "240px" }}>
              {editingName ? (
                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px", flexWrap: "wrap" }}>
                  <input
                    value={customName}
                    onChange={(e) => { setCustomName(e.target.value.toUpperCase()); setSaved(false); }}
                    onKeyDown={(e) => { if (e.key === "Enter") confirmName(customName); }}
                    style={{
                      fontFamily: "var(--mono)", fontSize: "22px", fontWeight: 700,
                      background: "rgba(255,77,77,0.05)", border: "1px solid var(--accent)",
                      color: "var(--text)", padding: "6px 12px", outline: "none", borderRadius: "2px",
                      maxWidth: "360px", width: "100%"
                    }}
                    maxLength={36}
                    autoFocus
                  />
                  <button className="btn btn-primary" style={{ fontSize: "11px", padding: "6px 14px" }}
                    onClick={() => confirmName(customName)}>CONFIRM</button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px", flexWrap: "wrap" }}>
                  <h1 style={{ fontSize: "clamp(20px, 3vw, 30px)", margin: 0, color: "var(--accent)", letterSpacing: "0.05em" }}>
                    {displayName}
                  </h1>
                  <button
                    onClick={() => setEditingName(true)}
                    style={{ background: "none", border: "1px solid var(--border)", color: "var(--text-dim)", fontFamily: "var(--mono)", fontSize: "10px", padding: "3px 10px", cursor: "pointer", borderRadius: "2px", letterSpacing: "0.1em" }}
                  >✎ RENAME</button>
                </div>
              )}
              <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", letterSpacing: "0.1em", marginBottom: "12px" }}>
                {wallet?.slice(0, 8)}...{wallet?.slice(-8)}
              </div>
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: "11px" }}>
                  <span style={{ color: "var(--text-dim)" }}>BIO-SCORE: </span>
                  <span style={{ color: scoreColor, fontWeight: 700 }}>
                    {scoreNum !== null ? `${scoreNum}%` : "UNASSESSED"}
                  </span>
                </div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "11px" }}>
                  <span style={{ color: "var(--text-dim)" }}>SCENARIOS TRACKED: </span>
                  <span style={{ color: "var(--accent)", fontWeight: 700 }}>{chosenScenarios.length}</span>
                </div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "11px" }}>
                  <span style={{ color: "var(--text-dim)" }}>STATUS: </span>
                  <span style={{ color: "#2ecc40", fontWeight: 700 }}>ACTIVE OPERATIVE</span>
                </div>
              </div>
            </div>

            {/* Score display */}
            {scoreNum !== null && (
              <div style={{ textAlign: "right", marginLeft: "auto" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", letterSpacing: "0.15em", marginBottom: "4px" }}>SURVIVAL RATING</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "56px", fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{scoreNum}%</div>
                <div className="threat-bar-wrap" style={{ marginTop: "8px", width: "120px", marginLeft: "auto" }}>
                  <div className="threat-bar-fill" style={{ width: `${scoreNum}%`, background: scoreColor }} />
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "12px", marginTop: "24px", flexWrap: "wrap", alignItems: "center" }}>
            <button
              className="btn btn-primary"
              onClick={saveProfile}
              disabled={saving}
              style={{ fontSize: "12px" }}
            >
              {saving ? "SAVING..." : saved ? "✓ SAVED" : "SAVE PROFILE"}
            </button>
            <Link href="/terminal" className="btn btn-ghost" style={{ fontSize: "12px" }}>
              ▶ OPEN TERMINAL
            </Link>
            <Link href="/archives" className="btn btn-ghost" style={{ fontSize: "12px" }}>
              BROWSE THREATS
            </Link>
          </div>
        </div>
      </div>

      {/* Scenario Picker */}
      <div className="container" style={{ padding: "48px 24px" }}>
        <div className="section-header" style={{ marginBottom: "8px" }}>
          <span className="section-line" />
          <span className="section-tag">CHOOSE YOUR THREAT SCENARIOS</span>
          <span className="section-line" />
        </div>
        <p style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)", textAlign: "center", marginBottom: "32px", lineHeight: "1.7" }}>
          Select the apocalypse scenarios you believe are most likely. The RED QUEEN will prioritise your briefings accordingly.
          <br /><span style={{ color: "var(--accent)" }}>{chosenScenarios.length} selected</span>
        </p>

        {/* Category filter tabs */}
        <div style={{ display: "flex", gap: "0", borderBottom: "1px solid var(--border)", marginBottom: "32px", flexWrap: "wrap" }}>
          {["ALL", "REALISTIC", "FICTIONAL", "SATIRICAL"].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              style={{
                fontFamily: "var(--mono)", fontSize: "11px", letterSpacing: "0.15em",
                padding: "12px 20px", background: "none", border: "none",
                borderBottom: activeFilter === cat
                  ? `2px solid ${cat === "ALL" ? "var(--accent)" : CAT_COLORS[cat]}`
                  : "2px solid transparent",
                color: activeFilter === cat
                  ? (cat === "ALL" ? "var(--accent)" : CAT_COLORS[cat])
                  : "var(--text-dim)",
                cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
              }}
            >
              {cat === "ALL" ? `ALL (${ALL_SCENARIOS.length})` : `${cat} (${ALL_SCENARIOS.filter(s => s.cat === cat).length})`}
            </button>
          ))}
        </div>

        {/* Scenario grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "12px", marginBottom: "40px" }}>
          {filteredScenarios.map((scenario) => {
            const selected = chosenScenarios.includes(scenario.id);
            const color = CAT_COLORS[scenario.cat];
            return (
              <div
                key={scenario.id}
                onClick={() => toggleScenario(scenario.id)}
                style={{
                  padding: "16px 20px",
                  border: selected ? `1px solid ${color}` : "1px solid var(--border)",
                  borderRadius: "2px",
                  background: selected ? `${color}10` : "var(--surface)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  display: "flex", alignItems: "flex-start", gap: "12px",
                  position: "relative",
                }}
              >
                {/* Checkbox */}
                <div style={{
                  width: "18px", height: "18px", border: `1px solid ${selected ? color : "var(--border)"}`,
                  borderRadius: "2px", flexShrink: 0, display: "flex",
                  alignItems: "center", justifyContent: "center",
                  background: selected ? color : "transparent", marginTop: "1px",
                  transition: "all 0.15s",
                }}>
                  {selected && <span style={{ color: "#000", fontSize: "11px", fontWeight: 900 }}>✓</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text)", fontWeight: selected ? 700 : 400, lineHeight: 1.4 }}>
                    {scenario.label}
                  </div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: color, letterSpacing: "0.15em", marginTop: "4px" }}>
                    {scenario.cat}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Save bar */}
        <div style={{
          position: "sticky", bottom: "24px", display: "flex", justifyContent: "center",
        }}>
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: "2px", padding: "16px 32px",
            display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap",
            justifyContent: "center",
            boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)" }}>
              <span style={{ color: "var(--accent)" }}>{chosenScenarios.length}</span> scenarios selected
            </span>
            <button
              className="btn btn-primary"
              onClick={saveProfile}
              disabled={saving}
              style={{ fontSize: "12px", padding: "10px 28px" }}
            >
              {saving ? "SAVING..." : saved ? "✓ PROFILE SAVED" : "SAVE PROFILE →"}
            </button>
          </div>
        </div>

        {/* Loading overlay */}
        {loading && (
          <div style={{ textAlign: "center", padding: "40px", fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)" }}>
            LOADING OPERATIVE DOSSIER<span className="loading-dots"><span>.</span><span>.</span><span>.</span></span>
          </div>
        )}
      </div>
    </div>
  );
}
