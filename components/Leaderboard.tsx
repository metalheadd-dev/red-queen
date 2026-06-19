import { useState, useEffect } from "react";
import { getClearanceLevel } from "@/lib/progression";

interface LeaderboardUser {
  wallet_address: string;
  apocalyptic_name: string;
  xp: number;
  level: number;
  bio_score: number;
  last_interaction: string | null;
  rank: number;
}

interface LeaderboardProps {
  currentHashedWallet?: string | null;
}

export default function Leaderboard({ currentHashedWallet }: LeaderboardProps) {
  const [data, setData] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/leaderboard");
      const result = await res.json();
      if (result.error) {
        setError(result.error);
      } else if (result.leaderboard) {
        setData(result.leaderboard);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to establish telemetry connection to leaderboard mainframe.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const filteredData = data.filter((user) => {
    const name = user.apocalyptic_name?.toLowerCase() || "";
    const wallet = user.wallet_address?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();
    return name.includes(query) || wallet.includes(query);
  });

  return (
    <div style={{
      width: "100%",
      fontFamily: "var(--mono)",
      color: "var(--text)",
      background: "rgba(5, 5, 5, 0.95)",
      border: "1px solid var(--border)",
      boxSizing: "border-box",
      padding: "20px",
      position: "relative"
    }}>
      {/* HUD border corners */}
      <div style={{ position: "absolute", top: "10px", left: "10px", width: "12px", height: "12px", borderTop: "2px solid var(--accent)", borderLeft: "2px solid var(--accent)" }} />
      <div style={{ position: "absolute", top: "10px", right: "10px", width: "12px", height: "12px", borderTop: "2px solid var(--accent)", borderRight: "2px solid var(--accent)" }} />
      <div style={{ position: "absolute", bottom: "10px", left: "10px", width: "12px", height: "12px", borderBottom: "2px solid var(--accent)", borderLeft: "2px solid var(--accent)" }} />
      <div style={{ position: "absolute", bottom: "10px", right: "10px", width: "12px", height: "12px", borderBottom: "2px solid var(--accent)", borderRight: "2px solid var(--accent)" }} />

      {/* Mainframe status header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed var(--border)", paddingBottom: "12px", marginBottom: "20px" }}>
        <div>
          <span style={{ color: "var(--accent)", fontWeight: "bold" }}>// SYSTEM_LEADERBOARD</span>
          <span style={{ color: "var(--text-dim)", marginLeft: "12px", fontSize: "11px" }}>[MAINFRAME_ONLINE]</span>
        </div>
        <button 
          onClick={fetchLeaderboard}
          style={{
            background: "rgba(255,77,77,0.05)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            fontFamily: "var(--mono)",
            fontSize: "11px",
            padding: "4px 12px",
            cursor: "pointer",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--accent)"}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block" }}>
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
          REFRESH_FEED
        </button>
      </div>

      {/* Search Filter input */}
      <div style={{ marginBottom: "20px" }}>
        <input 
          type="text"
          placeholder="SEARCH FOR OPERATIVE NAME / PASSPORT HASH..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            background: "rgba(10, 10, 10, 0.8)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            fontFamily: "var(--mono)",
            fontSize: "13px",
            padding: "10px 14px",
            outline: "none",
            boxSizing: "border-box"
          }}
        />
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--accent)" }}>
          <div className="hud-scanner-animation" style={{ display: "inline-block", fontSize: "14px" }}>
            SCANNING GLOBAL MAINFRAME REPOS...
          </div>
        </div>
      )}

      {error && (
        <div style={{ border: "1px solid var(--accent)", background: "rgba(255,77,77,0.05)", padding: "16px", color: "var(--accent)", marginBottom: "20px", fontSize: "12px" }}>
          [ERROR] - {error}
        </div>
      )}

      {!loading && !error && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)", color: "var(--text-dim)" }}>
                <th style={{ padding: "10px 8px" }}>RANK</th>
                <th style={{ padding: "10px 8px" }}>OPERATIVE</th>
                <th style={{ padding: "10px 8px" }}>CLEARANCE LEVEL</th>
                <th style={{ padding: "10px 8px" }}>LEVEL</th>
                <th style={{ padding: "10px 8px" }}>BIO-SCORE</th>
                <th style={{ padding: "10px 8px" }}>XP</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "20px 8px", textAlign: "center", color: "var(--text-dim)" }}>
                    NO DATA MATCHES THE TELEMETRY PARAMETERS
                  </td>
                </tr>
              ) : (
                filteredData.map((user) => {
                  const isSelf = currentHashedWallet && user.wallet_address === currentHashedWallet;
                  const clearance = getClearanceLevel(user.bio_score);

                  return (
                    <tr 
                      key={user.wallet_address}
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.03)",
                        background: isSelf ? "rgba(255,77,77,0.07)" : "transparent",
                        borderLeft: isSelf ? "3px solid var(--accent)" : "none",
                        transition: "background 0.2s"
                      }}
                    >
                      <td style={{ padding: "12px 8px", fontWeight: "bold", color: isSelf ? "var(--accent)" : "var(--text)" }}>
                        #{user.rank}
                      </td>
                      <td style={{ padding: "12px 8px", color: isSelf ? "var(--accent)" : "var(--text)" }}>
                        <span style={{ fontWeight: 600 }}>{user.apocalyptic_name}</span>
                        {isSelf && <span style={{ fontSize: "10px", color: "var(--accent)", marginLeft: "8px" }}>[YOU]</span>}
                        <div style={{ fontSize: "9px", color: "var(--text-dim)", marginTop: "2px" }}>
                          ID: {user.wallet_address.slice(0, 12)}...{user.wallet_address.slice(-6)}
                        </div>
                      </td>
                      <td style={{ padding: "12px 8px" }}>
                        <span style={{ 
                          fontSize: "11px", 
                          color: clearance.color, 
                          border: `1px solid ${clearance.color}33`,
                          padding: "2px 6px",
                          borderRadius: "2px",
                          fontWeight: "bold",
                          background: `${clearance.color}0c`
                        }}>
                          {clearance.label}
                        </span>
                      </td>
                      <td style={{ padding: "12px 8px" }}>
                        LVL {user.level}
                      </td>
                      <td style={{ padding: "12px 8px", fontWeight: "bold", color: "var(--text)" }}>
                        {user.bio_score}/100
                      </td>
                      <td style={{ padding: "12px 8px", color: "var(--text-dim)" }}>
                        {user.xp} XP
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
