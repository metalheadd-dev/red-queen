"use client";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useAuth } from "@/components/AuthProvider";
import SolvivalIcon from "@/components/SolvivalIcon";
import dynamic from "next/dynamic";
import { generateApocalypticName } from "@/lib/names";
import { DEFAULT_STATS, calculateBioScore, parseStatsFromAI, applyStatGains, getClearanceLevel } from "@/lib/progression";
import { Connection, PublicKey, TransactionMessage, VersionedTransaction, ComputeBudgetProgram, TransactionInstruction } from "@solana/web3.js";
import { getAssociatedTokenAddress, createTransferCheckedInstruction } from "@solana/spl-token";
import { getWorkingConnection } from "@/lib/solana";
import AgentResponseCard from "@/components/AgentResponseCard";
import type { RedQueenClientResponse } from "@/lib/red-queen-agent";
import { createDailyAction, DAILY_ACTION_EVENT, readDailyActions, saveDailyAction, updateDailyAction } from "@/lib/daily-action";
import { buildDeviceSurvivalMemory } from "@/lib/device-survival-memory";
import {
  createPreparednessPlan,
  PREPAREDNESS_PLANS_EVENT,
  readPreparednessPlans,
  savePreparednessPlan,
} from "@/lib/preparedness-plan";
import {
  AGENT_MODES,
  AgentMode,
  buildFirstContactPrompt,
  getFocusOption,
  isAgentMode,
  isSurvivalFocus,
  MODE_STARTERS,
  READINESS_BASELINE_PROMPT,
  sanitizeArea,
  sanitizeSignalId,
  sanitizeSignalIds,
  SurvivalContext,
} from "@/lib/survival-context";


const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false }
);

interface Message {
  role: "user" | "assistant";
  content: string;
  bioScore?: string;
  intel?: RedQueenClientResponse;
}

function extractBioScore(text: string): { clean: string; score: string | null } {
  const match = text.match(/\[BIO-SCORE:\s*(\d+)%?\]/i);
  if (match) {
    return {
      clean: text,
      score: match[1],
    };
  }
  return { clean: text, score: null };
}

function renderContent(text: string) {
  // Render markdown-style links [TEXT](URL) as anchor tags
  const parts = text.split(/(\[.*?\]\(.*?\))/g);
  return parts.map((part, i) => {
    const linkMatch = part.match(/\[(.+?)\]\((.+?)\)/);
    if (linkMatch) {
      return (
        <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer">
          {linkMatch[1]}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

const CORE_INTRO_MESSAGE = `[UPLINK ESTABLISHED]

I am RED QUEEN — your survival intelligence system.

I can explain a threat, turn it into a practical plan, audit your preparation, or run a decision drill. When live intelligence is available, I will label it and show the source. Everything else is clearly marked as general knowledge or simulation.

Ask what matters now. I will give you one clear next action.`;

function getLocalStatsAndScore(messages: Message[]) {
  let stats = { ...DEFAULT_STATS };
  for (const msg of messages) {
    if (msg.role === "assistant") {
      const parsed = parseStatsFromAI(msg.content);
      if (parsed) {
        stats = applyStatGains(stats, parsed.xpGain, parsed.gains);
      } else {
        const match = msg.content.match(/\[BIO-SCORE:\s*(\d+)%?\]/i);
        if (match) {
          const val = parseInt(match[1]);
          stats.threat_awareness = val;
          stats.operational_discipline = val;
          stats.psychological_stability = val;
          stats.technical_preparedness = val;
          stats.adaptability = val;
          stats.resourcefulness = val;
          stats.surveillance_resistance = val;
        }
      }
    }
  }
  return { stats, score: calculateBioScore(stats) };
}

export default function TerminalPage() {
  const { publicKey, connected, wallet, disconnect, signTransaction } = useWallet();
  const { setVisible } = useWalletModal();
  const { user, authIdentifier, session, loginWithWallet } = useAuth();
  
  const solanaWalletAddress = publicKey ? publicKey.toString() : null;
  const walletAddress = authIdentifier || solanaWalletAddress;

  const [premiumIntel, setPremiumIntel] = useState<any | null>(null);
  const [depinIntel, setDepinIntel] = useState<any | null>(null);
  const [loadingPremium, setLoadingPremium] = useState<string | null>(null);
  const [loadingDepin, setLoadingDepin] = useState<string | null>(null);
  const [premiumError, setPremiumError] = useState<string | null>(null);
  const [depinError, setDepinError] = useState<string | null>(null);
  const [premiumTxid, setPremiumTxid] = useState<string | null>(null);
  const [depinTxid, setDepinTxid] = useState<string | null>(null);
  const [premiumOperationId, setPremiumOperationId] = useState<string | null>(null);
  const [depinOperationId, setDepinOperationId] = useState<string | null>(null);
  const [premiumReceiptStored, setPremiumReceiptStored] = useState<boolean | null>(null);
  const [depinReceiptStored, setDepinReceiptStored] = useState<boolean | null>(null);
  const [x402Available, setX402Available] = useState<boolean | null>(null);
  const [x402StatusReason, setX402StatusReason] = useState("Checking settlement facilitator...");

  useEffect(() => {
    let active = true;
    fetch("/api/x402/status", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (!active) return;
        setX402Available(data.available === true);
        setX402StatusReason(data.available ? "x402 v2 exact SVM available" : data.reason || "Settlement facilitator unavailable");
      })
      .catch(() => {
        if (!active) return;
        setX402Available(false);
        setX402StatusReason("Settlement health check failed");
      });
    return () => { active = false; };
  }, []);

  const decryptIntel = async (endpoint: "/api/intel/premium" | "/api/intel/depin", type: "premium" | "depin") => {
    const setLoading = type === "premium" ? setLoadingPremium : setLoadingDepin;
    const setIntel = type === "premium" ? setPremiumIntel : setDepinIntel;
    const setError = type === "premium" ? setPremiumError : setDepinError;

    if (x402Available !== true) {
      setError(x402StatusReason);
      return;
    }

    setLoading("Initiating request...");
    setError(null);
    setIntel(null);
    const operationId = crypto.randomUUID();

    try {
      const token = session?.access_token;
      let headers: Record<string, string> = { "X-Operation-Id": operationId };
      if (type === "premium") {
        setPremiumOperationId(operationId);
        setPremiumReceiptStored(null);
      } else {
        setDepinOperationId(operationId);
        setDepinReceiptStored(null);
      }
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      let res = await fetch(endpoint, { headers });

      if (res.status === 200) {
        const data = await res.json();
        setIntel(data);
        const deliveredOperationId = res.headers.get("x-operation-id") || operationId;
        const receiptStored = res.headers.get("x-receipt-status") === "stored";
        if (type === "premium") {
          setPremiumOperationId(deliveredOperationId);
          setPremiumReceiptStored(receiptStored);
        } else {
          setDepinOperationId(deliveredOperationId);
          setDepinReceiptStored(receiptStored);
        }
        setLoading(null);

        const responseHeader = res.headers.get("payment-response") || res.headers.get("PAYMENT-RESPONSE");
        if (responseHeader) {
          try {
            const decoded = JSON.parse(atob(responseHeader));
            if (decoded.transaction) {
              if (type === "premium") {
                setPremiumTxid(decoded.transaction);
              } else {
                setDepinTxid(decoded.transaction);
              }
            }
          } catch (e) {
            console.error("Failed to parse payment-response header:", e);
          }
        }
        return;
      }

      if (res.status === 402) {
        const paymentRequiredHeader = res.headers.get("payment-required") || res.headers.get("x-payment-required");
        if (!paymentRequiredHeader) {
          throw new Error("Payment required, but no payment instructions were found in response headers.");
        }

        setLoading("Decoding payment instructions...");
        const paymentInfo = JSON.parse(atob(paymentRequiredHeader));
        const accept = paymentInfo.accepts?.[0];
        if (!accept) {
          throw new Error("No SVM exact payment accept method found in x402 details.");
        }

        const { amount, asset, payTo, network } = accept;
        if (!publicKey) {
          throw new Error("Wallet not connected. Connect your wallet in the Access Portal.");
        }

        setLoading("Verifying Solana RPC context...");
        const isDevnet = network.includes("EtWTRABZaYq6iMfeYKouRu166VU2xqa1") || network.includes("devnet");
        
        console.log("x402: Target Network ID:", network);
        console.log("x402: Client Wallet:", publicKey.toString());

        const connection = await getWorkingConnection(isDevnet);
        const rpcUrl = connection.rpcEndpoint;
        console.log("x402: Active RPC Connection Established with:", rpcUrl);

        // Verify SOL balance (at least 0.0001 SOL for gas)
        const solBalance = await connection.getBalance(publicKey);
        console.log("x402: Checked SOL Balance (in lamports):", solBalance);
        if (solBalance < 100000) {
          throw new Error(`Insufficient SOL balance in connected wallet. Your wallet must hold some SOL to cover the network transaction fee. RPC checked: ${rpcUrl}. Balance: ${solBalance / 1e9} SOL.`);
        }

        const mintPubkey = new PublicKey(asset);
        const recipientPubkey = new PublicKey(payTo);

        // Derive Associated Token Accounts (ATA)
        const sourceATA = await getAssociatedTokenAddress(mintPubkey, publicKey);
        const destinationATA = await getAssociatedTokenAddress(mintPubkey, recipientPubkey);

        // Verify USDC ATA exists and has enough balance
        try {
          const tokenBalance = await connection.getTokenAccountBalance(sourceATA);
          const requiredAmount = Number(amount);
          const currentBalance = Number(tokenBalance.value.amount);
          
          if (currentBalance < requiredAmount) {
            throw new Error(`Insufficient USDC balance in connected wallet. Required: $${(requiredAmount / 1e6).toFixed(2)} USDC. Your balance: $${tokenBalance.value.uiAmount} USDC.`);
          }
        } catch (e: any) {
          if (e.message.includes("could not find account") || e.message.includes("Invalid param") || e.message.includes("does not exist")) {
            throw new Error("Your connected wallet does not have a USDC token account on Solana Mainnet, or its balance is 0. Please ensure you hold USDC before decrypting.");
          }
          throw e;
        }

        setLoading("Constructing x402 payment payload...");
        const feePayer = paymentInfo.accepts?.[0]?.extra?.feePayer;
        if (!feePayer) {
          throw new Error("x402: No feePayer found in payment requirements. The facilitator did not provide a co-signer address.");
        }

        setLoading("Fetching token mint info...");
        let decimals = 6;
        try {
          const mintInfo = await connection.getParsedAccountInfo(mintPubkey);
          if (mintInfo.value && typeof mintInfo.value.data === 'object' && 'parsed' in mintInfo.value.data) {
            decimals = mintInfo.value.data.parsed.info.decimals;
          }
        } catch (e) {
          console.warn("x402: Could not fetch mint info parsed, defaulting to 6 decimals", e);
        }

        const instructions: TransactionInstruction[] = [];

        // Add ComputeBudget instructions
        instructions.push(ComputeBudgetProgram.setComputeUnitLimit({ units: 20000 }));
        instructions.push(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 5 }));

        // Add SPL Token TransferChecked instruction
        instructions.push(
          createTransferCheckedInstruction(
            sourceATA,
            mintPubkey,
            destinationATA,
            publicKey,
            BigInt(amount),
            decimals
          )
        );

        setLoading("Fetching fresh network blockhash...");
        const { blockhash } = await connection.getLatestBlockhash("confirmed");

        // Build transaction message using TransactionMessage and compileToV0Message
        const messageV0 = new TransactionMessage({
          payerKey: new PublicKey(feePayer),
          recentBlockhash: blockhash,
          instructions,
        }).compileToV0Message();

        const transaction = new VersionedTransaction(messageV0);

        if (!signTransaction) {
          throw new Error("Your wallet does not support signing transactions or is not fully initialized. Please try again or use a different wallet.");
        }
        setLoading("Awaiting wallet signature authorization...");
        const signedTx = await signTransaction(transaction);

        // Now serialize the signed transaction into wire format bytes
        const wireBytes = signedTx.serialize();

        // Base64 encode the wire bytes as the x402 payload transaction field
        const base64WireTx = Buffer.from(wireBytes).toString("base64");

        console.log("x402: Partial tx base64 length:", base64WireTx.length);
        console.log("x402: feePayer from requirements:", feePayer);
        console.log("x402: amount:", amount, "asset:", asset, "payTo:", payTo);

        // Build the x402 payment payload exactly as ExactSvmScheme.createPaymentPayload does:
        // { x402Version: 2, accepted: accept, payload: { transaction: "<base64-wire-tx>" } }
        const x402PaymentPayload = {
          x402Version: 2,
          accepted: accept,
          payload: { transaction: base64WireTx },
        };

        // Encode as base64(JSON.stringify(payload)) for the PAYMENT-SIGNATURE header
        const paymentSignatureHeader = btoa(JSON.stringify(x402PaymentPayload));

        setLoading("Submitting payment to x402 facilitator...");

        let success = false;
        let retryError = "";

        // Poll backend — the facilitator will co-sign, simulate, and submit the tx
        // Backend returns 200 once facilitated tx is confirmed
        for (let attempt = 1; attempt <= 8; attempt++) {
          try {
            const retryHeaders = {
              ...headers,
              "PAYMENT-SIGNATURE": paymentSignatureHeader,
            };
            const retryRes = await fetch(endpoint, { headers: retryHeaders });

            if (retryRes.status === 200) {
              const data = await retryRes.json();
              setIntel(data);
              const deliveredOperationId = retryRes.headers.get("x-operation-id") || operationId;
              const receiptStored = retryRes.headers.get("x-receipt-status") === "stored";
              if (type === "premium") {
                setPremiumOperationId(deliveredOperationId);
                setPremiumReceiptStored(receiptStored);
              } else {
                setDepinOperationId(deliveredOperationId);
                setDepinReceiptStored(receiptStored);
              }
              setLoading(null);

              // Extract payment response header if present
              const responseHeader = retryRes.headers.get("payment-response") || retryRes.headers.get("PAYMENT-RESPONSE");
              if (responseHeader) {
                try {
                  const decoded = JSON.parse(atob(responseHeader));
                  if (decoded.transaction) {
                    if (type === "premium") {
                      setPremiumTxid(decoded.transaction);
                    } else {
                      setDepinTxid(decoded.transaction);
                    }
                  }
                } catch (e) {
                  console.error("Failed to parse payment-response header:", e);
                }
              }

              success = true;
              break;
            } else if (retryRes.status === 402) {
              const paymentRequiredHeader = retryRes.headers.get("payment-required") || retryRes.headers.get("x-payment-required");
              const paymentResponseHeader = retryRes.headers.get("payment-response") || retryRes.headers.get("PAYMENT-RESPONSE");
              
              let headerError = "";
              if (paymentRequiredHeader) {
                try {
                  const info = JSON.parse(atob(paymentRequiredHeader));
                  if (info.error) headerError = info.error;
                } catch {}
              }
              if (!headerError && paymentResponseHeader) {
                try {
                  const info = JSON.parse(atob(paymentResponseHeader));
                  if (info.errorMessage || info.errorReason) {
                    headerError = info.errorMessage || info.errorReason;
                  }
                } catch {}
              }

              const errorBody = await retryRes.text().catch(() => "");
              retryError = headerError || errorBody || "HTTP 402 Payment Required";
              console.log(`x402: Attempt ${attempt}/8 — 402 response:`, errorBody.slice(0, 200), "Header error:", headerError);
            } else {
              const errorText = await retryRes.text();
              retryError = errorText || `HTTP ${retryRes.status}`;
              console.error("x402: Unexpected status:", retryRes.status, retryError.slice(0, 200));
            }
          } catch (e: any) {
            retryError = e?.message || "Network error during verification.";
          }

          if (attempt < 8) {
            setLoading(`x402: Facilitator processing — attempt ${attempt}/8...`);
            await new Promise((resolve) => setTimeout(resolve, 3000));
          }
        }

        if (!success) {
          throw new Error(`x402 payment facilitation failed after 8 attempts. Last error: ${retryError}`);
        }
      } else {
        throw new Error(`Decryption portal returned status: HTTP ${res.status}`);
      }
    } catch (err: any) {
      console.error("Decryption failed:", err);
      setError(`${err?.message || "Secure connection decryption failure."} Operation ID: ${operationId}`);
      setLoading(null);
    }
  };

  const handleChangeWallet = async () => {
    try {
      await disconnect();
      setVisible(true);
    } catch (err) {
      console.error("Failed to change wallet:", err);
    }
  };

  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: CORE_INTRO_MESSAGE, bioScore: "PENDING" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentScore, setCurrentScore] = useState<string | null>(null);
  const [profileStats, setProfileStats] = useState<any>(null);
  const [agentClearance, setAgentClearance] = useState<RedQueenClientResponse["clearance"]>({
    tier: 0,
    level: 1,
    name: "CIVILIAN",
    balance: 0,
    verified: false,
    responseDepth: "essential",
    contextMessages: 6,
    comparisonSignals: 2,
    earnedXpMultiplier: 1,
  });
  const [survivalContext, setSurvivalContext] = useState<SurvivalContext>({
    area: "",
    focus: "LOCAL_THREATS",
    mode: "ANALYZE",
  });
  const [firstContact, setFirstContact] = useState(false);
  const [savedActionText, setSavedActionText] = useState("");
  const [reviewActionId, setReviewActionId] = useState("");
  const [savedPlanTitles, setSavedPlanTitles] = useState<string[]>([]);
  const [localPreparednessCount, setLocalPreparednessCount] = useState(0);
  const [apocalypticName, setApocalypticName] = useState<string>("");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [limitBlocked, setLimitBlocked] = useState(false);
  const [shareModalData, setShareModalData] = useState<{ content: string; bioScore?: string; question?: string } | null>(null);
  const [shareImageSrc, setShareImageSrc] = useState<string>("");
  const [copySuccess, setCopySuccess] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const localProgression = getLocalStatsAndScore(messages);
  const hasVerifiedIdentity = Boolean(session?.access_token);
  const scoreNum = hasVerifiedIdentity ? (currentScore ? parseInt(currentScore) : localProgression.score) : localProgression.score;
  const stats = hasVerifiedIdentity ? (profileStats || localProgression.stats) : localProgression.stats;
  const clearance = getClearanceLevel(scoreNum);
  const scoreColor = scoreNum === 0 ? "var(--text-dim)" : clearance.color;
  const requestedSignalCount = new Set([
    ...(survivalContext.signalId ? [survivalContext.signalId] : []),
    ...(survivalContext.signalIds || []),
  ]).size;

  const userMessageCount = messages.filter((m) => m.role === "user").length;
  const isLocked = !hasVerifiedIdentity && (userMessageCount >= 4 || limitBlocked);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let stored: Partial<SurvivalContext> = {};
    try {
      stored = JSON.parse(localStorage.getItem("rq-survival-context-v1") || "{}");
    } catch {
      stored = {};
    }

    const queryArea = sanitizeArea(params.get("area") || "");
    const storedArea = sanitizeArea(typeof stored.area === "string" ? stored.area : "");
    const rawFocus = params.get("focus") || stored.focus;
    const rawMode = params.get("mode") || stored.mode;
    const focus = isSurvivalFocus(rawFocus) ? rawFocus : "LOCAL_THREATS";
    const mode = isAgentMode(rawMode) ? rawMode : getFocusOption(focus).mode;
    const storedLocation = stored.location
      && Number.isFinite(stored.location.lat)
      && Number.isFinite(stored.location.lng)
      && typeof stored.location.label === "string"
      ? stored.location
      : undefined;
    const nextContext: SurvivalContext = {
      area: queryArea || storedArea,
      focus,
      mode,
      signalId: sanitizeSignalId(params.get("signal")),
      signalIds: sanitizeSignalIds(params.get("signals")),
      location: queryArea && queryArea !== storedArea ? undefined : storedLocation,
    };

    setSurvivalContext(nextContext);
    setFirstContact(params.get("first") === "1");
    const queryPrompt = params.get("prompt");
    if (queryPrompt) setInput(queryPrompt.slice(0, 1_000));
    else if (params.get("first") === "1") setInput(buildFirstContactPrompt(nextContext));

    const requestedActionId = (params.get("action") || "").slice(0, 100);
    const reviewAction = readDailyActions(localStorage).find((action) => action.id === requestedActionId && action.status === "COMPLETED" && !action.reviewedAt);
    setReviewActionId(reviewAction?.id || "");
  }, []);

  useEffect(() => {
    if (hasVerifiedIdentity) {
      setLimitBlocked(false);
    }
  }, [hasVerifiedIdentity]);

  useEffect(() => {
    if (!shareModalData || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const monoFont = "'JetBrains Mono', Consolas, Monaco, 'Courier New', monospace";

    // Draw parameters
    const w = 800;
    const h = 650;
    canvas.width = w;
    canvas.height = h;

    // 1. Background
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, w, h);

    // 2. Neon Red Border
    ctx.strokeStyle = "#ff0033";
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, w - 8, h - 8);

    // Sub-border
    ctx.strokeStyle = "rgba(255, 0, 51, 0.15)";
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, w - 20, h - 20);

    // 3. Scanline grid background
    ctx.fillStyle = "rgba(255, 0, 51, 0.015)";
    for (let y = 12; y < h - 12; y += 4) {
      ctx.fillRect(12, y, w - 24, 2);
    }

    // 4. Header Bar
    ctx.fillStyle = "rgba(255, 77, 77, 0.08)";
    ctx.fillRect(12, 12, w - 24, 40);
    ctx.strokeStyle = "rgba(255, 77, 77, 0.2)";
    ctx.beginPath();
    ctx.moveTo(12, 52);
    ctx.lineTo(w - 12, 52);
    ctx.stroke();

    // Derived clearance level
    const scoreVal = scoreNum || 0;
    const clearanceInfo = getClearanceLevel(scoreVal);

    // Header Text
    ctx.fillStyle = "#ff0033";
    ctx.font = `bold 13px ${monoFont}`;
    ctx.textBaseline = "middle";
    ctx.fillText("◉ RED QUEEN CYBERNETIC PROTOCOL NODE 7.4.1", 24, 32);

    // Clearance Label in Header Right
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = `bold 11px ${monoFont}`;
    ctx.textAlign = "right";
    ctx.fillText(`CLEARANCE: ${clearanceInfo.label.toUpperCase()}`, w - 24, 32);
    ctx.textAlign = "left"; // reset alignment

    // 5. Readiness identity panel
    const opPanelY = 64;
    const opPanelH = 72;
    ctx.fillStyle = "rgba(255, 0, 51, 0.03)";
    ctx.fillRect(16, opPanelY, w - 32, opPanelH);
    ctx.strokeStyle = "rgba(255, 0, 51, 0.15)";
    ctx.strokeRect(16, opPanelY, w - 32, opPanelH);

    // Readiness identity text inside panel
    ctx.textBaseline = "top";
    ctx.fillStyle = "#ff4d4d";
    ctx.font = `bold 10px ${monoFont}`;
    ctx.fillText("READINESS IDENTITY", 28, opPanelY + 14);
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold 15px ${monoFont}`;
    ctx.fillText(apocalypticName || "SUBJECT", 28, opPanelY + 32);

    ctx.fillStyle = "#ff4d4d";
    ctx.font = `bold 10px ${monoFont}`;
    ctx.fillText("BIO-SCORE", 260, opPanelY + 14);
    const scoreColorHex = scoreVal === 0 ? "#888888" : scoreVal < 20 ? "#ff4d4d" : scoreVal < 60 ? "#f0c929" : "#2ecc40";
    ctx.fillStyle = scoreColorHex;
    ctx.font = `bold 18px ${monoFont}`;
    ctx.fillText(`${scoreVal}%`, 260, opPanelY + 32);

    ctx.fillStyle = "#ff4d4d";
    ctx.font = `bold 10px ${monoFont}`;
    ctx.fillText("EXPERIENCE / RANK", 380, opPanelY + 14);
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold 14px ${monoFont}`;
    ctx.fillText(`LEVEL ${stats?.level || 1} (${stats?.xp || 0} XP)`, 380, opPanelY + 32);

    ctx.fillStyle = "#ff4d4d";
    ctx.font = `bold 10px ${monoFont}`;
    ctx.fillText("UPLINK STATUS", 580, opPanelY + 14);
    ctx.fillStyle = hasVerifiedIdentity ? "#2ecc40" : "#f0c929";
    ctx.font = `bold 13px ${monoFont}`;
    ctx.fillText(
      agentClearance.verified ? `$THREAT ${agentClearance.name}` : (hasVerifiedIdentity ? "IDENTITY VERIFIED" : "UNVERIFIED PUBLIC"),
      580,
      opPanelY + 32,
    );

    // 6. Question Section (if exists)
    let textStartY = 155;
    if (shareModalData.question) {
      // Draw background panel for question
      const qText = shareModalData.question;
      ctx.fillStyle = "rgba(0, 229, 255, 0.02)";
      ctx.strokeStyle = "rgba(0, 229, 255, 0.1)";
      
      // Calculate lines to find dynamic height
      ctx.font = `bold 15px ${monoFont}`;
      const maxWidth = w - 64;
      const qLines = getWrappedLines(qText, maxWidth);
      const qHeight = qLines.length * 24 + 40;
      
      ctx.fillRect(16, textStartY, w - 32, qHeight);
      ctx.strokeRect(16, textStartY, w - 32, qHeight);
      
      ctx.fillStyle = "#00e5ff";
      ctx.font = `bold 12px ${monoFont}`;
      ctx.fillText("▼ INCOMING SUBJECT INQUIRY", 28, textStartY + 8);
      
      ctx.fillStyle = "#e0f7fa";
      ctx.font = `bold 15px ${monoFont}`;
      qLines.forEach((line, index) => {
        ctx.fillText(line, 28, textStartY + 28 + index * 24);
      });
      
      textStartY += qHeight + 15;
    }

    // 7. Response Section
    const rText = shareModalData.content;
    ctx.fillStyle = "rgba(255, 0, 51, 0.015)";
    ctx.strokeStyle = "rgba(255, 0, 51, 0.15)";
    
    ctx.font = `bold 16px ${monoFont}`;
    const maxWidth = w - 64;
    const rLines = getWrappedLines(rText.replace(/\[BIO-SCORE:\s*\d+%?\]/i, "").replace(/\[SYSTEM NOTICE:.*?\]/g, "").trim(), maxWidth);
    
    // Calculate remaining height to draw the response box
    const rHeight = h - 35 - 30 - textStartY;
    ctx.fillRect(16, textStartY, w - 32, rHeight);
    ctx.strokeRect(16, textStartY, w - 32, rHeight);
    
    ctx.fillStyle = "#ff3366";
    ctx.font = `bold 12px ${monoFont}`;
    ctx.fillText("▲ DETECTED CENTRAL RESPONSE", 28, textStartY + 10);
    
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold 16px ${monoFont}`;
    
    // Fit lines to the remaining box space
    const maxAvailableLines = Math.floor((rHeight - 45) / 26);
    for (let i = 0; i < Math.min(rLines.length, maxAvailableLines); i++) {
      ctx.fillText(rLines[i], 28, textStartY + 32 + i * 26);
    }

    // 8. Footer
    ctx.fillStyle = "rgba(255, 77, 77, 0.4)";
    ctx.font = `9px ${monoFont}`;
    ctx.fillText("RETRANSMISSION SECURITY PROTOCOL ACTIVATED // UPLINK SECURED", 24, h - 30);
    ctx.fillStyle = "#ff0033";
    ctx.textAlign = "right";
    ctx.font = `9px ${monoFont}`;
    ctx.fillText("@redqueen_agent // redqueen.space", w - 24, h - 30);
    ctx.textAlign = "left"; // reset alignment

    // Save as image URL
    setShareImageSrc(canvas.toDataURL("image/png"));

    // Helper inside the effect
    function getWrappedLines(textString: string, maxW: number): string[] {
      if (!ctx) return [];
      const paragraphs = textString.split("\n");
      const lines: string[] = [];
      paragraphs.forEach((para) => {
        if (!para.trim()) {
          lines.push("");
          return;
        }
        const words = para.split(" ");
        let line = "";
        for (let n = 0; n < words.length; n++) {
          let testLine = line + words[n] + " ";
          let metrics = ctx.measureText(testLine);
          if (metrics.width > maxW && n > 0) {
            lines.push(line.trim());
            line = words[n] + " ";
          } else {
            line = testLine;
          }
        }
        lines.push(line.trim());
      });
      return lines;
    }
  }, [shareModalData, apocalypticName, currentScore, hasVerifiedIdentity, agentClearance, stats, scoreNum]);

  useEffect(() => {
    const savedAction = readDailyActions(localStorage).find((action) => action.status === "ACTIVE") || null;
    setSavedActionText(savedAction?.action || "");
    setSavedPlanTitles(readPreparednessPlans(localStorage).map((plan) => plan.title));
    try {
      const checklist = JSON.parse(localStorage.getItem("rq-preparedness-checklist-v1") || "{}");
      setLocalPreparednessCount(Object.values(checklist).filter(Boolean).length);
    } catch {
      setLocalPreparednessCount(0);
    }
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    async function loadProfileAndHistory() {
      if (!walletAddress || !session?.access_token) {
        setMessages([{ role: "assistant", content: CORE_INTRO_MESSAGE, bioScore: "PENDING" }]);
        return;
      }
      setLoadingHistory(true);

      const generated = generateApocalypticName(walletAddress);
      setApocalypticName(generated);

      try {
        const token = session?.access_token;
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const [profileRes, historyRes] = await Promise.all([
          fetch(`/api/profile?wallet=${walletAddress}`, { headers }).then((r) => r.json()).catch(() => ({})),
          fetch(`/api/history?wallet=${walletAddress}`, { headers }).then((r) => r.json()).catch(() => ({}))
        ]);

        if (profileRes && profileRes.profile) {
          setApocalypticName(profileRes.profile.apocalyptic_name || generated);
          if (profileRes.profile.last_bio_score !== null) {
            setCurrentScore(profileRes.profile.last_bio_score.toString());
          }
          if (profileRes.profile.stats) {
            setProfileStats(profileRes.profile.stats);
          }
        }

        if (historyRes && historyRes.history && historyRes.history.length > 0) {
          const mapped = historyRes.history.map((m: any) => {
            const parsed = extractBioScore(m.content);
            return {
              role: m.role,
              content: m.content,
              bioScore: parsed.score || undefined
            };
          });
          setMessages(mapped);

          // Find the last bioScore in history (precedence over profile default)
          for (let i = mapped.length - 1; i >= 0; i--) {
            if (mapped[i].bioScore) {
              setCurrentScore(mapped[i].bioScore);
              break;
            }
          }
        } else {
          setMessages([
            { role: "assistant", content: CORE_INTRO_MESSAGE, bioScore: "PENDING" },
          ]);
        }
      } catch (err) {
        console.error("Failed to load user profile or history:", err);
      }
      setLoadingHistory(false);
    }
    loadProfileAndHistory();
  }, [walletAddress, session?.access_token]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");

    // Command Interceptor
    if (text.startsWith("/")) {
      setLoading(true);
      await new Promise(r => setTimeout(r, 600)); // satisfy typing animation
      
      const [cmd, ...commandArgs] = text.toLowerCase().trim().split(/\s+/);
      let reply = "";
      
      if (cmd === "/help") {
        reply = `[QUEEN COMMAND INDEX]

These commands read the current interface state. They do not call the AI or consume a guest analysis:
- /memory : Show active action, saved protocols, baseline, and Signal Watch configuration.
- /context : Show the broad area, focus, and current Queen mode.
- /mode monitor|analyze|prepare|simulate : Change how Queen approaches the next request.
- /pulse : Open the verified Daily Pulse and live signal field.
- /bio : Explain the current evidence-based readiness score.
- /help : Show this command index.

Ask a normal question when you want RED QUEEN to analyze, plan, or simulate.`;
      } else if (cmd === "/memory") {
        const memory = buildDeviceSurvivalMemory(localStorage);
        const planLines = memory.plans.length
          ? memory.plans.map((plan) => `- ${plan.title}: ${plan.completedSteps}/${plan.totalSteps} steps · ${plan.status}`).join("\n")
          : "- No Queen Protocols saved.";
        const watched = [memory.signalWatch.localPriority ? "LOCAL PRIORITY" : "", ...memory.signalWatch.types]
          .filter(Boolean)
          .join(", ") || "NOT CONFIGURED";
        reply = `[DEVICE SURVIVAL MEMORY]

ACTIVE ACTION
${memory.activeAction || "No active daily action saved."}

QUEEN PROTOCOLS
${planLines}

LOCAL BASELINE
${memory.preparednessChecks}/18 checks marked on this device.

SIGNAL WATCH
${watched}

This state remains device-local. It is loaded as bounded context only when you ask Queen a normal question; it is not verified BIO evidence.`;
      } else if (cmd === "/context") {
        reply = `[CURRENT QUEEN CONTEXT]

BROAD AREA: ${survivalContext.area || "GLOBAL / NOT SET"}
FOCUS: ${getFocusOption(survivalContext.focus).label.toUpperCase()}
MODE: ${survivalContext.mode}

RED QUEEN never needs an exact address. Change context using the controls beside the terminal or return to [Pulse](/).`;
      } else if (cmd === "/mode") {
        const requestedMode = commandArgs[0]?.toUpperCase() || "";
        if (isAgentMode(requestedMode)) {
          changeAgentMode(requestedMode);
          reply = `[QUEEN MODE CHANGED]

ACTIVE MODE: ${requestedMode}
${AGENT_MODES.find((mode) => mode.id === requestedMode)?.description || "The next request will use this reasoning mode."}

No AI request was consumed. Ask your next question when ready.`;
        } else {
          reply = `[MODE REQUIRED]

Use one of:
/mode monitor
/mode analyze
/mode prepare
/mode simulate`;
        }
      } else if (cmd === "/pulse") {
        reply = `[PULSE HANDOFF]

Open [Daily Pulse](/) for the current source health and personal priority, or jump to the [Live Signal Field](/#live-map).

Pulse is Queen's sight. A silent or unreachable sensor is never presented as proof of safety.`;
      } else if (cmd === "/bio") {
        reply = `[BIO-SCORE // EVIDENCE STATUS]

IDENTITY: ${hasVerifiedIdentity ? "VERIFIED SESSION" : "UNSAVED LOCAL SESSION"}
ACTIVE SCORE: ${scoreNum}%
LEVEL: ${stats?.level || 1} · XP: ${stats?.xp || 0}

BIO changes only after an eligible decision, demonstrated preparation, or evaluated drill. $THREAT holdings never create competence. ${hasVerifiedIdentity ? "Eligible evidence can persist to your account." : "Sign in before a drill if you want eligible evidence saved to your account."}`;
      } else {
        reply = `[UNKNOWN QUEEN COMMAND]

${cmd} is not active. Type /help for the current platform command index, or ask a normal question for Queen analysis.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: reply,
        },
      ]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
      const res = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          context: survivalContext,
          deviceMemory: buildDeviceSurvivalMemory(localStorage),
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        if (res.status === 403 && errJson.error?.includes("LIMIT_EXCEEDED")) {
          setLimitBlocked(true);
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `[ TELEMETRY LIMIT REACHED ] Guest analysis quota reached. Verify your identity to save memory, readiness, and continue.`,
            },
          ]);
          setLoading(false);
          return;
        }
        throw new Error(errJson.error || `Server error ${res.status}`);
      }
      const data = await res.json() as RedQueenClientResponse;
      if (!data.message) throw new Error("No message returned");

      const accumulated = data.message;

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: accumulated,
          intel: data,
          bioScore: data.readiness.applied ? String(data.readiness.bioScore) : undefined,
        },
      ]);

      setAgentClearance(data.clearance);
      if (firstContact) {
        setFirstContact(false);
        localStorage.setItem("rq-core-onboarding-v1", "done");
      }
      if (data.readiness.applied) {
        setCurrentScore(String(data.readiness.bioScore));
        setProfileStats((previous: any) => ({
          ...(previous || localProgression.stats),
          xp: data.readiness.totalXp,
          level: data.readiness.level,
        }));
      }

      if (reviewActionId && data.readiness.eligible) {
        updateDailyAction(localStorage, reviewActionId, {
          reviewedAt: new Date().toISOString(),
          reviewApplied: data.readiness.applied,
          reviewBioScore: data.readiness.bioScore,
        });
        window.dispatchEvent(new Event(DAILY_ACTION_EVENT));
        setReviewActionId("");
      }

      const newUserMsgCount = newMessages.filter((m) => m.role === "user").length;
      if (!hasVerifiedIdentity && newUserMsgCount === 2) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "[SYSTEM NOTICE] Verify an account or sign a wallet challenge to preserve memory and readiness. Simply connecting a wallet does not grant token clearance."
          }
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "[UPLINK ERROR] RED QUEEN could not complete this analysis. No readiness changes were applied. Try again in a moment.",
        },
      ]);
    }
    setLoading(false);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function changeAgentMode(mode: AgentMode) {
    setSurvivalContext((current) => {
      const next = { ...current, mode };
      localStorage.setItem("rq-survival-context-v1", JSON.stringify(next));
      return next;
    });
  }

  function startReadinessBaseline() {
    changeAgentMode("SIMULATE");
    setInput(READINESS_BASELINE_PROMPT);
    setFirstContact(false);
  }

  function saveAction(response: RedQueenClientResponse) {
    const action = createDailyAction(response, survivalContext);
    saveDailyAction(localStorage, action);
    setSavedActionText(action.action);
    window.dispatchEvent(new Event(DAILY_ACTION_EVENT));
  }

  function savePlan(response: RedQueenClientResponse) {
    const plan = createPreparednessPlan(response, survivalContext);
    if (!plan) return;
    savePreparednessPlan(localStorage, plan);
    setSavedPlanTitles((current) => Array.from(new Set([plan.title, ...current])));
    window.dispatchEvent(new Event(PREPAREDNESS_PLANS_EVENT));
  }


  return (
    <div className="rq-terminal-page">
      <header className="rq-terminal-core">
        <div className="rq-terminal-core-art" aria-hidden="true">
          <Image src="/art/red-queen-presence.png" alt="" fill sizes="360px" priority />
        </div>
        <div className="rq-terminal-core-copy">
          <span>QUEEN CORE // COGNITIVE COMMAND</span>
          <h1>I see the field.<br /><em>I turn it into action.</em></h1>
          <p>Pulse is my sight. The Map is my nervous system. The Library is my memory. Prepare is where intelligence becomes something your hands can finish.</p>
          <strong>“I decide what deserves attention. You decide whether to act.”</strong>
        </div>
        <nav className="rq-terminal-neural-grid" aria-label="RED QUEEN system architecture">
          <Link href="/"><span>EYES</span><strong>PULSE</strong><small>Daily signal</small></Link>
          <Link href="/#live-map"><span>NERVES</span><strong>MAP</strong><small>Live field</small></Link>
          <div className="active"><span>BRAIN</span><strong>QUEEN</strong><small>Decision core</small></div>
          <Link href="/threat-vector"><span>MEMORY</span><strong>LIBRARY</strong><small>Threat knowledge</small></Link>
          <Link href="/survival-kit"><span>HANDS</span><strong>PREPARE</strong><small>Action plan</small></Link>
          <Link href="/community"><span>VOICE</span><strong>COMMUNITY</strong><small>SOLvivor network</small></Link>
        </nav>
        <div className="rq-terminal-memory-state">
          <div><span>SOLVIVOR CONTEXT</span><strong>{survivalContext.area || "GLOBAL / NOT SET"}</strong></div>
          <div><span>ACTIVE ACTION</span><strong>{savedActionText ? "SAVED IN PREPARE" : "NOT YET CREATED"}</strong></div>
          <div><span>QUEEN PROTOCOLS</span><strong>{savedPlanTitles.length ? `${savedPlanTitles.length} IN SURVIVAL MEMORY` : "NONE SAVED"}</strong></div>
          <div><span>LOCAL BASELINE</span><strong>{localPreparednessCount}/18 CHECKS</strong></div>
        </div>
      </header>

      <div className="rq-terminal-identity-bar">
        <SolvivalIcon size={32} />
        <div className="rq-terminal-title">
          <span>SECURE SURVIVAL INTELLIGENCE CHANNEL</span>
          <strong>RED QUEEN TERMINAL</strong>
        </div>
        <div className="rq-identity-strip">
          <div className="rq-identity-metric">
            <span>{hasVerifiedIdentity ? "SAVED READINESS" : "UNSAVED READINESS"}</span>
            <strong style={{ color: scoreColor }}>{scoreNum}%</strong>
            <small>LVL {stats?.level || 1} · {stats?.xp || 0} XP · {clearance.label}</small>
          </div>
          <div className="rq-identity-metric rq-identity-metric--token">
            <span>$THREAT INTELLIGENCE CLEARANCE</span>
            <strong>LVL {agentClearance.level} · {agentClearance.name}</strong>
            <small>{agentClearance.verified ? `${agentClearance.balance.toLocaleString()} $THREAT VERIFIED` : "WALLET OWNERSHIP NOT VERIFIED"} · COMPARE {agentClearance.comparisonSignals}</small>
          </div>
        </div>
      </div>

      {/* Info bar */}
      <div className="alert alert-red" style={{ margin: "0", borderRadius: "0", border: "none", borderBottom: "1px solid rgba(255,77,77,0.15)" }}>
        <strong>[TWO SYSTEMS]</strong> BIO-SCORE measures demonstrated readiness. <strong>$THREAT</strong> holdings unlock deeper context and analysis. Connecting a wallet alone unlocks neither.
      </div>

      {/* Main split workspace */}
      <div style={{ display: "flex", flex: 1, minHeight: 0, position: "relative" }}>
        
        {/* Left Side: Chat Panel */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
          <div className="rq-session-bar">
            <div className="rq-mode-selector" role="tablist" aria-label="RED QUEEN mode">
              {AGENT_MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  role="tab"
                  aria-selected={survivalContext.mode === mode.id}
                  className={survivalContext.mode === mode.id ? "active" : ""}
                  onClick={() => changeAgentMode(mode.id)}
                  title={mode.description}
                >
                  <strong>{mode.label}</strong>
                  <span>{mode.description}</span>
                </button>
              ))}
            </div>
            <div className="rq-context-line">
              <span>SESSION CONTEXT</span>
              <strong>{survivalContext.area || "GLOBAL / AREA NOT SET"}</strong>
              <span>{getFocusOption(survivalContext.focus).label}</span>
              {requestedSignalCount > 0 && <span>{requestedSignalCount} SIGNAL ID{requestedSignalCount === 1 ? "" : "S"} · SERVER RE-VERIFIES</span>}
              {survivalContext.area && (
                <button
                  type="button"
                  onClick={() => setSurvivalContext((current) => {
                    const next = { ...current, area: "", location: undefined };
                    localStorage.setItem("rq-survival-context-v1", JSON.stringify(next));
                    return next;
                  })}
                >
                  CLEAR AREA
                </button>
              )}
            </div>
          </div>

          {firstContact && (
            <div className="rq-first-contact-brief">
              <div className="queen-core queen-core-small"><span /></div>
              <div>
                <span>FIRST CONTACT READY</span>
                <strong>{survivalContext.area ? `${survivalContext.area} · ` : "GLOBAL · "}{getFocusOption(survivalContext.focus).label}</strong>
                <p>Run the brief → save RED QUEEN&apos;s next action → complete it in My Plan. This first question creates an action; it does not change BIO-SCORE.</p>
              </div>
              <button type="button" onClick={() => setFirstContact(false)}>DISMISS</button>
            </div>
          )}

          {/* Messages */}
          <div ref={chatContainerRef} style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            minHeight: 0,
            maxHeight: "calc(100vh - 320px)",
          }}>
            {loadingHistory ? (
              <div className="message message-ai">
                <div className="message-label">[ SYSTEM — SEARCHING RECORDS ]</div>
                <div className="message-bubble" style={{ color: "var(--text-dim)" }}>
                  RESTORING CLASSIFIED UPLINK DATA STREAM<span className="loading-dots"><span>.</span><span>.</span><span>.</span></span>
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`message message-${msg.role === "user" ? "user" : "ai"}`}>
                  <div className="message-label">
                    {msg.role === "user"
                      ? `[ SOLVIVOR — ${apocalypticName || "UNREGISTERED"} ]`
                      : `[ RED QUEEN — ${msg.intel?.clearance.name || agentClearance.name} ANALYSIS ]`}
                  </div>
                  {msg.intel ? (
                    <AgentResponseCard
                      response={msg.intel}
                      onFollowUp={setInput}
                      onStartReadiness={i === messages.length - 1 && scoreNum === 0 ? startReadinessBaseline : undefined}
                      onSaveAction={() => saveAction(msg.intel!)}
                      onSavePlan={msg.intel.plan ? () => savePlan(msg.intel!) : undefined}
                      actionSaved={savedActionText === msg.intel.action}
                      planSaved={Boolean(msg.intel.plan && savedPlanTitles.includes(msg.intel.plan.title))}
                    />
                  ) : (
                    <div className="message-bubble">
                      {renderContent(msg.content)}
                    </div>
                  )}
                  {msg.role === "assistant" && (
                    <div style={{ display: "flex", gap: "16px", alignItems: "center", marginTop: "8px", flexWrap: "wrap" }}>
                      {!msg.intel && msg.bioScore && msg.bioScore !== "PENDING" && (
                        <div className="bio-score" style={{ color: scoreColor, marginTop: 0 }}>
                          ▶ BIO-SCORE UPDATED: {msg.bioScore}%
                        </div>
                      )}
                      <button
                        onClick={() => {
                          const prevMsg = i > 0 ? messages[i - 1] : null;
                          const questionVal = prevMsg && prevMsg.role === "user" ? prevMsg.content : undefined;
                          setShareModalData({
                            content: msg.content,
                            bioScore: msg.bioScore,
                            question: questionVal
                          });
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--accent)",
                          fontFamily: "var(--mono)",
                          fontSize: "10px",
                          cursor: "pointer",
                          padding: "0",
                          letterSpacing: "0.1em",
                          textDecoration: "underline",
                          display: "inline-block"
                        }}
                      >
                        [ SHARE DOSSIER ]
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}

            {loading && (
              <div className="message message-ai">
                <div className="message-label">[ RED QUEEN — PROCESSING ]</div>
                <div className="message-bubble" style={{ color: "var(--text-dim)" }}>
                  ANALYZING<span className="loading-dots"><span>.</span><span>.</span><span>.</span></span>
                </div>
              </div>
            )}

          </div>

          {/* Input */}
          {isLocked ? (
            <div style={{
              padding: "24px",
              background: "rgba(255, 77, 77, 0.03)",
              borderTop: "1px solid var(--border-red)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "16px",
              textAlign: "center"
            }}>
              <div className="tag tag-red" style={{ animation: "pulse-dot 2s infinite" }}>
                [ UPLINK LOCKED // TELEMETRY LIMIT REACHED ]
              </div>
              <p style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)", maxWidth: "550px", lineHeight: "1.7", margin: 0 }}>
                Guest analysis is complete. Verify an account to preserve RED QUEEN memory and readiness. Wallet verification requires a signature; connecting alone only exposes a public address.
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
                <WalletMultiButton style={{
                  background: "var(--accent)",
                  border: "none",
                  color: "#000",
                  fontFamily: "var(--mono)",
                  fontSize: "13px",
                  padding: "12px 32px",
                  height: "auto",
                  lineHeight: "1.5",
                  fontWeight: "bold",
                  cursor: "pointer",
                  borderRadius: "2px",
                  boxShadow: "0 0 15px rgba(255,0,51,0.4)"
                }} />
                {connected && (
                  <button className="btn btn-primary" type="button" onClick={() => loginWithWallet()}>
                    SIGN TO VERIFY WALLET
                  </button>
                )}
                <a href="/login" className="btn btn-ghost">USE EMAIL ACCOUNT</a>
              </div>
            </div>
          ) : (
            <div className="chat-input-row">
              <textarea
                className="chat-input"
                rows={2}
                placeholder="> Ask about a live signal, risk, decision, or preparedness plan..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                disabled={loading}
              />
              <button
                className="btn btn-primary"
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                style={{ height: "100%", minWidth: "120px" }}
              >
                {loading ? "PROCESSING..." : "TRANSMIT ▶"}
              </button>
            </div>
          )}

          {/* Hint row */}
          <div style={{
            padding: "10px 24px",
            display: "flex",
            gap: "24px",
            flexWrap: "wrap",
            background: "#050505",
            borderTop: "1px solid var(--border)"
          }}>
            {MODE_STARTERS[survivalContext.mode].map((hint) => (
              <button
                key={hint}
                onClick={() => setInput(hint)}
                style={{
                  background: "none",
                  border: "none",
                  fontFamily: "var(--mono)",
                  fontSize: "10px",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  padding: "4px 0"
                }}
              >
                ↗ {hint}
              </button>
            ))}
          </div>

          {/* Optional x402 compute — intentionally outside the first-use core loop. */}
          <details className="rq-advanced-compute">
            <summary>
              <span>ADVANCED COMPUTE // x402 USDC</span>
              <strong>Optional paid intelligence operations</strong>
              <small>Exact price is shown before wallet approval. Core RED QUEEN guidance remains available above.</small>
            </summary>
          <div style={{
            padding: "24px",
            borderTop: "1px solid var(--border)",
            background: "rgba(255, 77, 77, 0.02)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--accent)", letterSpacing: "0.25em", fontWeight: "bold" }}>
                [ SECURE MICROPAYMENT PROTOCOL (X402) ]
              </div>
              <div style={{ flex: 1, height: "1px", background: "rgba(255, 77, 77, 0.2)" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }} className="responsive-grid-2">
              {/* Premium Briefing Panel */}
              <div style={{ background: "#080808", border: "1px solid #201010", padding: "20px", borderRadius: "2px", display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "12px", fontWeight: "bold", color: "#ffffff", letterSpacing: "0.05em" }}>
                    DOSSIER A: GLOBAL SOURCE SYNTHESIS
                  </span>
                  <span className="tag" style={{ color: "var(--accent)", borderColor: "rgba(255,77,77,0.4)", padding: "3px 8px", fontSize: "10px" }}>
                    $0.01 USDC
                  </span>
                </div>

                {premiumIntel ? (
                  <div style={{ background: "rgba(255, 0, 51, 0.02)", border: "1px solid rgba(255, 0, 51, 0.25)", padding: "16px", borderRadius: "2px", fontFamily: "var(--mono)", fontSize: "12px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed rgba(255, 77, 77, 0.15)", paddingBottom: "6px" }}>
                      <span style={{ color: "#00ffcc", fontWeight: "bold", fontSize: "12.5px" }}>[ PAID OUTPUT DELIVERED ]</span>
                      <span style={{ color: premiumIntel.intel?.sourceCoverage?.partial ? "#f0c929" : "#2ecc40", fontSize: "10px", fontWeight: "bold", background: "rgba(46, 204, 64, 0.1)", padding: "2px 6px", borderRadius: "2px" }}>
                        {premiumIntel.intel?.sourceCoverage?.label || "SOURCE STATUS UNKNOWN"}
                      </span>
                    </div>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", background: "rgba(255,77,77,0.06)", border: "1px solid rgba(255,77,77,0.2)", padding: "10px", borderRadius: "2px", fontSize: "11.5px", alignItems: "center" }}>
                      <span style={{ color: "#ffffff", fontWeight: "bold" }}>PRIORITY SIGNAL:</span>
                      <span style={{ color: "var(--accent)", fontWeight: "bold", fontSize: "11px", textAlign: "right", maxWidth: "60%" }}>{premiumIntel.intel?.prioritySignal}</span>
                    </div>

                    <div style={{ color: "#ffffff", fontWeight: "bold", fontSize: "13px" }}>{premiumIntel.intel?.headline}</div>
                    <div style={{ color: "rgba(255, 255, 255, 0.95)", fontSize: "11.5px", lineHeight: "1.4" }}>{premiumIntel.intel?.summary}</div>

                    {premiumIntel.intel?.sourceStatus && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }} className="responsive-grid-2">
                        {premiumIntel.intel.sourceStatus.map((source: any) => (
                          <a key={source.id} href={source.url} target="_blank" rel="noopener noreferrer" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", padding: "9px", color: "inherit", textDecoration: "none", display: "flex", flexDirection: "column", gap: "3px" }}>
                            <strong style={{ color: source.status === "LIVE" ? "#2ecc40" : "#f0c929", fontSize: "10px" }}>{source.status} · {source.window}</strong>
                            <span style={{ color: "#fff", fontSize: "11px" }}>{source.name}</span>
                            <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "10px" }}>{source.eventCount} events returned</span>
                          </a>
                        ))}
                      </div>
                    )}
                    
                    {premiumIntel.intel?.signals && premiumIntel.intel.signals.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px dashed rgba(255,255,255,0.15)", paddingTop: "10px" }}>
                        <div style={{ color: "#ffffff", fontWeight: "bold", fontSize: "11.5px", display: "flex", alignItems: "center", gap: "6px" }}>
                          <span>VERIFIED SIGNAL RANKING · SEVERITY / CONFIDENCE / FRESHNESS</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "260px", overflowY: "auto", paddingRight: "4px" }}>
                          {premiumIntel.intel.signals.map((signal: any) => (
                            <a key={signal.id} href={signal.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", padding: "10px", color: "inherit", textDecoration: "none", display: "flex", flexDirection: "column", gap: "5px", fontSize: "11px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", color: "#ffffff" }}>
                                <span style={{ fontWeight: "bold" }}>{signal.name}</span>
                                <span style={{ color: signal.severity >= 80 ? "var(--accent)" : signal.severity >= 60 ? "#f0c929" : "#2ecc40", fontWeight: "bold" }}>{signal.severity}/100</span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", color: "rgba(255,255,255,0.5)", fontSize: "10px" }}>
                                <span>{signal.source} · {signal.kind.replaceAll("_", " ")} · {signal.region}</span>
                                <span>{signal.confidence}% CONF · {signal.freshness}</span>
                              </div>
                              <p style={{ margin: 0, color: "rgba(255,255,255,0.68)", lineHeight: 1.45 }}>{signal.fact}</p>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {premiumIntel.intel?.trustBoundary && (
                      <div style={{ color: "rgba(255,255,255,0.48)", fontSize: "10px", lineHeight: 1.5 }}>{premiumIntel.intel.trustBoundary}</div>
                    )}
                    
                    <div style={{ fontSize: "11.5px", color: "#ffffff", borderTop: "1px dashed rgba(255,255,255,0.15)", paddingTop: "10px", lineHeight: "1.4" }}>
                      <strong>Next action:</strong> <span style={{ color: "rgba(255,255,255,0.9)" }}>{premiumIntel.intel?.nextAction}</span>
                    </div>

                    <div style={{ background: "rgba(0, 255, 204, 0.01)", border: "1px solid rgba(0, 255, 204, 0.1)", padding: "10px", borderRadius: "2px", fontSize: "11px", display: "flex", flexDirection: "column", gap: "3px", marginTop: "4px" }}>
                      <div style={{ color: "#00ffcc", fontWeight: "bold", borderBottom: "1px dashed rgba(0, 255, 204, 0.15)", paddingBottom: "4px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, filter: "drop-shadow(0 0 3px currentColor)" }}>
                          <rect x="2" y="5" width="20" height="14" rx="2" />
                          <line x1="2" y1="10" x2="22" y2="10" />
                          <line x1="6" y1="15" x2="10" y2="15" />
                        </svg>
                        <span>x402 PROTOCOL PAYMENT RECEIPT</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(255,255,255,0.6)" }}>Standard Version:</span><span>x402 V2 (Exact SVM Scheme)</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}><span style={{ color: "rgba(255,255,255,0.6)" }}>Operation ID:</span><span style={{ fontSize: "10px", wordBreak: "break-all" }}>{premiumOperationId || "UNAVAILABLE"}</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(255,255,255,0.6)" }}>Settlement Price:</span><span style={{ fontWeight: "bold", color: "#f0c929" }}>0.01 USDC</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(255,255,255,0.6)" }}>Receipt State:</span><span style={{ color: premiumReceiptStored ? "#2ecc40" : "#ff8080", fontWeight: "bold" }}>{premiumReceiptStored ? "✓ STORED // REPLAY SAFE" : "UNCONFIRMED // DO NOT REPAY"}</span></div>
                    </div>

                    {/* Actions Row */}
                    <div style={{ display: "flex", gap: "12px", borderTop: "1px dashed rgba(255,255,255,0.15)", paddingTop: "10px", marginTop: "4px", alignItems: "center", flexWrap: "wrap" }}>
                      <button
                        onClick={() => {
                          const proofText = premiumTxid ? `\nProof: https://solscan.io/tx/${premiumTxid}` : "";
                          setShareModalData({
                            content: `◉ RED QUEEN GLOBAL SOURCE SYNTHESIS\n\nCoverage: ${premiumIntel.intel?.sourceCoverage?.label}\nHeadline: ${premiumIntel.intel?.headline}\nPriority: ${premiumIntel.intel?.prioritySignal}\nNext action: ${premiumIntel.intel?.nextAction}${proofText}`
                          });
                        }}
                        style={{ background: "none", border: "none", color: "var(--accent)", fontFamily: "var(--mono)", fontSize: "11px", cursor: "pointer", padding: 0, textDecoration: "underline", fontWeight: "bold" }}
                      >
                        [ 📤 SHARE DOSSIER ]
                      </button>
                      
                      {premiumTxid && (
                        <a
                          href={`https://solscan.io/tx/${premiumTxid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#2ecc40", fontFamily: "var(--mono)", fontSize: "11px", textDecoration: "underline", fontWeight: "bold" }}
                        >
                          [ 🔗 SOLSCAN PROOF ]
                        </a>
                      )}

                      {premiumOperationId && premiumReceiptStored === true && (
                        <span title={premiumOperationId} style={{ color: "rgba(255,255,255,0.55)", fontFamily: "var(--mono)", fontSize: "10px" }}>
                          RECEIPT {premiumOperationId.slice(0, 8)}…
                        </span>
                      )}
                      {premiumReceiptStored === false && (
                        <span style={{ color: "#ff8080", fontFamily: "var(--mono)", fontSize: "10px" }}>RECEIPT UNCONFIRMED — DO NOT REPAY</span>
                      )}

                      {premiumIntel.intel?.explorerUrl && (
                        <a
                          href={premiumIntel.intel.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#00e5ff", fontFamily: "var(--mono)", fontSize: "11px", textDecoration: "underline", fontWeight: "bold" }}
                        >
                          [ 🔍 EXPLORE x402 ]
                        </a>
                      )}

                      <button
                        onClick={() => decryptIntel("/api/intel/premium", "premium")}
                        disabled={premiumReceiptStored === false}
                        title={premiumReceiptStored === false ? "Receipt storage is unconfirmed. Keep this delivered output and do not submit another payment." : "Purchase a new source synthesis"}
                        style={{ background: "none", border: "none", color: "rgba(255, 255, 255, 0.7)", fontFamily: "var(--mono)", fontSize: "11px", cursor: premiumReceiptStored === false ? "not-allowed" : "pointer", opacity: premiumReceiptStored === false ? 0.35 : 1, padding: 0, textDecoration: "underline", marginLeft: "auto", fontWeight: "bold" }}
                      >
                        [ BUY FRESH SYNTHESIS · 0.01 USDC ]
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ fontSize: "11.5px", color: "var(--accent)", fontWeight: "bold", fontFamily: "var(--mono)", background: "rgba(255, 77, 77, 0.05)", padding: "10px", border: "1px solid rgba(255, 77, 77, 0.2)", borderRadius: "2px", textAlign: "center" }}>
                      STATUS: {loadingPremium ? `[ ACTIVE: ${loadingPremium} ]` : x402Available === true ? "[ LOCKED // x402 PROTOCOL: 0.01 USDC REQUIRED ]" : x402Available === null ? "[ CHECKING SETTLEMENT RAIL ]" : "[ SETTLEMENT RAIL OFFLINE ]"}
                    </div>
                    {premiumError && (
                      <div style={{ fontSize: "11px", color: "#ff8080", fontFamily: "var(--mono)" }}>
                        ⚠️ ERROR: {premiumError}
                      </div>
                    )}
                    {x402Available === false && !premiumError && (
                      <div style={{ fontSize: "11px", color: "#ff8080", fontFamily: "var(--mono)" }}>SETTLEMENT BLOCKED: {x402StatusReason}</div>
                    )}
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        if (!connected) {
                          setVisible(true);
                        } else {
                          decryptIntel("/api/intel/premium", "premium");
                        }
                      }}
                      disabled={!!loadingPremium || x402Available !== true}
                      style={{ padding: "10px", fontSize: "11.5px", fontWeight: "bold" }}
                    >
                      {loadingPremium ? "PROCESSING PAYWALL..." : x402Available !== true ? "PAYMENT UNAVAILABLE" : connected ? "DECRYPT DOSSIER A" : "CONNECT WALLET & DECRYPT"}
                    </button>
                  </div>
                )}
              </div>

              {/* Solana network health panel */}
              <div style={{ background: "#080808", border: "1px solid #201b10", padding: "20px", borderRadius: "2px", display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "12px", fontWeight: "bold", color: "#ffffff", letterSpacing: "0.05em" }}>
                    DOSSIER B: SOLANA NETWORK HEALTH
                  </span>
                  <span className="tag" style={{ color: "#f0c929", borderColor: "rgba(240,201,41,0.4)", padding: "3px 8px", fontSize: "10px" }}>
                    $0.02 USDC
                  </span>
                </div>

                {depinIntel ? (
                  <div style={{ background: "rgba(240, 201, 41, 0.02)", border: "1px solid rgba(240, 201, 41, 0.25)", padding: "16px", borderRadius: "2px", fontFamily: "var(--mono)", fontSize: "12px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed rgba(240, 201, 41, 0.15)", paddingBottom: "6px" }}>
                      <span style={{ color: "#00ffcc", fontWeight: "bold", fontSize: "12.5px" }}>[ PAID OUTPUT DELIVERED ]</span>
                      <span style={{ color: "#2ecc40", fontSize: "10px", fontWeight: "bold", background: "rgba(46, 204, 64, 0.1)", padding: "2px 6px", borderRadius: "2px" }}>{depinIntel.network?.sourceCoverage}</span>
                    </div>
                    <div style={{ color: "#ffffff", fontWeight: "bold", fontSize: "13.5px" }}>Solana Mainnet · confirmed RPC snapshot</div>
                    <div style={{ color: "rgba(255, 255, 255, 0.95)", fontSize: "12px" }}>
                      Vote accounts: <span style={{ color: "#ffffff", fontWeight: "bold" }}>{depinIntel.network?.voteAccounts?.total}</span> · Delinquent share: <span style={{ color: "#f0c929", fontWeight: "bold" }}>{depinIntel.network?.voteAccounts?.delinquentShare}%</span>
                    </div>

                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", padding: "10px", borderRadius: "2px", display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px" }}>
                      <div style={{ color: "#ffffff", fontWeight: "bold", borderBottom: "1px dashed rgba(255,255,255,0.1)", paddingBottom: "4px", marginBottom: "4px" }}>SOLANA RPC TELEMETRY</div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(255,255,255,0.7)" }}>SAMPLED TPS:</span><span style={{ color: "#00ffcc", fontWeight: "bold" }}>{depinIntel.network?.performance?.sampledTransactionsPerSecond ?? "UNAVAILABLE"}</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(255,255,255,0.7)" }}>AVG RECENT PRIORITY FEE:</span><span style={{ color: "#f0c929", fontWeight: "bold" }}>{depinIntel.network?.fees?.averageRecentPriorityFeeMicroLamports ?? "UNAVAILABLE"} microLamports/CU</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(255,255,255,0.7)" }}>CIRCULATING / TOTAL SOL:</span><span style={{ color: "#ffffff" }}>{depinIntel.network?.supply ? `${depinIntel.network.supply.circulatingSol.toLocaleString()} / ${depinIntel.network.supply.totalSol.toLocaleString()} SOL` : "UNAVAILABLE"}</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(255,255,255,0.7)" }}>NON-CIRCULATING SHARE:</span><span style={{ color: "#00ffcc", fontWeight: "bold" }}>{depinIntel.network?.supply ? `${depinIntel.network.supply.nonCirculatingShare}%` : "UNAVAILABLE"}</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(255,255,255,0.7)" }}>TOTAL INFLATION RATE:</span><span style={{ color: "#ffffff" }}>{depinIntel.network?.inflation ? `${depinIntel.network.inflation.totalPercent}%` : "UNAVAILABLE"}</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(255,255,255,0.7)" }}>EPOCH PROGRESS:</span><span style={{ color: "#ffffff" }}>{depinIntel.network?.epoch?.progress}% (Epoch {depinIntel.network?.epoch?.number})</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(255,255,255,0.7)" }}>ABSOLUTE SLOT:</span><span style={{ color: "#ffffff" }}>{depinIntel.network?.epoch?.absoluteSlot}</span></div>
                    </div>

                    {depinIntel.network?.topCurrentValidators && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", borderTop: "1px dashed rgba(255,255,255,0.15)", paddingTop: "10px" }}>
                        <div style={{ color: "#00ffcc", fontWeight: "bold", fontSize: "11.5px" }}>CURRENT VOTE ACCOUNTS · TOP ACTIVATED STAKE:</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          {depinIntel.network.topCurrentValidators.map((n: any, idx: number) => {
                            const shortPubKey = n.votePubkey.slice(0, 8) + "..." + n.votePubkey.slice(-8);
                            return (
                              <div key={idx} style={{ display: "flex", justifyContent: "space-between", background: "rgba(255,255,255,0.02)", padding: "4px 8px", borderRadius: "2px", border: "1px solid rgba(255,255,255,0.05)", fontSize: "11px" }}>
                                <span>{idx + 1}. Vote: {shortPubKey}</span>
                                <span>Commission: {n.commission}% | Stake: {n.activatedStakeSol?.toLocaleString()} SOL</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {depinIntel.network?.delinquentVoteAccounts && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", borderTop: "1px dashed rgba(255,255,255,0.15)", paddingTop: "10px" }}>
                        <div style={{ color: "var(--accent)", fontWeight: "bold", fontSize: "11.5px" }}>DELINQUENT VOTE ACCOUNTS · NOT A COMPROMISE CLAIM:</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          {depinIntel.network.delinquentVoteAccounts.map((n: any, idx: number) => {
                            const shortPubKey = n.votePubkey.slice(0, 8) + "..." + n.votePubkey.slice(-8);
                            return (
                              <div key={idx} style={{ display: "flex", justifyContent: "space-between", background: "rgba(255, 77, 77, 0.02)", padding: "4px 8px", borderRadius: "2px", border: "1px solid rgba(255, 77, 77, 0.08)", fontSize: "11px" }}>
                                <span style={{ color: "var(--accent)" }}>Vote: {shortPubKey}</span>
                                <span>Last vote: Slot {n.lastVote}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.9)", borderTop: "1px dashed rgba(255,255,255,0.15)", paddingTop: "10px" }}>
                      <strong>Assessment:</strong> {depinIntel.network?.assessment}
                      <div style={{ marginTop: "6px" }}><strong>Next action:</strong> {depinIntel.network?.nextAction}</div>
                    </div>

                    <div style={{ background: "rgba(0, 255, 204, 0.01)", border: "1px solid rgba(0, 255, 204, 0.1)", padding: "10px", borderRadius: "2px", fontSize: "11px", display: "flex", flexDirection: "column", gap: "3px", marginTop: "4px" }}>
                      <div style={{ color: "#00ffcc", fontWeight: "bold", borderBottom: "1px dashed rgba(0, 255, 204, 0.15)", paddingBottom: "4px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, filter: "drop-shadow(0 0 3px currentColor)" }}>
                          <rect x="2" y="5" width="20" height="14" rx="2" />
                          <line x1="2" y1="10" x2="22" y2="10" />
                          <line x1="6" y1="15" x2="10" y2="15" />
                        </svg>
                        <span>x402 PROTOCOL PAYMENT RECEIPT</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(255,255,255,0.6)" }}>Standard Version:</span><span>x402 V2 (Exact SVM Scheme)</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}><span style={{ color: "rgba(255,255,255,0.6)" }}>Operation ID:</span><span style={{ fontSize: "10px", wordBreak: "break-all" }}>{depinOperationId || "UNAVAILABLE"}</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(255,255,255,0.6)" }}>Settlement Price:</span><span style={{ fontWeight: "bold", color: "#f0c929" }}>0.02 USDC</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(255,255,255,0.6)" }}>Receipt State:</span><span style={{ color: depinReceiptStored ? "#2ecc40" : "#ff8080", fontWeight: "bold" }}>{depinReceiptStored ? "✓ STORED // REPLAY SAFE" : "UNCONFIRMED // DO NOT REPAY"}</span></div>
                    </div>

                    {/* Actions Row */}
                    <div style={{ display: "flex", gap: "12px", borderTop: "1px dashed rgba(255,255,255,0.15)", paddingTop: "10px", marginTop: "4px", alignItems: "center", flexWrap: "wrap" }}>
                      <button
                        onClick={() => {
                          const proofText = depinTxid ? `\nProof: https://solscan.io/tx/${depinTxid}` : "";
                          setShareModalData({
                            content: `◉ RED QUEEN SOLANA NETWORK HEALTH\n\nCoverage: ${depinIntel.network?.sourceCoverage}\nVote accounts: ${depinIntel.network?.voteAccounts?.total}\nDelinquent share: ${depinIntel.network?.voteAccounts?.delinquentShare}%\nSampled TPS: ${depinIntel.network?.performance?.sampledTransactionsPerSecond ?? "unavailable"}\nEpoch: ${depinIntel.network?.epoch?.number}\nAssessment: ${depinIntel.network?.assessment}${proofText}`
                          });
                        }}
                        style={{ background: "none", border: "none", color: "#f0c929", fontFamily: "var(--mono)", fontSize: "11px", cursor: "pointer", padding: 0, textDecoration: "underline", fontWeight: "bold" }}
                      >
                        [ 📤 SHARE DOSSIER ]
                      </button>
                      
                      {depinTxid && (
                        <a
                          href={`https://solscan.io/tx/${depinTxid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#2ecc40", fontFamily: "var(--mono)", fontSize: "11px", textDecoration: "underline", fontWeight: "bold" }}
                        >
                          [ 🔗 SOLSCAN PROOF ]
                        </a>
                      )}

                      {depinOperationId && depinReceiptStored === true && (
                        <span title={depinOperationId} style={{ color: "rgba(255,255,255,0.55)", fontFamily: "var(--mono)", fontSize: "10px" }}>
                          RECEIPT {depinOperationId.slice(0, 8)}…
                        </span>
                      )}
                      {depinReceiptStored === false && (
                        <span style={{ color: "#ff8080", fontFamily: "var(--mono)", fontSize: "10px" }}>RECEIPT UNCONFIRMED — DO NOT REPAY</span>
                      )}

                      <button
                        onClick={() => decryptIntel("/api/intel/depin", "depin")}
                        disabled={depinReceiptStored === false}
                        title={depinReceiptStored === false ? "Receipt storage is unconfirmed. Keep this delivered output and do not submit another payment." : "Purchase a new network snapshot"}
                        style={{ background: "none", border: "none", color: "rgba(255, 255, 255, 0.7)", fontFamily: "var(--mono)", fontSize: "11px", cursor: depinReceiptStored === false ? "not-allowed" : "pointer", opacity: depinReceiptStored === false ? 0.35 : 1, padding: 0, textDecoration: "underline", marginLeft: "auto", fontWeight: "bold" }}
                      >
                        [ BUY FRESH SNAPSHOT · 0.02 USDC ]
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ fontSize: "11.5px", color: "#f0c929", fontWeight: "bold", fontFamily: "var(--mono)", background: "rgba(240, 201, 41, 0.05)", padding: "10px", border: "1px solid rgba(240, 201, 41, 0.2)", borderRadius: "2px", textAlign: "center" }}>
                      STATUS: {loadingDepin ? `[ ACTIVE: ${loadingDepin} ]` : x402Available === true ? "[ LOCKED // x402 PROTOCOL: 0.02 USDC REQUIRED ]" : x402Available === null ? "[ CHECKING SETTLEMENT RAIL ]" : "[ SETTLEMENT RAIL OFFLINE ]"}
                    </div>
                    {depinError && (
                      <div style={{ fontSize: "11px", color: "var(--accent)", fontFamily: "var(--mono)" }}>
                        ⚠️ ERROR: {depinError}
                      </div>
                    )}
                    {x402Available === false && !depinError && (
                      <div style={{ fontSize: "11px", color: "var(--accent)", fontFamily: "var(--mono)" }}>SETTLEMENT BLOCKED: {x402StatusReason}</div>
                    )}
                    <button
                      className="btn"
                      onClick={() => {
                        if (!connected) {
                          setVisible(true);
                        } else {
                          decryptIntel("/api/intel/depin", "depin");
                        }
                      }}
                      disabled={!!loadingDepin || x402Available !== true}
                      style={{ padding: "10px", fontSize: "11.5px", fontWeight: "bold", background: "#f0c929", color: "#000", border: "none" }}
                    >
                      {loadingDepin ? "PROCESSING PAYWALL..." : x402Available !== true ? "PAYMENT UNAVAILABLE" : connected ? "DECRYPT DOSSIER B" : "CONNECT WALLET & DECRYPT"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          </details>
        </div>

        {/* Right Side: the user loop first; diagnostics stay available on demand. */}
        <aside className="desktop-only" style={{
          width: "320px",
          borderLeft: "1px solid var(--border)",
          background: "var(--surface)",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          overflowY: "auto",
          fontFamily: "var(--mono)",
          fontSize: "11.5px",
          color: "var(--text-dim)",
          flexShrink: 0
        }}>
          <div className="rq-loop-card">
            <span>YOUR SURVIVAL LOOP</span>
            <strong>One useful action. One plan that survives the chat.</strong>
            <ol>
              <li><b>ASK</b><small>Get a clear brief from RED QUEEN.</small></li>
              <li><b>SAVE</b><small>Keep the next action or full Queen protocol.</small></li>
              <li><b>COMPLETE</b><small>Work through observable steps in Prepare.</small></li>
              <li><b>PROVE</b><small>Let Queen evaluate what you actually did before BIO changes.</small></li>
            </ol>
            <a href="/survival-kit">{savedActionText || savedPlanTitles.length ? "OPEN SURVIVAL MEMORY →" : "OPEN MY PLAN →"}</a>
          </div>

          <div>
            <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--accent)", letterSpacing: "0.15em", marginBottom: "12px" }}>
              [ SESSION STATUS ]
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", background: "#0c0c0c", border: "1px solid #161616", padding: "12px", borderRadius: "2px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>IDENTITY:</span>
                <span style={{ color: "var(--text)" }}>{apocalypticName || "SUBJECT"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>UPLINK TIER:</span>
                <span style={{ color: "var(--accent)" }}>{agentClearance.verified ? `LEVEL ${agentClearance.level} (${agentClearance.name})` : hasVerifiedIdentity ? "IDENTITY VERIFIED / PUBLIC" : "LEVEL 1 (PUBLIC)"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>STATUS:</span>
                <span style={{ color: "#2ecc40" }}>ACTIVE CONNECT</span>
              </div>
            </div>
          </div>

          <details className="rq-terminal-diagnostics">
            <summary>ADVANCED SYSTEMS</summary>
            <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
              <div style={{ padding: "10px", border: "1px solid rgba(255,255,255,.08)", background: "#0b0b0b" }}>
                <span style={{ color: x402Available === true ? "#a8ff60" : "#f0c929", fontWeight: "bold" }}>x402 SETTLEMENT RAIL · {x402Available === true ? "READY" : x402Available === null ? "CHECKING" : "BLOCKED"}</span>
                <div style={{ marginTop: "4px", color: "var(--text-muted)", fontSize: "10px", lineHeight: 1.45 }}>{x402StatusReason}</div>
              </div>
              <div style={{ color: "var(--text)", fontSize: "10px", letterSpacing: ".12em" }}>LOCAL COMMAND INDEX</div>
              {[
                ["/memory", "Show the bounded Survival Memory on this device."],
                ["/context", "Show broad area, focus, and Queen mode."],
                ["/mode monitor|analyze|prepare|simulate", "Change the next reasoning mode without consuming AI."],
                ["/pulse", "Return to the verified Daily Pulse and map."],
                ["/bio", "Explain evidence-based readiness and persistence."],
                ["/help", "Show the complete command index."],
              ].map(([command, description]) => (
                <div key={command} style={{ paddingBottom: "7px", borderBottom: "1px dashed var(--border)" }}>
                  <span style={{ color: "#a8ff60", fontWeight: "bold" }}>{command}</span>
                  <div style={{ marginTop: "2px", color: "var(--text-muted)", fontSize: "10px", lineHeight: 1.4 }}>{description}</div>
                </div>
              ))}
            </div>
          </details>

          <div style={{ marginTop: "auto", borderTop: "1px dashed var(--border)", paddingTop: "16px" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.15em", marginBottom: "6px" }}>
              SYSTEM TELEMETRY INTEGRITY
            </div>
            <div style={{ fontSize: "10px", display: "flex", flexDirection: "column", gap: "4px", color: "var(--text-muted)" }}>
              <div>• LIVE SOURCES: VERIFY IN PULSE</div>
              <div>• SOLANA RPC: VERIFY IN ON-CHAIN HUB</div>
              <div>• LOCATION: BROAD AREA ONLY</div>
              <div>• DEVICE MEMORY: SENT ONLY WITH A QUEEN REQUEST</div>
            </div>
          </div>

        </aside>

        {/* Hidden Canvas for Generation */}
        <canvas ref={canvasRef} style={{ display: "none" }} />

        {/* Share Dossier Modal Overlay */}
        {shareModalData && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px"
          }}>
            <div style={{
              background: "#050505",
              border: "2px solid var(--accent)",
              width: "100%",
              maxWidth: "640px",
              padding: "24px",
              boxShadow: "0 0 30px rgba(255, 0, 51, 0.3)",
              position: "relative"
            }}>
              <h2 className="glow-text" style={{
                fontFamily: "var(--mono)",
                fontSize: "18px",
                margin: "0 0 16px",
                color: "var(--accent)",
                borderBottom: "1px solid rgba(255, 77, 77, 0.2)",
                paddingBottom: "10px"
              }}>
                [ TRANSMISSION SHARE PROTOCOL ]
              </h2>

              {shareImageSrc ? (
                <div style={{ textAlign: "center", marginBottom: "20px" }}>
                  <img
                    src={shareImageSrc}
                    alt="Dossier Preview"
                    style={{
                      maxWidth: "100%",
                      height: "auto",
                      border: "1px solid var(--border)",
                      boxShadow: "0 0 15px rgba(0,0,0,0.5)"
                    }}
                  />
                </div>
              ) : (
                <div style={{
                  height: "200px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-dim)",
                  fontFamily: "var(--mono)"
                }}>
                  GENERATING DOSSIER IMAGE...
                </div>
              )}

              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap"
              }}>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    className="btn btn-primary"
                    onClick={async () => {
                      try {
                        const response = await fetch(shareImageSrc);
                        const blob = await response.blob();
                        await navigator.clipboard.write([
                          new ClipboardItem({ "image/png": blob })
                        ]);
                        setCopySuccess(true);
                        setTimeout(() => setCopySuccess(false), 2000);
                      } catch (err) {
                        console.error("Clipboard copy failed:", err);
                      }
                    }}
                    style={{ minWidth: "120px" }}
                  >
                    {copySuccess ? "✓ COPIED" : "COPY IMAGE"}
                  </button>

                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                      "Intercepted transmission from the RED QUEEN. Digital survival status evaluated. ◉ @redqueen_agent"
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn"
                    style={{
                      background: "#1d9bf0",
                      border: "none",
                      color: "#fff",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "8px 16px",
                      fontFamily: "var(--mono)",
                      fontSize: "11px",
                      fontWeight: "bold",
                      cursor: "pointer",
                      borderRadius: "2px"
                    }}
                  >
                    SHARE TO X
                  </a>
                </div>

                <button
                  onClick={() => setShareModalData(null)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-dim)",
                    fontFamily: "var(--mono)",
                    fontSize: "11px",
                    cursor: "pointer",
                    textDecoration: "underline"
                  }}
                >
                  [ CLOSE ]
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
