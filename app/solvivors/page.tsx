"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import Link from "next/link";
import SolvivalIcon from "@/components/SolvivalIcon";

interface Task {
  id: string;
  title: string;
  description: string;
  reward_xp: number;
  recurrence: string;
  created_at: string;
}

interface Bounty {
  id: string;
  title: string;
  description: string;
  reward_sol: number;
  winners_count: number;
  deadline: string;
  created_at: string;
}

interface UserQuest {
  id: string;
  target_id: string;
  type: string;
  status: string;
}

export default function SolvivorsHubPage() {
  const { user, session, authIdentifier } = useAuth();
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();

  // Hub tabs: operations, broadcasts, lore, comics
  const [activeHub, setActiveHub] = useState<"operations" | "broadcasts" | "lore" | "comics">("operations");
  // Sub-toggle inside operations: tasks, bounties
  const [activeTab, setActiveTab] = useState<"tasks" | "bounties">("tasks");
  
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
          <div style={{ fontSize: "12px", color: "#f0c929", fontFamily: "var(--mono)", letterSpacing: "0.05em", marginTop: "12px" }}>
            💡 <em>"You can monitor the active status of your accepted tasks and bounties directly from your personal profile page."</em>
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
            { id: "operations", label: "🕹️ LIVE OPERATIONS", desc: "Missions & Bounties" },
            { id: "broadcasts", label: "📻 BROADCASTS & NEWS", desc: "Coming Soon", isComing: true },
            { id: "lore", label: "📜 LORE & ARCHIVES", desc: "Coming Soon", isComing: true },
            { id: "comics", label: "🎨 TACTICAL COMICS", desc: "Coming Soon", isComing: true }
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
                  minWidth: "160px",
                  transition: "all 0.2s"
                }}
              >
                <div style={{ fontWeight: "bold" }}>{hub.label}</div>
                <div style={{ fontSize: "9px", color: isActive ? "#00ffcc" : "rgba(255,255,255,0.3)", marginTop: "2px", textTransform: "uppercase" }}>
                  {hub.desc}
                </div>
              </button>
            );
          })}
        </div>

        {/* Lock Overlay if not logged in (for Operations tab) */}
        {!isLoggedIn && activeHub === "operations" ? (
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
            <div style={{ fontSize: "54px", marginBottom: "20px" }}>🔒</div>
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
        ) : (
          // Coming Soon / Gated Hub tabs (Broadcasts, Lore, Comics)
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
            <div style={{ fontSize: "50px", marginBottom: "20px" }}>📡</div>
            
            {activeHub === "broadcasts" && (
              <>
                <h2 style={{ fontSize: "20px", fontFamily: "var(--mono)", color: "#f0c929", letterSpacing: "0.15em", marginBottom: "12px" }}>
                  [ DECODING SATELLITE UPLINK ]
                </h2>
                <p style={{ fontSize: "14px", color: "var(--text-dim)", lineHeight: "1.7", fontFamily: "var(--sans)", margin: "0 auto 28px", maxWidth: "480px" }}>
                  Establishing secure channel metadata feeds. Tactical broadcasts, survival announcements, and news from the digital containment front lines will display here.
                </p>
              </>
            )}

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
