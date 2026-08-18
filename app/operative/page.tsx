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
import { X402_INTELLIGENCE_PRODUCTS } from "@/lib/intelligence-products";

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
  community_visible?: boolean;
  community_joined_at?: string | null;
};

type HistoryMessage = {
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

type X402Receipt = {
  operation_id: string;
  product_id: string;
  status: "delivered";
  scheme: string;
  network: string;
  price: string;
  transaction_signature: string | null;
  delivered_at: string;
};

type OnchainAchievement = {
  achievement_id: string;
  transaction_signature: string;
  protocol_xp: number;
  created_at: string;
  metadata?: Record<string, unknown>;
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
  const [x402Receipts, setX402Receipts] = useState<X402Receipt[]>([]);
  const [receiptNotice, setReceiptNotice] = useState("");
  const [onchainAchievements, setOnchainAchievements] = useState<OnchainAchievement[]>([]);
  const [protocolXp, setProtocolXp] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [customName, setCustomName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [savingCommunity, setSavingCommunity] = useState(false);
  const [communityStatus, setCommunityStatus] = useState("");
  const [localChecks, setLocalChecks] = useState(0);
  const [preparednessPlans, setPreparednessPlans] = useState<PreparednessPlan[]>([]);
  const [signalWatch, setSignalWatch] = useState<SignalWatchMemory>({
    version: 1,
    types: [],
    localPriority: false,
    browserAlerts: false,
    knownSignalIds: [],
    acknowledgedSignalIds: [],
  });
  const [avatar, setAvatar] = useState("");
  const [avatarKind, setAvatarKind] = useState<"CUSTOM" | "QUEEN_VISAGE" | "">("");
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
      const [profileResponse, historyResponse, receiptsResponse, achievementsResponse] = await Promise.all([
        fetch(`/api/profile?wallet=${encodeURIComponent(identity)}`, { headers }),
        fetch(`/api/history?wallet=${encodeURIComponent(identity)}`, { headers }),
        fetch("/api/profile/x402-receipts", { headers, cache: "no-store" }),
        fetch("/api/profile/onchain-achievements", { headers, cache: "no-store" }),
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

      if (receiptsResponse.ok) {
        const data = await receiptsResponse.json();
        setX402Receipts(Array.isArray(data.receipts) ? data.receipts : []);
        setReceiptNotice(data.message || "");
      } else {
        setX402Receipts([]);
        setReceiptNotice("Receipt history is temporarily unavailable.");
      }

      if (achievementsResponse.ok) {
        const data = await achievementsResponse.json();
        setOnchainAchievements(Array.isArray(data.achievements) ? data.achievements : []);
        setProtocolXp(Number(data.protocolXp || 0));
      } else {
        setOnchainAchievements([]);
        setProtocolXp(0);
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
      const savedAvatar = localStorage.getItem(`rq-solvivor-avatar-v1:${identity}`) || "";
      const savedKind = localStorage.getItem(`rq-solvivor-avatar-kind-v1:${identity}`);
      setAvatar(savedAvatar);
      setAvatarKind(savedAvatar ? savedKind === "CUSTOM" ? "CUSTOM" : "QUEEN_VISAGE" : "");
    } catch {
      setAvatar("");
      setAvatarKind("");
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
      setX402Receipts([]);
      setReceiptNotice("");
      setOnchainAchievements([]);
      setProtocolXp(0);
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

  async function updateCommunityVisibility(visible: boolean) {
    setSavingCommunity(true);
    setCommunityStatus(visible ? "JOINING SOLVIVOR NETWORK..." : "LEAVING PUBLIC BOARD...");
    try {
      const response = await fetch("/api/community/membership", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ visible }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Community preference update failed.");
      setProfile((current) => current ? {
        ...current,
        community_visible: Boolean(data.membership?.community_visible),
        community_joined_at: data.membership?.community_joined_at || current.community_joined_at,
      } : current);
      setCommunityStatus(visible
        ? "PUBLIC ALIAS ACTIVE. THE NETWORK CAN SEE YOUR READINESS RECORD."
        : "PROFILE REMOVED FROM THE PUBLIC BOARD.");
    } catch (error) {
      setCommunityStatus(error instanceof Error ? error.message : "Community preference update failed.");
    } finally {
      setSavingCommunity(false);
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
    setAvatarStatus("Portrait ready. Use it locally as-is, or generate a holder-only Queen Visage. Nothing is sent to AI until you choose Generate.");
  }

  async function makeSquareAvatar(file: File) {
    const sourceUrl = URL.createObjectURL(file);
    try {
      const image = new window.Image();
      image.src = sourceUrl;
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Portrait could not be read."));
      });
      const canvas = document.createElement("canvas");
      canvas.width = 768;
      canvas.height = 768;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Browser image processing is unavailable.");
      const crop = Math.min(image.naturalWidth, image.naturalHeight);
      const sourceX = (image.naturalWidth - crop) / 2;
      const sourceY = (image.naturalHeight - crop) / 2;
      context.fillStyle = "#000";
      context.fillRect(0, 0, 768, 768);
      context.drawImage(image, sourceX, sourceY, crop, crop, 0, 0, 768, 768);
      return canvas.toDataURL("image/webp", 0.88);
    } finally {
      URL.revokeObjectURL(sourceUrl);
    }
  }

  async function usePersonalAvatar() {
    if (!avatarFile || !identity) return;
    setAvatarStatus("Preparing a private square profile image on this device…");
    try {
      const localAvatar = await makeSquareAvatar(avatarFile);
      setAvatar(localAvatar);
      setAvatarKind("CUSTOM");
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarPreview("");
      localStorage.setItem(`rq-solvivor-avatar-v1:${identity}`, localAvatar);
      localStorage.setItem(`rq-solvivor-avatar-kind-v1:${identity}`, "CUSTOM");
      setAvatarStatus("Personal avatar active. It was processed and stored only in this browser.");
    } catch (error) {
      setAvatarStatus(error instanceof Error ? error.message : "Personal avatar could not be saved.");
    }
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
      setAvatarKind("QUEEN_VISAGE");
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarPreview("");
      setAvatarStatus("Queen Visage V2 generated and saved on this device. It is ready for X, Discord or any profile.");
      try {
        localStorage.setItem(`rq-solvivor-avatar-v1:${identity}`, data.avatarDataUrl);
        localStorage.setItem(`rq-solvivor-avatar-kind-v1:${identity}`, "QUEEN_VISAGE");
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
    setAvatarKind("");
    setAvatarFile(null);
    setAvatarStatus("Local Queen Visage removed.");
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview("");
    if (avatarInputRef.current) avatarInputRef.current.value = "";
    try {
      localStorage.removeItem(`rq-solvivor-avatar-v1:${identity}`);
      localStorage.removeItem(`rq-solvivor-avatar-kind-v1:${identity}`);
    } catch {}
  }

  async function shareAvatar() {
    if (!avatar) return;
    const caption = avatarKind === "QUEEN_VISAGE"
      ? "RED QUEEN rebuilt my SOLvivor identity. The last line of defense is intelligence. #SOLvivor #RedQueen"
      : "SOLvivor profile online. #SOLvivor #RedQueen";
    try {
      const blob = await (await fetch(avatar)).blob();
      const file = new File([blob], "red-queen-solvivor.webp", { type: blob.type || "image/webp" });
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({ title: "RED QUEEN SOLvivor", text: caption, files: [file] });
        setAvatarStatus("Avatar shared through your device.");
        return;
      }
      const download = document.createElement("a");
      download.href = avatar;
      download.download = "red-queen-solvivor.webp";
      download.click();
      await navigator.clipboard?.writeText(caption);
      setAvatarStatus("Avatar downloaded and post text copied. Upload the image to X, Discord or your preferred profile.");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setAvatarStatus("Use Download, then upload the image to X, Discord or your preferred profile.");
    }
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

        <section className={`rq-profile-visage${hasFreshHolderProof ? " is-unlocked" : " is-personal"}`}>
          <div className="rq-profile-visage-copy">
            <span>SOLVIVOR AVATAR // PERSONAL OR QUEEN VISAGE</span>
            <h2>Your identity. Her visual language when you choose it.</h2>
            <p>Every SOLvivor can use a personal profile image. Verified $THREAT holders can ask RED QUEEN to reconstruct it as a square branded apocalypse-intelligence portrait.</p>
            <ul>
              <li>Personal avatar: available to everyone, cropped and stored only in this browser.</li>
              <li>Queen Visage V2: holder-only white linework, red circuitry, luminous eyes and tactical crown halo.</li>
              <li>Generate sends the selected portrait to the configured AI provider only for that request.</li>
              <li>Download or Share exports a social-ready 1:1 image for X, Discord or anywhere else.</li>
            </ul>
            {!hasThreatBalance && <Link href="/network-clearance">VERIFY $THREAT TO UNLOCK BRANDED GENERATION →</Link>}
            {hasThreatBalance && !hasFreshHolderProof && <a href="#holder-clearance">REFRESH HOLDER PROOF FOR QUEEN VISAGE →</a>}
          </div>
          <div className="rq-profile-visage-studio">
            <div className="rq-profile-visage-preview">
              {avatarPreview || avatar ? (
                <img src={avatarPreview || avatar} alt={avatarPreview ? "Portrait selected for SOLvivor avatar" : avatarKind === "QUEEN_VISAGE" ? "Generated Queen Visage" : "Personal SOLvivor avatar"} />
              ) : (
                <div><span>NO PORTRAIT LOADED</span><strong>Your face. Her visual language.</strong></div>
              )}
              <i>{avatarPreview ? "SOURCE PREVIEW // NOT UPLOADED" : avatarKind === "QUEEN_VISAGE" ? "QUEEN VISAGE V2 // HOLDER IDENTITY" : avatarKind === "CUSTOM" ? "PERSONAL AVATAR // LOCAL" : "AWAITING PORTRAIT"}</i>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={(event) => chooseAvatarSource(event.target.files?.[0])}
            />
            <div className="rq-profile-visage-actions">
              <button type="button" onClick={() => avatarInputRef.current?.click()} disabled={generatingAvatar}>CHOOSE PORTRAIT</button>
              <button type="button" onClick={() => void usePersonalAvatar()} disabled={!avatarFile || generatingAvatar}>USE MY AVATAR</button>
              <button type="button" className="primary" onClick={generateAvatar} disabled={!hasFreshHolderProof || !avatarFile || generatingAvatar}>
                {!hasFreshHolderProof ? hasThreatBalance ? "REFRESH PROOF FOR RQ VISAGE" : "RQ VISAGE · HOLDERS" : generatingAvatar ? "RECONSTRUCTING..." : "GENERATE RQ VISAGE V2"}
              </button>
              {avatar && <a href={avatar} download="red-queen-solvivor.webp">DOWNLOAD 1:1</a>}
              {avatar && <button type="button" onClick={() => void shareAvatar()} disabled={generatingAvatar}>SHARE / EXPORT</button>}
              {(avatar || avatarPreview) && <button type="button" onClick={removeAvatar} disabled={generatingAvatar}>REMOVE</button>}
            </div>
            {!hasFreshHolderProof && <div className="rq-profile-visage-holder-note"><strong>PERSONAL AVATAR IS OPEN</strong><span>Branded RED QUEEN transformation requires a fresh verified $THREAT balance.</span></div>}
            {avatarStatus && <p className="rq-profile-visage-status">{avatarStatus}</p>}
          </div>
        </section>

        <section className="rq-profile-metrics" aria-label="Readiness summary">
          <div className="rq-profile-metric rq-profile-metric-primary" style={{ "--metric-color": readinessTier.color } as React.CSSProperties}>
            <span>BIO-SCORE</span><strong>{bioScore}%</strong><b>{bioScore === 0 ? "CALIBRATION REQUIRED" : readinessTier.label}</b><p>Evaluated readiness across seven domains.</p>
          </div>
          <div className="rq-profile-metric"><span>EXPERIENCE</span><strong>{stats.xp} XP</strong><b>LEVEL {stats.level}{profile?.xp_rank ? ` · RANK #${profile.xp_rank}` : ""}</b><i><em style={{ width: `${xpProgress}%` }} /></i><p>Permanent evidence and drill record.</p></div>
          <div className="rq-profile-metric"><span>LOCAL PREPARE</span><strong>{localProgress}%</strong><b>{localChecks}/{PREPAREDNESS_CHECKLIST.length} SELF-CHECKS</b><i><em style={{ width: `${localProgress}%` }} /></i><p>Stored on this device; not BIO evidence.</p></div>
          <div className="rq-profile-metric"><span>$THREAT CLEARANCE</span><strong>LVL {tokenClearance.level}</strong><b>{tokenClearance.name}</b><p>{tokenClearance.responseDepth.toUpperCase()} analysis · {tokenClearance.comparisonSignals} live signals per synthesis · ×{tokenClearance.earnedXpMultiplier.toFixed(2)} earned XP.</p></div>
        </section>
        <div className="rq-profile-guide-link"><span>NEW TO THE SYSTEM?</span><p>BIO, XP, levels, domains, protocols, Signal Watch, holder proof and privacy are explained in plain language.</p><Link href="/docs#readiness">OPEN PROFILE FIELD GUIDE →</Link></div>

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

        <section className="rq-profile-receipts" aria-label="x402 payment receipts">
          <div className="rq-profile-receipts-heading">
            <span>QUEEN COMPUTE // PRIVATE x402 LEDGER</span>
            <h2>Paid intelligence, with proof of delivery</h2>
            <p>Every settled operation is bound to one request and one delivered output. Payments never create XP or BIO-SCORE.</p>
          </div>
          {x402Receipts.length ? (
            <div className="rq-profile-receipt-list">
              {x402Receipts.slice(0, 6).map((receipt) => {
                const product = X402_INTELLIGENCE_PRODUCTS.find((item) => item.id === receipt.product_id);
                return (
                  <article key={receipt.operation_id}>
                    <div><span>{product?.name || receipt.product_id}</span><strong>{receipt.price.replace("$", "")} USDC</strong></div>
                    <p>{new Date(receipt.delivered_at).toLocaleString()} · {receipt.scheme.toUpperCase()} · DELIVERED</p>
                    <code>{receipt.operation_id}</code>
                    {receipt.transaction_signature && <a href={`https://explorer.solana.com/tx/${receipt.transaction_signature}`} target="_blank" rel="noreferrer">VIEW SETTLEMENT ↗</a>}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rq-profile-receipts-empty"><strong>NO WALLET-BOUND RECEIPTS</strong><p>{receiptNotice || "Completed x402 operations paid by this signed wallet will appear here."}</p><Link href="/network-clearance">EXPLORE QUEEN OPERATIONS →</Link></div>
          )}
        </section>

        <section className="rq-profile-protocol" aria-label="Verified Solana protocol achievements">
          <div>
            <span>SOLANA RECORD // PROTOCOL XP</span>
            <h2>Useful on-chain participation, separated from readiness.</h2>
            <p>Protocol XP records verified Solana actions. It never changes BIO-SCORE, readiness domains or SOLvivor leaderboard XP.</p>
            <Link href="/network-clearance#buy-threat">OPEN ON-CHAIN HUB →</Link>
          </div>
          <div className="rq-profile-protocol-score"><span>PROTOCOL XP</span><strong>{protocolXp}</strong><small>not survival competence</small></div>
          <div className="rq-profile-protocol-list">
            {onchainAchievements.length ? onchainAchievements.map((item) => (
              <article key={item.achievement_id}>
                <span>{item.achievement_id === "ONCHAIN_INITIATE_V1" ? "ONCHAIN INITIATE" : item.achievement_id.replaceAll("_", " ")}</span>
                <strong>+{item.protocol_xp} PROTOCOL XP</strong>
                <small>{new Date(item.created_at).toLocaleString()}</small>
                <a href={`https://explorer.solana.com/tx/${item.transaction_signature}`} target="_blank" rel="noreferrer">PROOF ↗</a>
              </article>
            )) : <article className="is-empty"><span>NO PROTOCOL RECORD YET</span><p>Your first verified $THREAT swap can unlock ONCHAIN INITIATE once. Purchase volume never creates more XP.</p></article>}
          </div>
        </section>

        <section className={`rq-profile-network-status${profile?.community_visible ? " is-visible" : ""}`} aria-label="SOLvivor Network visibility">
          <div>
            <span>SOLVIVOR NETWORK // OPT-IN READINESS BOARD</span>
            <h2>{profile?.community_visible ? "Your signal is visible to the network." : "Join the public readiness board when you choose."}</h2>
            <p>Only your apocalyptic alias, earned XP, level, BIO-SCORE and broad activity band appear. Your email and wallet never appear on the board.</p>
          </div>
          <div className="rq-profile-network-score">
            <span>SOLVIVOR POINTS</span><strong>{stats.xp}</strong><small>earned XP · not a token</small>
          </div>
          <div className="rq-profile-network-actions">
            <Link href="/community#solvivor-board">VIEW BOARD →</Link>
            <button type="button" disabled={savingCommunity || !profile} onClick={() => updateCommunityVisibility(!profile?.community_visible)}>
              {savingCommunity ? "UPDATING..." : profile?.community_visible ? "LEAVE PUBLIC BOARD" : "JOIN WITH PUBLIC ALIAS"}
            </button>
            {communityStatus && <small>{communityStatus}</small>}
          </div>
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
              <ul><li>{tokenClearance.contextMessages} context messages</li><li>{tokenClearance.signalWatchSlots} Signal Watch slots</li><li>{tokenClearance.comparisonSignals} verified signals per Queen synthesis</li><li>{tokenClearance.responseDepth} response depth</li><li>×{tokenClearance.earnedXpMultiplier.toFixed(2)} multiplier on earned XP only</li></ul>
              {nextTokenClearance ? <p>NEXT: {nextTokenClearance.name} at {formatThreshold(nextTokenClearance.threshold)} $THREAT</p> : <p>MAXIMUM CLEARANCE VERIFIED</p>}
              <Link href="/network-clearance#buy-threat">BUY $THREAT THROUGH JUPITER →</Link>
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
              <div><span>PUBLIC READINESS BOARD</span><strong>{profile?.community_visible ? "OPTED IN" : "PRIVATE"}</strong></div>
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
