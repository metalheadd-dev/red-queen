"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import Link from "next/link";
import SolvivalIcon from "@/components/SolvivalIcon";
import dynamic from "next/dynamic";
import Leaderboard from "@/components/Leaderboard";

// Client-side SHA-256 generator to display the Hashed Passport matching server index
async function generateHashedPassport(pubkey: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(pubkey + "red-queen-cyber-salt-2026");
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgBuffer as any);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

const BroadcastMap = dynamic(() => import("@/components/BroadcastMap"), { ssr: false });

interface Task {
  id: string;
  title: string;
  description: string;
  reward_xp: number;
  recurrence: string;
  created_at: string;
  image_url?: string;
}

interface Bounty {
  id: string;
  title: string;
  description: string;
  reward_sol: number;
  winners_count: number;
  deadline: string;
  created_at: string;
  image_url?: string;
}

interface UserQuest {
  id: string;
  target_id: string;
  type: string;
  status: string;
}

function getHubIcon(id: string, color: string) {
  switch (id) {
    case "operations":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", filter: `drop-shadow(0 0 3px ${color}55)` }}>
          {/* Cyberpunk space invader emoji style line-art */}
          <path d="M6 4h12M4 7h16M3 10h18M3 13h2M8 13h8M19 13h2M3 16h18M5 19h2M17 19h2" />
          <circle cx="8" cy="10" r="1.5" fill={color} />
          <circle cx="16" cy="10" r="1.5" fill={color} />
        </svg>
      );
    case "broadcasts":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", filter: `drop-shadow(0 0 3px ${color}55)` }}>
          {/* High-tech radio transmitter style line-art */}
          <rect x="2" y="8" width="20" height="12" rx="2" />
          <circle cx="7" cy="14" r="3" />
          <line x1="17" y1="11" x2="17.01" y2="11" />
          <line x1="17" y1="14" x2="17.01" y2="14" />
          <line x1="17" y1="17" x2="17.01" y2="17" />
          <path d="M16 8l4-5" />
          <path d="M12 3a6 6 0 0 1 6 6" />
          <path d="M12 6a3 3 0 0 1 3 3" />
        </svg>
      );
    case "lore":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", filter: `drop-shadow(0 0 3px ${color}55)` }}>
          {/* Cyber parchment/scroll style line-art */}
          <path d="M16 5V3a1 1 0 0 0-1-1H4a2 2 0 0 0 0 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6" />
          <path d="M8 22H19a1 1 0 0 0 1-1v-2" />
          <line x1="8" y1="9" x2="15" y2="9" />
          <line x1="8" y1="13" x2="16" y2="13" />
        </svg>
      );
    case "comics":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", filter: `drop-shadow(0 0 3px ${color}55)` }}>
          {/* Cyber palette/art style line-art */}
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 14.7255 3.09032 17.1962 4.85857 19C5.3211 19.4625 6.07921 19.3496 6.39864 18.7845C6.79093 18.0906 7.5262 17.6 8.5 17.6C9.4738 17.6 10.2091 18.0906 10.6014 18.7845C10.9208 19.3496 11.6789 19.4625 12.1414 19C12.048 19.345 12 19.667 12 22Z" />
          <circle cx="7.5" cy="10.5" r="1.5" fill={color} />
          <circle cx="11.5" cy="7.5" r="1.5" fill={color} />
          <circle cx="16.5" cy="9.5" r="1.5" fill={color} />
        </svg>
      );
    case "leaderboard":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", filter: `drop-shadow(0 0 3px ${color}55)` }}>
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
          <path d="M12 2a4 4 0 0 1 4 4v7H8V6a4 4 0 0 1 4-4z" />
        </svg>
      );
    default:
      return null;
  }
}

function getComingSoonIcon(id: string) {
  switch (id) {
    case "operations":
      return (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f0c929" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "20px", filter: "drop-shadow(0 0 8px rgba(240, 201, 41, 0.4))" }}>
          {/* Cyberpunk space invader emoji style line-art */}
          <path d="M6 4h12M4 7h16M3 10h18M3 13h2M8 13h8M19 13h2M3 16h18M5 19h2M17 19h2" />
          <circle cx="8" cy="10" r="1.5" fill="#f0c929" />
          <circle cx="16" cy="10" r="1.5" fill="#f0c929" />
        </svg>
      );
    case "broadcasts":
      return (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f0c929" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "20px", filter: "drop-shadow(0 0 8px rgba(240, 201, 41, 0.4))" }}>
          {/* Cyber antenna transmission radio towers */}
          <path d="M12 20h10M2 20h10M12 20V8m0 0L8 5m4 3l4-3" />
          <circle cx="12" cy="8" r="1" />
          <path d="M7 11a7 7 0 0 1 10 0" />
          <path d="M4 14a11 11 0 0 1 16 0" />
        </svg>
      );
    case "lore":
      return (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f0c929" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "20px", filter: "drop-shadow(0 0 8px rgba(240, 201, 41, 0.4))" }}>
          {/* Glowing cyber scroll */}
          <path d="M16 5V3a1 1 0 0 0-1-1H4a2 2 0 0 0 0 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6" />
          <path d="M8 22H19a1 1 0 0 0 1-1v-2" />
          <line x1="8" y1="9" x2="15" y2="9" />
          <line x1="8" y1="13" x2="16" y2="13" />
          <line x1="8" y1="17" x2="14" y2="17" />
        </svg>
      );
    case "comics":
      return (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f0c929" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "20px", filter: "drop-shadow(0 0 8px rgba(240, 201, 41, 0.4))" }}>
          {/* Cyber art palette */}
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 14.7255 3.09032 17.1962 4.85857 19C5.3211 19.4625 6.07921 19.3496 6.39864 18.7845C6.79093 18.0906 7.5262 17.6 8.5 17.6C9.4738 17.6 10.2091 18.0906 10.6014 18.7845C10.9208 19.3496 11.6789 19.4625 12.1414 19C12.048 19.345 12 19.667 12 22Z" />
          <circle cx="7.5" cy="10.5" r="1.5" fill="#f0c929" />
          <circle cx="11.5" cy="7.5" r="1.5" fill="#f0c929" />
          <circle cx="16.5" cy="9.5" r="1.5" fill="#f0c929" />
        </svg>
      );
    default:
      return null;
  }
}


function getNodeColor(node: any): string {
  if (node.category === "gdacs") {
    const level = node.alertLevel || "Green";
    if (level === "Red") return "#ff4d4d";
    if (level === "Orange") return "#f97316";
    if (level === "Green") return "#22c55e";
    return "#22c55e";
  }
  if (node.category === "fictional")   return "#a855f7";
  if (node.category === "satirical")   return "#f0c929";
  if (node.category === "algorithmic") return "#00ffcc";
  return "#ff4d4d"; // realistic
}

function getSectorLabel(node: any): string {
  if (node.category === "gdacs") {
    return `TACTICAL FEED // ${node.eventTypeName || node.type}`;
  }
  if (node.category === "realistic")   return `SECTOR ALPHA // ${node.type}`;
  if (node.category === "fictional")   return "SECTOR BETA // ANOMALY";
  if (node.category === "satirical")   return "SECTOR GAMMA // DEGENERACY";
  if (node.category === "algorithmic") return "SECTOR DELTA // ALGORITHMIC";
  return node.type;
}


export default function SolvivorsHubPage() {
  const OPERATIONS_COMING_SOON = false;
  const { user, session, authIdentifier } = useAuth();
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();

  // Hub tabs: operations, broadcasts, leaderboard, lore, comics
  const [activeHub, setActiveHub] = useState<"operations" | "broadcasts" | "leaderboard" | "lore" | "comics">("operations");
  const [hashedWallet, setHashedWallet] = useState<string | null>(null);

  const wallet = authIdentifier || (publicKey ? publicKey.toString() : null);

  useEffect(() => {
    if (wallet) {
      generateHashedPassport(wallet).then((hash) => setHashedWallet(hash));
    } else {
      setHashedWallet(null);
    }
  }, [wallet]);
  
  // Broadcasts map states
  const [broadcastNodes, setBroadcastNodes] = useState<any[]>([]);
  const [selectedBroadcastNode, setSelectedBroadcastNode] = useState<any>(null);
  const [loadingBroadcasts, setLoadingBroadcasts] = useState(false);
  const [broadcastFilter, setBroadcastFilter] = useState<string>("all");

  // Sub-toggle inside operations: tasks, bounties
  const [activeTab, setActiveTab] = useState<"tasks" | "bounties">("tasks");

  useEffect(() => {
    if (activeHub === "broadcasts" && broadcastNodes.length === 0) {
      async function loadBroadcastData() {
        setLoadingBroadcasts(true);
        try {
          // 1. Fetch live GDACS alerts
          const gdacsRes = await fetch("/api/broadcasts/live");
          const gdacsData = await gdacsRes.json();
          const gdacsAlerts = gdacsData.alerts || [];

          const formattedGdacs = gdacsAlerts.map((alert: any) => ({
            id: `gdacs-${alert.id}`,
            name: alert.title,
            type: alert.eventTypeName || alert.eventType,
            category: alert.category || "gdacs",
            severity: Math.round(alert.alertScore * 20) || 50,
            lat: alert.lat,
            lng: alert.lng,
            region: alert.country || "Global",
            desc: alert.desc,
            alertLevel: alert.alertLevel,
            pubDate: alert.pubDate,
            link: alert.link
          }));

          // 2. Fetch existing threat map nodes
          const threatRes = await fetch("/api/threat-map");
          const threatData = await threatRes.json();

          // Combine them!
          const combined = [...formattedGdacs, ...threatData];
          setBroadcastNodes(combined);
          
          if (combined.length > 0) {
            setSelectedBroadcastNode(combined[0]);
          }
        } catch (err) {
          console.error("Failed to load broadcast feeds:", err);
        }
        setLoadingBroadcasts(false);
      }
      loadBroadcastData();
    }
  }, [activeHub, broadcastNodes.length]);

  const filteredBroadcastNodes = broadcastNodes.filter(node => {
    if (broadcastFilter === "all") return true;
    return node.category === broadcastFilter;
  });
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [userQuests, setUserQuests] = useState<UserQuest[]>([]);
  const [selectedItem, setSelectedItem] = useState<{ type: "task" | "bounty"; item: any } | null>(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isLoggedIn = !!user || connected;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = session?.access_token;
      const res = await fetch("/api/quests/all", {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setTasks(data.tasks || []);
        setBounties(data.bounties || []);
        setUserQuests(data.userQuests || []);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load community hub.");
    }
    setLoading(false);
  }, [session]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStartQuest = async (targetId: string, type: "task" | "bounty") => {
    if (!isLoggedIn) {
      setVisible(true);
      return;
    }
    setActionLoading(targetId);
    try {
      const token = session?.access_token;
      const res = await fetch("/api/quests/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ targetId, type })
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        await fetchData();
        setSelectedItem(null);
      }
    } catch (err: any) {
      alert("Error starting operation: " + err.message);
    }
    setActionLoading(null);
  };

  const getQuestStatus = (targetId: string) => {
    const q = userQuests.find(uq => uq.target_id === targetId);
    return q ? q.status : null;
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <span className="status-badge active">[ RUNNING ]</span>;
      case "pending":
        return <span className="status-badge pending">[ UNDER APPROVAL ]</span>;
      case "completed":
        return <span className="status-badge completed">[ COMPLETED ]</span>;
      case "rejected":
        return <span className="status-badge rejected">[ REJECTED ]</span>;
      default:
        return null;
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", paddingTop: "80px", background: "#030303", color: "#fff" }}>
      {/* Header section */}
      <div style={{ borderBottom: "1px solid rgba(255, 77, 77, 0.1)", padding: "40px 24px", background: "linear-gradient(180deg, rgba(255, 77, 77, 0.03) 0%, rgba(5,5,5,0) 100%)" }}>
        <div className="container" style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "6px 14px", border: "1px solid rgba(255, 77, 77, 0.3)", borderRadius: "30px", background: "rgba(255, 77, 77, 0.05)", marginBottom: "16px" }}>
            <SolvivalIcon size={20} />
            <span style={{ fontSize: "11px", fontFamily: "var(--mono)", letterSpacing: "0.15em", color: "var(--accent)" }}>COMMUNITY MISSION CONTROL</span>
          </div>
          <h1 className="glow-text" style={{ fontSize: "clamp(32px, 6vw, 54px)", margin: "0 0 12px", fontFamily: "var(--title-font)", fontWeight: "bold", letterSpacing: "0.05em" }}>
            SOLVIVORS <span style={{ color: "var(--accent)" }}>HUB</span>
          </h1>
          <p style={{ fontSize: "14.5px", color: "var(--text-dim)", maxWidth: "700px", margin: "0 auto 8px", lineHeight: "1.7", fontFamily: "var(--sans)" }}>
            The central operative repository. Access live community missions, tactical news, survivor logs, and classified media archives.
          </p>
          <div style={{ fontSize: "12px", color: "#f0c929", fontFamily: "var(--mono)", letterSpacing: "0.05em", marginTop: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, filter: "drop-shadow(0 0 4px rgba(240, 201, 41, 0.6))" }}>
              {/* Custom cyber-lightbulb SVG */}
              <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .6 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
              <line x1="9" y1="18" x2="15" y2="18" />
              <line x1="10" y1="22" x2="14" y2="22" />
              <line x1="12" y1="2" x2="12" y2="4" />
              <line x1="5" y1="5" x2="6.4" y2="6.4" />
              <line x1="19" y1="5" x2="17.6" y2="6.4" />
            </svg>
            <em>"You can monitor the active status of your accepted tasks and bounties directly from your personal profile page."</em>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container" style={{ flex: 1, maxWidth: "1200px", margin: "0 auto", padding: "40px 24px", width: "100%" }}>
        
        {/* Main Hub Tabs */}
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          gap: "12px", 
          marginBottom: "32px", 
          borderBottom: "1px solid rgba(255,255,255,0.05)", 
          paddingBottom: "20px",
          flexWrap: "wrap"
        }}>
          {[
            { id: "operations", label: "LIVE OPERATIONS", desc: OPERATIONS_COMING_SOON ? "Coming Soon" : "Missions & Bounties", isComing: OPERATIONS_COMING_SOON },
            { id: "broadcasts", label: "BROADCASTS & NEWS", desc: "Live Threat Feed", isComing: false },
            { id: "leaderboard", label: "LEADERBOARD", desc: "Global Standings", isComing: false },
            { id: "lore", label: "LORE & ARCHIVES", desc: "Coming Soon", isComing: true },
            { id: "comics", label: "TACTICAL COMICS", desc: "Coming Soon", isComing: true }
          ].map((hub) => {
            const isActive = activeHub === hub.id;
            return (
              <button
                key={hub.id}
                onClick={() => setActiveHub(hub.id as any)}
                style={{
                  padding: "10px 20px",
                  background: isActive ? "rgba(255,77,77,0.05)" : "transparent",
                  border: "1px solid",
                  borderColor: isActive ? "var(--accent)" : "rgba(255, 255, 255, 0.05)",
                  color: isActive ? "#fff" : "var(--text-dim)",
                  cursor: "pointer",
                  borderRadius: "2px",
                  fontFamily: "var(--mono)",
                  fontSize: "12px",
                  textAlign: "center",
                  minWidth: "180px",
                  transition: "all 0.2s"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontWeight: "bold" }}>
                  {getHubIcon(hub.id, isActive ? "var(--accent)" : "var(--text-dim)")}
                  <span>{hub.label}</span>
                </div>
                <div style={{ fontSize: "9px", color: isActive ? "#00ffcc" : "rgba(255,255,255,0.3)", marginTop: "2px", textTransform: "uppercase" }}>
                  {hub.desc}
                </div>
              </button>
            );
          })}
        </div>

        {/* Lock Overlay if not logged in (for Operations tab) */}
        {OPERATIONS_COMING_SOON && activeHub === "operations" ? (
          <div style={{
            background: "rgba(10, 10, 10, 0.4)",
            border: "1px solid rgba(240, 201, 41, 0.15)",
            borderRadius: "6px",
            padding: "80px 40px",
            textAlign: "center",
            backdropFilter: "blur(12px)",
            boxShadow: "0 0 40px rgba(0, 0, 0, 0.6)",
            maxWidth: "680px",
            margin: "0 auto",
            position: "relative"
          }}>
            {getComingSoonIcon("operations")}
            <h2 style={{ fontSize: "20px", fontFamily: "var(--mono)", color: "#f0c929", letterSpacing: "0.15em", marginBottom: "12px" }}>
              [ LIVE OPERATIONS INACTIVE ]
            </h2>
            <p style={{ fontSize: "14px", color: "var(--text-dim)", lineHeight: "1.7", fontFamily: "var(--sans)", margin: "0 auto 28px", maxWidth: "480px" }}>
              The live mission control grid is currently offline. Community tasks, bounty tracking, and reward campaigns will be deployed here soon.
            </p>
            <div style={{
              display: "inline-block",
              fontFamily: "var(--title-font)",
              fontSize: "14px",
              fontWeight: "bold",
              color: "#f0c929",
              letterSpacing: "0.2em",
              border: "1px dashed #f0c929",
              padding: "8px 20px",
              background: "rgba(240, 201, 41, 0.03)",
              textShadow: "0 0 8px rgba(240, 201, 41, 0.3)"
            }}>
              COMING SOON // CLEARANCE GATED
            </div>
            {/* Blurred Mockup Elements in background */}
            <div style={{
              marginTop: "40px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              opacity: 0.15,
              filter: "blur(4px)",
              pointerEvents: "none",
              userSelect: "none"
            }}>
              <div style={{ background: "#111", height: "80px", border: "1px solid #fff" }} />
              <div style={{ background: "#111", height: "80px", border: "1px solid #fff" }} />
            </div>
          </div>
        ) : !isLoggedIn && activeHub === "operations" ? (
          <div style={{
            background: "rgba(10, 10, 10, 0.4)",
            border: "1px solid rgba(255, 77, 77, 0.1)",
            borderRadius: "6px",
            padding: "80px 40px",
            textAlign: "center",
            backdropFilter: "blur(10px)",
            boxShadow: "0 0 40px rgba(0, 0, 0, 0.5)",
            margin: "0 auto",
            maxWidth: "600px"
          }}>
            <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "20px", filter: "drop-shadow(0 0 8px rgba(255, 77, 77, 0.5))" }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              <circle cx="12" cy="15" r="1.5" fill="var(--accent)" />
              <path d="M12 16.5V19" />
            </svg>
            <h2 style={{ fontSize: "22px", fontFamily: "var(--mono)", letterSpacing: "0.1em", color: "var(--accent)", marginBottom: "12px" }}>
              UPLINK RESTRICTED
            </h2>
            <p style={{ fontSize: "14px", color: "var(--text-dim)", lineHeight: "1.6", maxWidth: "400px", margin: "0 auto 28px", fontFamily: "var(--sans)" }}>
              Access to Solvivors tasks and bounties requires secure network authorization. Sign in via your email profile or connect your Solana wallet to proceed.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <Link href="/login" className="btn btn-primary" style={{ padding: "12px 24px" }}>
                SIGN IN WITH EMAIL
              </Link>
              <button onClick={() => setVisible(true)} className="btn btn-ghost" style={{ padding: "12px 24px" }}>
                CONNECT WALLET
              </button>
            </div>
          </div>
        ) : loading && activeHub === "operations" ? (
          <div style={{ textAlign: "center", padding: "60px", fontFamily: "var(--mono)", color: "var(--accent)" }}>
            [ CONNECTING TO QUEEN UPLINK... ]
          </div>
        ) : error && activeHub === "operations" ? (
          <div className="alert alert-red" style={{ maxWidth: "600px", margin: "0 auto" }}>
            <strong>UPLINK ERROR:</strong> {error}
          </div>
        ) : activeHub === "operations" ? (
          // Active Operations Board (Tasks + Bounties sub-toggles)
          <div>
            {/* Sub-toggles */}
            <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginBottom: "32px" }}>
              <button
                onClick={() => setActiveTab("tasks")}
                style={{
                  padding: "10px 24px",
                  fontFamily: "var(--mono)",
                  fontSize: "12.5px",
                  fontWeight: "bold",
                  border: "1px solid",
                  borderColor: activeTab === "tasks" ? "var(--accent)" : "rgba(255, 255, 255, 0.05)",
                  background: activeTab === "tasks" ? "rgba(255, 77, 77, 0.08)" : "rgba(10, 10, 10, 0.5)",
                  color: activeTab === "tasks" ? "#fff" : "var(--text-dim)",
                  cursor: "pointer",
                  borderRadius: "4px",
                  transition: "all 0.2s"
                }}
              >
                [ TASKS BOARD ]
              </button>
              <button
                onClick={() => setActiveTab("bounties")}
                style={{
                  padding: "10px 24px",
                  fontFamily: "var(--mono)",
                  fontSize: "12.5px",
                  fontWeight: "bold",
                  border: "1px solid",
                  borderColor: activeTab === "bounties" ? "#f0c929" : "rgba(255, 255, 255, 0.05)",
                  background: activeTab === "bounties" ? "rgba(240, 201, 41, 0.08)" : "rgba(10, 10, 10, 0.5)",
                  color: activeTab === "bounties" ? "#fff" : "var(--text-dim)",
                  cursor: "pointer",
                  borderRadius: "4px",
                  transition: "all 0.2s"
                }}
              >
                [ SOL BOUNTIES ]
              </button>
            </div>

            {activeTab === "tasks" ? (
              // Tasks Grid
              tasks.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--text-dim)", fontFamily: "var(--mono)" }}>
                  [ NO ACTIVE TASKS REGISTERED BY COMMAND ]
                </div>
              ) : (
                <div className="grid-layout" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
                  {tasks.map((task) => {
                    const status = getQuestStatus(task.id);
                    return (
                      <div
                        key={task.id}
                        className="panel hover-effect"
                        style={{
                          background: "rgba(10, 10, 10, 0.6)",
                          borderColor: "rgba(255, 77, 77, 0.15)",
                          padding: "24px",
                          borderRadius: "6px",
                          backdropFilter: "blur(12px)",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          transition: "all 0.3s ease",
                          cursor: "pointer"
                        }}
                        onClick={() => setSelectedItem({ type: "task", item: task })}
                      >
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                            <span style={{
                              fontFamily: "var(--mono)",
                              fontSize: "11px",
                              color: "var(--accent)",
                              border: "1px solid rgba(255, 77, 77, 0.3)",
                              borderRadius: "20px",
                              padding: "4px 10px",
                              background: "rgba(255, 77, 77, 0.05)"
                            }}>
                              {task.recurrence.toUpperCase()}
                            </span>
                            {status && renderStatusBadge(status)}
                          </div>
                          {task.image_url && (
                            <div style={{ width: "100%", height: "140px", overflow: "hidden", borderRadius: "4px", marginBottom: "14px", border: "1px solid rgba(255, 77, 77, 0.15)" }}>
                              <img src={task.image_url} alt={task.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            </div>
                          )}
                          <h3 style={{ fontSize: "17px", fontFamily: "var(--mono)", color: "#fff", margin: "0 0 8px" }}>
                            {task.title}
                          </h3>
                          <p style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.6", margin: "0 0 20px" }}>
                            {task.description.length > 90 ? `${task.description.slice(0, 90)}...` : task.description}
                          </p>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px dashed rgba(255,255,255,0.06)", paddingTop: "16px" }}>
                          <span style={{ fontSize: "14px", fontFamily: "var(--mono)", color: "#00ffcc", fontWeight: "bold" }}>
                            +{task.reward_xp} XP
                          </span>
                          {status ? (
                            <Link href="/operative" className="btn btn-ghost" style={{ fontSize: "11px", padding: "6px 14px" }} onClick={(e) => e.stopPropagation()}>
                              TRACK PROGRESS
                            </Link>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartQuest(task.id, "task");
                              }}
                              disabled={actionLoading === task.id}
                              className="btn btn-primary"
                              style={{ fontSize: "11px", padding: "6px 16px" }}
                            >
                              {actionLoading === task.id ? "STARTING..." : "START"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              // Bounties Grid
              bounties.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--text-dim)", fontFamily: "var(--mono)" }}>
                  [ NO RUNNING SOL BOUNTIES DEPLOYED ]
                </div>
              ) : (
                <div className="grid-layout" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
                  {bounties.map((bounty) => {
                    const status = getQuestStatus(bounty.id);
                    const isExpired = new Date(bounty.deadline) < new Date();
                    return (
                      <div
                        key={bounty.id}
                        className="panel hover-effect"
                        style={{
                          background: "rgba(10, 10, 10, 0.6)",
                          borderColor: "rgba(240, 201, 41, 0.15)",
                          padding: "24px",
                          borderRadius: "6px",
                          backdropFilter: "blur(12px)",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          transition: "all 0.3s ease",
                          cursor: "pointer"
                        }}
                        onClick={() => setSelectedItem({ type: "bounty", item: bounty })}
                      >
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                            <span style={{
                              fontFamily: "var(--mono)",
                              fontSize: "11px",
                              color: "#f0c929",
                              border: "1px solid rgba(240, 201, 41, 0.3)",
                              borderRadius: "20px",
                              padding: "4px 10px",
                              background: "rgba(240, 201, 41, 0.05)"
                            }}>
                              SOL CAMPAIGN
                            </span>
                            {status ? renderStatusBadge(status) : isExpired ? <span className="status-badge rejected">[ EXPIRED ]</span> : null}
                          </div>
                          {bounty.image_url && (
                            <div style={{ width: "100%", height: "140px", overflow: "hidden", borderRadius: "4px", marginBottom: "14px", border: "1px solid rgba(240, 201, 41, 0.15)" }}>
                              <img src={bounty.image_url} alt={bounty.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            </div>
                          )}
                          <h3 style={{ fontSize: "17px", fontFamily: "var(--mono)", color: "#fff", margin: "0 0 8px" }}>
                            {bounty.title}
                          </h3>
                          <p style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.6", margin: "0 0 20px" }}>
                            {bounty.description.length > 90 ? `${bounty.description.slice(0, 90)}...` : bounty.description}
                          </p>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px dashed rgba(255,255,255,0.06)", paddingTop: "16px" }}>
                          <div>
                            <div style={{ fontSize: "14px", fontFamily: "var(--mono)", color: "#f0c929", fontWeight: "bold" }}>
                              {bounty.reward_sol} SOL
                            </div>
                            <div style={{ fontSize: "10px", color: "var(--text-dim)", marginTop: "2px" }}>
                              Top {bounty.winners_count} Winner{bounty.winners_count > 1 ? "s" : ""}
                            </div>
                          </div>
                          {status ? (
                            <Link href="/operative" className="btn btn-ghost" style={{ fontSize: "11px", padding: "6px 14px" }} onClick={(e) => e.stopPropagation()}>
                              TRACK PROGRESS
                            </Link>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartQuest(bounty.id, "bounty");
                              }}
                              disabled={actionLoading === bounty.id || isExpired}
                              className="btn btn-primary"
                              style={{
                                fontSize: "11px",
                                padding: "6px 16px",
                                borderColor: "#f0c929",
                                color: isExpired ? "var(--text-muted)" : "#000",
                                background: isExpired ? "rgba(255,255,255,0.05)" : "#f0c929"
                              }}
                            >
                              {actionLoading === bounty.id ? "STARTING..." : isExpired ? "EXPIRED" : "START"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        ) : activeHub === "broadcasts" ? (
          // Dynamic WebGL Map and Live Feeds view
          loadingBroadcasts ? (
            <div style={{ textAlign: "center", padding: "100px 40px", fontFamily: "var(--mono)", color: "var(--accent)" }}>
              [ ESTABLISHING DIGITAL TRANS-METADATA LINK... ]
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed rgba(255,255,255,0.08)", paddingBottom: "12px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--accent)" }}>
                    // LIVE BROADCAST MONITORING TERMINAL
                  </span>
                  <h2 style={{ fontSize: "20px", fontFamily: "var(--mono)", color: "#fff", margin: "4px 0 0" }}>
                    SATELLITE INTEL TRANS-FEEDS
                  </h2>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <span className="blink" style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#ff4d4d", boxShadow: "0 0 8px #ff4d4d", alignSelf: "center" }} />
                  <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)" }}>
                    UPLINK ACTIVE
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "24px", minHeight: "600px", flexWrap: "wrap" }}>
                {/* Map Panel */}
                <div style={{ 
                  flex: 1, 
                  minWidth: "320px", 
                  border: "1px solid rgba(255,255,255,0.06)", 
                  background: "rgba(10,10,10,0.5)",
                  padding: "8px", 
                  borderRadius: "4px",
                  height: "600px",
                  position: "relative"
                }}>
                  <BroadcastMap nodes={filteredBroadcastNodes} selectedNode={selectedBroadcastNode} onSelectNode={setSelectedBroadcastNode} />
                </div>

                {/* Sidebar feed list */}
                <div style={{ 
                  width: "350px", 
                  minWidth: "300px", 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: "12px", 
                  height: "600px" 
                }}>
                  {/* Category filters */}
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", background: "rgba(0,0,0,0.2)", padding: "4px", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.03)" }}>
                    {[
                      { id: "all", label: "ALL", color: "#fff" },
                      { id: "gdacs", label: "LIVE GDACS", color: "#22c55e" },
                      { id: "realistic", label: "REALISTIC", color: "#ff4d4d" },
                      { id: "fictional", label: "FICTIONAL", color: "#a855f7" },
                      { id: "satirical", label: "SATIRICAL", color: "#f0c929" },
                      { id: "algorithmic", label: "ALGORITHMIC", color: "#00ffcc" }
                    ].map(f => {
                      const active = broadcastFilter === f.id;
                      return (
                        <button
                          key={f.id}
                          onClick={() => setBroadcastFilter(f.id)}
                          style={{
                            flex: 1,
                            padding: "6px 8px",
                            fontFamily: "var(--mono)",
                            fontSize: "9px",
                            fontWeight: "bold",
                            background: active ? "rgba(255,255,255,0.05)" : "transparent",
                            border: "1px solid",
                            borderColor: active ? f.color : "transparent",
                            color: active ? "#fff" : "var(--text-dim)",
                            cursor: "pointer",
                            borderRadius: "2px",
                            transition: "all 0.15s",
                            textAlign: "center"
                          }}
                        >
                          {f.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Scroller list */}
                  <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", paddingRight: "4px" }}>
                    {filteredBroadcastNodes.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "40px 10px", color: "var(--text-dim)", fontFamily: "var(--mono)", fontSize: "11px" }}>
                        [ NO THREAT NODES FOUND FOR THIS VECTOR ]
                      </div>
                    ) : (
                      filteredBroadcastNodes.map((node) => {
                        const isSelected = selectedBroadcastNode?.id === node.id;
                        const color = getNodeColor(node);
                        const label = getSectorLabel(node);
                        return (
                          <div
                            key={node.id}
                            onClick={() => setSelectedBroadcastNode(node)}
                            style={{
                              padding: "12px",
                              background: isSelected ? "rgba(255,255,255,0.03)" : "rgba(10, 10, 10, 0.4)",
                              border: "1px solid",
                              borderColor: isSelected ? color : "rgba(255, 255, 255, 0.05)",
                              borderRadius: "4px",
                              cursor: "pointer",
                              transition: "all 0.2s"
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", fontFamily: "var(--mono)", color: color, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                              <span>[{label}]</span>
                              <span>{node.severity}% Severity</span>
                            </div>
                            <div style={{ fontSize: "13px", fontWeight: "bold", color: "#fff", fontFamily: "var(--mono)" }}>{node.name}</div>
                            <div style={{ fontSize: "11px", color: "var(--text-dim)", marginTop: "4px", lineHeight: "1.4" }}>
                              {node.region}
                            </div>
                            {isSelected && node.desc && (
                              <div style={{ fontSize: "11px", color: "#bbb", marginTop: "8px", borderTop: "1px dashed rgba(255,255,255,0.05)", paddingTop: "8px", lineHeight: "1.4" }}>
                                {node.desc}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        ) : activeHub === "leaderboard" ? (
          <Leaderboard currentHashedWallet={hashedWallet} />
        ) : (
          // Lore & Comics tabs (still Gated/Coming Soon)
          <div style={{
            background: "rgba(10, 10, 10, 0.4)",
            border: "1px solid rgba(240, 201, 41, 0.15)",
            borderRadius: "6px",
            padding: "80px 40px",
            textAlign: "center",
            backdropFilter: "blur(12px)",
            boxShadow: "0 0 40px rgba(0, 0, 0, 0.6)",
            maxWidth: "680px",
            margin: "0 auto",
            position: "relative"
          }}>
            {getComingSoonIcon(activeHub)}

            {activeHub === "lore" && (
              <>
                <h2 style={{ fontSize: "20px", fontFamily: "var(--mono)", color: "#f0c929", letterSpacing: "0.15em", marginBottom: "12px" }}>
                  [ CORRELATION ARCHIVE ENCRYPTED ]
                </h2>
                <p style={{ fontSize: "14px", color: "var(--text-dim)", lineHeight: "1.7", fontFamily: "var(--sans)", margin: "0 auto 28px", maxWidth: "480px" }}>
                  Unlocking historical databases, survivor journals, and the classified origins of Solvival Corp. clearance. Level-4 Clearance vectors required for decryptions.
                </p>
              </>
            )}

            {activeHub === "comics" && (
              <>
                <h2 style={{ fontSize: "20px", fontFamily: "var(--mono)", color: "#f0c929", letterSpacing: "0.15em", marginBottom: "12px" }}>
                  [ VISUAL RECON LOGS INACTIVE ]
                </h2>
                <p style={{ fontSize: "14px", color: "var(--text-dim)", lineHeight: "1.7", fontFamily: "var(--sans)", margin: "0 auto 28px", maxWidth: "480px" }}>
                  Synchronizing high-fidelity graphic assets. Tactical comics illustrating battle outlines against Sector Alpha pathogen outbreaks are preparing for transmission.
                </p>
              </>
            )}

            <div style={{
              display: "inline-block",
              fontFamily: "var(--title-font)",
              fontSize: "14px",
              fontWeight: "bold",
              color: "#f0c929",
              letterSpacing: "0.2em",
              border: "1px dashed #f0c929",
              padding: "8px 20px",
              background: "rgba(240, 201, 41, 0.03)",
              textShadow: "0 0 8px rgba(240, 201, 41, 0.3)"
            }}>
              COMING SOON // CLEARANCE GATED
            </div>

            {/* Blurred Mockup Elements in background */}
            <div style={{
              marginTop: "40px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              opacity: 0.15,
              filter: "blur(4px)",
              pointerEvents: "none",
              userSelect: "none"
            }}>
              <div style={{ background: "#111", height: "80px", border: "1px solid #fff" }} />
              <div style={{ background: "#111", height: "80px", border: "1px solid #fff" }} />
            </div>
          </div>
        )}
      </div>

      {/* Detail view Modal */}
      {selectedItem && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0, 0, 0, 0.85)",
          backdropFilter: "blur(8px)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px"
        }} onClick={() => setSelectedItem(null)}>
          <div style={{
            background: "#080808",
            border: "1px solid",
            borderColor: selectedItem.type === "task" ? "rgba(255, 77, 77, 0.25)" : "rgba(240, 201, 41, 0.25)",
            borderRadius: "6px",
            padding: "32px",
            maxWidth: "600px",
            width: "100%",
            boxShadow: `0 0 30px ${selectedItem.type === "task" ? "rgba(255, 77, 77, 0.05)" : "rgba(240, 201, 41, 0.05)"}`,
            maxHeight: "90vh",
            overflowY: "auto"
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <span style={{
                fontFamily: "var(--mono)",
                fontSize: "11px",
                color: selectedItem.type === "task" ? "var(--accent)" : "#f0c929",
                border: "1px solid",
                borderColor: selectedItem.type === "task" ? "rgba(255, 77, 77, 0.3)" : "rgba(240, 201, 41, 0.3)",
                borderRadius: "20px",
                padding: "4px 12px",
                background: selectedItem.type === "task" ? "rgba(255, 77, 77, 0.05)" : "rgba(240, 201, 41, 0.05)"
              }}>
                {selectedItem.type === "task" ? `TASK // ${selectedItem.item.recurrence.toUpperCase()}` : "SOL BOUNTY CAMPAIGN"}
              </span>
              <button 
                onClick={() => setSelectedItem(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-dim)",
                  fontFamily: "var(--mono)",
                  fontSize: "18px",
                  cursor: "pointer"
                }}
              >
                [X]
              </button>
            </div>

            <h2 style={{ fontSize: "22px", fontFamily: "var(--mono)", margin: "0 0 16px" }}>
              {selectedItem.item.title}
            </h2>

            {selectedItem.item.image_url && (
              <div style={{ width: "100%", maxHeight: "280px", overflow: "hidden", borderRadius: "4px", marginBottom: "20px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                <img src={selectedItem.item.image_url} alt={selectedItem.item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}

            <div style={{ 
              fontSize: "14.5px", 
              color: "var(--text-dim)", 
              lineHeight: "1.7", 
              marginBottom: "28px", 
              whiteSpace: "pre-wrap",
              background: "rgba(255,255,255,0.01)",
              border: "1px solid rgba(255,255,255,0.03)",
              padding: "16px",
              borderRadius: "4px"
            }}>
              {selectedItem.item.description}
            </div>

            {selectedItem.type === "bounty" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "28px", borderBottom: "1px dashed rgba(255,255,255,0.05)", paddingBottom: "20px" }}>
                <div>
                  <div style={{ fontSize: "11px", color: "var(--text-dim)", fontFamily: "var(--mono)" }}>CAMPAIGN DEADLINE</div>
                  <div style={{ fontSize: "14px", fontFamily: "var(--mono)", color: "#fff", fontWeight: "bold", marginTop: "4px" }}>
                    {new Date(selectedItem.item.deadline).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "var(--text-dim)", fontFamily: "var(--mono)" }}>AVAILABLE WINNER SPOTS</div>
                  <div style={{ fontSize: "14px", fontFamily: "var(--mono)", color: "#f0c929", fontWeight: "bold", marginTop: "4px" }}>
                    Top {selectedItem.item.winners_count} Spot{selectedItem.item.winners_count > 1 ? "s" : ""}
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "11px", color: "var(--text-dim)", fontFamily: "var(--mono)" }}>REWARD VALUE</div>
                <div style={{ 
                  fontSize: "20px", 
                  fontFamily: "var(--mono)", 
                  color: selectedItem.type === "task" ? "#00ffcc" : "#f0c929", 
                  fontWeight: "bold",
                  marginTop: "4px"
                }}>
                  {selectedItem.type === "task" ? `+${selectedItem.item.reward_xp} XP` : `${selectedItem.item.reward_sol} SOL`}
                </div>
              </div>

              {getQuestStatus(selectedItem.item.id) ? (
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {renderStatusBadge(getQuestStatus(selectedItem.item.id)!)}
                  <Link href="/operative" className="btn btn-ghost" style={{ fontSize: "12px", padding: "10px 20px" }}>
                    TRACK
                  </Link>
                </div>
              ) : (
                <button
                  onClick={() => handleStartQuest(selectedItem.item.id, selectedItem.type)}
                  disabled={actionLoading === selectedItem.item.id || (selectedItem.type === "bounty" && new Date(selectedItem.item.deadline) < new Date())}
                  className="btn btn-primary"
                  style={{
                    padding: "10px 24px",
                    background: selectedItem.type === "task" ? "var(--accent)" : "#f0c929",
                    borderColor: selectedItem.type === "task" ? "var(--accent)" : "#f0c929",
                    color: selectedItem.type === "task" ? "#fff" : "#000"
                  }}
                >
                  {actionLoading === selectedItem.item.id ? "STARTING..." : (selectedItem.type === "bounty" && new Date(selectedItem.item.deadline) < new Date()) ? "EXPIRED" : "START OPERATION"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Styled CSS */}
      <style jsx>{`
        .status-badge {
          font-family: var(--mono);
          font-size: 11px;
          font-weight: bold;
          letter-spacing: 0.05em;
        }
        .status-badge.active { color: #00ffcc; }
        .status-badge.pending { color: #f0c929; }
        .status-badge.completed { color: #55ff55; }
        .status-badge.rejected { color: var(--accent); }
        .hover-effect:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 25px rgba(255, 77, 77, 0.05);
          border-color: rgba(255, 77, 77, 0.3) !important;
        }
      `}</style>
    </div>
  );
}
