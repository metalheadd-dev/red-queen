"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuth } from "@/components/AuthProvider";
import { generateApocalypticName } from "@/lib/names";
import {
  calculateBioScore,
  DEFAULT_STATS,
  getClearanceLevel,
  UserStats,
} from "@/lib/progression";
import { getNextThreatClearance, getThreatClearance } from "@/lib/threat-token";
import { PREPAREDNESS_CHECKLIST } from "@/lib/preparedness";
import {
  PREPAREDNESS_PLANS_EVENT,
  readPreparednessPlans,
  type PreparednessPlan,
} from "@/lib/preparedness-plan";
import {
  parseSignalWatchMemory,
  SIGNAL_WATCH_EVENT,
  SIGNAL_WATCH_STORAGE_KEY,
  type SignalWatchMemory,
} from "@/lib/signal-watch";
import { isHolderProofFresh } from "@/lib/holder-proof";
import { READINESS_BASELINE_PROMPT } from "@/lib/survival-context";

type Profile = {
  wallet_address: string;
  apocalyptic_name: string | null;
  chosen_scenarios: string[];
  last_bio_score: number | null;
  last_interaction: string | null;
  linked_wallet_address?: string | null;
  stats?: UserStats;
  xp_rank?: number | null;
  bio_score_rank?: number | null;
  holder_tier?: number | null;
  holder_status?: string | null;
  verified_balance?: number | null;
  last_verification?: string | null;
};

type HistoryMessage = {
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

const READINESS_DOMAINS: Array<{
  key: keyof Pick<UserStats,
    | "threat_awareness"
    | "operational_discipline"
    | "psychological_stability"
    | "technical_preparedness"
    | "adaptability"
    | "resourcefulness"
    | "surveillance_resistance"
  >;
  label: string;
  description: string;
}> = [
  { key: "threat_awareness", label: "Threat awareness", description: "Recognize signals and separate evidence from noise." },
  { key: "operational_discipline", label: "Operational discipline", description: "Follow safe routines under pressure." },
  { key: "psychological_stability", label: "Psychological stability", description: "Make clear decisions without panic or denial." },
  { key: "technical_preparedness", label: "Technical preparedness", description: "Maintain tools, backups and recovery options." },
  { key: "adaptability", label: "Adaptability", description: "Update a plan when assumptions change." },
  { key: "resourcefulness", label: "Resourcefulness", description: "Use available people, supplies and alternatives." },
  { key: "surveillance_resistance", label: "Digital resilience", description: "Reduce wallet, identity and information exposure." },
];

const LOCAL_CHECKLIST_KEY = "rq-preparedness-checklist-v1";

function maskIdentity(value: string) {
  if (!value) return "NO VERIFIED IDENTITY";
  if (value.startsWith("email-auth:")) return `ACCOUNT ${value.slice(-8).toUpperCase()}`;
  if (value.length > 18) return `${value.slice(0, 7)}…${value.slice(-7)}`;
  return value;
}

function formatRelativeTime(value?: string | null) {
  if (!value) return "NOT YET";
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return "UNKNOWN";
  const diff = Date.now() - time;
  const minutes = Math.max(0, Math.floor(diff / 60_000));
  if (minutes < 1) return "JUST NOW";
  if (minutes < 60) return `${minutes}M AGO`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}H AGO`;
  return `${Math.floor(hours / 24)}D AGO`;
}

function formatThreshold(value: number) {
  if (value >= 1_000_000) return `${value / 1_000_000}M`;
  if (value >= 1_000) return `${value / 1_000}K`;
  return String(value);
}

function extractSection(content: string, label: string) {
  const pattern = new RegExp(`${label}:\\s*([^\\n]+)`, "i");
  return content.match(pattern)?.[1]?.trim() || "";
}

export default function OperativeProfilePage() {
  const { publicKey } = useWallet();
  const { user, session, authIdentifier, loading: authLoading, logout } = useAuth();
  const identity = authIdentifier;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [history, setHistory] = useState<HistoryMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [customName, setCustomName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [localChecks, setLocalChecks] = useState(0);
  const [preparednessPlans, setPreparednessPlans] = useState<PreparednessPlan[]>([]);
  const [signalWatch, setSignalWatch] = useState<SignalWatchMemory>({ version: 1, types: [], localPriority: false, knownSignalIds: [] });
  const [avatar, setAvatar] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarStatus, setAvatarStatus] = useState("");
  const [generatingAvatar, setGeneratingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const generatedName = identity ? generateApocalypticName(identity) : "";

  const getHeaders = useCallback(() => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
    return headers;
  }, [session]);

  const loadAccount = useCallback(async () => {
    if (!identity) return;
    setLoading(true);
    setLoadError("");
    try {
      const headers = getHeaders();
      const [profileResponse, historyResponse] = await Promise.all([
        fetch(`/api/profile?wallet=${encodeURIComponent(identity)}`, { headers }),
        fetch(`/api/history?wallet=${encodeURIComponent(identity)}`, { headers }),
      ]);

      if (profileResponse.ok) {
        const data = await profileResponse.json();
        setProfile(data.profile || null);
        setCustomName(data.profile?.apocalyptic_name || generatedName);
      } else {
        const data = await profileResponse.json().catch(() => ({}));
        setLoadError(data.error || "Profile memory is currently unavailable.");
        setCustomName(generatedName);
      }

      if (historyResponse.ok) {
        const data = await historyResponse.json();
        setHistory(Array.isArray(data.history) ? data.history : []);
      } else {
        setHistory([]);
      }
    } catch {
      setLoadError("RED QUEEN memory is unreachable. Your local preparedness data is still available.");
      setCustomName(generatedName);
    } finally {
      setLoading(false);
    }
  }, [generatedName, getHeaders, identity]);

  useEffect(() => {
    const syncLocalMemory = () => {
      try {
        const saved = JSON.parse(localStorage.getItem(LOCAL_CHECKLIST_KEY) || "{}");
        setLocalChecks(PREPAREDNESS_CHECKLIST.filter((item) => Boolean(saved?.[item.id])).length);
      } catch {
        setLocalChecks(0);
      }
      setPreparednessPlans(readPreparednessPlans(localStorage));
      setSignalWatch(parseSignalWatchMemory(localStorage.getItem(SIGNAL_WATCH_STORAGE_KEY)));
    };
    syncLocalMemory();
    window.addEventListener("storage", syncLocalMemory);
    window.addEventListener(PREPAREDNESS_PLANS_EVENT, syncLocalMemory);
    window.addEventListener(SIGNAL_WATCH_EVENT, syncLocalMemory);
    return () => {
      window.removeEventListener("storage", syncLocalMemory);
      window.removeEventListener(PREPAREDNESS_PLANS_EVENT, syncLocalMemory);
      window.removeEventListener(SIGNAL_WATCH_EVENT, syncLocalMemory);
    };
  }, []);

  useEffect(() => {
    if (!identity) return;
    try {
      setAvatar(localStorage.getItem(`rq-solvivor-avatar-v1:${identity}`) || "");
    } catch {
      setAvatar("");
    }
  }, [identity]);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  useEffect(() => {
    if (identity && !authLoading) loadAccount();
    if (!identity && !authLoading) {
      setProfile(null);
      setHistory([]);
      setLoadError("");
    }
  }, [authLoading, identity, loadAccount]);

  async function saveName() {
    if (!identity) return;
    const safeName = customName.trim().slice(0, 36).toUpperCase() || generatedName;
    setSavingName(true);
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          wallet_address: identity,
          apocalyptic_name: safeName,
          chosen_scenarios: profile?.chosen_scenarios || [],
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Profile update failed.");
      setProfile(data.profile);
      setCustomName(data.profile?.apocalyptic_name || safeName);
      setEditingName(false);
      setLoadError("");
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Profile update failed.");
    } finally {
      setSavingName(false);
    }
  }

  async function verifyHoldings() {
    if (!identity) return;
    setVerifying(true);
    setVerifyStatus("VERIFYING ON SOLANA...");
    try {
      const response = await fetch("/api/profile/verify-holder", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "On-chain verification failed.");
      setVerifyStatus(`${Number(data.verified_balance || 0).toLocaleString()} $THREAT VERIFIED · ${data.holder_status}`);
      await loadAccount();
    } catch (error) {
      setVerifyStatus(error instanceof Error ? error.message : "On-chain verification failed.");
    } finally {
      setVerifying(false);
    }
  }

  function chooseAvatarSource(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 6 * 1024 * 1024) {
      setAvatarStatus("Use a JPEG, PNG or WebP portrait smaller than 6 MB.");
      return;
    }
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarStatus("Portrait ready. Nothing is sent until you choose Generate.");
  }

  async function generateAvatar() {
    if (!avatarFile || !session?.access_token || !hasFreshHolderProof) return;
    setGeneratingAvatar(true);
    setAvatarStatus("RED QUEEN is reconstructing your SOLvivor identity...");
    try {
      const body = new FormData();
      body.set("photo", avatarFile);
      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body,
      });
      const data = await response.json();
      if (!response.ok || !data.avatarDataUrl) throw new Error(data.error || "Portrait generation failed.");
      setAvatar(data.avatarDataUrl);
      setAvatarStatus("Queen Visage generated and saved on this device.");
      try {
        localStorage.setItem(`rq-solvivor-avatar-v1:${identity}`, data.avatarDataUrl);
      } catch {
        setAvatarStatus("Queen Visage generated. Browser storage is full, so download it before leaving.");
      }
    } catch (error) {
      setAvatarStatus(error instanceof Error ? error.message : "Portrait generation failed.");
    } finally {
      setGeneratingAvatar(false);
    }
  }

  function removeAvatar() {
    setAvatar("");
    setAvatarFile(null);
    setAvatarStatus("Local Queen Visage removed.");
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview("");
    if (avatarInputRef.current) avatarInputRef.current.value = "";
    try { localStorage.removeItem(`rq-solvivor-avatar-v1:${identity}`); } catch {}
  }

  const stats = profile?.stats || DEFAULT_STATS;
  const calculatedScore = calculateBioScore(stats);
  const bioScore = calculatedScore || profile?.last_bio_score || 0;
  const readinessTier = getClearanceLevel(bioScore);
  const tokenBalance = Number(profile?.verified_balance || 0);
  const hasThreatBalance = tokenBalance > 0;
  const hasFreshHolderProof = isHolderProofFresh(tokenBalance, profile?.last_verification);
  const tokenClearance = getThreatClearance(tokenBalance);
  const nextTokenClearance = getNextThreatClearance(tokenBalance);
  const displayName = customName || profile?.apocalyptic_name || generatedName || "UNREGISTERED SOLVIVOR";
  const xpProgress = stats.xp % 100;
  const localProgress = Math.round((localChecks / PREPAREDNESS_CHECKLIST.length) * 100);
  const activeProtocols = preparednessPlans.filter((plan) => plan.status === "ACTIVE");
  const completedProtocols = preparednessPlans.length - activeProtocols.length;
  const protocolSteps = preparednessPlans.flatMap((plan) => plan.steps);
  const completedProtocolSteps = protocolSteps.filter((step) => step.completed).length;
  const verifiedWallet = identity.startsWith("email-auth:")
    ? profile?.linked_wallet_address || ""
    : publicKey?.toString() || identity;

  const weakestDomain = useMemo(() => {
    return [...READINESS_DOMAINS].sort((a, b) => stats[a.key] - stats[b.key])[0];
  }, [stats]);

  const baselineHref = `/terminal?${new URLSearchParams({
    mode: "SIMULATE",
    prompt: bioScore === 0
      ? READINESS_BASELINE_PROMPT
      : `Run a focused readiness drill for ${weakestDomain.label}. Give me one realistic decision at a time, wait for my answer, and score only the evidence in my decision.`,
  }).toString()}`;

  const evaluatedHistory = useMemo(() => {
    return history
      .filter((message) => message.role === "assistant" && /READINESS:/i.test(message.content))
      .slice(-5)
      .reverse()
      .map((message) => ({
        date: message.created_at,
        readiness: extractSection(message.content, "READINESS"),
        action: extractSection(message.content, "NEXT ACTION"),
      }));
  }, [history]);

  if (authLoading) {
    return <ProfileLoading label="VERIFYING ACCOUNT SESSION" />;
  }

  if (!identity) {
    return (
      <div className="rq-profile-page rq-profile-guest">
        <div className="rq-profile-guest-card">
          <div className="queen-core"><span /></div>
          <span className="pulse-eyebrow">MY READINESS // PRIVATE ACCOUNT</span>
          <h1>Your survival profile needs a verified session.</h1>
          <p>Sign in to save Queen history, evidence-based BIO, permanent XP and verified $THREAT clearance. Public intelligence and preparedness tools remain open without an account.</p>
          <div>
            <Link className="btn btn-primary" href="/login">SIGN IN OR CONNECT WALLET</Link>
            <Link className="btn btn-ghost" href="/survival-kit">CONTINUE WITH LOCAL PREPARE</Link>
          </div>
          <small>No readiness score is created from wallet ownership alone.</small>
        </div>
      </div>
    );
  }

  return (
    <div className="rq-profile-page">
      <header className="rq-profile-hero">
        <div className="container rq-profile-identity">
          <div className={`rq-profile-avatar${avatar ? " has-visage" : ""}`}>
            {avatar ? <img src={avatar} alt={`${displayName} Queen Visage`} /> : <div className="queen-core"><span /></div>}
            <b>SOLVIVOR ID</b>
          </div>
          <div className="rq-profile-name">
            <span className="pulse-eyebrow">SURVIVAL IDENTITY // VERIFIED SOLVIVOR</span>
            {editingName ? (
              <div className="rq-profile-name-editor">
                <input value={customName} maxLength={36} autoFocus onChange={(event) => setCustomName(event.target.value.toUpperCase())} onKeyDown={(event) => { if (event.key === "Enter") saveName(); }} />
                <button type="button" onClick={saveName} disabled={savingName}>{savingName ? "SAVING..." : "SAVE"}</button>
                <button type="button" onClick={() => setEditingName(false)}>CANCEL</button>
              </div>
            ) : (
              <h1>{displayName}<button type="button" onClick={() => setEditingName(true)}>EDIT</button></h1>
            )}
            <div className="rq-profile-id-line">
              <span>{user?.email ? "EMAIL SESSION" : "SOLANA SESSION"}</span>
              <strong>{maskIdentity(identity)}</strong>
              {verifiedWallet && <small>WALLET {maskIdentity(verifiedWallet)}</small>}
            </div>
          </div>
          <div className="rq-profile-hero-actions">
            <Link className="btn btn-primary" href={baselineHref}>{bioScore === 0 ? "START BASELINE" : "TRAIN WEAKEST DOMAIN"}</Link>
            <Link className="btn btn-ghost" href="/survival-kit">OPEN PREPARE</Link>
            <button type="button" className="rq-profile-logout" onClick={() => logout()}>LOG OUT</button>
          </div>
        </div>
      </header>

      <main className="container rq-profile-main">
        {loadError && <div className="rq-profile-error"><strong>MEMORY STATUS</strong><span>{loadError}</span><button type="button" onClick={loadAccount}>RETRY</button></div>}
        {loading && <div className="rq-profile-loading-line">SYNCHRONIZING VERIFIED PROFILE...</div>}

        <section className="rq-profile-next">
          <div><span>RED QUEEN // NEXT LOOP</span><h2>{bioScore === 0 ? "Establish an evidence-based readiness baseline" : `Strengthen ${weakestDomain.label}`}</h2><p>{bioScore === 0 ? "Queen will present one decision at a time. Your first question alone will not change BIO." : weakestDomain.description}</p></div>
          <Link href={baselineHref}>{bioScore === 0 ? "RUN 3-MIN BASELINE" : "START FOCUSED DRILL"} →</Link>
        </section>

        <section className={`rq-profile-visage${hasFreshHolderProof ? " is-unlocked" : " is-locked"}`}>
          <div className="rq-profile-visage-copy">
            <span>QUEEN VISAGE // $THREAT HOLDER UTILITY</span>
            <h2>Enter the system in RED QUEEN form.</h2>
            <p>Upload a clear portrait and the Queen will reconstruct it in the platform&apos;s red-and-white apocalyptic intelligence style while preserving your identity.</p>
            <ul>
              <li>Available only to accounts with verified $THREAT holdings.</li>
              <li>Generate sends the source portrait to the configured AI image provider for this one request.</li>
              <li>The generated portrait stays on this device unless you download or share it.</li>
            </ul>
            {!hasThreatBalance && <Link href="/network-clearance">VERIFY $THREAT TO UNLOCK →</Link>}
            {hasThreatBalance && !hasFreshHolderProof && <a href="#holder-clearance">REFRESH HOLDER PROOF TO GENERATE →</a>}
          </div>
          <div className="rq-profile-visage-studio">
            <div className="rq-profile-visage-preview">
              {!hasFreshHolderProof ? (
                <div className="rq-profile-visage-lock"><span>{hasThreatBalance ? "PROOF EXPIRED" : "HOLDER ACCESS"}</span><strong>{hasThreatBalance ? "Refresh your balance to reopen the studio." : "Queen Visage awaits verified $THREAT clearance."}</strong></div>
              ) : avatar || avatarPreview ? (
                <img src={avatar || avatarPreview} alt={avatar ? "Generated Queen Visage" : "Portrait selected for Queen Visage"} />
              ) : (
                <div><span>NO PORTRAIT LOADED</span><strong>Your face. Her visual language.</strong></div>
              )}
              <i>{!hasFreshHolderProof ? hasThreatBalance ? "LOCKED // REFRESH PROOF" : "LOCKED // $THREAT REQUIRED" : avatar ? "QUEEN VISAGE ACTIVE" : avatarPreview ? "SOURCE PREVIEW" : "AWAITING SOURCE"}</i>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={(event) => chooseAvatarSource(event.target.files?.[0])}
            />
            <div className="rq-profile-visage-actions">
              <button type="button" onClick={() => avatarInputRef.current?.click()} disabled={!hasFreshHolderProof || generatingAvatar}>CHOOSE PORTRAIT</button>
              <button type="button" className="primary" onClick={generateAvatar} disabled={!hasFreshHolderProof || !avatarFile || generatingAvatar}>
                {!hasFreshHolderProof ? hasThreatBalance ? "REFRESH HOLDER PROOF" : "HOLDER ACCESS ONLY" : generatingAvatar ? "RECONSTRUCTING..." : "GENERATE QUEEN VISAGE"}
              </button>
              {avatar && <a href={avatar} download="red-queen-solvivor.webp">DOWNLOAD</a>}
              {(avatar || avatarPreview) && <button type="button" onClick={removeAvatar} disabled={generatingAvatar}>REMOVE</button>}
            </div>
            {avatarStatus && <p className="rq-profile-visage-status">{avatarStatus}</p>}
          </div>
        </section>

        <section className="rq-profile-metrics" aria-label="Readiness summary">
          <div className="rq-profile-metric rq-profile-metric-primary" style={{ "--metric-color": readinessTier.color } as React.CSSProperties}>
            <span>BIO-SCORE</span><strong>{bioScore}%</strong><b>{bioScore === 0 ? "CALIBRATION REQUIRED" : readinessTier.label}</b><p>Evaluated readiness across seven domains.</p>
          </div>
          <div className="rq-profile-metric"><span>EXPERIENCE</span><strong>{stats.xp} XP</strong><b>LEVEL {stats.level}{profile?.xp_rank ? ` · RANK #${profile.xp_rank}` : ""}</b><i><em style={{ width: `${xpProgress}%` }} /></i><p>Permanent evidence and drill record.</p></div>
          <div className="rq-profile-metric"><span>LOCAL PREPARE</span><strong>{localProgress}%</strong><b>{localChecks}/{PREPAREDNESS_CHECKLIST.length} SELF-CHECKS</b><i><em style={{ width: `${localProgress}%` }} /></i><p>Stored on this device; not BIO evidence.</p></div>
          <div className="rq-profile-metric"><span>$THREAT CLEARANCE</span><strong>LVL {tokenClearance.level}</strong><b>{tokenClearance.name}</b><p>{tokenClearance.responseDepth.toUpperCase()} analysis · ×{tokenClearance.earnedXpMultiplier.toFixed(2)} earned XP.</p></div>
        </section>

        <section className="rq-profile-continuity" aria-label="Survival continuity">
          <div className="rq-profile-continuity-heading">
            <span>QUEEN MEMORY // ACTIVE SURVIVAL LOOP</span>
            <h2>What RED QUEEN is carrying forward for you</h2>
            <p>Plans, completed actions and watched signals persist beyond a single conversation on this device.</p>
          </div>
          <div><span>ACTIVE PROTOCOLS</span><strong>{activeProtocols.length}</strong><small>{completedProtocols} completed</small><Link href="/survival-kit">OPEN PROTOCOLS →</Link></div>
          <div><span>PLAN EXECUTION</span><strong>{completedProtocolSteps}/{protocolSteps.length}</strong><small>observable steps complete</small><Link href="/survival-kit">CONTINUE PLAN →</Link></div>
          <div><span>SIGNAL WATCH</span><strong>{signalWatch.types.length}</strong><small>{signalWatch.localPriority ? "local priority active" : "signal categories"}</small><Link href="/#live-map">TUNE WATCH →</Link></div>
        </section>

        <div className="rq-profile-grid">
          <section className="rq-profile-panel rq-profile-domains">
            <div className="rq-profile-panel-heading"><div><span>01 // READINESS DOMAINS</span><h2>What your score actually measures</h2></div><small>LAST EVIDENCE {formatRelativeTime(profile?.last_interaction)}</small></div>
            <div className="rq-profile-domain-list">
              {READINESS_DOMAINS.map((domain) => {
                const value = stats[domain.key];
                return (
                  <div key={domain.key} className={domain.key === weakestDomain.key && bioScore > 0 ? "weakest" : ""}>
                    <div><strong>{domain.label}</strong><span>{value}/100</span></div>
                    <i><b style={{ width: `${value}%` }} /></i>
                    <p>{domain.description}</p>
                  </div>
                );
              })}
            </div>
            <div className="rq-profile-score-contract"><strong>SCORING CONTRACT</strong><p>Ordinary questions do not earn XP. BIO changes only after an evaluated decision, plan or demonstrated preparedness action. Token holdings never create readiness.</p></div>
          </section>

          <aside className="rq-profile-side">
            <section id="holder-clearance" className="rq-profile-panel rq-profile-token">
              <div className="rq-profile-panel-heading"><div><span>02 // ON-CHAIN CLEARANCE</span><h2>$THREAT utility</h2></div></div>
              <div className="rq-profile-token-balance"><span>VERIFIED BALANCE</span><strong>{tokenBalance.toLocaleString()} $THREAT</strong><small>LAST CHECK {formatRelativeTime(profile?.last_verification)}</small></div>
              <ul><li>{tokenClearance.contextMessages} context messages</li><li>{tokenClearance.responseDepth} response depth</li><li>×{tokenClearance.earnedXpMultiplier.toFixed(2)} multiplier on earned XP only</li></ul>
              {nextTokenClearance ? <p>NEXT: {nextTokenClearance.name} at {formatThreshold(nextTokenClearance.threshold)} $THREAT</p> : <p>MAXIMUM CLEARANCE VERIFIED</p>}
              <button type="button" onClick={verifyHoldings} disabled={verifying || !verifiedWallet}>{verifying ? "VERIFYING..." : "REFRESH ON-CHAIN BALANCE"}</button>
              {verifyStatus && <small className="rq-profile-verify-status">{verifyStatus}</small>}
              {!verifiedWallet && <small>Sign in with a Solana wallet to verify holdings. A connected wallet is never silently linked to an email account.</small>}
            </section>

            <section className="rq-profile-panel rq-profile-memory">
              <div className="rq-profile-panel-heading"><div><span>03 // MEMORY & PRIVACY</span><h2>What Queen remembers</h2></div></div>
              <div><span>ACCOUNT MEMORY</span><strong>{profile ? "ACTIVE" : "AWAITING FIRST EVIDENCE"}</strong></div>
              <div><span>CONVERSATION HISTORY</span><strong>{history.length} SAVED MESSAGES</strong></div>
              <div><span>QUEEN PROTOCOLS</span><strong>{activeProtocols.length} ACTIVE · {completedProtocols} COMPLETE</strong></div>
              <div><span>SIGNAL WATCH</span><strong>{signalWatch.types.length} CATEGORIES{signalWatch.localPriority ? " · LOCAL" : ""}</strong></div>
              <div><span>LAST SENSOR SCAN</span><strong>{formatRelativeTime(signalWatch.lastScanAt)}</strong></div>
              <div><span>EXACT LOCATION</span><strong>NEVER REQUESTED</strong></div>
              <p>Broad area and preparedness checklist context remain under your control. Seed phrases, private keys and exact addresses must never be entered.</p>
              <Link href="/privacy">REVIEW PRIVACY POLICY →</Link>
            </section>
          </aside>
        </div>

        <section className="rq-profile-panel rq-profile-evidence">
          <div className="rq-profile-panel-heading"><div><span>04 // EVALUATED ACTIVITY</span><h2>Readiness evidence, not chat volume</h2></div><Link href="/terminal">OPEN QUEEN →</Link></div>
          {evaluatedHistory.length ? (
            <div className="rq-profile-evidence-list">
              {evaluatedHistory.map((entry, index) => (
                <div key={`${entry.date}-${index}`}><span>{new Date(entry.date).toLocaleDateString()}</span><strong>{entry.readiness}</strong><p>{entry.action || "No next action was stored with this entry."}</p></div>
              ))}
            </div>
          ) : (
            <div className="rq-profile-empty-evidence"><strong>NO EVALUATED EVIDENCE YET</strong><p>Complete a Queen decision drill or demonstrate a preparedness action. Asking more questions alone will not fill this log.</p><Link href={baselineHref}>START FIRST DRILL →</Link></div>
          )}
        </section>
      </main>
    </div>
  );
}

function ProfileLoading({ label }: { label: string }) {
  return <div className="rq-profile-page rq-profile-loading"><div className="queen-core"><span /></div><strong>{label}</strong></div>;
}
