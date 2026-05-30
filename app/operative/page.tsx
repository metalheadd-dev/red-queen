"use client";
import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useAuth } from "@/components/AuthProvider";
import dynamic from "next/dynamic";
import Link from "next/link";
import { generateApocalypticName } from "@/lib/names";
import { getClearanceLevel, DEFAULT_STATS, parseStatsFromAI } from "@/lib/progression";
import { Connection, PublicKey } from "@solana/web3.js";

const THREAT_MINT = new PublicKey("3SBP25W239gQwTjTebshDcyNKBzM1J9ADRyqDqLQpump");

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false }
);

// Mapped scenarios matching all 59 threats plus algorithmic sectors
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
  // Algorithmic Warfare
  { id: "WALLET-TRAIL", label: "Wallet-Trail (Surveillance Footprint)", cat: "ALGORITHMIC" },
  { id: "AI-PROFILING", label: "AI-Profiling (Scraping Exposure)", cat: "ALGORITHMIC" },
  { id: "FEED-MANIP", label: "Feed-Manip (Sentiment Steering)", cat: "ALGORITHMIC" },
  { id: "DEEPFAKE-SE", label: "Deepfake-SE (Vocal impersonations)", cat: "ALGORITHMIC" },
  { id: "REPUTATION-X", label: "Reputation-X (Compliance Flags)", cat: "ALGORITHMIC" },
  { id: "META-LEAK", label: "Meta-Leak (Web2 mapping)", cat: "ALGORITHMIC" },
];

const CAT_COLORS: Record<string, string> = {
  REALISTIC: "#ff4d4d",
  FICTIONAL: "#a855f7",
  SATIRICAL: "#f0c929",
  ALGORITHMIC: "#00ffcc",
};

type Profile = {
  wallet_address: string;
  apocalyptic_name: string | null;
  chosen_scenarios: string[];
  last_bio_score: number | null;
  last_interaction: string | null;
  email?: string | null;
  linked_wallet_address?: string | null;
  stats?: typeof DEFAULT_STATS;
};

// Client-side SHA-256 generator to display the Hashed Passport
async function generateHashedPassport(pubkey: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(pubkey + "red-queen-cyber-salt-2026");
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgBuffer as any);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function OperativeProfilePage() {
  const { publicKey, connected, wallet: walletObj, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const { user, authIdentifier } = useAuth();

  const solanaWalletAddress = publicKey?.toString() ?? null;
  const wallet = authIdentifier || solanaWalletAddress;

  const handleChangeWallet = async () => {
    try {
      await disconnect();
      setVisible(true);
    } catch (err) {
      console.error("Failed to change wallet:", err);
    }
  };

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [chosenScenarios, setChosenScenarios] = useState<string[]>([]);
  const [customName, setCustomName] = useState<string>("");
  const [editingName, setEditingName] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [hashedPassport, setHashedPassport] = useState<string>("");
  const [threatBalance, setThreatBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const generatedName = wallet ? generateApocalypticName(wallet) : "";

  // Render hashed passport once wallet connects
  useEffect(() => {
    if (wallet) {
      generateHashedPassport(wallet).then((hash) => setHashedPassport(hash));
    } else {
      setHashedPassport("");
    }
  }, [wallet]);

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

  const fetchHistory = useCallback(async () => {
    if (!wallet) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/history?wallet=${wallet}`);
      const data = await res.json();
      if (data.history) {
        setHistory(data.history);
      }
    } catch (e) {
      console.error("Failed to load history:", e);
    }
    setLoadingHistory(false);
  }, [wallet]);

  useEffect(() => {
    async function checkBalance() {
      let addressToCheck = "";
      if (wallet && wallet.startsWith("email-auth:")) {
        addressToCheck = profile?.linked_wallet_address || solanaWalletAddress || "";
      } else {
        addressToCheck = wallet || "";
      }

      if (!addressToCheck) {
        setThreatBalance(null);
        return;
      }
      setLoadingBalance(true);
      try {
        const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(new PublicKey(addressToCheck), {
          mint: THREAT_MINT,
        });
        if (tokenAccounts.value.length === 0) {
          setThreatBalance(0);
        } else {
          const balanceInfo = tokenAccounts.value[0].account.data.parsed.info.tokenAmount;
          setThreatBalance(balanceInfo.uiAmount || 0);
        }
      } catch (err) {
        console.error("Failed to query $THREAT balance:", err);
        setThreatBalance(0); 
      }
      setLoadingBalance(false);
    }
    checkBalance();
  }, [wallet, profile?.linked_wallet_address, solanaWalletAddress]);

  async function linkSolanaWallet() {
    if (!authIdentifier || !solanaWalletAddress) return;
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet_address: authIdentifier,
          linked_wallet_address: solanaWalletAddress,
          email: user?.email
        })
      });
      const data = await res.json();
      if (data.error) {
        alert("Failed to link wallet: " + data.error);
      } else {
        alert("Success: Solana wallet linked to your operative profile!");
        fetchProfile();
      }
    } catch (e: any) {
      alert("Error linking wallet: " + e.message);
    }
    setSaving(false);
  }

  useEffect(() => {
    if (wallet) {
      fetchProfile();
      fetchHistory();
    }
  }, [wallet, fetchProfile, fetchHistory]);

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
      if (data.error) {
        alert("Error saving profile: " + data.error);
      } else if (data.profile) {
        setProfile(data.profile);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (e: any) {
      alert("Failed to save profile: " + e.message);
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
      if (data.error) {
        alert("Error saving name: " + data.error);
      } else if (data.profile) {
        setProfile(data.profile);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (e: any) {
      alert("Failed to save name: " + e.message);
      console.error(e);
    }
    setSaving(false);
  }

  const displayName = customName || generatedName;
  const scoreNum = profile?.last_bio_score ?? null;
  const stats = profile?.stats || DEFAULT_STATS;
  const clearance = getClearanceLevel(scoreNum || 0);
  const scoreColor = scoreNum === null ? "var(--text-dim)" : clearance.color;

  const filteredScenarios = activeFilter === "ALL"
    ? ALL_SCENARIOS
    : ALL_SCENARIOS.filter((s) => s.cat === activeFilter);

  if (!wallet) {
    return (
      <div style={{ padding: "60px 0 0", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#050505" }}>
        <div style={{ textAlign: "center", maxWidth: "480px", padding: "48px 24px", border: "1px solid var(--border)", background: "var(--surface)" }}>
          <div className="tag tag-red" style={{ marginBottom: "24px" }}>IDENTITY VERIFICATION REQUIRED</div>
          <h1 className="glow-text" style={{ fontSize: "36px", marginBottom: "16px", letterSpacing: "0.05em" }}>
            CONNECT <span style={{ color: "var(--accent)" }}>IDENTITY</span>
          </h1>
          <p style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.8", marginBottom: "32px" }}>
            The RED QUEEN cannot retrieve an anonymous identity dossier. Connect your Solana wallet or log in with your email credentials to decrypt your profile status.
          </p>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", justifyContent: "center" }}>
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
            {walletObj && !connected && (
              <button 
                onClick={handleChangeWallet}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-dim)",
                  textDecoration: "underline",
                  fontSize: "11px",
                  cursor: "pointer",
                  fontFamily: "var(--mono)",
                }}
              >
                [CHANGE WALLET]
              </button>
            )}
            
            <div style={{ borderTop: "1px dashed var(--border)", width: "100%", margin: "8px 0", paddingTop: "12px" }} />
            
            <Link 
              href="/login" 
              style={{
                fontFamily: "var(--mono)",
                fontSize: "12px",
                border: "1px solid var(--accent)",
                color: "var(--accent)",
                padding: "10px 24px",
                textDecoration: "none",
                borderRadius: "2px",
                width: "100%",
                textAlign: "center",
                boxSizing: "border-box"
              }}
            >
              LOG IN WITH EMAIL PASSPORT
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "60px 0 0", minHeight: "100vh", background: "#050505" }}>
      {/* Header / Profile Card */}
      <div style={{ borderBottom: "1px solid var(--border)", padding: "40px 24px", background: "var(--surface)" }}>
        <div className="container">
          <div className="tag tag-red" style={{ marginBottom: "16px" }}>OPERATIVE PASSPORT — SECURE LINK</div>
          <h1 className="glow-text" style={{ fontSize: "clamp(24px, 4vw, 36px)", marginBottom: "8px", letterSpacing: "0.05em" }}>
            OPERATIVE <span style={{ color: "var(--accent)" }}>PROFILE</span>
          </h1>
          <p style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", marginBottom: "20px" }}>
            Your AI-generated survival identity
          </p>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "32px", flexWrap: "wrap" }}>
            {/* Logo initials avatar */}
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

            {/* Hashed details */}
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
                  <h1 className="glow-text" style={{ fontSize: "clamp(20px, 3vw, 30px)", margin: 0, color: "var(--accent)", letterSpacing: "0.05em" }}>
                    {displayName}
                  </h1>
                  <button
                    onClick={() => setEditingName(true)}
                    style={{ background: "none", border: "1px solid var(--border)", color: "var(--text-dim)", fontFamily: "var(--mono)", fontSize: "10px", padding: "3px 10px", cursor: "pointer", borderRadius: "2px", letterSpacing: "0.1em" }}
                  >✎ RENAME</button>
                </div>
              )}

              {/* Hashed Passport display */}
              <div style={{ background: "#0c0c0c", border: "1px solid #151515", padding: "10px 14px", borderRadius: "2px", marginBottom: "16px", maxWidth: "580px" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)", letterSpacing: "0.15em", marginBottom: "4px" }}>
                  HASHED PASSPORT (SALTED SHA-256)
                </div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--accent)", wordBreak: "break-all", textShadow: "0 0 2px rgba(255, 0, 51, 0.4)" }}>
                  {hashedPassport || "COMPUTING ANONYMOUS PASSPORT..."}
                </div>
              </div>

              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: "11px" }}>
                  <span style={{ color: "var(--text-dim)" }}>BIO-SCORE: </span>
                  <span style={{ color: scoreColor, fontWeight: 700 }}>
                    {scoreNum !== null ? `${scoreNum}%` : "PENDING"}
                  </span>
                </div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "11px" }}>
                  <span style={{ color: "var(--text-dim)" }}>MONITORED VECTORS: </span>
                  <span style={{ color: "var(--accent)", fontWeight: 700 }}>{chosenScenarios.length}</span>
                </div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "11px" }}>
                  <span style={{ color: "var(--text-dim)" }}>STATUS: </span>
                  <span style={{ color: "#00ffcc", fontWeight: 700 }}>ANONYMIZED OPERATIVE</span>
                </div>
              </div>

              {/* Boosters Panel */}
              <div style={{ 
                marginTop: "16px",
                display: "flex", 
                gap: "12px", 
                flexWrap: "wrap",
                background: "rgba(255, 77, 77, 0.02)",
                border: "1px solid rgba(255, 77, 77, 0.1)",
                padding: "10px 16px",
                borderRadius: "2px",
                maxWidth: "580px"
              }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: "10.5px", color: "var(--text-dim)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>$THREAT BOOST:</span>
                  <span style={{ 
                    color: threatBalance && threatBalance > 0 ? "#00ffcc" : "var(--text-muted)", 
                    fontWeight: "bold",
                    background: threatBalance && threatBalance > 0 ? "rgba(0, 255, 204, 0.08)" : "rgba(255, 255, 255, 0.03)",
                    padding: "2px 6px",
                    borderRadius: "2px",
                    border: threatBalance && threatBalance > 0 ? "1px solid rgba(0, 255, 204, 0.2)" : "1px solid rgba(255, 255, 255, 0.05)"
                  }}>
                    {threatBalance && threatBalance > 0 ? "ACTIVE (2.0x)" : "INACTIVE (1.0x)"}
                  </span>
                </div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "10.5px", color: "var(--text-dim)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>CLEARANCE BOOST:</span>
                  <span style={{ 
                    color: "var(--accent)", 
                    fontWeight: "bold",
                    background: "rgba(255, 77, 77, 0.05)",
                    padding: "2px 6px",
                    borderRadius: "2px",
                    border: "1px solid rgba(255, 77, 77, 0.2)"
                  }}>
                    {stats.level >= 5 ? "ACTIVE (2.0x)" : 
                     stats.level >= 4 ? "ACTIVE (1.75x)" : 
                     stats.level >= 3 ? "ACTIVE (1.5x)" : 
                     stats.level >= 2 ? "ACTIVE (1.25x)" : 
                     "ACTIVE (1.0x)"}
                  </span>
                </div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "10.5px", color: "var(--text)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>TOTAL MULTIPLIER:</span>
                  <span style={{ 
                    color: "#00ffcc", 
                    fontWeight: "bold",
                    textShadow: "0 0 4px rgba(0, 255, 204, 0.4)"
                  }}>
                    {((threatBalance && threatBalance > 0 ? 2.0 : 1.0) * 
                      (stats.level >= 5 ? 2.0 : 
                       stats.level >= 4 ? 1.75 : 
                       stats.level >= 3 ? 1.5 : 
                       stats.level >= 2 ? 1.25 : 
                       1.0)).toFixed(2)}x XP
                  </span>
                </div>
              </div>
            </div>

            {/* Score display with live glowing bar */}
            {scoreNum !== null && (
              <div style={{ textAlign: "right", marginLeft: "auto", minWidth: "160px" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", letterSpacing: "0.15em", marginBottom: "4px" }}>
                  SURVIVAL READINESS (BIO-SCORE)
                </div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "56px", fontWeight: 900, color: scoreColor, lineHeight: 1, textShadow: `0 0 6px ${scoreColor}80` }}>
                  {scoreNum}%
                </div>
                <div className="threat-bar-wrap" style={{ marginTop: "12px", width: "140px", marginLeft: "auto", height: "8px", border: "1px solid rgba(255,255,255,0.08)", background: "#111" }}>
                  <div className="threat-bar-fill" style={{ width: `${scoreNum}%`, background: scoreColor, boxShadow: `0 0 10px ${scoreColor}` }} />
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "12px", marginTop: "32px", flexWrap: "wrap", alignItems: "center" }}>
            <button
              className="btn btn-primary"
              onClick={saveProfile}
              disabled={saving}
              style={{ fontSize: "12px" }}
            >
              {saving ? "SAVING..." : saved ? "✓ PROFILE SECURED" : "SAVE PROFILE"}
            </button>
            <Link href="/terminal" className="btn btn-ghost" style={{ fontSize: "12px" }}>
              ▶ OPEN TERMINAL
            </Link>
            <Link href="/threat-vector" className="btn btn-ghost" style={{ fontSize: "12px" }}>
              BROWSE SECTOR MATRIX
            </Link>
          </div>

          {/* Solana Wallet Linkage Panel for Email Users */}
          {user && (
            <div style={{
              marginTop: "32px",
              padding: "20px 24px",
              background: "rgba(255, 77, 77, 0.03)",
              border: "1px dashed rgba(255, 77, 77, 0.2)",
              borderRadius: "2px",
              maxWidth: "580px"
            }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--accent)", letterSpacing: "0.15em", marginBottom: "8px", fontWeight: "bold" }}>
                // CRYPTOGRAPHIC KEY REGISTRY (WEB3 LINKAGE)
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-dim)", lineHeight: "1.6", margin: "0 0 16px 0" }}>
                Establish a cryptographic link between your email session and your Solana wallet. By binding your public key, the Red Queen can query your on-chain $THREAT token holdings and activate your 2.0x XP multiplier.
              </p>

              {profile?.linked_wallet_address ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "11.5px", color: "#00ffcc" }}>
                    Status: LINKED TO WALLET ADDRESS
                  </div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text)", wordBreak: "break-all", background: "rgba(0,0,0,0.4)", padding: "8px 12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                    {profile.linked_wallet_address}
                  </div>
                  
                  {solanaWalletAddress && solanaWalletAddress !== profile.linked_wallet_address && (
                    <div style={{ marginTop: "12px" }}>
                      <p style={{ fontSize: "11.5px", color: "var(--text-muted)", margin: "0 0 8px 0" }}>
                        Connected wallet ({solanaWalletAddress.slice(0, 4)}...{solanaWalletAddress.slice(-4)}) differs from linked wallet. Do you want to update the link?
                      </p>
                      <button 
                        onClick={linkSolanaWallet}
                        disabled={saving}
                        className="btn btn-ghost"
                        style={{ fontSize: "10.5px", padding: "4px 12px", borderColor: "var(--accent)", color: "var(--accent)" }}
                      >
                        {saving ? "LINKING..." : "UPDATE LINKED WALLET"}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {solanaWalletAddress ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "10px" }}>
                      <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text)" }}>
                        Connected Solana Wallet: <span style={{ color: "var(--accent)" }}>{solanaWalletAddress.slice(0, 6)}...{solanaWalletAddress.slice(-6)}</span>
                      </div>
                      <button
                        onClick={linkSolanaWallet}
                        disabled={saving}
                        className="btn btn-primary"
                        style={{ fontSize: "11px", padding: "6px 16px", boxShadow: "0 0 10px rgba(255,0,51,0.1)" }}
                      >
                        {saving ? "LINKING..." : "LINK CONNECTED WALLET NOW"}
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                      <WalletMultiButton style={{
                        background: "transparent",
                        border: "1px solid var(--accent)",
                        color: "var(--accent)",
                        fontFamily: "var(--mono)",
                        fontSize: "11px",
                        padding: "6px 16px",
                        height: "auto",
                        lineHeight: "1.5",
                      }} />
                      <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-muted)" }}>
                        Connect your wallet to enable link sequence.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Progression & Sub-Stats panel */}
        <div className="container" style={{ padding: "0 24px 20px", display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* XP & Clearance Level Progression Block */}
          <div className="panel" style={{
            background: "rgba(5, 5, 5, 0.4)",
            borderColor: "rgba(255, 77, 77, 0.15)",
            padding: "32px",
            boxShadow: "0 0 20px rgba(255, 0, 51, 0.02)"
          }}>
            <div style={{ borderBottom: "1px dashed var(--border)", paddingBottom: "16px", marginBottom: "24px" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--accent)", letterSpacing: "0.2em", marginBottom: "4px" }}>
                [ SYSTEM DIAGNOSTIC XP REPORT ]
              </div>
              <h3 style={{ fontFamily: "var(--mono)", fontSize: "20px", margin: 0, textTransform: "uppercase" }}>
                🛡️ PERMANENT SYSTEM CLEARANCE
              </h3>
            </div>

            <p style={{ fontSize: "14px", color: "var(--text-dim)", lineHeight: "1.7", marginBottom: "24px" }}>
              <strong>What is this?</strong> Your Level and Experience Points (XP) represent your permanent training record on the platform. You earn XP by checking in, talking to the terminal, and performing audits. This score <strong>never decreases or decays</strong>. Raising your XP unlocks higher clearance tiers.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", marginBottom: "32px" }} className="responsive-grid-2">
              
              {/* Level & Unlock Progress Checklist */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text)", fontWeight: "bold" }}>
                    OPERATIVE PROGRESS: LEVEL {stats.level}
                  </span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--accent)", fontWeight: "bold" }}>
                    {stats.xp % 100}/100 XP
                  </span>
                </div>
                <div className="threat-bar-wrap" style={{ height: "8px", background: "#111", marginBottom: "24px" }}>
                  <div className="threat-bar-fill" style={{ width: `${stats.xp % 100}%`, background: "var(--accent)" }} />
                </div>

                <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--accent)", letterSpacing: "0.15em", marginBottom: "14px" }}>
                  [ CLEARANCE TIER LOCKS ]
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontFamily: "var(--mono)", fontSize: "11.5px" }}>
                  {[
                    { l: 1, label: "CIVILIAN", req: "0+ XP", desc: "Basic terminal checks", unlocked: stats.level >= 1 },
                    { l: 2, label: "OBSERVER", req: "100+ XP", desc: "Live incident feeds enabled", unlocked: stats.level >= 2 },
                    { l: 3, label: "OPERATIVE", req: "200+ XP", desc: "Decryption protocols authorized", unlocked: stats.level >= 3 },
                    { l: 4, label: "ANALYST", req: "350+ XP", desc: "Strategic AI briefing modules", unlocked: stats.level >= 4 },
                    { l: 5, label: "DIRECTOR", req: "500+ XP", desc: "Full gateway overrides & logs", unlocked: stats.level >= 5 }
                  ].map((cl) => (
                    <div key={cl.l} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "6px", borderBottom: "1px dashed #1b1b1b", color: cl.unlocked ? "var(--text)" : "var(--text-muted)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ color: cl.unlocked ? "var(--accent)" : "var(--text-muted)", fontWeight: "bold" }}>
                          {cl.unlocked ? "✓" : "🔒"}
                        </span>
                        <span style={{ fontWeight: cl.unlocked ? "bold" : "normal" }}>
                          Lvl {cl.l}: {cl.label}
                        </span>
                        <span style={{ fontSize: "9.5px", color: "var(--text-dim)" }}>- {cl.desc}</span>
                      </div>
                      <span style={{ fontSize: "10px", color: cl.unlocked ? "#00ffcc" : "var(--text-muted)" }}>{cl.req}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Multiplier Boosters Summary */}
              <div style={{ background: "rgba(255, 255, 255, 0.01)", border: "1px solid rgba(255, 255, 255, 0.03)", padding: "20px", borderRadius: "2px" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--accent)", letterSpacing: "0.15em", marginBottom: "12px" }}>
                  [ ACTIVE REWARD BOOSTERS ]
                </div>
                <p style={{ fontSize: "12.5px", color: "var(--text-dim)", lineHeight: "1.6", marginBottom: "16px" }}>
                  Boosters multiply the amount of XP you gain for every interaction. You can stack boosters by holding the token and unlocking higher clearance.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontFamily: "var(--mono)", fontSize: "11.5px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-dim)" }}>$THREAT TOKEN MULTIPLIER:</span>
                    <span style={{ color: threatBalance && threatBalance > 0 ? "#00ffcc" : "var(--text-muted)", fontWeight: "bold" }}>
                      {threatBalance && threatBalance > 0 ? "2.0x (ACTIVE)" : "1.0x (INACTIVE)"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-dim)" }}>CLEARANCE LEVEL MULTIPLIER:</span>
                    <span style={{ color: "var(--accent)", fontWeight: "bold" }}>
                      {stats.level >= 5 ? "2.0x (Lvl 5)" : 
                       stats.level >= 4 ? "1.75x (Lvl 4)" : 
                       stats.level >= 3 ? "1.5x (Lvl 3)" : 
                       stats.level >= 2 ? "1.25x (Lvl 2)" : 
                       "1.0x (Lvl 1)"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "8px", borderTop: "1px dashed rgba(255, 255, 255, 0.05)" }}>
                    <span style={{ color: "var(--text)", fontWeight: "bold" }}>COMBINED TOTAL BOOST:</span>
                    <span style={{ color: "#00ffcc", fontWeight: "bold" }}>
                      {((threatBalance && threatBalance > 0 ? 2.0 : 1.0) * 
                        (stats.level >= 5 ? 2.0 : 
                         stats.level >= 4 ? 1.75 : 
                         stats.level >= 3 ? 1.5 : 
                         stats.level >= 2 ? 1.25 : 
                         1.0)).toFixed(2)}x XP
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* XP Audit History Logs */}
            <div style={{ borderTop: "1px dashed rgba(255,255,255,0.05)", paddingTop: "24px" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--accent)", letterSpacing: "0.15em", marginBottom: "16px" }}>
                [ SYSTEM DIAGNOSTICS & XP AUDIT HISTORY ]
              </div>
              {loadingHistory ? (
                <div style={{ fontFamily: "var(--mono)", fontSize: "11.5px", color: "var(--text-dim)", padding: "10px 0" }}>
                  DECRYPTING TRANSACTIONAL AUDIT PATHS...
                </div>
              ) : history.filter(m => m.role === "assistant").length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase" }}>
                    [ Showing Simulated Training Operations — Connect & Chat to Log Real Data ]
                  </div>
                  {[
                    { op: "OP-INIT", action: "System Clearance Onboarding Check-In", date: "2026-05-30", reward: "+20 XP", stat: "Awareness +2, Stability +1", type: "SUCCESS" },
                    { op: "OP-042", action: "Footprint Entropy Scan", date: "2026-05-29", reward: "+10 XP", stat: "Surveillance Resistance +2", type: "SUCCESS" },
                    { op: "OP-041", action: "Algorithmic Sandbox Verification", date: "2026-05-28", reward: "+8 XP", stat: "Adaptability +1", type: "SUCCESS" }
                  ].map((log, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#090909", border: "1px solid #141414", padding: "10px 16px", borderRadius: "2px", fontFamily: "var(--mono)", fontSize: "11.5px" }}>
                      <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                        <span style={{ color: "#00ffcc", fontWeight: "bold" }}>
                          [{log.op}]
                        </span>
                        <span style={{ color: "var(--text)" }}>{log.action}</span>
                        <span style={{ color: "var(--text-dim)", fontSize: "9px" }}>({log.date})</span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ color: "#00ffcc", marginRight: "16px", fontWeight: "bold" }}>{log.reward}</span>
                        <span style={{ color: "var(--text-dim)", fontSize: "10px" }}>[{log.stat}]</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {history
                    .filter(m => m.role === "assistant")
                    .reverse()
                    .slice(0, 10)
                    .map((msg, idx) => {
                      const parsed = parseStatsFromAI(msg.content);
                      const dateStr = new Date(msg.created_at).toISOString().split("T")[0];
                      
                      let fallbackXp = 0;
                      if (!parsed) {
                        const scoreMatch = msg.content.match(/\[BIO-SCORE:\s*(\d+)%?\]/i);
                        if (scoreMatch) fallbackXp = 5;
                      }

                      if (!parsed && fallbackXp === 0) return null;

                      const xpVal = parsed ? parsed.xpGain : fallbackXp;
                      const statGains = parsed ? Object.entries(parsed.gains)
                        .filter(([_, val]) => (val as number) > 0)
                        .map(([key, val]) => `${key.replace("_", " ").toUpperCase()} +${val}`)
                        .join(", ") : "Threat Awareness +1";

                      return (
                        <div key={idx} style={{ 
                          display: "flex", 
                          justifyContent: "space-between", 
                          alignItems: "center", 
                          background: "#090909", 
                          border: "1px solid #141414", 
                          padding: "10px 16px", 
                          borderRadius: "2px", 
                          fontFamily: "var(--mono)", 
                          fontSize: "11.5px",
                          flexWrap: "wrap",
                          gap: "8px"
                        }}>
                          <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
                            <span style={{ color: "#00ffcc", fontWeight: "bold" }}>
                              [OP-DB-{idx + 1}]
                            </span>
                            <span style={{ color: "var(--text)", textOverflow: "ellipsis", maxWidth: "250px", overflow: "hidden", whiteSpace: "nowrap" }}>
                              {msg.content.replace(/\[BIO-SCORE:.*?\]/gi, "").trim().slice(0, 45)}...
                            </span>
                            <span style={{ color: "var(--text-dim)", fontSize: "9px" }}>({dateStr})</span>
                          </div>
                          <div style={{ textAlign: "right", display: "flex", gap: "16px", alignItems: "center" }}>
                            <span style={{ color: "#00ffcc", fontWeight: "bold" }}>+{xpVal} XP</span>
                            <span style={{ color: "var(--text-dim)", fontSize: "10px" }}>[{statGains}]</span>
                          </div>
                        </div>
                      );
                    }).filter(Boolean)}
                </div>
              )}
            </div>
          </div>

          {/* BIO-SCORE & Sub-Stats Block */}
          {(() => {
            // 7 sub-stats values and labels
            const subStatsList = [
              { key: "threat_awareness", label: "AWARENESS", val: stats.threat_awareness, desc: "Understanding of passive & active threats" },
              { key: "operational_discipline", label: "DISCIPLINE", val: stats.operational_discipline, desc: "Consistency in security routines" },
              { key: "psychological_stability", label: "STABILITY", val: stats.psychological_stability, desc: "Resilience under stressful simulations" },
              { key: "technical_preparedness", label: "TECH PREP", val: stats.technical_preparedness, desc: "Hardware isolation & offline redundancy" },
              { key: "adaptability", label: "ADAPTABILITY", val: stats.adaptability, desc: "Agility in changing threat conditions" },
              { key: "resourcefulness", label: "RESOURCEFUL", val: stats.resourcefulness, desc: "Utility mapping & alternative supply routing" },
              { key: "surveillance_resistance", label: "OPSEC", val: stats.surveillance_resistance, desc: "Sovereign wallet patterns & trace minimization" }
            ];

            const getRadarPoints = (values: number[], maxVal = 100, size = 240) => {
              const center = size / 2;
              const radius = size * 0.35;
              const points: string[] = [];
              values.forEach((v, i) => {
                const angle = (i * 2 * Math.PI) / 7 - Math.PI / 2;
                const r = (v / maxVal) * radius;
                const x = center + r * Math.cos(angle);
                const y = center + r * Math.sin(angle);
                points.push(`${x},${y}`);
              });
              return points.join(" ");
            };

            const getRadarGridPoints = (level: number, size = 240) => {
              const center = size / 2;
              const radius = size * 0.35 * (level / 5);
              const points: string[] = [];
              for (let i = 0; i < 7; i++) {
                const angle = (i * 2 * Math.PI) / 7 - Math.PI / 2;
                const x = center + radius * Math.cos(angle);
                const y = center + radius * Math.sin(angle);
                points.push(`${x},${y}`);
              }
              return points.join(" ");
            };

            const getPsychologicalProfile = () => {
              const maxStat = subStatsList.reduce((max, current) => current.val > max.val ? current : max, subStatsList[0]);
              if (maxStat.val < 10) {
                return {
                  title: "UNCLASSIFIED CIV-NODE",
                  desc: "Operative profile under-evaluated. Complete diagnostic check-ins in the terminal to establish cognitive parameters.",
                  tag: "INDUCTION"
                };
              }
              if (maxStat.key === "surveillance_resistance") {
                return {
                  title: "SOVEREIGN SHIELD (OPSEC SPECIALIST)",
                  desc: "Operative demonstrates exceptional sensitivity to metadata leak vectors. Primarily focused on transaction masking and address decoupling.",
                  tag: "SHIELD"
                };
              }
              if (maxStat.key === "technical_preparedness") {
                return {
                  title: "CYBERNETIC WARDEN (SYSTEM TECH)",
                  desc: "Profile indicates deep alignment with hardware redundancy. Expert in offline power management, local data caching, and emergency mesh adapters.",
                  tag: "HARDWARE"
                };
              }
              if (maxStat.key === "psychological_stability") {
                return {
                  title: "TACTICAL SENTINEL (STRESS ANALYST)",
                  desc: "Maintains optimal logical coherence during cascade collapse events. Psychological parameters verify suitability for high-panic crisis nodes.",
                  tag: "PSYCHE"
                };
              }
              return {
                title: "RECON FIELD AGENT (TELEMETRY RECON)",
                desc: "Profile reflects balanced diagnostic metrics. Well-rounded in active danger mapping and resource routing parameters.",
                tag: "FIELD"
              };
            };

            const psyProfile = getPsychologicalProfile();

            return (
              <div className="panel" style={{
                background: "rgba(5, 5, 5, 0.4)",
                borderColor: "rgba(0, 255, 204, 0.15)",
                padding: "32px",
                boxShadow: "0 0 20px rgba(0, 255, 204, 0.01)"
              }}>
                <div style={{ borderBottom: "1px dashed var(--border)", paddingBottom: "16px", marginBottom: "24px" }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "#00ffcc", letterSpacing: "0.2em", marginBottom: "4px" }}>
                    [ OPERATIVE READINESS METRICS ]
                  </div>
                  <h3 style={{ fontFamily: "var(--mono)", fontSize: "20px", margin: 0, textTransform: "uppercase" }}>
                    🧬 DYNAMIC SURVIVAL READINESS (BIO-SCORE)
                  </h3>
                </div>

                <p style={{ fontSize: "14px", color: "var(--text-dim)", lineHeight: "1.7", marginBottom: "24px" }}>
                  <strong>What is this?</strong> Your BIO-SCORE is a dynamic rating between 0% and 100% that measures your current survival preparedness. It is calculated by averaging your 7 individual sub-stats. <strong>Warning: If you do not interact with the terminal for 24 hours, this score will decay by 5% per day.</strong> Check in daily to stop decay and restore your stats.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "32px", marginBottom: "32px" }} className="responsive-grid-2-large">
                  
                  {/* Left Column: Radar geometry & Psy Profile */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    <div style={{ background: "#080808", border: "1px solid #141414", padding: "24px", borderRadius: "2px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "#00ffcc", letterSpacing: "0.15em", marginBottom: "16px", alignSelf: "flex-start" }}>
                        [ RADAR DIAGNOSTICS GEOMETRY ]
                      </div>
                      
                      {/* SVG Radar Chart */}
                      <div style={{ position: "relative", width: "240px", height: "240px" }}>
                        <svg width="240" height="240" viewBox="0 0 240 240" style={{ overflow: "visible" }}>
                          {[1, 2, 3, 4, 5].map((lvl) => (
                            <polygon
                              key={lvl}
                              points={getRadarGridPoints(lvl)}
                              fill="none"
                              stroke="rgba(0, 255, 204, 0.08)"
                              strokeWidth="1"
                            />
                          ))}
                          {Array.from({ length: 7 }).map((_, i) => {
                            const angle = (i * 2 * Math.PI) / 7 - Math.PI / 2;
                            const x = 120 + 84 * Math.cos(angle);
                            const y = 120 + 84 * Math.sin(angle);
                            return (
                              <line
                                key={i}
                                x1="120"
                                y1="120"
                                x2={x}
                                y2={y}
                                stroke="rgba(0, 255, 204, 0.12)"
                                strokeWidth="1.5"
                                strokeDasharray="2 2"
                              />
                            );
                          })}
                          <polygon
                            points={getRadarPoints(subStatsList.map(s => s.val))}
                            fill="rgba(0, 255, 204, 0.15)"
                            stroke="#00ffcc"
                            strokeWidth="2"
                            style={{ filter: "drop-shadow(0 0 4px rgba(0,255,204,0.3))" }}
                          />
                          {subStatsList.map((st, i) => {
                            const angle = (i * 2 * Math.PI) / 7 - Math.PI / 2;
                            const r = (st.val / 100) * 84;
                            const x = 120 + r * Math.cos(angle);
                            const y = 120 + r * Math.sin(angle);
                            return (
                              <circle
                                key={i}
                                cx={x}
                                cy={y}
                                r="3.5"
                                fill="#00ffcc"
                                style={{ filter: "drop-shadow(0 0 2px #00ffcc)" }}
                              />
                            );
                          })}
                          {subStatsList.map((st, i) => {
                            const angle = (i * 2 * Math.PI) / 7 - Math.PI / 2;
                            const offset = 98;
                            const x = 120 + offset * Math.cos(angle);
                            const y = 120 + offset * Math.sin(angle);
                            return (
                              <text
                                key={i}
                                x={x}
                                y={y + 4}
                                textAnchor="middle"
                                style={{
                                  fontFamily: "var(--mono)",
                                  fontSize: "8.5px",
                                  fill: "var(--text-dim)",
                                  fontWeight: "bold",
                                  letterSpacing: "0.05em"
                                }}
                              >
                                {st.label}
                              </text>
                            );
                          })}
                        </svg>
                      </div>
                    </div>

                    {/* Psychological Profile Card */}
                    <div style={{ background: "rgba(0, 255, 204, 0.02)", borderLeft: "3px solid #00ffcc", padding: "20px", borderRadius: "0 2px 2px 0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "#00ffcc", letterSpacing: "0.15em" }}>
                          [ COGNITIVE PSYCHE DIAGNOSTIC ]
                        </span>
                        <span className="tag tag-green" style={{ fontSize: "8px", padding: "2px 6px", background: "rgba(0, 255, 204, 0.1)", color: "#00ffcc", borderColor: "rgba(0, 255, 204, 0.2)" }}>
                          {psyProfile.tag}
                        </span>
                      </div>
                      <h4 style={{ fontFamily: "var(--title-font)", fontSize: "14px", color: "var(--text)", margin: "0 0 6px 0" }}>
                        {psyProfile.title}
                      </h4>
                      <p style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)", lineHeight: "1.6", margin: 0, fontStyle: "italic" }}>
                        &ldquo;{psyProfile.desc}&rdquo;
                      </p>
                    </div>
                  </div>

                  {/* Right Column: 7 Sub-Stats bars */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {subStatsList.map((st, idx) => (
                      <div key={idx} style={{ background: "#080808", border: "1px solid #141414", padding: "12px 16px", borderRadius: "2px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                          <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text)", fontWeight: "bold" }}>{st.label}</span>
                          <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "#00ffcc", fontWeight: "bold" }}>{st.val}/100</span>
                        </div>
                        <div className="threat-bar-wrap" style={{ height: "4px", background: "#111", marginBottom: "4px" }}>
                          <div className="threat-bar-fill" style={{ width: `${st.val}%`, background: "#00ffcc" }} />
                        </div>
                        <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)" }}>
                          {st.desc}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Quests and Community Section Block */}
          <div className="panel" style={{
            background: "rgba(5, 5, 5, 0.4)",
            borderColor: "rgba(240, 201, 41, 0.15)",
            padding: "32px",
            boxShadow: "0 0 20px rgba(240, 201, 41, 0.01)"
          }}>
            <div style={{ borderBottom: "1px dashed var(--border)", paddingBottom: "16px", marginBottom: "24px" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "#f0c929", letterSpacing: "0.2em", marginBottom: "4px" }}>
                [ COMMUNITY OPERATIONS & MISSIONS ]
              </div>
              <h3 style={{ fontFamily: "var(--mono)", fontSize: "20px", margin: 0, textTransform: "uppercase" }}>
                🎯 RED QUEEN QUESTS
              </h3>
            </div>

            <p style={{ fontSize: "14px", color: "var(--text-dim)", lineHeight: "1.7", marginBottom: "24px" }}>
              <strong>What is this?</strong> Participate in targeted community challenges and network drills. Completing active quests earns massive XP rewards, upgrades your clearance tier, and grants permanent sub-stat boosts.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
              {[
                { title: "SANDBOX DRILL // MEV MITIGATION", reward: "+50 XP, OPSEC +5", desc: "Successfully route three multi-hop swaps using secure private endpoints." },
                { title: "ENTROPY HARVEST // CRAWLER BYPASS", reward: "+80 XP, Adaptability +8", desc: "Rotate transaction footprints to drop correlation indices below 15%." },
                { title: "COGNITIVE STRAIN // FEED DECOUPLING", reward: "+60 XP, Stability +6", desc: "Isolate and ignore outline injection loops inside the Sector Gamma feed." }
              ].map((q, idx) => (
                <div key={idx} style={{ 
                  background: "#080808", 
                  border: "1px solid rgba(240, 201, 41, 0.1)", 
                  padding: "20px", 
                  borderRadius: "2px",
                  position: "relative",
                  overflow: "hidden"
                }}>
                  {/* Blurred locked content */}
                  <div style={{
                    opacity: 0.12,
                    filter: "blur(3px)",
                    pointerEvents: "none",
                    userSelect: "none"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                      <span className="tag" style={{ color: "#f0c929", borderColor: "rgba(240, 201, 41, 0.3)", background: "rgba(240, 201, 41, 0.05)", fontSize: "8.5px" }}>
                        QUEST 0{idx + 1}
                      </span>
                    </div>
                    <h4 style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "#ffffff", margin: "0 0 6px 0" }}>{q.title}</h4>
                    <p style={{ fontSize: "12px", color: "var(--text-dim)", lineHeight: "1.6", margin: "0 0 16px 0" }}>{q.desc}</p>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "10.5px", color: "#00ffcc" }}>
                      REWARD: {q.reward}
                    </div>
                  </div>

                  {/* Absolute Coming Soon Overlay */}
                  <div style={{
                    position: "absolute",
                    top: 0, left: 0, right: 0, bottom: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    gap: "6px",
                    background: "rgba(8, 8, 8, 0.6)"
                  }}>
                    <span style={{
                      fontFamily: "var(--title-font)",
                      fontSize: "13px",
                      fontWeight: "bold",
                      color: "#f0c929",
                      letterSpacing: "0.18em",
                      textShadow: "0 0 8px rgba(240, 201, 41, 0.3)"
                    }}>
                      COMING SOON
                    </span>
                    <span style={{
                      fontFamily: "var(--mono)",
                      fontSize: "9px",
                      color: "rgba(240, 201, 41, 0.6)",
                      letterSpacing: "0.1em"
                    }}>
                      [ LOCKED // CLEARANCE ACCESS ]
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Scenario Picker */}
      <div className="container" style={{ padding: "48px 24px" }}>
        <div className="section-header" style={{ marginBottom: "8px" }}>
          <span className="section-line" />
          <span className="section-tag">CHOOSE TARGET BREACH VECTORS</span>
          <span className="section-line" />
        </div>
        <p style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)", textAlign: "center", marginBottom: "32px", lineHeight: "1.7" }}>
          Select the active threat fields you seek to monitor. The RED QUEEN will customize briefing streams to prioritize these alerts.
          <br /><span style={{ color: "var(--accent)" }}>{chosenScenarios.length} vectors enabled</span>
        </p>

        {/* Category filter tabs */}
        <div style={{ display: "flex", gap: "0", borderBottom: "1px solid var(--border)", marginBottom: "32px", flexWrap: "wrap" }}>
          {["ALL", "REALISTIC", "FICTIONAL", "SATIRICAL", "ALGORITHMIC"].map((cat) => (
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px", marginBottom: "40px" }}>
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
                  background: selected ? `${color}06` : "var(--surface)",
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
          position: "sticky", bottom: "24px", display: "flex", justifyContent: "center", zIndex: 10
        }}>
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: "2px", padding: "16px 32px",
            display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap",
            justifyContent: "center",
            boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)" }}>
              <span style={{ color: "var(--accent)" }}>{chosenScenarios.length}</span> vectors monitored
            </span>
            <button
              className="btn btn-primary"
              onClick={saveProfile}
              disabled={saving}
              style={{ fontSize: "12px", padding: "10px 28px" }}
            >
              {saving ? "SAVING..." : saved ? "✓ SECURED" : "SAVE SYSTEM PROFILE"}
            </button>
          </div>
        </div>

        {/* Loading overlay */}
        {loading && (
          <div style={{ textAlign: "center", padding: "40px", fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)" }}>
            RETRIEVING SECURE CREDENTIALS<span className="loading-dots"><span>.</span><span>.</span><span>.</span></span>
          </div>
        )}
      </div>
    </div>
  );
}
