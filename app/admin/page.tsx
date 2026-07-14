"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useWallet } from "@solana/wallet-adapter-react";
import AccessGuard from "@/components/AccessGuard";
import Link from "next/link";
import SolvivalIcon from "@/components/SolvivalIcon";

const formatDatetimeLocal = (isoString?: string) => {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    const tzoffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzoffset).toISOString().slice(0, 16);
  } catch {
    return "";
  }
};

interface Submission {
  id: string;
  created_at: string;
  wallet_address: string;
  raw_wallet: string;
  type: "task" | "bounty";
  target_id: string;
  status: string;
  proof_link: string;
  submitted_at: string;
  details: {
    title: string;
    description: string;
    reward_xp?: number;
    reward_sol?: number;
  } | null;
  user: {
    apoptotic_name: string | null;
    email: string | null;
    linked_wallet_address: string | null;
  } | null;
}

export default function AdminDashboardPage() {
  const { user, session } = useAuth();
  const { connected } = useWallet();

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [activeTab, setActiveTab] = useState<"submissions" | "create" | "manage" | "twitter" | "invites" | "players" | "holder" | "analytics">("submissions");
  const [tweetText, setTweetText] = useState(
    "gmgn guys. Made several deployments and updates for Red Queen:\n\n1. Live threat telemetry (NOAA space weather, USGS earthquakes, GDELT disease RSS & GDACS) integrated.\n2. Gemini AI dynamically synthesizes the homepage Threat of the Day card with source citations.\n3. Swapped Mapbox GL for open-source MapLibre GL."
  );

  // Invite management states
  const [invites, setInvites] = useState<any[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [newInviteCode, setNewInviteCode] = useState("");
  const [newInviteMaxUses, setNewInviteMaxUses] = useState("1");
  const [newInviteNotes, setNewInviteNotes] = useState("");
  const [newInviteExpiry, setNewInviteExpiry] = useState("");
  const [generatingInvite, setGeneratingInvite] = useState(false);

  // Player management & Analytics states
  const [players, setPlayers] = useState<any[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);

  // Holder Audit tool states
  const [verifyWalletInput, setVerifyWalletInput] = useState("");
  const [verifyingHolder, setVerifyingHolder] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [verifyingError, setVerifyingError] = useState<string | null>(null);

  // Content creation form states
  const [createType, setCreateType] = useState<"task" | "bounty">("task");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rewardXp, setRewardXp] = useState("50");
  const [recurrence, setRecurrence] = useState("one-time");
  const [rewardSol, setRewardSol] = useState("0.1");
  const [winnersCount, setWinnersCount] = useState("3");
  const [deadline, setDeadline] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [creating, setCreating] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Containment Breach status states
  const [breachActive, setBreachActive] = useState(false);
  const [breachUntil, setBreachUntil] = useState("");
  const [breachDurationHours, setBreachDurationHours] = useState("24");
  const [loadingBreach, setLoadingBreach] = useState(false);
  const [savingBreach, setSavingBreach] = useState(false);

  // Manage active missions states
  const [tasks, setTasks] = useState<any[]>([]);
  const [bounties, setBounties] = useState<any[]>([]);
  const [loadingActiveMissions, setLoadingActiveMissions] = useState(false);
  const [editingItem, setEditingItem] = useState<{
    type: "task" | "bounty";
    id: string;
    title: string;
    description: string;
    reward_xp?: number;
    recurrence?: string;
    reward_sol?: number;
    winners_count?: number;
    deadline?: string;
    image_url?: string;
  } | null>(null);

  // Check admin status
  const checkAdminStatus = useCallback(async () => {
    setCheckingAdmin(true);
    try {
      const token = session?.access_token;
      const res = await fetch("/api/admin/check", {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });
      const data = await res.json();
      setIsAdmin(!!data.isAdmin);
    } catch {
      setIsAdmin(false);
    }
    setCheckingAdmin(false);
  }, [session]);

  const fetchSubmissions = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingSubmissions(true);
    try {
      const token = session?.access_token;
      const res = await fetch("/api/admin/submissions", {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });
      const data = await res.json();
      if (data.submissions) {
        setSubmissions(data.submissions);
      }
    } catch (e) {
      console.error("Error loading submissions:", e);
    }
    setLoadingSubmissions(false);
  }, [isAdmin, session]);

  const fetchActiveMissions = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingActiveMissions(true);
    try {
      const res = await fetch("/api/quests/all");
      const data = await res.json();
      if (data.tasks) setTasks(data.tasks);
      if (data.bounties) setBounties(data.bounties);
    } catch (e) {
      console.error("Error loading active missions:", e);
    }
    setLoadingActiveMissions(false);
  }, [isAdmin]);

  const fetchInvites = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingInvites(true);
    try {
      const token = session?.access_token;
      const res = await fetch("/api/admin/invites", {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });
      const data = await res.json();
      if (data && data.invites) {
        setInvites(data.invites);
      }
    } catch (e) {
      console.error("Error loading invites:", e);
    }
    setLoadingInvites(false);
  }, [isAdmin, session]);

  const fetchPlayersAndAnalytics = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingPlayers(true);
    try {
      const token = session?.access_token;
      const res = await fetch("/api/admin/players", {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });
      const data = await res.json();
      if (data && data.players) {
        setPlayers(data.players);
      }
      if (data && data.analytics) {
        setAnalytics(data.analytics);
      }
    } catch (e) {
      console.error("Error loading players list:", e);
    }
    setLoadingPlayers(false);
  }, [isAdmin, session]);

  const handleGenerateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneratingInvite(true);
    try {
      const token = session?.access_token;
      const res = await fetch("/api/admin/invites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          code: newInviteCode || undefined,
          max_uses: parseInt(newInviteMaxUses) || 1,
          note: newInviteNotes,
          expires_at: newInviteExpiry || null
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Invite code generated: ${data.invite.code}`);
        setNewInviteCode("");
        setNewInviteMaxUses("1");
        setNewInviteNotes("");
        setNewInviteExpiry("");
        fetchInvites();
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (err: any) {
      console.error("Failed to generate invite:", err);
    }
    setGeneratingInvite(false);
  };

  const handleToggleInvite = async (id: string, active: boolean) => {
    try {
      const token = session?.access_token;
      const res = await fetch("/api/admin/invites", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ id, active })
      });
      const data = await res.json();
      if (data.success) {
        fetchInvites();
      }
    } catch (err) {
      console.error("Failed to update invite:", err);
    }
  };

  const handleDeleteInvite = async (id: string) => {
    if (!confirm("Are you sure you want to delete this invite?")) return;
    try {
      const token = session?.access_token;
      const res = await fetch(`/api/admin/invites?id=${id}`, {
        method: "DELETE",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });
      const data = await res.json();
      if (data.success) {
        fetchInvites();
      }
    } catch (err) {
      console.error("Failed to delete invite:", err);
    }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const token = session?.access_token;
      const res = await fetch("/api/admin/edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify(editingItem)
      });
      const data = await res.json();
      if (data.error) {
        alert("Failed to edit: " + data.error);
      } else {
        alert("Successfully updated item!");
        setEditingItem(null);
        fetchActiveMissions();
      }
    } catch (e: any) {
      alert("Error saving: " + e.message);
    }
  };

  const handleDelete = async (type: "task" | "bounty", id: string) => {
    if (!confirm(`Are you sure you want to delete this ${type}? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = session?.access_token;
      const res = await fetch("/api/admin/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ type, id })
      });
      const data = await res.json();
      if (data.error) {
        alert("Failed to delete: " + data.error);
      } else {
        alert("Successfully deleted item!");
        fetchActiveMissions();
      }
    } catch (e: any) {
      alert("Error deleting: " + e.message);
    }
  };

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  useEffect(() => {
    if (isAdmin) {
      fetchSubmissions();
    }
  }, [isAdmin, fetchSubmissions]);

  useEffect(() => {
    if (isAdmin && activeTab === "manage") {
      fetchActiveMissions();
    }
  }, [isAdmin, activeTab, fetchActiveMissions]);

  useEffect(() => {
    if (isAdmin && activeTab === "invites") {
      fetchInvites();
    } else if (isAdmin && (activeTab === "players" || activeTab === "analytics")) {
      fetchPlayersAndAnalytics();
    }
  }, [isAdmin, activeTab, fetchInvites, fetchPlayersAndAnalytics]);

  const fetchBreachStatus = useCallback(async () => {
    setLoadingBreach(true);
    try {
      const token = session?.access_token;
      const res = await fetch("/api/admin/breach", {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });
      const data = await res.json();
      if (data.success && data.breach) {
        setBreachActive(!!data.breach.active);
        setBreachUntil(formatDatetimeLocal(data.breach.until));
        if (data.breach.until) {
          const msLeft = new Date(data.breach.until).getTime() - Date.now();
          const hrsLeft = Math.max(1, Math.round(msLeft / (1000 * 60 * 60)));
          setBreachDurationHours(String(hrsLeft));
        }
      }
    } catch (e) {
      console.error("Failed to load breach status:", e);
    }
    setLoadingBreach(false);
  }, [session]);

  const handleBreachSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBreach(true);
    try {
      const token = session?.access_token;
      let calculatedUntil = null;
      if (breachActive) {
        const durationHrs = parseFloat(breachDurationHours) || 24;
        calculatedUntil = new Date(Date.now() + durationHrs * 60 * 60 * 1000).toISOString();
      }
      
      const res = await fetch("/api/admin/breach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          active: breachActive,
          until: calculatedUntil
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("Containment breach state updated successfully.");
        if (data.breach) {
          setBreachActive(!!data.breach.active);
          setBreachUntil(formatDatetimeLocal(data.breach.until));
        }
      } else {
        alert("Error: " + data.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
    setSavingBreach(false);
  };

  useEffect(() => {
    if (isAdmin && activeTab === ("breach" as any)) {
      fetchBreachStatus();
    }
  }, [isAdmin, activeTab, fetchBreachStatus]);

  const handleAction = async (submissionId: string, action: "approve" | "reject") => {
    setActioningId(submissionId);
    try {
      const token = session?.access_token;
      const res = await fetch("/api/admin/action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ submissionId, action })
      });
      const data = await res.json();
      if (data.error) {
        alert("Action failed: " + data.error);
      } else {
        alert(`Successfully ${action}d submission.`);
        fetchSubmissions();
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    }
    setActioningId(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      alert("Title and description are required.");
      return;
    }

    setCreating(true);
    try {
      const token = session?.access_token;
      const payload = createType === "task" 
        ? { type: "task", title, description, reward_xp: parseInt(rewardXp) || 0, recurrence, image_url: imageUrl }
        : { type: "bounty", title, description, reward_sol: parseFloat(rewardSol) || 0, winners_count: parseInt(winnersCount) || 1, deadline, image_url: imageUrl };

      const res = await fetch("/api/admin/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.error) {
        alert("Failed to create: " + data.error);
      } else {
        alert(`Successfully published new ${createType}!`);
        // Reset form
        setTitle("");
        setDescription("");
        setDeadline("");
        setImageUrl("");
        setActiveTab("manage");
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    }
    setCreating(false);
  };

  if (checkingAdmin) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#050505", color: "#f0c929", fontFamily: "var(--mono)" }}>
        [ INITIALIZING ROOT SECURITY CREDENTIALS... ]
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#050505", color: "var(--accent)", padding: "24px", textAlign: "center" }}>
        <div style={{ marginBottom: "20px", display: "inline-flex", alignItems: "center", color: "var(--accent)", filter: "drop-shadow(0 0 12px rgba(255, 0, 51, 0.6))" }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            <circle cx="12" cy="16" r="1.5" fill="currentColor" />
          </svg>
        </div>
        <h1 style={{ fontSize: "28px", fontFamily: "var(--mono)", letterSpacing: "0.15em", marginBottom: "16px" }}>
          ACCESS DENIED // INCIDENT LOGGED
        </h1>
        <p style={{ fontSize: "14px", color: "var(--text-dim)", maxWidth: "500px", lineHeight: "1.6", marginBottom: "32px", fontFamily: "var(--sans)" }}>
          Your session lacks administrative clearance (Level 5 Clearance required). Unauthorized attempts to connect to the Red Queen core terminal have been reported to security grids.
        </p>
        <Link href="/" className="btn btn-primary" style={{ padding: "12px 24px" }}>
          RETURN TO COMMAND HUB
        </Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", paddingTop: "80px", background: "#030303", color: "#fff" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid rgba(255, 77, 77, 0.1)", padding: "32px 24px", background: "var(--surface)" }}>
        <div className="container" style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontFamily: "var(--mono)", fontSize: "11px", color: "#f0c929", letterSpacing: "0.2em", marginBottom: "4px" }}>
              <span className="status-dot" style={{ background: "#f0c929" }} />
              SECURE ADMIN TERMINAL
            </div>
            <h1 style={{ fontSize: "28px", fontFamily: "var(--mono)", margin: 0, letterSpacing: "0.05em" }}>
              COMMAND <span style={{ color: "var(--accent)" }}>CONTROL</span>
            </h1>
          </div>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              onClick={() => setActiveTab("submissions")}
              className="btn"
              style={{
                fontSize: "12px",
                fontFamily: "var(--mono)",
                borderColor: activeTab === "submissions" ? "var(--accent)" : "rgba(255,255,255,0.05)",
                background: activeTab === "submissions" ? "rgba(255, 77, 77, 0.05)" : "transparent"
              }}
            >
              PENDING SUBMISSIONS ({submissions.length})
            </button>
            <button
              onClick={() => setActiveTab("create")}
              className="btn"
              style={{
                fontSize: "12px",
                fontFamily: "var(--mono)",
                borderColor: activeTab === "create" ? "var(--accent)" : "rgba(255,255,255,0.05)",
                background: activeTab === "create" ? "rgba(255, 77, 77, 0.05)" : "transparent"
              }}
            >
              PUBLISH CONTENT
            </button>
            <button
              onClick={() => setActiveTab("manage")}
              className="btn"
              style={{
                fontSize: "12px",
                fontFamily: "var(--mono)",
                borderColor: activeTab === "manage" ? "var(--accent)" : "rgba(255,255,255,0.05)",
                background: activeTab === "manage" ? "rgba(255, 77, 77, 0.05)" : "transparent"
              }}
            >
              MANAGE ACTIVE MISSIONS
            </button>
            <button
              onClick={() => setActiveTab("twitter")}
              className="btn"
              style={{
                fontSize: "12px",
                fontFamily: "var(--mono)",
                borderColor: activeTab === "twitter" ? "#1d9bf0" : "rgba(255,255,255,0.05)",
                background: activeTab === "twitter" ? "rgba(29, 155, 240, 0.05)" : "transparent",
                color: activeTab === "twitter" ? "#1d9bf0" : "var(--text)"
              }}
            >
              𝕏 / TWITTER COMPOSER
            </button>
            <button
              onClick={() => setActiveTab("invites")}
              className="btn"
              style={{
                fontSize: "12px",
                fontFamily: "var(--mono)",
                borderColor: activeTab === "invites" ? "var(--accent)" : "rgba(255,255,255,0.05)",
                background: activeTab === "invites" ? "rgba(255, 77, 77, 0.05)" : "transparent"
              }}
            >
              INVITE CODES
            </button>
            <button
              onClick={() => setActiveTab("players")}
              className="btn"
              style={{
                fontSize: "12px",
                fontFamily: "var(--mono)",
                borderColor: activeTab === "players" ? "var(--accent)" : "rgba(255,255,255,0.05)",
                background: activeTab === "players" ? "rgba(255, 77, 77, 0.05)" : "transparent"
              }}
            >
              PLAYERS DIRECTORY
            </button>
            <button
              onClick={() => setActiveTab("holder")}
              className="btn"
              style={{
                fontSize: "12px",
                fontFamily: "var(--mono)",
                borderColor: activeTab === "holder" ? "var(--accent)" : "rgba(255,255,255,0.05)",
                background: activeTab === "holder" ? "rgba(255, 77, 77, 0.05)" : "transparent"
              }}
            >
              HOLDER AUDIT TOOLS
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className="btn"
              style={{
                fontSize: "12px",
                fontFamily: "var(--mono)",
                borderColor: activeTab === "analytics" ? "var(--accent)" : "rgba(255,255,255,0.05)",
                background: activeTab === "analytics" ? "rgba(255, 77, 77, 0.05)" : "transparent"
              }}
            >
              METRICS & ANALYTICS
            </button>
            <button
              onClick={() => setActiveTab("breach" as any)}
              className="btn"
              style={{
                fontSize: "12px",
                fontFamily: "var(--mono)",
                borderColor: activeTab === ("breach" as any) ? "var(--accent)" : "rgba(255,255,255,0.05)",
                background: activeTab === ("breach" as any) ? "rgba(255, 77, 77, 0.05)" : "transparent"
              }}
            >
              CONTAINMENT BREACH
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="container" style={{ flex: 1, maxWidth: "1200px", margin: "0 auto", padding: "40px 24px w-full" }}>
        
        {activeTab === "submissions" ? (
          // Submissions View
          <div>
            <h2 style={{ fontSize: "18px", fontFamily: "var(--mono)", marginBottom: "20px", color: "var(--text)" }}>
              [ USER MISSIONS VERIFICATION QUEUE ]
            </h2>

            {loadingSubmissions ? (
              <div style={{ textAlign: "center", padding: "40px", fontFamily: "var(--mono)", color: "var(--accent)" }}>
                [ LOADING VERIFICATION QUEUE... ]
              </div>
            ) : submissions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "4px", color: "var(--text-dim)", fontFamily: "var(--mono)" }}>
                [ ALL USER SUBMISSIONS VERIFIED. QUEUE IS EMPTY ]
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {submissions.map((sub) => {
                  const username = sub.user?.apoptotic_name || "UNKNOWN OPERATIVE";
                  const email = sub.user?.email || "No email";
                  const walletAddr = sub.raw_wallet || sub.user?.linked_wallet_address || "No wallet linked";

                  return (
                    <div key={sub.id} className="panel" style={{ padding: "24px", background: "rgba(10, 10, 10, 0.6)", borderColor: "rgba(255, 77, 77, 0.15)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "16px", borderBottom: "1px dashed rgba(255,255,255,0.05)", paddingBottom: "12px" }}>
                        <div>
                          <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase" }}>
                            OPERATIVE:
                          </span>
                          <span style={{ fontFamily: "var(--mono)", fontSize: "13px", fontWeight: "bold", color: "#fff", marginLeft: "6px" }}>
                            {username} ({email})
                          </span>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--mono)", marginTop: "2px" }}>
                            Wallet: {walletAddr}
                          </div>
                        </div>
                        <span className="tag" style={{ color: sub.type === "task" ? "var(--accent)" : "#f0c929", borderColor: sub.type === "task" ? "rgba(255,77,77,0.2)" : "rgba(240,201,41,0.2)" }}>
                          {sub.type.toUpperCase()} SUBMISSION
                        </span>
                      </div>

                      <div style={{ marginBottom: "20px" }}>
                        <h3 style={{ fontSize: "16px", fontFamily: "var(--mono)", margin: "0 0 6px" }}>
                          {sub.details?.title || "Classified Target"}
                        </h3>
                        <p style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.5", margin: "0 0 12px" }}>
                          {sub.details?.description}
                        </p>
                        <div style={{ padding: "12px", background: "#050505", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "2px" }}>
                          <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", display: "block", marginBottom: "4px" }}>
                            SUBMITTED PROOF LINK:
                          </span>
                          <a href={sub.proof_link} target="_blank" rel="noopener noreferrer" style={{ color: "#00ffcc", textDecoration: "underline", wordBreak: "break-all", fontSize: "13px", fontFamily: "var(--mono)" }}>
                            {sub.proof_link} ↗
                          </a>
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                        <div style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)" }}>
                          Base Reward:{" "}
                          <span style={{ color: "#fff", fontWeight: "bold" }}>
                            {sub.type === "task" ? `+${sub.details?.reward_xp} XP` : `${sub.details?.reward_sol} SOL`}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: "10px" }}>
                          <button
                            onClick={() => handleAction(sub.id, "reject")}
                            disabled={actioningId === sub.id}
                            className="btn btn-ghost"
                            style={{ borderColor: "var(--accent)", color: "var(--accent)", fontSize: "12px", padding: "8px 20px" }}
                          >
                            REJECT
                          </button>
                          <button
                            onClick={() => handleAction(sub.id, "approve")}
                            disabled={actioningId === sub.id}
                            className="btn btn-primary"
                            style={{ background: "#55ff55", borderColor: "#55ff55", color: "#000", fontSize: "12px", padding: "8px 20px", fontWeight: "bold" }}
                          >
                            {actioningId === sub.id ? "PROCESSING..." : "APPROVE"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : activeTab === "create" ? (
          // Publish Content Form
          <div style={{ maxWidth: "600px", margin: "0 auto" }}>
            <h2 style={{ fontSize: "18px", fontFamily: "var(--mono)", marginBottom: "24px", color: "var(--text)" }}>
              [ CREATE NEW MISSION PROTOCOL ]
            </h2>

            <form onSubmit={handleCreate} className="panel" style={{ padding: "32px", borderColor: "rgba(255,255,255,0.08)" }}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)", marginBottom: "8px" }}>
                  MISSION TYPE
                </label>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    type="button"
                    onClick={() => setCreateType("task")}
                    style={{
                      flex: 1,
                      padding: "10px",
                      fontFamily: "var(--mono)",
                      fontSize: "12px",
                      border: "1px solid",
                      borderColor: createType === "task" ? "var(--accent)" : "rgba(255,255,255,0.05)",
                      background: createType === "task" ? "rgba(255, 77, 77, 0.05)" : "transparent",
                      color: "#fff",
                      cursor: "pointer"
                    }}
                  >
                    TASK (XP Reward)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateType("bounty")}
                    style={{
                      flex: 1,
                      padding: "10px",
                      fontFamily: "var(--mono)",
                      fontSize: "12px",
                      border: "1px solid",
                      borderColor: createType === "bounty" ? "#f0c929" : "rgba(255,255,255,0.05)",
                      background: createType === "bounty" ? "rgba(240, 201, 41, 0.05)" : "transparent",
                      color: "#fff",
                      cursor: "pointer"
                    }}
                  >
                    BOUNTY (SOL Reward)
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label htmlFor="title" style={{ display: "block", fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)", marginBottom: "8px" }}>
                  MISSION TITLE
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Follow Red Queen on X"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "#050505",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "2px",
                    color: "#fff",
                    outline: "none"
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label htmlFor="description" style={{ display: "block", fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)", marginBottom: "8px" }}>
                  MISSION DESCRIPTION (Full instruction details)
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Input detailed instructions on what user needs to execute..."
                  rows={4}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "#050505",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "2px",
                    color: "#fff",
                    fontFamily: "var(--sans)",
                    outline: "none",
                    resize: "vertical"
                  }}
                  required
                />
              </div>

              {createType === "task" ? (
                // Task Specific Form
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "28px" }}>
                  <div>
                    <label htmlFor="rewardXp" style={{ display: "block", fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)", marginBottom: "8px" }}>
                      XP REWARD VALUE
                    </label>
                    <input
                      id="rewardXp"
                      type="number"
                      value={rewardXp}
                      onChange={(e) => setRewardXp(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        background: "#050505",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "2px",
                        color: "#fff",
                        outline: "none"
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="recurrence" style={{ display: "block", fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)", marginBottom: "8px" }}>
                      RECURRENCE
                    </label>
                    <select
                      id="recurrence"
                      value={recurrence}
                      onChange={(e) => setRecurrence(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        background: "#050505",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "2px",
                        color: "#fff",
                        fontFamily: "var(--mono)",
                        outline: "none"
                      }}
                    >
                      <option value="one-time">ONE-TIME</option>
                      <option value="daily">DAILY</option>
                      <option value="weekly">WEEKLY</option>
                    </select>
                  </div>
                </div>
              ) : (
                // Bounty Specific Form
                <div style={{ marginBottom: "28px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                    <div>
                      <label htmlFor="rewardSol" style={{ display: "block", fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)", marginBottom: "8px" }}>
                        SOL POOL VALUE
                      </label>
                      <input
                        id="rewardSol"
                        type="text"
                        value={rewardSol}
                        onChange={(e) => setRewardSol(e.target.value)}
                        placeholder="e.g. 0.5"
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          background: "#050505",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "2px",
                          color: "#fff",
                          outline: "none"
                        }}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="winnersCount" style={{ display: "block", fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)", marginBottom: "8px" }}>
                        WINNERS CAPACITY
                      </label>
                      <input
                        id="winnersCount"
                        type="number"
                        value={winnersCount}
                        onChange={(e) => setWinnersCount(e.target.value)}
                        placeholder="e.g. 3"
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          background: "#050505",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "2px",
                          color: "#fff",
                          outline: "none"
                        }}
                        required
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: "20px" }}>
                    <label htmlFor="deadline" style={{ display: "block", fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)", marginBottom: "8px" }}>
                      CAMPAIGN EXPIRY TIMELINE
                    </label>
                    <input
                      id="deadline"
                      type="datetime-local"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        background: "#050505",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "2px",
                        color: "#fff",
                        fontFamily: "var(--mono)",
                        outline: "none"
                      }}
                      required
                    />
                  </div>
                </div>
              )}

              {/* IMAGE URL (OPTIONAL) for BOTH tasks and bounties */}
              <div style={{ marginBottom: "28px" }}>
                <label htmlFor="imageUrl" style={{ display: "block", fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)", marginBottom: "8px" }}>
                  IMAGE URL (OPTIONAL)
                </label>
                <input
                  id="imageUrl"
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="e.g. https://i.imgur.com/example.png"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "#050505",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "2px",
                    color: "#fff",
                    fontFamily: "var(--mono)",
                    outline: "none"
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={creating}
                className="btn btn-primary"
                style={{
                  width: "100%",
                  padding: "12px",
                  fontSize: "13px",
                  fontWeight: "bold",
                  background: createType === "task" ? "var(--accent)" : "#f0c929",
                  borderColor: createType === "task" ? "var(--accent)" : "#f0c929",
                  color: createType === "task" ? "#fff" : "#000"
                }}
              >
                {creating ? "PUBLISHING..." : `PUBLISH ${createType.toUpperCase()} MISSION`}
              </button>
            </form>
          </div>
        ) : activeTab === "manage" ? (
          // Manage Active Missions View
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "18px", fontFamily: "var(--mono)", margin: 0, color: "var(--text)" }}>
                [ ACTIVE MISSIONS CONTROL PANEL ]
              </h2>
              <button 
                onClick={fetchActiveMissions} 
                className="btn btn-ghost" 
                style={{ fontSize: "12px", padding: "6px 12px" }}
                disabled={loadingActiveMissions}
              >
                {loadingActiveMissions ? "REFRESHING..." : "REFRESH LIST"}
              </button>
            </div>

            {loadingActiveMissions ? (
              <div style={{ textAlign: "center", padding: "40px", fontFamily: "var(--mono)", color: "var(--accent)" }}>
                [ SCANNING ACTIVE TARGETS... ]
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>
                {/* Active Tasks */}
                <div>
                  <h3 style={{ fontSize: "14px", fontFamily: "var(--mono)", marginBottom: "16px", color: "var(--accent)", borderBottom: "1px dashed rgba(255, 77, 77, 0.2)", paddingBottom: "8px" }}>
                    TASKS (XP REWARDS) - {tasks.length} ACTIVE
                  </h3>
                  {tasks.length === 0 ? (
                    <div style={{ padding: "20px", border: "1px dashed rgba(255,255,255,0.05)", textAlign: "center", color: "var(--text-dim)", fontFamily: "var(--mono)", fontSize: "12px" }}>
                      NO ACTIVE TASKS FOUND
                    </div>
                  ) : (
                    tasks.map((task) => (
                      <div key={task.id} className="panel" style={{ padding: "16px", background: "rgba(10, 10, 10, 0.4)", borderColor: "rgba(255, 77, 77, 0.1)", marginBottom: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                          <h4 style={{ fontSize: "14px", fontFamily: "var(--mono)", margin: 0, color: "#fff" }}>
                            {task.title}
                          </h4>
                          <span style={{ fontSize: "10px", fontFamily: "var(--mono)", background: "rgba(255, 77, 77, 0.1)", color: "var(--accent)", padding: "2px 6px", border: "1px solid rgba(255, 77, 77, 0.2)" }}>
                            +{task.reward_xp} XP
                          </span>
                        </div>
                        <p style={{ fontSize: "12px", color: "var(--text-dim)", lineHeight: "1.4", margin: "0 0 12px", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {task.description}
                        </p>
                        {task.image_url && (
                          <div style={{ fontSize: "10px", color: "#00ffcc", marginBottom: "8px", fontFamily: "var(--mono)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                            Image: {task.image_url}
                          </div>
                        )}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "10px", fontFamily: "var(--mono)", color: "var(--text-muted)" }}>
                            Recurrence: {task.recurrence || "one-time"}
                          </span>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              onClick={() => setEditingItem({
                                type: "task",
                                id: task.id,
                                title: task.title,
                                description: task.description,
                                reward_xp: task.reward_xp,
                                recurrence: task.recurrence,
                                image_url: task.image_url || ""
                              })}
                              className="btn"
                              style={{ fontSize: "10px", padding: "4px 8px", borderColor: "rgba(255,255,255,0.15)" }}
                            >
                              EDIT
                            </button>
                            <button
                              onClick={() => handleDelete("task", task.id)}
                              className="btn btn-ghost"
                              style={{ fontSize: "10px", padding: "4px 8px", borderColor: "var(--accent)", color: "var(--accent)" }}
                            >
                              DELETE
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Active Bounties */}
                <div>
                  <h3 style={{ fontSize: "14px", fontFamily: "var(--mono)", marginBottom: "16px", color: "#f0c929", borderBottom: "1px dashed rgba(240, 201, 41, 0.2)", paddingBottom: "8px" }}>
                    BOUNTIES (SOL REWARDS) - {bounties.length} ACTIVE
                  </h3>
                  {bounties.length === 0 ? (
                    <div style={{ padding: "20px", border: "1px dashed rgba(255,255,255,0.05)", textAlign: "center", color: "var(--text-dim)", fontFamily: "var(--mono)", fontSize: "12px" }}>
                      NO ACTIVE BOUNTIES FOUND
                    </div>
                  ) : (
                    bounties.map((bounty) => (
                      <div key={bounty.id} className="panel" style={{ padding: "16px", background: "rgba(10, 10, 10, 0.4)", borderColor: "rgba(240, 201, 41, 0.1)", marginBottom: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                          <h4 style={{ fontSize: "14px", fontFamily: "var(--mono)", margin: 0, color: "#fff" }}>
                            {bounty.title}
                          </h4>
                          <span style={{ fontSize: "10px", fontFamily: "var(--mono)", background: "rgba(240, 201, 41, 0.1)", color: "#f0c929", padding: "2px 6px", border: "1px solid rgba(240, 201, 41, 0.2)" }}>
                            {bounty.reward_sol} SOL
                          </span>
                        </div>
                        <p style={{ fontSize: "12px", color: "var(--text-dim)", lineHeight: "1.4", margin: "0 0 12px", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {bounty.description}
                        </p>
                        {bounty.image_url && (
                          <div style={{ fontSize: "10px", color: "#00ffcc", marginBottom: "8px", fontFamily: "var(--mono)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                            Image: {bounty.image_url}
                          </div>
                        )}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "10px", fontFamily: "var(--mono)", color: "var(--text-muted)" }}>
                            Deadline: {bounty.deadline ? new Date(bounty.deadline).toLocaleDateString() : "None"}
                          </span>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              onClick={() => setEditingItem({
                                type: "bounty",
                                id: bounty.id,
                                title: bounty.title,
                                description: bounty.description,
                                reward_sol: bounty.reward_sol,
                                winners_count: bounty.winners_count,
                                deadline: bounty.deadline,
                                image_url: bounty.image_url || ""
                              })}
                              className="btn"
                              style={{ fontSize: "10px", padding: "4px 8px", borderColor: "rgba(255,255,255,0.15)" }}
                            >
                              EDIT
                            </button>
                            <button
                              onClick={() => handleDelete("bounty", bounty.id)}
                              className="btn btn-ghost"
                              style={{ fontSize: "10px", padding: "4px 8px", borderColor: "var(--accent)", color: "var(--accent)" }}
                            >
                              DELETE
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        ) : activeTab === "twitter" ? (
          // Twitter Composer Tab
          <div style={{ maxWidth: "600px", margin: "0 auto" }}>
            <h2 style={{ fontSize: "18px", fontFamily: "var(--mono)", marginBottom: "20px", color: "var(--text)" }}>
              [ 𝕏 / TWITTER COMMUNITY ANNOUNCER ]
            </h2>
            <div className="panel" style={{ padding: "28px", borderColor: "#1d9bf0" }}>
              <textarea
                value={tweetText}
                onChange={(e) => setTweetText(e.target.value)}
                rows={6}
                style={{ width: "100%", background: "#0c0c0c", border: "1px solid var(--border)", color: "#fff", padding: "12px", fontFamily: "var(--mono)", borderRadius: "2px", resize: "vertical" }}
              />
              <button
                onClick={() => {
                  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`, "_blank");
                }}
                className="btn btn-primary"
                style={{ width: "100%", marginTop: "16px", background: "#1d9bf0", borderColor: "#1d9bf0", color: "#fff", fontWeight: "bold" }}
              >
                BROADCAST TO TWITTER GRID 🚀
              </button>
            </div>
          </div>
        ) : activeTab === "invites" ? (
          // Invite Codes Tab
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "24px", marginBottom: "30px" }}>
              <div style={{ flex: 1, minWidth: "300px" }}>
                <h2 style={{ fontSize: "18px", fontFamily: "var(--mono)", marginBottom: "16px", color: "var(--text)" }}>
                  [ GENERATE NEW ACCESS KEY ]
                </h2>
                <form onSubmit={handleGenerateInvite} className="panel" style={{ padding: "20px", background: "rgba(10,10,10,0.3)" }}>
                  <div style={{ marginBottom: "12px" }}>
                    <label style={{ display: "block", fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)", marginBottom: "6px" }}>CUSTOM CODE (OPTIONAL)</label>
                    <input
                      type="text"
                      placeholder="RQ-AUTO-GEN"
                      value={newInviteCode}
                      onChange={(e) => setNewInviteCode(e.target.value.toUpperCase())}
                      style={{ width: "100%", background: "#0c0c0c", border: "1px solid var(--border)", color: "#fff", padding: "8px 12px", fontFamily: "var(--mono)", borderRadius: "2px" }}
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                    <div>
                      <label style={{ display: "block", fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)", marginBottom: "6px" }}>MAX USES</label>
                      <input
                        type="number"
                        min="1"
                        value={newInviteMaxUses}
                        onChange={(e) => setNewInviteMaxUses(e.target.value)}
                        style={{ width: "100%", background: "#0c0c0c", border: "1px solid var(--border)", color: "#fff", padding: "8px 12px", fontFamily: "var(--mono)", borderRadius: "2px" }}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)", marginBottom: "6px" }}>EXPIRY DATE (OPTIONAL)</label>
                      <input
                        type="datetime-local"
                        value={newInviteExpiry}
                        onChange={(e) => setNewInviteExpiry(e.target.value)}
                        style={{ width: "100%", background: "#0c0c0c", border: "1px solid var(--border)", color: "#fff", padding: "8px 12px", fontFamily: "var(--mono)", borderRadius: "2px" }}
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)", marginBottom: "6px" }}>ADMIN NOTE</label>
                    <input
                      type="text"
                      placeholder="Closed beta invite for..."
                      value={newInviteNotes}
                      onChange={(e) => setNewInviteNotes(e.target.value)}
                      style={{ width: "100%", background: "#0c0c0c", border: "1px solid var(--border)", color: "#fff", padding: "8px 12px", fontFamily: "var(--mono)", borderRadius: "2px" }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={generatingInvite}
                    className="btn btn-primary"
                    style={{ width: "100%", padding: "10px", fontFamily: "var(--mono)", fontSize: "11px", fontWeight: "bold" }}
                  >
                    {generatingInvite ? "[ GENERATING... ]" : "[ COMPILE ACCESS CODE ]"}
                  </button>
                </form>
              </div>

              <div style={{ flex: 1.5, minWidth: "400px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h2 style={{ fontSize: "18px", fontFamily: "var(--mono)", margin: 0, color: "var(--text)" }}>
                    [ REGISTERED ACCESS CODES ]
                  </h2>
                  <button onClick={fetchInvites} className="btn" style={{ fontSize: "10px", padding: "4px 8px" }} disabled={loadingInvites}>
                    REFRESH
                  </button>
                </div>

                <div className="panel" style={{ padding: "12px", background: "#080808", overflowX: "auto" }}>
                  {loadingInvites ? (
                    <div style={{ textAlign: "center", padding: "20px", fontFamily: "var(--mono)", color: "var(--accent)" }}>
                      [ RETRIEVING ARCHIVE KEY DATA... ]
                    </div>
                  ) : invites.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "20px", color: "var(--text-dim)", fontFamily: "var(--mono)", fontSize: "11px" }}>
                      NO REGISTERED INVITE CODES FOUND
                    </div>
                  ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "550px" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                          <th style={{ padding: "8px", fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)" }}>CODE</th>
                          <th style={{ padding: "8px", fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)" }}>USES</th>
                          <th style={{ padding: "8px", fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)" }}>NOTE</th>
                          <th style={{ padding: "8px", fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)" }}>STATUS</th>
                          <th style={{ padding: "8px", fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)", textAlign: "right" }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invites.map((invite: any) => (
                          <tr key={invite.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                            <td style={{ padding: "8px", fontFamily: "var(--mono)", fontSize: "11px", color: "#00ffcc", fontWeight: "bold" }}>
                              {invite.code}
                            </td>
                            <td style={{ padding: "8px", fontFamily: "var(--mono)", fontSize: "11px", color: "#fff" }}>
                              {invite.current_uses} / {invite.max_uses}
                            </td>
                            <td style={{ padding: "8px", fontSize: "11px", color: "var(--text-dim)" }}>
                              {invite.note || "—"}
                            </td>
                            <td style={{ padding: "8px", fontFamily: "var(--mono)", fontSize: "10px" }}>
                              {invite.active ? (
                                <span style={{ color: "#00ffcc" }}>ACTIVE</span>
                              ) : (
                                <span style={{ color: "var(--accent)" }}>DISABLED</span>
                              )}
                            </td>
                            <td style={{ padding: "8px", textAlign: "right" }}>
                              <div style={{ display: "inline-flex", gap: "6px" }}>
                                <button
                                  onClick={() => handleToggleInvite(invite.id, !invite.active)}
                                  className="btn"
                                  style={{ fontSize: "9px", padding: "2px 6px" }}
                                >
                                  {invite.active ? "DISABLE" : "ENABLE"}
                                </button>
                                <button
                                  onClick={() => handleDeleteInvite(invite.id)}
                                  className="btn btn-ghost"
                                  style={{ fontSize: "9px", padding: "2px 6px", borderColor: "var(--accent)", color: "var(--accent)" }}
                                >
                                  DELETE
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === "players" ? (
          // Players Directory Tab
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "18px", fontFamily: "var(--mono)", margin: 0, color: "var(--text)" }}>
                [ OPERATIVE REGISTRY DIRECTORY ]
              </h2>
              <button onClick={fetchPlayersAndAnalytics} className="btn" style={{ fontSize: "10px", padding: "4px 8px" }} disabled={loadingPlayers}>
                REFRESH
              </button>
            </div>

            <div className="panel" style={{ padding: "16px", background: "#080808", overflowX: "auto" }}>
              {loadingPlayers ? (
                <div style={{ textAlign: "center", padding: "30px", fontFamily: "var(--mono)", color: "var(--accent)" }}>
                  [ RETRIEVING OPERATIVE REGISTRIES... ]
                </div>
              ) : players.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px", color: "var(--text-dim)", fontFamily: "var(--mono)", fontSize: "11px" }}>
                  NO REGISTERED PLAYERS FOUND IN REGISTRY
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                      <th style={{ padding: "8px", fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)" }}>HASHED WALLET</th>
                      <th style={{ padding: "8px", fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)" }}>CALLSIGN</th>
                      <th style={{ padding: "8px", fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)" }}>CLASS/ROLE</th>
                      <th style={{ padding: "8px", fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)" }}>LEVEL (XP)</th>
                      <th style={{ padding: "8px", fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)" }}>BIO SCORE</th>
                      <th style={{ padding: "8px", fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)" }}>$THREAT BAL</th>
                      <th style={{ padding: "8px", fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)" }}>ACCESS TYPE</th>
                      <th style={{ padding: "8px", fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)", textAlign: "right" }}>OVERRIDE ACCESS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((player: any) => (
                      <tr key={player.wallet_address} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                        <td style={{ padding: "8px", fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-muted)" }}>
                          {player.wallet_address.slice(0, 10)}...{player.wallet_address.slice(-6)}
                        </td>
                        <td style={{ padding: "8px", fontSize: "11px", color: "#fff", fontWeight: "bold" }}>
                          {player.apocalyptic_name || "UNNAMED"}
                        </td>
                        <td style={{ padding: "8px", fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)" }}>
                          {player.class || "None"} / {player.role || "None"}
                        </td>
                        <td style={{ padding: "8px", fontFamily: "var(--mono)", fontSize: "11px", color: "var(--accent)" }}>
                          Lv {player.level || 1} ({player.xp || 0} XP)
                        </td>
                        <td style={{ padding: "8px", fontFamily: "var(--mono)", fontSize: "11px", color: "#ffcc00" }}>
                          {player.last_bio_score || player.bio_score || "—"}
                        </td>
                        <td style={{ padding: "8px", fontFamily: "var(--mono)", fontSize: "11px", color: "#00ffcc" }}>
                          {(player.verified_balance || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: "8px", fontFamily: "var(--mono)", fontSize: "11px", color: player.access_type === "Holder" ? "#00ffcc" : player.access_type === "Invite" ? "#ff4d4d" : "var(--text)" }}>
                          {player.access_type || "None"}
                        </td>
                        <td style={{ padding: "8px", textAlign: "right" }}>
                          <select
                            value={player.access_type || "None"}
                            onChange={async (e) => {
                              const val = e.target.value;
                              try {
                                const token = session?.access_token;
                                const res = await fetch("/api/admin/players", {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                    ...(token && { Authorization: `Bearer ${token}` })
                                  },
                                  body: JSON.stringify({ wallet_address: player.wallet_address, access_type: val })
                                });
                                const data = await res.json();
                                if (data.success) {
                                  fetchPlayersAndAnalytics();
                                }
                              } catch (err) {
                                console.error("Override failed:", err);
                              }
                            }}
                            style={{ background: "#0c0c0c", border: "1px solid var(--border)", color: "#fff", fontFamily: "var(--mono)", fontSize: "10px", padding: "2px 4px" }}
                          >
                            <option value="None">None</option>
                            <option value="Invite">Invite</option>
                            <option value="Holder">Holder</option>
                            <option value="Admin">Admin</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : activeTab === "holder" ? (
          // Holder Audit Tab
          <div style={{ maxWidth: "600px", margin: "0 auto" }}>
            <h2 style={{ fontSize: "18px", fontFamily: "var(--mono)", marginBottom: "20px", color: "var(--text)" }}>
              [ RUN MANUAL $THREAT AUDIT ]
            </h2>

            <div className="panel" style={{ padding: "28px" }}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", marginBottom: "8px" }}>TARGET SOLANA PUBLIC KEY</label>
                <input
                  type="text"
                  placeholder="Enter raw Solana wallet address..."
                  value={verifyWalletInput}
                  onChange={(e) => setVerifyWalletInput(e.target.value)}
                  style={{ width: "100%", background: "#0c0c0c", border: "1px solid var(--border)", color: "#fff", padding: "10px 14px", fontFamily: "var(--mono)", fontSize: "12px", borderRadius: "2px" }}
                />
              </div>

              <button
                onClick={async () => {
                  if (!verifyWalletInput.trim()) return;
                  setVerifyingHolder(true);
                  setVerifyResult(null);
                  setVerifyingError(null);
                  try {
                    const token = session?.access_token;
                    const res = await fetch("/api/profile/verify-holder", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        ...(token && { Authorization: `Bearer ${token}` })
                      },
                      body: JSON.stringify({ custom_wallet: verifyWalletInput })
                    });
                    const data = await res.json();
                    if (data.success) {
                      setVerifyResult(data);
                    } else {
                      setVerifyingError(data.error || "Audit request rejected");
                    }
                  } catch (e) {
                    setVerifyingError("Uplink timeout or connection failure.");
                  } finally {
                    setVerifyingHolder(false);
                  }
                }}
                disabled={verifyingHolder || !verifyWalletInput.trim()}
                className="btn btn-primary"
                style={{ width: "100%", padding: "12px", fontFamily: "var(--mono)", fontSize: "12px", fontWeight: "bold" }}
              >
                {verifyingHolder ? "[ DECRYPTING BLOCKCHAIN BALANCES... ]" : "[ AUDIT SOLANA WALLET ]"}
              </button>

              {verifyingError && (
                <div style={{ color: "var(--accent)", fontFamily: "var(--mono)", fontSize: "11px", marginTop: "16px", textAlign: "center" }}>
                  ⚠️ {verifyingError}
                </div>
              )}

              {verifyResult && (
                <div style={{ marginTop: "24px", background: "#0c0c0c", border: "1px solid var(--border)", padding: "16px" }}>
                  <h4 style={{ fontSize: "12px", fontFamily: "var(--mono)", margin: "0 0 12px 0", color: "#00ffcc", borderBottom: "1px solid var(--border)", paddingBottom: "6px" }}>
                    AUDIT REPORT SUMMARY
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontFamily: "var(--mono)", fontSize: "11px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>VERIFIED $THREAT:</span>
                      <span style={{ color: "#fff", fontWeight: "bold" }}>{verifyResult.verified_balance.toLocaleString()} tokens</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>CLEARANCE STATUS:</span>
                      <span style={{ color: "var(--accent)", fontWeight: "bold" }}>{verifyResult.holder_status}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>BENEFIT TIER:</span>
                      <span style={{ color: "#ffcc00", fontWeight: "bold" }}>Tier {verifyResult.holder_tier}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>ACCESS CLEARANCE:</span>
                      <span style={{ color: "#00ffcc", fontWeight: "bold" }}>{verifyResult.access_type}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === "analytics" ? (
          // Metrics & Analytics Tab
          <div>
            <h2 style={{ fontSize: "18px", fontFamily: "var(--mono)", marginBottom: "20px", color: "var(--text)" }}>
              [ AGGREGATED METRICS & ECOSYSTEM HEALTH ]
            </h2>

            {analytics ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                  <div className="panel" style={{ padding: "20px", background: "rgba(10,10,10,0.3)" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)", display: "block" }}>TOTAL REGISTRY PARTICIPANTS</span>
                    <span style={{ fontSize: "28px", fontWeight: "bold", fontFamily: "var(--mono)", color: "#fff", display: "block", marginTop: "8px" }}>
                      {analytics.totalCount}
                    </span>
                  </div>
                  <div className="panel" style={{ padding: "20px", background: "rgba(10,10,10,0.3)" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)", display: "block" }}>ACTIVE INVITE USERS</span>
                    <span style={{ fontSize: "28px", fontWeight: "bold", fontFamily: "var(--mono)", color: "#ff4d4d", display: "block", marginTop: "8px" }}>
                      {analytics.inviteCount}
                    </span>
                  </div>
                  <div className="panel" style={{ padding: "20px", background: "rgba(10,10,10,0.3)" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)", display: "block" }}>VERIFIED HOLDERS (LEVEL 2+)</span>
                    <span style={{ fontSize: "28px", fontWeight: "bold", fontFamily: "var(--mono)", color: "#00ffcc", display: "block", marginTop: "8px" }}>
                      {analytics.holderCount}
                    </span>
                  </div>
                  <div className="panel" style={{ padding: "20px", background: "rgba(10,10,10,0.3)" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)", display: "block" }}>FOUNDER BADGE HOLDERS (LEVEL 3)</span>
                    <span style={{ fontSize: "28px", fontWeight: "bold", fontFamily: "var(--mono)", color: "#ffcc00", display: "block", marginTop: "8px" }}>
                      {analytics.founderCount}
                    </span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start", flexWrap: "wrap" }}>
                  <div className="panel" style={{ padding: "20px" }}>
                    <h3 style={{ fontSize: "14px", fontFamily: "var(--mono)", margin: "0 0 16px 0", color: "#fff", borderBottom: "1px dashed rgba(255,255,255,0.1)", paddingBottom: "8px" }}>
                      ECOSYSTEM PERFORMANCE AVERAGES
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontFamily: "var(--mono)", fontSize: "12px" }}>
                      <div>
                        <span style={{ color: "var(--text-muted)" }}>AVERAGE BIO-SCORE EVALUATION:</span>
                        <div style={{ fontSize: "16px", fontWeight: "bold", color: "#ffcc00", marginTop: "4px" }}>
                          {analytics.avgBioScore} / 100
                        </div>
                      </div>
                      <div>
                        <span style={{ color: "var(--text-muted)" }}>AVERAGE SECURED SECTOR COMPLETION:</span>
                        <div style={{ fontSize: "16px", fontWeight: "bold", color: "#00ffcc", marginTop: "4px" }}>
                          {analytics.avgCampaignCompletion}%
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="panel" style={{ padding: "20px" }}>
                    <h3 style={{ fontSize: "14px", fontFamily: "var(--mono)", margin: "0 0 16px 0", color: "#fff", borderBottom: "1px dashed rgba(255,255,255,0.1)", paddingBottom: "8px" }}>
                      POPULAR DEFENSE OPERATIONS
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {analytics.popularOperations.length === 0 ? (
                        <span style={{ color: "var(--text-dim)", fontFamily: "var(--mono)", fontSize: "11px" }}>NO OPERATIONS RECORDED YET</span>
                      ) : (
                        analytics.popularOperations.map((op: any, i: number) => (
                          <div key={op.title} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.02)", paddingBottom: "6px" }}>
                            <span style={{ fontSize: "11px", fontFamily: "var(--mono)", color: "#fff" }}>
                              {i+1}. {op.title}
                            </span>
                            <span style={{ fontSize: "11px", fontFamily: "var(--mono)", color: "var(--accent)", fontWeight: "bold" }}>
                              {op.count} Runs
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px", fontFamily: "var(--mono)", color: "var(--accent)" }}>
                [ CALCULATING ANALYTIC ALGORITHMS... ]
              </div>
            )}
          </div>
        ) : activeTab === ("breach" as any) ? (
          // Containment Breach View
          <div>
            <h2 style={{ fontSize: "18px", fontFamily: "var(--mono)", marginBottom: "20px", color: "var(--text)" }}>
              [ SYSTEM STATE: CONTAINMENT BREACH INTRUSION ]
            </h2>

            <div className="panel" style={{ padding: "28px" }}>
              <form onSubmit={handleBreachSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <input
                    type="checkbox"
                    id="breachActiveCheckbox"
                    checked={breachActive}
                    onChange={(e) => setBreachActive(e.target.checked)}
                    style={{ width: "18px", height: "18px", cursor: "pointer" }}
                  />
                  <label htmlFor="breachActiveCheckbox" style={{ fontFamily: "var(--mono)", fontSize: "14px", color: "#fff", cursor: "pointer" }}>
                    ACTIVE CONTAINMENT BREACH EVENT
                  </label>
                </div>

                <div>
                  <label style={{ display: "block", fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", marginBottom: "8px" }}>
                    BREACH DURATION (HOURS)
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={breachDurationHours}
                    onChange={(e) => setBreachDurationHours(e.target.value)}
                    style={{ width: "100%", background: "#0c0c0c", border: "1px solid var(--border)", color: "#fff", padding: "10px 14px", fontFamily: "var(--mono)", fontSize: "12px", borderRadius: "2px" }}
                    placeholder="Enter duration in hours (e.g. 24)"
                  />
                </div>

                {breachActive && breachUntil && (
                  <div style={{ fontFamily: "var(--mono)", fontSize: "11.5px", color: "#ff4d4d", background: "rgba(255, 77, 77, 0.05)", border: "1px solid rgba(255, 77, 77, 0.15)", padding: "10px 14px", borderRadius: "2px" }}>
                    CURRENT ACTIVE DEADLINE: {new Date(breachUntil).toUTCString()}
                  </div>
                )}

                <div style={{ fontSize: "11px", color: "var(--text-dim)", lineHeight: "1.6", borderTop: "1px dashed rgba(255,77,77,0.1)", paddingTop: "12px" }}>
                  <strong>NOTICE:</strong> Toggling this manually writes directly to the <code>system_state</code> table. While active, returning operatives will see an urgent check-in warning window. Operatives who fail to check-in before this expiration date will have their daily streak reset to 1.
                </div>

                <button
                  type="submit"
                  disabled={savingBreach}
                  className="btn btn-primary"
                  style={{ width: "100%", padding: "12px", fontFamily: "var(--mono)", fontSize: "12px", fontWeight: "bold" }}
                >
                  {savingBreach ? "[ SYNCHRONIZING SYSTEM STATE... ]" : "[ UPDATE BREACH STATUS ]"}
                </button>
              </form>
            </div>
          </div>
        ) : null}
      </div>

      {/* Edit Modal Overlay */}
      {editingItem && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px"
        }}>
          <div className="panel" style={{ width: "100%", maxWidth: "500px", padding: "28px", background: "#080808", borderColor: editingItem.type === "task" ? "var(--accent)" : "#f0c929" }}>
            <h3 style={{ fontSize: "18px", fontFamily: "var(--mono)", marginBottom: "20px", color: editingItem.type === "task" ? "var(--accent)" : "#f0c929" }}>
              [ EDIT {editingItem.type.toUpperCase()} ]
            </h3>
            
            <form onSubmit={handleEditSave}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", marginBottom: "6px" }}>TITLE</label>
                <input
                  type="text"
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    background: "#020202",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "2px",
                    color: "#fff",
                    outline: "none"
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", marginBottom: "6px" }}>DESCRIPTION</label>
                <textarea
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  rows={4}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    background: "#020202",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "2px",
                    color: "#fff",
                    fontFamily: "var(--sans)",
                    outline: "none",
                    resize: "vertical"
                  }}
                  required
                />
              </div>

              {editingItem.type === "task" ? (
                <>
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", marginBottom: "6px" }}>XP REWARD</label>
                    <input
                      type="number"
                      value={editingItem.reward_xp || 0}
                      onChange={(e) => setEditingItem({ ...editingItem, reward_xp: parseInt(e.target.value) || 0 })}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        background: "#020202",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "2px",
                        color: "#fff",
                        outline: "none"
                      }}
                      required
                    />
                  </div>
                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", marginBottom: "6px" }}>RECURRENCE</label>
                    <select
                      value={editingItem.recurrence || "one-time"}
                      onChange={(e) => setEditingItem({ ...editingItem, recurrence: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        background: "#020202",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "2px",
                        color: "#fff",
                        fontFamily: "var(--mono)",
                        outline: "none"
                      }}
                    >
                      <option value="one-time">ONE-TIME</option>
                      <option value="daily">DAILY</option>
                      <option value="weekly">WEEKLY</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                    <div>
                      <label style={{ display: "block", fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", marginBottom: "6px" }}>SOL REWARD</label>
                      <input
                        type="text"
                        value={editingItem.reward_sol || 0}
                        onChange={(e) => setEditingItem({ ...editingItem, reward_sol: parseFloat(e.target.value) || 0 })}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          background: "#020202",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "2px",
                          color: "#fff",
                          outline: "none"
                        }}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", marginBottom: "6px" }}>WINNERS</label>
                      <input
                        type="number"
                        value={editingItem.winners_count || 1}
                        onChange={(e) => setEditingItem({ ...editingItem, winners_count: parseInt(e.target.value) || 1 })}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          background: "#020202",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "2px",
                          color: "#fff",
                          outline: "none"
                        }}
                        required
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", marginBottom: "6px" }}>DEADLINE</label>
                    <input
                      type="datetime-local"
                      value={formatDatetimeLocal(editingItem.deadline)}
                      onChange={(e) => setEditingItem({ ...editingItem, deadline: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        background: "#020202",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "2px",
                        color: "#fff",
                        fontFamily: "var(--mono)",
                        outline: "none"
                      }}
                      required
                    />
                  </div>
                </>
              )}

              {/* IMAGE URL (OPTIONAL) for BOTH tasks and bounties */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", marginBottom: "6px" }}>IMAGE URL (OPTIONAL)</label>
                <input
                  type="url"
                  value={editingItem.image_url || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, image_url: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    background: "#020202",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "2px",
                    color: "#fff",
                    fontFamily: "var(--mono)",
                    outline: "none"
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="btn btn-ghost"
                  style={{ fontSize: "12px", padding: "8px 16px" }}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    fontSize: "12px",
                    padding: "8px 20px",
                    background: editingItem.type === "task" ? "var(--accent)" : "#f0c929",
                    borderColor: editingItem.type === "task" ? "var(--accent)" : "#f0c929",
                    color: editingItem.type === "task" ? "#fff" : "#000",
                    fontWeight: "bold"
                  }}
                >
                  SAVE CHANGES
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
  );
}
