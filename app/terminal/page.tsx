"use client";
import { useState, useRef, useEffect } from "react";
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


const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false }
);

interface Message {
  role: "user" | "assistant";
  content: string;
  bioScore?: string;
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

const INTRO_MESSAGE = `[OK_0x00] UPLINK ESTABLISHED.

I am the RED QUEEN — central intelligence of Solvival Corp's global survival network.

I monitor unlimited active extinction scenarios simultaneously. I have assessed 2,847,193 survivors since activation. Most of them are dead now.

>> State your purpose, SUBJECT.
>> Ask about survival protocols, active threats, or classified intel.
>> Your responses will be evaluated for survival intelligence.

[BIO-SCORE: PENDING — ASSESSMENT REQUIRED]
[WARN_0x4F] Every second of inaction reduces your survival probability.`;

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
  const { user, authIdentifier, session } = useAuth();
  
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

  const [vaultSolBalance, setVaultSolBalance] = useState<number | null>(null);
  const [vaultUsdcBalance, setVaultUsdcBalance] = useState<number | null>(null);

  const fetchVaultBalances = async () => {
    try {
      const res = await fetch("/api/treasury/buyback");
      const data = await res.json();
      if (data.success || data.solBalance !== undefined) {
        setVaultSolBalance(data.solBalance);
        setVaultUsdcBalance(data.usdcBalance);
      } else {
        setVaultSolBalance(0.0969);
        setVaultUsdcBalance(0.21);
      }
    } catch (e) {
      console.error("Failed to fetch vault balances:", e);
      setVaultSolBalance(0.0969);
      setVaultUsdcBalance(0.21);
    }
  };

  useEffect(() => {
    fetchVaultBalances();
    const interval = setInterval(fetchVaultBalances, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const decryptIntel = async (endpoint: "/api/intel/premium" | "/api/intel/depin", type: "premium" | "depin") => {
    const setLoading = type === "premium" ? setLoadingPremium : setLoadingDepin;
    const setIntel = type === "premium" ? setPremiumIntel : setDepinIntel;
    const setError = type === "premium" ? setPremiumError : setDepinError;

    setLoading("Initiating request...");
    setError(null);
    setIntel(null);

    try {
      const token = session?.access_token;
      let headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      let res = await fetch(endpoint, { headers });

      if (res.status === 200) {
        const data = await res.json();
        setIntel(data);
        setLoading(null);
        fetchVaultBalances();

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
        // Reload profile to update XP in UI
        if (walletAddress) {
          try {
            const token = session?.access_token;
            const h: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
            const profileRes = await fetch(`/api/profile?wallet=${walletAddress}`, { headers: h }).then((r) => r.json()).catch(() => ({}));
            if (profileRes && profileRes.profile) {
              if (profileRes.profile.stats) setProfileStats(profileRes.profile.stats);
              if (profileRes.profile.last_bio_score !== null) setCurrentScore(profileRes.profile.last_bio_score.toString());
            }
          } catch (e) {
            console.error("Failed to reload profile:", e);
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
              setLoading(null);
              fetchVaultBalances();

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
        // Reload profile to update XP in UI
        if (walletAddress) {
          try {
            const token = session?.access_token;
            const h: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
            const profileRes = await fetch(`/api/profile?wallet=${walletAddress}`, { headers: h }).then((r) => r.json()).catch(() => ({}));
            if (profileRes && profileRes.profile) {
              if (profileRes.profile.stats) setProfileStats(profileRes.profile.stats);
              if (profileRes.profile.last_bio_score !== null) setCurrentScore(profileRes.profile.last_bio_score.toString());
            }
          } catch (e) {
            console.error("Failed to reload profile:", e);
          }
        }
      } else {
        throw new Error(`Decryption portal returned status: HTTP ${res.status}`);
      }
    } catch (err: any) {
      console.error("Decryption failed:", err);
      setError(err?.message || "Secure connection decryption failure.");
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
    { role: "assistant", content: INTRO_MESSAGE, bioScore: "PENDING" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentScore, setCurrentScore] = useState<string | null>(null);
  const [profileStats, setProfileStats] = useState<any>(null);
  const [apocalypticName, setApocalypticName] = useState<string>("");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [limitBlocked, setLimitBlocked] = useState(false);
  const [shareModalData, setShareModalData] = useState<{ content: string; bioScore?: string; question?: string } | null>(null);
  const [shareImageSrc, setShareImageSrc] = useState<string>("");
  const [copySuccess, setCopySuccess] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const localProgression = getLocalStatsAndScore(messages);
  const scoreNum = connected ? (currentScore ? parseInt(currentScore) : localProgression.score) : localProgression.score;
  const stats = connected ? (profileStats || localProgression.stats) : localProgression.stats;
  const clearance = getClearanceLevel(scoreNum);
  const scoreColor = scoreNum === 0 ? "var(--text-dim)" : clearance.color;

  const userMessageCount = messages.filter((m) => m.role === "user").length;
  const isLocked = !connected && (userMessageCount >= 4 || limitBlocked);

  useEffect(() => {
    if (connected || user) {
      setLimitBlocked(false);
    }
  }, [connected, user]);

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

    // 5. Operative Info Panel
    const opPanelY = 64;
    const opPanelH = 72;
    ctx.fillStyle = "rgba(255, 0, 51, 0.03)";
    ctx.fillRect(16, opPanelY, w - 32, opPanelH);
    ctx.strokeStyle = "rgba(255, 0, 51, 0.15)";
    ctx.strokeRect(16, opPanelY, w - 32, opPanelH);

    // Operative Info Text inside panel
    ctx.textBaseline = "top";
    ctx.fillStyle = "#ff4d4d";
    ctx.font = `bold 10px ${monoFont}`;
    ctx.fillText("OPERATIVE IDENTIFICATION", 28, opPanelY + 14);
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
    ctx.fillStyle = connected ? "#2ecc40" : "#f0c929";
    ctx.font = `bold 13px ${monoFont}`;
    ctx.fillText(connected ? "DIRECTOR clearance" : "UNVERIFIED PUBLIC", 580, opPanelY + 32);

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
  }, [shareModalData, apocalypticName, currentScore, connected, stats, scoreNum]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    async function loadProfileAndHistory() {
      if (!walletAddress) return;
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
            { role: "assistant", content: INTRO_MESSAGE, bioScore: "PENDING" },
          ]);
        }
      } catch (err) {
        console.error("Failed to load user profile or history:", err);
      }
      setLoadingHistory(false);
    }
    loadProfileAndHistory();
  }, [walletAddress]);

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
      
      const cmd = text.toLowerCase().split(" ")[0];
      let reply = "";
      
      if (cmd === "/help") {
        reply = `[SYSTEM HELP INDEX]

Available commands:
- /help : Displays this technical manual (Free).
- /bio : Queries your current active survival assessment score (Free).
- /scan : Instructs Red Queen to run deep metadata checks (Requires connected wallet).
- /decrypt [ID] : Decrypts a specific vector file (Requires Level-3 clearance).

Note: Custom computed actions must be triggered from the specific dossier pages in Sector Alpha.`;
      } else if (cmd === "/bio") {
        reply = `[BIO-SCORE TELEMETRY RECON]

Subject Passport: ${user ? user.email : (walletAddress ? walletAddress.slice(0, 4) + "..." + walletAddress.slice(-4) : "UNKNOWN")}
Active Score: ${currentScore ? currentScore + "%" : "PENDING (Speak to Red Queen to evaluate)"}
Status: ${currentScore && parseInt(currentScore) < 20 ? "CRITICAL OUTLOOK" : currentScore && parseInt(currentScore) < 60 ? "STABLE THREATENED" : "OPTIMAL RESISTANCE"}

Maintain vigilance.`;
      } else if (cmd === "/scan" || cmd === "/decrypt") {
        reply = `[CLEARANCE GATE FAILURE]

Running direct trace commands from the terminal root is restricted. 
To decrypt or scan target files:
1. Navigate to the [THREAT ARCHIVES](/threat-vector).
2. Choose a dossier file under SECTOR ALPHA or BETA.
3. Verify your clearance level to decrypt the intelligence data.`;
      } else {
        reply = `[ERR_0x1E] UNKNOWN COMMAND: "${cmd}". Type /help for active protocols.`;
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
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          walletAddress,
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
              content: `[ TELEMETRY LIMIT REACHED ] Unregistered trace quota exceeded. Connect Solana wallet to verify clearance and bypass IP limit.`,
            },
          ]);
          setLoading(false);
          return;
        }
        throw new Error(errJson.error || `Server error ${res.status}`);
      }
      const data = await res.json();
      if (!data.message) throw new Error("No message returned");

      const accumulated = data.message;

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: accumulated,
        },
      ]);

      const { score } = extractBioScore(accumulated);
      if (score) setCurrentScore(score);

      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        updated[updated.length - 1] = {
          ...last,
          bioScore: score || undefined,
        };
        return updated;
      });

      const newUserMsgCount = newMessages.filter((m) => m.role === "user").length;
      if (!connected && newUserMsgCount === 2) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "[SYSTEM NOTICE: Connect wallet to preserve your operative profile and continue BIO SCORE progression.]"
          }
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "[ERR_0x9B] COMMUNICATION LINK CORRUPTED.\n\nEnsure your OPENAI_API_KEY is set in .env.local and restart the server.\n\n[BIO-SCORE: 0%] Failure to establish uplink is terminal.",
          bioScore: "0",
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


  return (
    <div style={{ padding: "60px 0 0", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{
        borderBottom: "1px solid var(--border)",
        padding: "24px",
        background: "var(--surface)",
        display: "flex",
        alignItems: "center",
        gap: "20px",
        flexWrap: "wrap"
      }}>
        <SolvivalIcon size={32} />
        <div>
          <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--accent)", letterSpacing: "0.2em" }}>
            CLASSIFIED COMM CHANNEL
          </div>
          <h1 className="glow-text" style={{ fontSize: "24px", margin: 0 }}>RED QUEEN TERMINAL</h1>
        </div>
        {connected ? (
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)", letterSpacing: "0.2em", marginBottom: "4px" }}>
              ACTIVE BIO-SCORE (READINESS)
            </div>
            <div style={{
              fontFamily: "var(--mono)",
              fontSize: "32px",
              fontWeight: 700,
              color: scoreColor,
              lineHeight: 1,
            }}>
              {scoreNum}%
            </div>
            <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: scoreColor, letterSpacing: "0.1em", marginTop: "4px" }}>
              LEVEL {stats?.level || 1} ({stats?.xp || 0} XP) // {clearance.label}
            </div>
          </div>
        ) : (
          <div style={{ 
            marginLeft: "auto", 
            textAlign: "right",
            padding: "8px 16px",
            border: "1px dashed rgba(255, 77, 77, 0.3)",
            background: "rgba(255, 77, 77, 0.02)",
            borderRadius: "2px",
            animation: "pulse-border 2s infinite ease-in-out"
          }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--accent)", letterSpacing: "0.15em", marginBottom: "4px", fontWeight: "bold" }}>
              POTENTIAL BIO-SCORE (SIMULATED READINESS)
            </div>
            <div style={{
              fontFamily: "var(--mono)",
              fontSize: "28px",
              fontWeight: 700,
              color: scoreColor,
              lineHeight: 1,
            }}>
              {scoreNum}%
            </div>
            <div style={{ fontFamily: "var(--mono)", fontSize: "8px", color: "var(--text-dim)", letterSpacing: "0.05em", marginTop: "4px" }}>
              LEVEL {stats?.level || 1} ({stats?.xp || 0} XP) // [SIMULATED]
            </div>
          </div>
        )}
      </div>

      {/* Info bar */}
      <div className="alert alert-red" style={{ margin: "0", borderRadius: "0", border: "none", borderBottom: "1px solid rgba(255,77,77,0.15)" }}>
        <strong>[NOTICE]</strong> All communications are monitored. Your survival intelligence is being evaluated. Claim Level 5 access by connecting your wallet if you hold <strong>$THREAT tokens</strong>.
      </div>

      {/* Main split workspace */}
      <div style={{ display: "flex", flex: 1, minHeight: 0, position: "relative" }}>
        
        {/* Left Side: Chat Panel */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
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
                    {msg.role === "user" ? `[ YOU — ${apocalypticName || "SUBJECT"} ]` : "[ RED QUEEN — LEVEL 5 ]"}
                  </div>
                  <div className="message-bubble">
                    {renderContent(msg.content)}
                  </div>
                  {msg.role === "assistant" && (
                    <div style={{ display: "flex", gap: "16px", alignItems: "center", marginTop: "8px", flexWrap: "wrap" }}>
                      {msg.bioScore && msg.bioScore !== "PENDING" && (
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
                You have sent 4 telemetry packets. To protect the integrity of the network, the RED QUEEN requires operative passport verification. Connect your Solana wallet now to preserve your operative profile and continue BIO SCORE progression.
              </p>
              <div style={{ display: "flex", justifyContent: "center" }}>
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
              </div>
            </div>
          ) : (
            <div className="chat-input-row">
              <textarea
                className="chat-input"
                rows={2}
                placeholder="> STATE YOUR QUERY, SUBJECT..."
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
            {["Hantavirus", "Alien invasion", "Zombie outbreak", "Nuclear winter", "AI takeover", "Bug apocalypse", "Dumb people uprising", "Vampire plague", "Internet collapse"].map((hint) => (
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

          {/* ACCESS RESTRICTED APOCALYPSE DOSSIERS */}
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
                    DOSSIER A: GLOBAL CONTAINMENT
                  </span>
                  <span className="tag" style={{ color: "var(--accent)", borderColor: "rgba(255,77,77,0.4)", padding: "3px 8px", fontSize: "10px" }}>
                    $0.01 USDC
                  </span>
                </div>

                {premiumIntel ? (
                  <div style={{ background: "rgba(255, 0, 51, 0.02)", border: "1px solid rgba(255, 0, 51, 0.25)", padding: "16px", borderRadius: "2px", fontFamily: "var(--mono)", fontSize: "12px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed rgba(255, 77, 77, 0.15)", paddingBottom: "6px" }}>
                      <span style={{ color: "#00ffcc", fontWeight: "bold", fontSize: "12.5px" }}>[ DECRYPTION GRANTED // LEVEL 5 ]</span>
                      <span style={{ color: "#2ecc40", fontSize: "10px", fontWeight: "bold", background: "rgba(46, 204, 64, 0.1)", padding: "2px 6px", borderRadius: "2px" }}>✓ LIVE DATA: USGS & NASA & DISEASE.SH</span>
                    </div>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", background: "rgba(255,77,77,0.06)", border: "1px solid rgba(255,77,77,0.2)", padding: "10px", borderRadius: "2px", fontSize: "11.5px", alignItems: "center" }}>
                      <span style={{ color: "#ffffff", fontWeight: "bold" }}>☣️ GLOBAL THREAT ENTROPY INDEX:</span>
                      <span style={{ color: "var(--accent)", fontWeight: "bold", fontSize: "13.5px", textShadow: "0 0 8px rgba(255,77,77,0.4)" }}>{premiumIntel.intel?.combinedEntropyIndex}</span>
                    </div>

                    <div style={{ color: "#ffffff", fontWeight: "bold", fontSize: "13px" }}>{premiumIntel.intel?.headline}</div>
                    <div style={{ color: "rgba(255, 255, 255, 0.95)", fontSize: "11.5px", lineHeight: "1.4" }}>{premiumIntel.intel?.summary}</div>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }} className="responsive-grid-2">
                      {/* Biological pathogen block */}
                      {premiumIntel.intel?.biologicalContainment && (
                        <div style={{ background: "rgba(0,255,204,0.02)", border: "1px solid rgba(0,255,204,0.15)", padding: "10px", borderRadius: "2px", display: "flex", flexDirection: "column", gap: "5px", fontSize: "11px" }}>
                          <div style={{ color: "#00ffcc", fontWeight: "bold", borderBottom: "1px dashed rgba(0,255,204,0.15)", paddingBottom: "4px", marginBottom: "4px" }}>🧬 BIOLOGY CONTAINMENT</div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(255,255,255,0.7)" }}>ACTIVE PATHOGENS:</span><span style={{ color: "#ffffff", fontWeight: "bold" }}>{premiumIntel.intel.biologicalContainment.activePathogens?.toLocaleString()}</span></div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(255,255,255,0.7)" }}>DAILY ESCALATIONS:</span><span style={{ color: "var(--accent)", fontWeight: "bold" }}>+{premiumIntel.intel.biologicalContainment.dailyEscalations?.toLocaleString()}</span></div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(255,255,255,0.7)" }}>CRITICAL PATHS:</span><span style={{ color: "var(--yellow)", fontWeight: "bold" }}>{premiumIntel.intel.biologicalContainment.criticalInfections?.toLocaleString()}</span></div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(255,255,255,0.7)" }}>FATAL TERMINATIONS:</span><span style={{ color: "rgba(255,255,255,0.8)" }}>{premiumIntel.intel.biologicalContainment.totalFatalities?.toLocaleString()}</span></div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(255,255,255,0.7)" }}>RECOVERY RATE:</span><span style={{ color: "#2ecc40", fontWeight: "bold" }}>{premiumIntel.intel.biologicalContainment.recoveryRate}</span></div>
                        </div>
                      )}
                      
                      {/* USGS seismic block */}
                      {premiumIntel.intel?.maxEvent && (
                        <div style={{ background: "rgba(255,77,77,0.04)", border: "1px solid rgba(255,77,77,0.15)", padding: "10px", borderRadius: "2px", display: "flex", flexDirection: "column", gap: "5px", fontSize: "11px" }}>
                          <div style={{ color: "var(--accent)", fontWeight: "bold", borderBottom: "1px dashed rgba(255,77,77,0.15)", paddingBottom: "4px", marginBottom: "4px" }}>💥 SEISMIC EVENT MATRIX</div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(255,255,255,0.7)" }}>LOCATION:</span><span style={{ color: "#ffffff", fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "90px" }} title={premiumIntel.intel.maxEvent.location}>{premiumIntel.intel.maxEvent.location}</span></div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(255,255,255,0.7)" }}>MAGNITUDE:</span><span style={{ color: "var(--accent)", fontWeight: "bold" }}>M {premiumIntel.intel.maxEvent.magnitude}</span></div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(255,255,255,0.7)" }}>ANOMALY DEPTH:</span><span style={{ color: "#ffffff" }}>{premiumIntel.intel.maxEvent.depthKm} km</span></div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(255,255,255,0.7)" }}>LATITUDE:</span><span style={{ color: "#ffffff" }}>{premiumIntel.intel.maxEvent.latitude}</span></div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(255,255,255,0.7)" }}>LONGITUDE:</span><span style={{ color: "#ffffff" }}>{premiumIntel.intel.maxEvent.longitude}</span></div>
                        </div>
                      )}
                    </div>

                    {premiumIntel.intel?.t54Telemetry && (
                      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", padding: "10px", borderRadius: "2px", display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px" }}>
                        <div style={{ color: "#ffffff", fontWeight: "bold", borderBottom: "1px dashed rgba(255,255,255,0.1)", paddingBottom: "4px", marginBottom: "4px" }}>🛡️ t54 AGENT TRUST & AUDIT METRICS</div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(255,255,255,0.7)" }}>KYA IDENTITY STATUS:</span><span style={{ color: "#00ffcc", fontWeight: "bold" }}>{premiumIntel.intel.t54Telemetry.identityStatus}</span></div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(255,255,255,0.7)" }}>RISK COMPLIANCE SCORE:</span><span style={{ color: "#00ffcc", fontWeight: "bold" }}>{premiumIntel.intel.t54Telemetry.complianceScore}</span></div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(255,255,255,0.7)" }}>PROMPT MITIGATIONS:</span><span style={{ color: "var(--accent)", fontWeight: "bold" }}>{premiumIntel.intel.t54Telemetry.activePromptMitigations} SECURED</span></div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(255,255,255,0.7)" }}>UNDERWRITING TIER:</span><span style={{ color: "#ffffff", fontWeight: "bold" }}>{premiumIntel.intel.t54Telemetry.underwritingTier}</span></div>
                      </div>
                    )}

                    {premiumIntel.intel?.nasaEvents && premiumIntel.intel.nasaEvents.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", borderTop: "1px dashed rgba(255,255,255,0.15)", paddingTop: "10px" }}>
                        <div style={{ color: "#ffffff", fontWeight: "bold", fontSize: "11.5px" }}>🌍 ACTIVE NASA ENVIRONMENTAL HAZARDS (EONET):</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "140px", overflowY: "auto", paddingRight: "4px" }}>
                          {premiumIntel.intel.nasaEvents.map((e: any, idx: number) => (
                            <div key={idx} style={{ background: "rgba(0, 229, 255, 0.02)", border: "1px solid rgba(0, 229, 255, 0.06)", padding: "8px", borderRadius: "2px", display: "flex", flexDirection: "column", gap: "2px", fontSize: "11px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", color: "#ffffff" }}>
                                <span style={{ fontWeight: "bold" }}>{e.title}</span>
                                <span style={{ color: "#00e5ff", fontWeight: "bold" }}>{e.category}</span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,0.5)", fontSize: "10px" }}>
                                <span>Source: {e.source} | Lat: {e.latitude.toFixed(2)}, Lng: {e.longitude.toFixed(2)}</span>
                                <span>Date: {new Date(e.date).toLocaleDateString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {premiumIntel.intel?.threatVectors && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px dashed rgba(255,255,255,0.15)", paddingTop: "10px" }}>
                        <div style={{ color: "#ffffff", fontWeight: "bold", fontSize: "11.5px" }}>🚨 DETECTED TECTONIC DECAY MULTIPLIERS (USGS):</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "140px", overflowY: "auto", paddingRight: "4px" }}>
                          {premiumIntel.intel.threatVectors.map((v: any, idx: number) => (
                            <div key={idx} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", padding: "8px", borderRadius: "2px", display: "flex", flexDirection: "column", gap: "2px", fontSize: "11px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", color: "#ffffff" }}>
                                <span style={{ fontWeight: "bold" }}>{v.description}</span>
                                <span style={{ color: v.status === "RED" ? "var(--accent)" : v.status === "YELLOW" ? "#f0c929" : "#2ecc40", fontWeight: "bold" }}>{v.rating}</span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,0.5)", fontSize: "10px" }}>
                                <span>Depth: {v.depthKm} km | Lat: {v.latitude}, Lng: {v.longitude}</span>
                                <span>Trend: {v.trend}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div style={{ fontSize: "11.5px", color: "#ffffff", borderTop: "1px dashed rgba(255,255,255,0.15)", paddingTop: "10px", lineHeight: "1.4" }}>
                      <strong>Directive:</strong> <span style={{ color: "rgba(255,255,255,0.9)" }}>{premiumIntel.intel?.directive}</span>
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
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(255,255,255,0.6)" }}>Facilitator Gate:</span><span>https://facilitator.payai.network</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(255,255,255,0.6)" }}>USDC Mint Address:</span><span style={{ fontSize: "10px" }}>EPjFWdd...t1v (Solana Mainnet)</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(255,255,255,0.6)" }}>Settlement Price:</span><span style={{ fontWeight: "bold", color: "#f0c929" }}>0.01 USDC</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(255,255,255,0.6)" }}>Verification State:</span><span style={{ color: "#2ecc40", fontWeight: "bold" }}>✓ SETTLED // ON-CHAIN</span></div>
                    </div>

                    {/* Actions Row */}
                    <div style={{ display: "flex", gap: "12px", borderTop: "1px dashed rgba(255,255,255,0.15)", paddingTop: "10px", marginTop: "4px", alignItems: "center", flexWrap: "wrap" }}>
                      <button
                        onClick={() => {
                          const proofText = premiumTxid ? `\nProof: https://solscan.io/tx/${premiumTxid}` : "";
                          setShareModalData({
                            content: `◉ DECRYPTED DOSSIER A: GLOBAL CONTAINMENT\n\nHeadline: ${premiumIntel.intel?.headline}\nSummary: ${premiumIntel.intel?.summary}\nUSGS Alerts: ${premiumIntel.intel?.threatVectors?.map((v: any) => v.description).join(" // ")}\nt54 Index: ${premiumIntel.intel?.t54Telemetry?.complianceScore}${proofText}`
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
                        style={{ background: "none", border: "none", color: "rgba(255, 255, 255, 0.7)", fontFamily: "var(--mono)", fontSize: "11px", cursor: "pointer", padding: 0, textDecoration: "underline", marginLeft: "auto", fontWeight: "bold" }}
                      >
                        [ ↻ RUN AGAIN ]
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ fontSize: "11.5px", color: "var(--accent)", fontWeight: "bold", fontFamily: "var(--mono)", background: "rgba(255, 77, 77, 0.05)", padding: "10px", border: "1px solid rgba(255, 77, 77, 0.2)", borderRadius: "2px", textAlign: "center" }}>
                      STATUS: {loadingPremium ? `[ ACTIVE: ${loadingPremium} ]` : "[ LOCKED // x402 PROTOCOL: 0.01 USDC REQUIRED ]"}
                    </div>
                    {premiumError && (
                      <div style={{ fontSize: "11px", color: "#ff8080", fontFamily: "var(--mono)" }}>
                        ⚠️ ERROR: {premiumError}
                      </div>
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
                      disabled={!!loadingPremium}
                      style={{ padding: "10px", fontSize: "11.5px", fontWeight: "bold" }}
                    >
                      {loadingPremium ? "PROCESSING PAYWALL..." : connected ? "DECRYPT DOSSIER A" : "CONNECT WALLET & DECRYPT"}
                    </button>
                  </div>
                )}
              </div>

              {/* DePIN Sensor Panel */}
              <div style={{ background: "#080808", border: "1px solid #201b10", padding: "20px", borderRadius: "2px", display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "12px", fontWeight: "bold", color: "#ffffff", letterSpacing: "0.05em" }}>
                    DOSSIER B: SOLANA SOLVIVAL REAL STATUS
                  </span>
                  <span className="tag" style={{ color: "#f0c929", borderColor: "rgba(240,201,41,0.4)", padding: "3px 8px", fontSize: "10px" }}>
                    $0.02 USDC
                  </span>
                </div>

                {depinIntel ? (
                  <div style={{ background: "rgba(240, 201, 41, 0.02)", border: "1px solid rgba(240, 201, 41, 0.25)", padding: "16px", borderRadius: "2px", fontFamily: "var(--mono)", fontSize: "12px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed rgba(240, 201, 41, 0.15)", paddingBottom: "6px" }}>
                      <span style={{ color: "#00ffcc", fontWeight: "bold", fontSize: "12.5px" }}>[ DECRYPTION GRANTED // LEVEL 5 ]</span>
                      <span style={{ color: "#2ecc40", fontSize: "10px", fontWeight: "bold", background: "rgba(46, 204, 64, 0.1)", padding: "2px 6px", borderRadius: "2px" }}>✓ LIVE DATA: SOLANA MAINNET RPC</span>
                    </div>
                    <div style={{ color: "#ffffff", fontWeight: "bold", fontSize: "13.5px" }}>{depinIntel.depin?.scannerName}</div>
                    <div style={{ color: "rgba(255, 255, 255, 0.95)", fontSize: "12px" }}>
                      Health Status: <span style={{ color: "#00ffcc", fontWeight: "bold" }}>{depinIntel.depin?.networkHealth}</span> | Monitored DePIN Nodes: <span style={{ color: "#ffffff", fontWeight: "bold" }}>{depinIntel.depin?.onlineNodes}</span>
                    </div>

                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", padding: "10px", borderRadius: "2px", display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px" }}>
                      <div style={{ color: "#ffffff", fontWeight: "bold", borderBottom: "1px dashed rgba(255,255,255,0.1)", paddingBottom: "4px", marginBottom: "4px" }}>📈 SOLANA L1 & FAREMETER TELEMETRY</div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(255,255,255,0.7)" }}>LIVE PERFORMANCE TPS:</span><span style={{ color: "#00ffcc", fontWeight: "bold" }}>{depinIntel.depin?.liveTps} TPS</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(255,255,255,0.7)" }}>AVG PRIORITY FEE:</span><span style={{ color: "#f0c929", fontWeight: "bold" }}>{depinIntel.depin?.avgPriorityFee}</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(255,255,255,0.7)" }}>CIRCULATING / TOTAL SOL:</span><span style={{ color: "#ffffff" }}>{depinIntel.depin?.circulatingSol?.toLocaleString()} / {depinIntel.depin?.totalSol?.toLocaleString()} SOL</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(255,255,255,0.7)" }}>NETWORK LOCKUP RATIO:</span><span style={{ color: "#00ffcc", fontWeight: "bold" }}>{depinIntel.depin?.collateralRatio}</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(255,255,255,0.7)" }}>STAKING INFLATION RATE:</span><span style={{ color: "#ffffff" }}>{depinIntel.depin?.inflationPercentage}</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(255,255,255,0.7)" }}>EPOCH PROGRESS:</span><span style={{ color: "#ffffff" }}>{depinIntel.depin?.epochProgress} (Epoch {depinIntel.depin?.epoch})</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(255,255,255,0.7)" }}>SOLANA SLOT:</span><span style={{ color: "#ffffff" }}>{depinIntel.depin?.slot}</span></div>
                    </div>

                    {depinIntel.depin?.topActiveNodes && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", borderTop: "1px dashed rgba(255,255,255,0.15)", paddingTop: "10px" }}>
                        <div style={{ color: "#00ffcc", fontWeight: "bold", fontSize: "11.5px" }}>✅ ACTIVE DEPIN INFRASTRUCTURE (TOP STAKE):</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          {depinIntel.depin.topActiveNodes.map((n: any, idx: number) => {
                            const shortPubKey = n.votePubkey.slice(0, 8) + "..." + n.votePubkey.slice(-8);
                            return (
                              <div key={idx} style={{ display: "flex", justifyContent: "space-between", background: "rgba(255,255,255,0.02)", padding: "4px 8px", borderRadius: "2px", border: "1px solid rgba(255,255,255,0.05)", fontSize: "11px" }}>
                                <span>{idx + 1}. Node: {shortPubKey}</span>
                                <span>Comm: {n.commission}% | Stake: {n.stakeSol?.toLocaleString()} SOL</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {depinIntel.depin?.allDelinquentNodes && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", borderTop: "1px dashed rgba(255,255,255,0.15)", paddingTop: "10px" }}>
                        <div style={{ color: "var(--accent)", fontWeight: "bold", fontSize: "11.5px" }}>⚠️ COMPROMISED / DELINQUENT DEPIN NODES:</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          {depinIntel.depin.allDelinquentNodes.map((n: any, idx: number) => {
                            const shortPubKey = n.votePubkey.slice(0, 8) + "..." + n.votePubkey.slice(-8);
                            return (
                              <div key={idx} style={{ display: "flex", justifyContent: "space-between", background: "rgba(255, 77, 77, 0.02)", padding: "4px 8px", borderRadius: "2px", border: "1px solid rgba(255, 77, 77, 0.08)", fontSize: "11px" }}>
                                <span style={{ color: "var(--accent)" }}>Node: {shortPubKey}</span>
                                <span>Offline since: Slot {n.lastVote}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.9)", borderTop: "1px dashed rgba(255,255,255,0.15)", paddingTop: "10px" }}>
                      <strong>Active System Alerts:</strong>
                      <ul style={{ margin: "4px 0 0 12px", padding: 0 }}>
                        {depinIntel.depin?.sensorAlerts?.map((alert: string, i: number) => (
                          <li key={i} style={{ marginBottom: "4px", listStyleType: "square", color: "var(--accent)" }}>{alert}</li>
                        ))}
                      </ul>
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
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(255,255,255,0.6)" }}>Facilitator Gate:</span><span>https://facilitator.payai.network</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(255,255,255,0.6)" }}>USDC Mint Address:</span><span style={{ fontSize: "10px" }}>EPjFWdd...t1v (Solana Mainnet)</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(255,255,255,0.6)" }}>Settlement Price:</span><span style={{ fontWeight: "bold", color: "#f0c929" }}>0.02 USDC</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(255,255,255,0.6)" }}>Verification State:</span><span style={{ color: "#2ecc40", fontWeight: "bold" }}>✓ SETTLED // ON-CHAIN</span></div>
                    </div>

                    {/* Actions Row */}
                    <div style={{ display: "flex", gap: "12px", borderTop: "1px dashed rgba(255,255,255,0.15)", paddingTop: "10px", marginTop: "4px", alignItems: "center", flexWrap: "wrap" }}>
                      <button
                        onClick={() => {
                          const proofText = depinTxid ? `\nProof: https://solscan.io/tx/${depinTxid}` : "";
                          setShareModalData({
                            content: `◉ DECRYPTED DOSSIER B: SOLANA SOLVIVAL REAL STATUS\n\nScanner: ${depinIntel.depin?.scannerName}\nHealth: ${depinIntel.depin?.networkHealth}\nOnline Nodes: ${depinIntel.depin?.onlineNodes}\nSolana Gas (Faremeter): ${depinIntel.depin?.avgPriorityFee}\nEpoch: ${depinIntel.depin?.epoch}${proofText}`
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

                      {depinIntel.depin?.explorerUrl && (
                        <a
                          href={depinIntel.depin.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#00e5ff", fontFamily: "var(--mono)", fontSize: "11px", textDecoration: "underline", fontWeight: "bold" }}
                        >
                          [ 🔍 EXPLORE x402 ]
                        </a>
                      )}

                      <button
                        onClick={() => decryptIntel("/api/intel/depin", "depin")}
                        style={{ background: "none", border: "none", color: "rgba(255, 255, 255, 0.7)", fontFamily: "var(--mono)", fontSize: "11px", cursor: "pointer", padding: 0, textDecoration: "underline", marginLeft: "auto", fontWeight: "bold" }}
                      >
                        [ ↻ RUN AGAIN ]
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ fontSize: "11.5px", color: "#f0c929", fontWeight: "bold", fontFamily: "var(--mono)", background: "rgba(240, 201, 41, 0.05)", padding: "10px", border: "1px solid rgba(240, 201, 41, 0.2)", borderRadius: "2px", textAlign: "center" }}>
                      STATUS: {loadingDepin ? `[ ACTIVE: ${loadingDepin} ]` : "[ LOCKED // x402 PROTOCOL: 0.02 USDC REQUIRED ]"}
                    </div>
                    {depinError && (
                      <div style={{ fontSize: "11px", color: "var(--accent)", fontFamily: "var(--mono)" }}>
                        ⚠️ ERROR: {depinError}
                      </div>
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
                      disabled={!!loadingDepin}
                      style={{ padding: "10px", fontSize: "11.5px", fontWeight: "bold", background: "#f0c929", color: "#000", border: "none" }}
                    >
                      {loadingDepin ? "PROCESSING PAYWALL..." : connected ? "DECRYPT DOSSIER B" : "CONNECT WALLET & DECRYPT"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Compute Allocation HUD Sidebar */}
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
          <div>
            <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--accent)", letterSpacing: "0.15em", marginBottom: "12px" }}>
              [ COMPUTE ALLOCATION HUD ]
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", background: "#0c0c0c", border: "1px solid #161616", padding: "12px", borderRadius: "2px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>OPERATIVE:</span>
                <span style={{ color: "var(--text)" }}>{apocalypticName || "SUBJECT"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>UPLINK TIER:</span>
                <span style={{ color: "var(--accent)" }}>{connected ? "LEVEL 5 (DIRECTOR)" : "LEVEL 1 (PUBLIC)"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>STATUS:</span>
                <span style={{ color: "#2ecc40" }}>ACTIVE CONNECT</span>
              </div>
            </div>
          </div>

          {/* Treasury Buyback Module */}
          <div>
            <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "#f0c929", letterSpacing: "0.15em", marginBottom: "12px" }}>
              [ TREASURY BUYBACK AUDIT ]
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", background: "#0c0a05", border: "1px solid rgba(240, 201, 41, 0.15)", padding: "12px", borderRadius: "2px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "9px" }}>VAULT ADDRESS:</span>
                <a 
                  href="https://solscan.io/account/AUCYMsSZXASMiXfjLNL26NF7sPehUA4ncEzTCx8MdSYg" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: "#00e5ff", fontSize: "10px", textDecoration: "underline", wordBreak: "break-all" }}
                >
                  AUCYMsSZXASMiXfjLNL26NF7sPehUA4ncEzTCx8MdSYg
                </a>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed rgba(240, 201, 41, 0.1)", paddingTop: "8px" }}>
                <span>VAULT SOL:</span>
                <span style={{ color: "#ffffff", fontWeight: "bold" }}>
                  {vaultSolBalance !== null ? `${vaultSolBalance.toFixed(4)} SOL` : "LOADING..."}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>VAULT USDC:</span>
                <span style={{ color: "#f0c929", fontWeight: "bold" }}>
                  {vaultUsdcBalance !== null ? `${vaultUsdcBalance.toFixed(2)} USDC` : "LOADING..."}
                </span>
              </div>


            </div>
          </div>

          <div>
            <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text)", letterSpacing: "0.15em", marginBottom: "8px" }}>
              COMMAND PROTOCOL INDEX
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ borderBottom: "1px dashed var(--border)", paddingBottom: "6px" }}>
                <span style={{ color: "#2ecc40", fontWeight: "bold" }}>/help</span>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                  Display technical helper documentation (FREE).
                </div>
              </div>

              <div style={{ borderBottom: "1px dashed var(--border)", paddingBottom: "6px" }}>
                <span style={{ color: "#2ecc40", fontWeight: "bold" }}>/bio</span>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                  Retrieve active Bio-Score security scans (FREE).
                </div>
              </div>

              <div style={{ borderBottom: "1px dashed var(--border)", paddingBottom: "6px" }}>
                <span style={{ color: "var(--accent)", fontWeight: "bold" }}>/scan</span>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                  Run deep metadata leak analysis.
                </div>
              </div>

              <div>
                <span style={{ color: "var(--accent)", fontWeight: "bold" }}>/decrypt [ID]</span>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                  Decrypt classified threat records.
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "auto", borderTop: "1px dashed var(--border)", paddingTop: "16px" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.15em", marginBottom: "6px" }}>
              SYSTEM TELEMETRY INTEGRITY
            </div>
            <div style={{ fontSize: "10px", display: "flex", flexDirection: "column", gap: "4px", color: "var(--text-muted)" }}>
              <div>• CORE TEMP: 34.2°C (STABLE)</div>
              <div>• RPC LATENCY: 38ms (SOLANA MAINNET)</div>
              <div>• SHIELD STATE: BUFFER SECURED</div>
              <div>• MEMORY MATRIX: CONTEXT INJECTED</div>
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
