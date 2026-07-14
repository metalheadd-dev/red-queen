"use client";
import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useAuth } from "@/components/AuthProvider";
import AccessGuard from "@/components/AccessGuard";
import dynamic from "next/dynamic";
import Link from "next/link";
import { generateApocalypticName } from "@/lib/names";
import { getClearanceLevel, DEFAULT_STATS, parseStatsFromAI } from "@/lib/progression";
import { Connection, PublicKey, TransactionMessage, VersionedTransaction, ComputeBudgetProgram, TransactionInstruction } from "@solana/web3.js";
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createTransferCheckedInstruction } from "@solana/spl-token";
import { isValidSolanaPublicKey, getWorkingConnection } from "@/lib/solana";

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
  xp_rank?: number | null;
  bio_score_rank?: number | null;
  streak_count?: number;
  last_checkin_at?: string | null;
  total_checkins?: number;
  longest_streak?: number;
  pulse_tier?: number;
  highest_pulse_tier_reached?: number;
};

// Client-side SHA-256 generator to display the Hashed Passport
async function generateHashedPassport(pubkey: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(pubkey + "red-queen-cyber-salt-2026");
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgBuffer as any);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function OperativeProfilePage() {
  const { publicKey, connected, wallet: walletObj, disconnect, sendTransaction, signTransaction } = useWallet();
  const { setVisible } = useWalletModal();
  const { user, authIdentifier, logout, session } = useAuth();

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
  const [userQuests, setUserQuests] = useState<any[]>([]);
  const [loadingQuests, setLoadingQuests] = useState(false);
  const [proofInputs, setProofInputs] = useState<{ [key: string]: string }>({});
  const [submittingQuest, setSubmittingQuest] = useState<string | null>(null);

  const [premiumIntel, setPremiumIntel] = useState<any | null>(null);
  const [depinIntel, setDepinIntel] = useState<any | null>(null);
  const [loadingPremium, setLoadingPremium] = useState<string | null>(null);
  const [loadingDepin, setLoadingDepin] = useState<string | null>(null);
  const [premiumError, setPremiumError] = useState<string | null>(null);
  const [depinError, setDepinError] = useState<string | null>(null);
  const [premiumTxid, setPremiumTxid] = useState<string | null>(null);
  const [depinTxid, setDepinTxid] = useState<string | null>(null);

  const [breachActive, setBreachActive] = useState(false);
  const [breachUntil, setBreachUntil] = useState<string | null>(null);
  const [transmittingPulse, setTransmittingPulse] = useState(false);
  const [activityTab, setActivityTab] = useState<"quests" | "x402" | "logs" | "wallet">("quests");

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
        headers["X-Operative-Token"] = `Bearer ${token}`;
        headers["Authorization"] = `Bearer ${token}`;
      }
      let res = await fetch(endpoint, { headers });

      if (res.status === 200) {
        const data = await res.json();
        setIntel(data);
        setLoading(null);

        // Extract payment response header if present
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
        // Reload profile to refresh XP and sub-stats
        fetchProfile();
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

        // ── x402 SVM Exact Scheme: correct payload construction ─────────────
        // The x402 protocol is NOT a send-then-verify flow.
        // The client PARTIALLY SIGNS the transaction. The facilitator (payai.network)
        // receives the partial tx via PAYMENT-SIGNATURE header, co-signs it as fee payer,
        // simulates it, and submits it. We never broadcast ourselves.
        //
        // Required payload structure for PAYMENT-SIGNATURE header:
        //   base64( JSON.stringify({ x402Version: 2, payload: { transaction: "<base64-wire-tx>" } }) )
        //
        // The base64 wire transaction must be built with @solana/kit (not @solana/web3.js)
        // and must contain:
        //   1. ComputeBudget SetComputeUnitLimit
        //   2. ComputeBudget SetComputeUnitPrice
        //   3. SPL Token TransferChecked (NOT Transfer)
        //   4. Memo instruction (random nonce)

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
        // Reload profile to refresh XP and sub-stats
        fetchProfile();


      } else {
        throw new Error(`Decryption portal returned status: HTTP ${res.status}`);
      }
    } catch (err: any) {
      console.error("Decryption failed:", err);
      setError(err?.message || "Secure connection decryption failure.");
      setLoading(null);
    }
  };

  const handleTransmitPulse = async () => {
    if (!wallet) return;
    setTransmittingPulse(true);
    try {
      const token = session?.access_token;
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ wallet_address: wallet })
      });
      const data = await res.json();
      if (res.status === 200) {
        alert(`Pulse Transmitted successfully! Pulse chain: ${data.streak_count} days.`);
        fetchProfile();
      } else {
        alert("Transmission Failed: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Error transmitting pulse: " + err.message);
    }
    setTransmittingPulse(false);
  };

  useEffect(() => {
    async function checkBreach() {
      try {
        const res = await fetch("/api/admin/breach");
        const data = await res.json();
        if (data.success && data.breach) {
          setBreachActive(!!data.breach.active);
          setBreachUntil(data.breach.until);
        }
      } catch (e) {
        console.warn("Failed to check containment breach status:", e);
      }
    }
    checkBreach();
  }, []);

  const generatedName = wallet ? generateApocalypticName(wallet) : "";

  // Render hashed passport once wallet connects
  useEffect(() => {
    if (wallet) {
      generateHashedPassport(wallet).then((hash) => setHashedPassport(hash));
    } else {
      setHashedPassport("");
    }
  }, [wallet]);

  const getHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    } else if (typeof window !== "undefined" && wallet) {
      const savedSig = localStorage.getItem(`rq_sol_sig:${wallet}`);
      if (savedSig) {
        try {
          const { signature, message } = JSON.parse(savedSig);
          headers["X-Solana-PublicKey"] = wallet;
          headers["X-Solana-Signature"] = signature;
          headers["X-Solana-Message"] = message;
        } catch (e) {}
      }
    }
    return headers;
  }, [session, wallet]);

  const fetchProfile = useCallback(async () => {
    if (!wallet) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/profile?wallet=${wallet}`, {
        headers: getHeaders()
      });
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
  }, [wallet, generatedName, session, getHeaders]);

  const fetchHistory = useCallback(async () => {
    if (!wallet) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/history?wallet=${wallet}`, {
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.history) {
        setHistory(data.history);
      }
    } catch (e) {
      console.error("Failed to load history:", e);
    }
    setLoadingHistory(false);
  }, [wallet, session, getHeaders]);

  const fetchUserQuests = useCallback(async () => {
    if (!wallet) return;
    setLoadingQuests(true);
    try {
      const res = await fetch("/api/quests/user", {
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.userQuests) {
        setUserQuests(data.userQuests);
      }
    } catch (e) {
      console.error("Failed to fetch user quests:", e);
    }
    setLoadingQuests(false);
  }, [wallet, session, getHeaders]);

  const handleSubmitQuest = async (questId: string) => {
    const link = proofInputs[questId] || "";
    if (!link.trim()) {
      alert("Please enter a valid proof link.");
      return;
    }

    setSubmittingQuest(questId);
    try {
      const res = await fetch("/api/quests/submit", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ questId, proofLink: link })
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        alert("Operation submission sent successfully. Status: Under Approval.");
        setProofInputs(prev => ({ ...prev, [questId]: "" }));
        await fetchUserQuests();
      }
    } catch (e: any) {
      alert("Failed to submit proof: " + e.message);
    }
    setSubmittingQuest(null);
  };

  useEffect(() => {
    async function checkBalance() {
      let addressToCheck = "";
      if (solanaWalletAddress && isValidSolanaPublicKey(solanaWalletAddress)) {
        addressToCheck = solanaWalletAddress;
      } else if (profile?.linked_wallet_address && isValidSolanaPublicKey(profile.linked_wallet_address)) {
        addressToCheck = profile.linked_wallet_address;
      } else if (wallet && isValidSolanaPublicKey(wallet)) {
        addressToCheck = wallet;
      }

      if (!addressToCheck) {
        setThreatBalance(null);
        return;
      }
      setLoadingBalance(true);
      try {
        const connection = await getWorkingConnection(false);
        const threatATA = await getAssociatedTokenAddress(THREAT_MINT, new PublicKey(addressToCheck));
        
        try {
          const tokenBalance = await connection.getTokenAccountBalance(threatATA);
          setThreatBalance(tokenBalance.value.uiAmount || 0);
        } catch (e: any) {
          // If the associated token account doesn't exist, they hold 0 $THREAT
          if (e.message?.includes("could not find account") || e.message?.includes("does not exist") || e.message?.includes("Invalid param")) {
            setThreatBalance(0);
          } else {
            throw e;
          }
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
      const token = session?.access_token;
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: getHeaders(),
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
      fetchUserQuests();
    }
  }, [wallet, fetchProfile, fetchHistory, fetchUserQuests]);

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
      const token = session?.access_token;
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: getHeaders(),
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
      const token = session?.access_token;
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: getHeaders(),
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

  const lastCheckinStr = profile?.last_checkin_at;
  const lastCheckin = lastCheckinStr ? new Date(lastCheckinStr) : null;
  const hoursSinceLast = lastCheckin ? (new Date().getTime() - lastCheckin.getTime()) / (1000 * 60 * 60) : null;
  const alreadyCheckedIn = hoursSinceLast !== null && hoursSinceLast < 20;

  const streakCount = profile?.streak_count || 0;
  const filledDots = streakCount >= 7 ? 7 : streakCount;
  
  const breachRemainingHours = breachActive && breachUntil
    ? Math.max(0, Math.floor((new Date(breachUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60)))
    : null;

  const highestPulseTier = profile?.highest_pulse_tier_reached || 0;
  let pulseTitle = "";
  if (highestPulseTier === 1) pulseTitle = "STEADY OPERATIVE";
  else if (highestPulseTier === 2) pulseTitle = "HARDENED SURVIVOR";
  else if (highestPulseTier === 3) pulseTitle = "UNDYING";

  const displayName = customName || generatedName;
  const scoreNum = profile?.last_bio_score ?? null;
  const displayScore = scoreNum ?? 0;
  const stats = profile?.stats || DEFAULT_STATS;
  const clearance = getClearanceLevel(displayScore);
  const scoreColor = clearance.color;

  const filteredScenarios = activeFilter === "ALL"
    ? ALL_SCENARIOS
    : ALL_SCENARIOS.filter((s) => s.cat === activeFilter);

  return (
    <div style={{ padding: "60px 0 0", minHeight: "100vh", background: "#050505" }}>
      {/* Header / Profile Card */}
      <div style={{ borderBottom: "1px solid var(--border)", padding: "40px 24px", background: "var(--surface)" }}>
        <div className="container">
          <div className="tag tag-red" style={{ marginBottom: "16px" }}>OPERATIVE PASSPORT — SECURE UPLINK</div>
          
          <div style={{ display: "flex", gap: "32px", flexWrap: "wrap", width: "100%" }}>
            
            {/* Left Column: Identity & Actions */}
            <div style={{ flex: "1.2 1 360px", display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                {/* Scanline Avatar */}
                <div style={{
                  width: "80px", height: "80px", borderRadius: "2px",
                  border: "1px solid var(--accent)", background: "rgba(255, 77, 77, 0.03)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, position: "relative", overflow: "hidden",
                  boxShadow: "0 0 12px rgba(255, 77, 77, 0.15)"
                }}>
                  <svg width="50" height="50" viewBox="0 0 100 100" style={{ filter: "drop-shadow(0 0 3px rgba(255, 0, 51, 0.5))" }}>
                    <circle cx="50" cy="50" r="40" stroke="var(--accent)" strokeWidth="1.5" fill="none" strokeDasharray="6, 6" />
                    <circle cx="50" cy="50" r="25" stroke="var(--accent)" strokeWidth="1" fill="none" opacity="0.6" />
                    <path d="M 50 5 L 50 20 M 50 80 L 50 95 M 5 50 L 20 50 M 80 50 L 95 50" stroke="var(--accent)" strokeWidth="2" />
                    <circle cx="50" cy="50" r="4" fill="var(--accent)" />
                  </svg>
                  <div style={{
                    position: "absolute", bottom: "3px", left: 0, right: 0,
                    textAlign: "center", fontFamily: "var(--mono)", fontSize: "7px", color: "var(--accent)", letterSpacing: "0.1em"
                  }}>
                    SEC-ID
                  </div>
                </div>

                {/* Identity Details */}
                <div style={{ flex: 1 }}>
                  {editingName ? (
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <input
                        value={customName}
                        onChange={(e) => { setCustomName(e.target.value.toUpperCase()); setSaved(false); }}
                        onKeyDown={(e) => { if (e.key === "Enter") confirmName(customName); }}
                        style={{
                          fontFamily: "var(--mono)", fontSize: "18px", fontWeight: 700,
                          background: "rgba(255, 77, 77, 0.05)", border: "1px solid var(--accent)",
                          color: "var(--text)", padding: "4px 8px", outline: "none", borderRadius: "2px",
                          maxWidth: "200px", width: "100%"
                        }}
                        maxLength={36}
                        autoFocus
                      />
                      <button className="btn btn-primary" style={{ fontSize: "10px", padding: "4px 8px" }}
                        onClick={() => confirmName(customName)}>CONFIRM</button>
                    </div>
                  ) : (
                    <div>
                      <h2 className="glow-text" style={{ fontSize: "clamp(18px, 3vw, 24px)", margin: 0, color: "var(--text)", letterSpacing: "0.05em", fontFamily: "var(--title-font)", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        {displayName}
                        {pulseTitle && (
                          <span style={{
                            fontFamily: "var(--mono)",
                            fontSize: "10px",
                            fontWeight: "bold",
                            color: "#f0c929",
                            background: "rgba(240, 201, 41, 0.08)",
                            border: "1px solid rgba(240, 201, 41, 0.25)",
                            padding: "2px 6px",
                            borderRadius: "2px",
                            letterSpacing: "0.05em"
                          }}>
                            {pulseTitle}
                          </span>
                        )}
                      </h2>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
                        {profile && (typeof profile.xp_rank === "number" || typeof profile.bio_score_rank === "number") && (
                          <div style={{
                            fontFamily: "var(--mono)",
                            fontSize: "10px",
                            color: "#00ffcc",
                            letterSpacing: "0.05em"
                          }}>
                            {typeof profile.xp_rank === "number" && `RANK #${profile.xp_rank}`}
                          </div>
                        )}
                        <div style={{ height: "10px", width: "1px", background: "rgba(255,255,255,0.1)" }} />
                        <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-muted)" }}>
                          LVL {stats.level}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Bio-Score Onboarding state check */}
                  <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)", letterSpacing: "0.1em" }}>BIO-SCORE:</span>
                    {displayScore === 0 ? (
                      <span style={{ fontFamily: "var(--mono)", fontSize: "9.5px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text-muted)", padding: "2px 6px", borderRadius: "2px" }}>
                        CALIBRATION REQUIRED
                      </span>
                    ) : (
                      <span style={{ fontFamily: "var(--mono)", fontSize: "9.5px", background: `${scoreColor}10`, border: `1px solid ${scoreColor}30`, color: scoreColor, padding: "2px 6px", borderRadius: "2px", fontWeight: "bold" }}>
                        {displayScore}% — {displayScore >= 80 ? "EXCELLENT" : displayScore >= 50 ? "NOMINAL" : "CRITICAL"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Cryptographic signature */}
              <div style={{
                background: "rgba(10, 10, 10, 0.6)",
                border: "1px solid var(--border)",
                borderLeft: "2px solid var(--accent)",
                padding: "10px 14px",
                borderRadius: "2px",
                boxShadow: "inset 0 1px 3px rgba(0,0,0,0.8)"
              }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)", letterSpacing: "0.1em", marginBottom: "4px", display: "flex", justifyContent: "space-between" }}>
                  <span>CRYPTOGRAPHIC PASSPORT SIGNATURE</span>
                  <span style={{ color: "rgba(255,77,77,0.3)" }}>[ SHA-256 ]</span>
                </div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--accent)", wordBreak: "break-all", opacity: 0.9 }}>
                  {hashedPassport || "COMPUTING ANONYMOUS PASSPORT..."}
                </div>
              </div>

              {/* Action Buttons Panel */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "6px" }}>
                {/* Main Primary CTA */}
                <Link href="/terminal" style={{ textDecoration: "none" }}>
                  <button className="btn" style={{
                    width: "100%",
                    fontSize: "13px",
                    fontFamily: "var(--mono)",
                    background: "var(--accent)",
                    borderColor: "var(--accent)",
                    color: "#fff",
                    boxShadow: "0 0 12px rgba(255, 77, 77, 0.25)",
                    padding: "10px 20px",
                    fontWeight: "bold",
                    letterSpacing: "0.05em",
                    cursor: "pointer"
                  }}>
                    ▶ OPEN SYSTEM TERMINAL
                  </button>
                </Link>

                {/* Secondary controls grouped inline */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button onClick={() => setEditingName(true)} className="btn btn-ghost" style={{ fontSize: "10px", padding: "5px 10px", flex: 1, minWidth: "75px" }}>
                    ✎ RENAME
                  </button>
                  <Link href="/leaderboard" style={{ textDecoration: "none", flex: 1, minWidth: "100px" }}>
                    <button className="btn btn-ghost" style={{ fontSize: "10px", padding: "5px 10px", width: "100%" }}>
                      🏆 LEADERBOARD
                    </button>
                  </Link>
                  <Link href="/threat-vector" style={{ textDecoration: "none", flex: 1, minWidth: "100px" }}>
                    <button className="btn btn-ghost" style={{ fontSize: "10px", padding: "5px 10px", width: "100%" }}>
                      🛰️ SECTOR MATRIX
                    </button>
                  </Link>
                  <button onClick={saveProfile} disabled={saving} className="btn btn-ghost" style={{ fontSize: "10px", padding: "5px 10px", flex: 1.2, minWidth: "110px", color: saved ? "#00ffcc" : "var(--text)" }}>
                    {saving ? "SAVING..." : saved ? "✓ SECURED" : "💾 SAVE PROFILE"}
                  </button>
                  {user && (
                    <button onClick={() => logout()} className="btn btn-ghost" style={{ fontSize: "10px", padding: "5px 10px", flex: 1, minWidth: "80px", color: "var(--accent)", borderColor: "rgba(255,77,77,0.2)" }}>
                      ⎋ LOGOUT
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Pulse Protocol Check-in Module */}
            <div style={{
              flex: "0.8 1 280px",
              background: "rgba(10, 10, 10, 0.4)",
              border: "1px solid var(--border)",
              borderLeft: `3px solid ${alreadyCheckedIn ? "#00ffcc" : "var(--accent)"}`,
              padding: "20px",
              borderRadius: "2px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.5)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)", letterSpacing: "0.15em" }}>
                  PULSE PROTOCOL STATUS
                </span>
                {hoursSinceLast !== null && hoursSinceLast > 48 && (
                  <span style={{ fontFamily: "var(--mono)", fontSize: "8.5px", background: "rgba(255,77,77,0.1)", border: "1px solid rgba(255,77,77,0.3)", color: "var(--accent)", padding: "1px 5px", borderRadius: "2px", fontWeight: "bold" }}>
                    PULSE LOST — RESET
                  </span>
                )}
              </div>

              {/* Streak Day Counter */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: "20px", fontWeight: "bold", color: "#fff" }}>
                  PULSE CHAIN: <span style={{ color: alreadyCheckedIn ? "#00ffcc" : "var(--accent)" }}>{streakCount} DAYS</span>
                </span>
                <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", marginTop: "2px" }}>
                  TOTAL UPLINKS: <span style={{ color: "#fff", fontWeight: "bold", marginRight: "12px" }}>{profile?.total_checkins || 0}</span>
                  LONGEST CHAIN: <span style={{ color: "#f0c929", fontWeight: "bold" }}>{profile?.longest_streak || 0} DAYS</span>
                </span>
                <span style={{ fontFamily: "var(--mono)", fontSize: "10.5px", color: "var(--text-dim)", marginTop: "6px", lineHeight: "1.4" }}>
                  RED QUEEN tracks your pulse. Miss a transmission and containment assumes the worst.
                </span>
              </div>

              {/* 7-Dot strip */}
              <div style={{ display: "flex", gap: "8px", margin: "4px 0" }}>
                {Array.from({ length: 7 }).map((_, i) => {
                  const isFilled = i < filledDots;
                  return (
                    <div
                      key={i}
                      style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        background: isFilled ? (alreadyCheckedIn ? "#00ffcc" : "var(--accent)") : "transparent",
                        border: `2px solid ${isFilled ? (alreadyCheckedIn ? "#00ffcc" : "var(--accent)") : "rgba(255,255,255,0.15)"}`,
                        boxShadow: isFilled ? `0 0 8px ${alreadyCheckedIn ? "#00ffcc" : "var(--accent)"}` : "none",
                        transition: "all 0.3s"
                      }}
                      title={isFilled ? `Day ${i + 1} secure` : `Day ${i + 1} pending`}
                    />
                  );
                })}
              </div>

              {/* Containment Breach Warning Banner */}
              {breachActive && (
                <div style={{
                  background: "rgba(255, 77, 77, 0.05)",
                  border: "1px solid rgba(255, 77, 77, 0.2)",
                  padding: "8px 10px",
                  borderRadius: "2px",
                  fontFamily: "var(--mono)",
                  fontSize: "10.5px",
                  lineHeight: "1.4"
                }}>
                  {alreadyCheckedIn ? (
                    <span style={{ color: "#00ffcc", fontWeight: "bold" }}>
                      ✓ SIGNAL TRANSMITTED // SYSTEM BREACH IN PROGRESS (WINDOW SECURED)
                    </span>
                  ) : (
                    <span style={{ color: "var(--accent)", fontWeight: "bold" }}>
                      ⚠️ SIGNAL WINDOW CLOSING — TRANSMIT PULSE WITHIN {breachRemainingHours ?? 0}H OR THE CHAIN BREAKS
                    </span>
                  )}
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleTransmitPulse}
                disabled={alreadyCheckedIn || transmittingPulse}
                className="btn"
                style={{
                  width: "100%",
                  padding: "10px",
                  fontFamily: "var(--mono)",
                  fontSize: "11px",
                  fontWeight: "bold",
                  cursor: alreadyCheckedIn ? "default" : "pointer",
                  background: alreadyCheckedIn ? "rgba(0, 255, 204, 0.04)" : "var(--accent)",
                  borderColor: alreadyCheckedIn ? "rgba(0, 255, 204, 0.2)" : "var(--accent)",
                  color: alreadyCheckedIn ? "#00ffcc" : "#fff",
                  boxShadow: alreadyCheckedIn ? "none" : "0 0 10px rgba(255,77,77,0.2)"
                }}
              >
                {transmittingPulse ? "[ COUPLING UPLINK SENT... ]" : alreadyCheckedIn ? "[ ✓ PULSE SENT ]" : "[ TRANSMIT PULSE ]"}
              </button>
            </div>
            
          </div>
        </div>
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
              <div style={{ fontFamily: "var(--mono)", fontSize: "14px", color: "var(--accent)", letterSpacing: "0.2em", marginBottom: "4px" }}>
                [ SYSTEM DIAGNOSTIC XP REPORT ]
              </div>
              <h3 style={{ fontFamily: "var(--mono)", fontSize: "20px", margin: 0, textTransform: "uppercase" }}>
                🛡️ PERMANENT SYSTEM CLEARANCE
              </h3>
            </div>

            <p style={{ fontSize: "14.5px", color: "var(--text-dim)", lineHeight: "1.7", marginBottom: "24px" }}>
              <strong>What is this?</strong> Your Level and Experience Points (XP) represent your permanent training record on the platform. You earn XP by checking in, talking to the terminal, and performing audits. This score <strong>never decreases or decays</strong>. Raising your XP unlocks higher clearance tiers.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }} className="responsive-grid-2">
              
              {/* Left Column: XP and Boosters */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "14px", color: "var(--text)", fontWeight: "bold" }}>
                    OPERATIVE PROGRESS: LEVEL {stats.level}
                  </span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "12.5px", color: "var(--accent)", fontWeight: "bold" }}>
                    {stats.xp} Total XP ({stats.xp % 100}/100 XP to next level)
                  </span>
                </div>
                <div className="threat-bar-wrap" style={{ height: "8px", background: "#111", marginBottom: "16px" }}>
                  <div className="threat-bar-fill" style={{ width: `${stats.xp % 100}%`, background: "var(--accent)" }} />
                </div>

                {/* Inline Boosters Badges */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
                  <span style={{
                    fontFamily: "var(--mono)",
                    fontSize: "10px",
                    background: threatBalance && threatBalance > 0 ? "rgba(0, 255, 204, 0.08)" : "rgba(255, 255, 255, 0.02)",
                    border: `1px solid ${threatBalance && threatBalance > 0 ? "rgba(0, 255, 204, 0.2)" : "rgba(255, 255, 255, 0.08)"}`,
                    color: threatBalance && threatBalance > 0 ? "#00ffcc" : "var(--text-muted)",
                    padding: "3px 8px",
                    borderRadius: "2px",
                    fontWeight: "bold"
                  }}>
                    $THREAT HODL: {threatBalance && threatBalance > 0 ? "2.0x BOOST" : "1.0x BASE"}
                  </span>
                  <span style={{
                    fontFamily: "var(--mono)",
                    fontSize: "10px",
                    background: "rgba(255, 77, 77, 0.08)",
                    border: "1px solid rgba(255, 77, 77, 0.2)",
                    color: "var(--accent)",
                    padding: "3px 8px",
                    borderRadius: "2px",
                    fontWeight: "bold"
                  }}>
                    CLEARANCE: {
                      stats.level >= 5 ? "2.0x BOOST" : 
                      stats.level >= 4 ? "1.75x BOOST" : 
                      stats.level >= 3 ? "1.5x BOOST" : 
                      stats.level >= 2 ? "1.25x BOOST" : 
                      "1.0x BASE"
                    }
                  </span>
                  <span style={{
                    fontFamily: "var(--mono)",
                    fontSize: "10px",
                    background: "rgba(240, 201, 41, 0.08)",
                    border: "1px solid rgba(240, 201, 41, 0.2)",
                    color: "#f0c929",
                    padding: "3px 8px",
                    borderRadius: "2px",
                    fontWeight: "bold"
                  }}>
                    COMBINED: {((threatBalance && threatBalance > 0 ? 2.0 : 1.0) * 
                      (stats.level >= 5 ? 2.0 : 
                       stats.level >= 4 ? 1.75 : 
                       stats.level >= 3 ? 1.5 : 
                       stats.level >= 2 ? 1.25 : 
                       1.0)).toFixed(2)}x XP
                  </span>
                </div>

                <div style={{ fontFamily: "var(--sans)", fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.6" }}>
                  Permanently track training metrics in the database. Engage in terminal actions, audits, and checks to increase system clearance. Permanent status <strong>never decays or decreases</strong> over time.
                </div>
              </div>

              {/* Right Column: Clearance Tier Unlock checklist */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--accent)", letterSpacing: "0.15em", marginBottom: "4px" }}>
                  [ CLEARANCE TIER LOCKS ]
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontFamily: "var(--mono)", fontSize: "12.5px" }}>
                  {[
                    { l: 1, label: "CIVILIAN", req: "0+ XP", desc: "Basic terminal checks", unlocked: stats.level >= 1 },
                    { l: 2, label: "OBSERVER", req: "100+ XP", desc: "Live incident feeds enabled", unlocked: stats.level >= 2 },
                    { l: 3, label: "OPERATIVE", req: "200+ XP", desc: "Decryption protocols authorized", unlocked: stats.level >= 3 },
                    { l: 4, label: "ANALYST", req: "350+ XP", desc: "Strategic AI briefing modules", unlocked: stats.level >= 4 },
                    { l: 5, label: "DIRECTOR", req: "500+ XP", desc: "Full gateway overrides & logs", unlocked: stats.level >= 5 }
                  ].map((cl) => (
                    <div key={cl.l} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "6px", borderBottom: "1px dashed #1b1b1b", color: cl.unlocked ? "var(--text)" : "var(--text-muted)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ color: cl.unlocked ? "var(--accent)" : "var(--text-muted)", fontWeight: "bold", display: "inline-flex", alignItems: "center" }}>
                          {cl.unlocked ? (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                          )}
                        </span>
                        <span style={{ fontWeight: cl.unlocked ? "bold" : "normal" }}>
                          Lvl {cl.l}: {cl.label}
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>- {cl.desc}</span>
                      </div>
                      <span style={{ fontSize: "11.5px", color: cl.unlocked ? "#00ffcc" : "var(--text-muted)" }}>{cl.req}</span>
                    </div>
                  ))}
                </div>
              </div>

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
                  <div style={{ fontFamily: "var(--mono)", fontSize: "12.5px", color: "#00ffcc", letterSpacing: "0.2em", marginBottom: "4px" }}>
                    [ OPERATIVE READINESS METRICS ]
                  </div>
                  <h3 style={{ fontFamily: "var(--mono)", fontSize: "20px", margin: 0, textTransform: "uppercase" }}>
                    🧬 DYNAMIC SURVIVAL READINESS (BIO-SCORE)
                  </h3>
                </div>

                <p style={{ fontSize: "15.5px", color: "var(--text-dim)", lineHeight: "1.7", marginBottom: "24px" }}>
              <strong>What is this?</strong> Your BIO-SCORE is a dynamic rating between 0% and 100% that measures your current survival preparedness. It is calculated by averaging your 7 individual sub-stats. <strong>Warning: If you do not interact with the terminal for 24 hours, this score will decay by 5% per day.</strong> Check in daily to stop decay and restore your stats.
                </p>

                {(() => {
                  const allZeroStats =
                    stats.threat_awareness === 0 &&
                    stats.operational_discipline === 0 &&
                    stats.psychological_stability === 0 &&
                    stats.technical_preparedness === 0 &&
                    stats.adaptability === 0 &&
                    stats.resourcefulness === 0 &&
                    stats.surveillance_resistance === 0;

                  if (allZeroStats) {
                    return (
                      <div style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "48px 24px",
                        background: "#080808",
                        border: "1px dashed rgba(255, 77, 77, 0.2)",
                        borderRadius: "4px",
                        textAlign: "center",
                        minHeight: "280px",
                        boxShadow: "inset 0 1px 3px rgba(0,0,0,0.8)"
                      }}>
                        <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--accent)", letterSpacing: "0.15em", marginBottom: "12px", fontWeight: "bold" }}>
                          [ DIAGNOSTICS NOT YET CALIBRATED ]
                        </span>
                        <p style={{ fontFamily: "var(--sans)", fontSize: "14px", color: "var(--text-dim)", maxWidth: "420px", lineHeight: "1.6", margin: "0 0 24px 0" }}>
                          Operative cognitive parameters and survival readiness ratings are not yet established. Speak to the terminal interface to execute active check-ins and establish calibration parameters.
                        </p>
                        <Link href="/terminal" style={{ textDecoration: "none" }}>
                          <button className="btn btn-primary" style={{ padding: "10px 24px", fontSize: "12px", fontWeight: "bold", fontFamily: "var(--mono)" }}>
                            TALK TO THE TERMINAL TO BEGIN CALIBRATION
                          </button>
                        </Link>
                      </div>
                    );
                  }

                  return (
                    <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "32px", marginBottom: "32px" }} className="responsive-grid-2-large">
                      
                      {/* Left Column: Radar geometry & Psy Profile */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                        <div style={{ background: "#080808", border: "1px solid #141414", padding: "24px", borderRadius: "2px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <div style={{ fontFamily: "var(--mono)", fontSize: "12.5px", color: "#00ffcc", letterSpacing: "0.15em", marginBottom: "16px", alignSelf: "flex-start" }}>
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
                            <span style={{ fontFamily: "var(--mono)", fontSize: "12.5px", color: "#00ffcc", letterSpacing: "0.15em" }}>
                              [ COGNITIVE PSYCHE DIAGNOSTIC ]
                            </span>
                            <span className="tag tag-green" style={{ fontSize: "10px", padding: "2px 6px", background: "rgba(0, 255, 204, 0.1)", color: "#00ffcc", borderColor: "rgba(0, 255, 204, 0.2)" }}>
                              {psyProfile.tag}
                            </span>
                          </div>
                          <h4 style={{ fontFamily: "var(--title-font)", fontSize: "14px", color: "var(--text)", margin: "0 0 6px 0" }}>
                            {psyProfile.title}
                          </h4>
                          <p style={{ fontFamily: "var(--mono)", fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.6", margin: 0, fontStyle: "italic" }}>
                            &ldquo;{psyProfile.desc}&rdquo;
                          </p>
                        </div>
                      </div>
    
                      {/* Right Column: 7 Sub-Stats bars */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {subStatsList.map((st, idx) => (
                          <div key={idx} style={{ background: "#080808", border: "1px solid #141414", padding: "12px 16px", borderRadius: "2px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                               <span style={{ fontFamily: "var(--mono)", fontSize: "14.5px", color: "var(--text)", fontWeight: "bold" }}>{st.label}</span>
                               <span style={{ fontFamily: "var(--mono)", fontSize: "14.5px", color: "#00ffcc", fontWeight: "bold" }}>{st.val}/100</span>
                            </div>
                            <div className="threat-bar-wrap" style={{ height: "4px", background: "#111", marginBottom: "4px" }}>
                              <div className="threat-bar-fill" style={{ width: `${st.val}%`, background: "#00ffcc" }} />
                            </div>
                             <div style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)" }}>
                              {st.desc}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })()}

          {/* Sub-tabs header for secondary features */}
          <div style={{ display: "flex", gap: "0", borderBottom: "1px solid var(--border)", marginBottom: "20px", flexWrap: "wrap" }}>
            {[
              { id: "quests", label: "DRILLS & QUESTS" },
              { id: "x402", label: "MICROPAYMENTS (X402)" },
              { id: "logs", label: "XP AUDIT LOGS" },
              { id: "wallet", label: "CRYPTO REGISTRY" }
            ].map((tab) => {
              const active = activityTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActivityTab(tab.id as any)}
                  style={{
                    fontFamily: "var(--mono)", fontSize: "11px", letterSpacing: "0.15em",
                    padding: "10px 18px", background: "none", border: "none",
                    borderBottom: active ? "2px solid var(--accent)" : "2px solid transparent",
                    color: active ? "var(--text)" : "var(--text-muted)",
                    cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
                    fontWeight: active ? "bold" : "normal"
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab contents */}
          
          {/* 1. Quests and Drills */}
          {activityTab === "quests" && (
            <div className="panel" style={{
              background: "rgba(5, 5, 5, 0.4)",
              borderColor: "rgba(240, 201, 41, 0.15)",
              padding: "24px",
              boxShadow: "0 0 20px rgba(240, 201, 41, 0.01)"
            }}>
              <div style={{ borderBottom: "1px dashed var(--border)", paddingBottom: "12px", marginBottom: "16px" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "#f0c929", letterSpacing: "0.15em", marginBottom: "4px" }}>
                  [ COMMUNITY OPERATIONS & ACTIVE DRILLS ]
                </div>
                <h3 style={{ fontFamily: "var(--mono)", fontSize: "16px", margin: 0, textTransform: "uppercase" }}>
                  RED QUEEN QUESTS
                </h3>
              </div>

              <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.6", marginBottom: "16px" }}>
                Participate in targeted community challenges and network drills. Completing active quests earns massive XP rewards, upgrades your clearance tier, and grants permanent sub-stat boosts.
              </p>

              {loadingQuests ? (
                <div style={{ textAlign: "center", padding: "20px", fontFamily: "var(--mono)", color: "var(--accent)" }}>
                  [ SYNCHRONIZING WITH RED QUEEN OPERATIONS... ]
                </div>
              ) : userQuests.length === 0 ? (
                <div style={{
                  textAlign: "center",
                  padding: "24px",
                  border: "1px dashed rgba(240, 201, 41, 0.15)",
                  background: "rgba(240, 201, 41, 0.01)",
                  color: "var(--text-dim)",
                  borderRadius: "4px"
                }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "12px", marginBottom: "8px" }}>
                    [ NO ACTIVE OPERATIONS RUNNING ]
                  </div>
                  <Link href="/solvivors" className="btn btn-primary" style={{ fontSize: "10px", padding: "6px 12px" }}>
                    BROWSE SOLVIVORS HUB
                  </Link>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
                  {userQuests.map((quest) => {
                    const title = quest.details?.title || "Classified Operation";
                    const description = quest.details?.description || "";
                    const rewardText = quest.details 
                      ? (quest.type === "task" ? `+${quest.details.reward_xp} XP` : `${quest.details.reward_sol} SOL`)
                      : "REWARD CALCULATION PENDING";

                    return (
                      <div key={quest.id} style={{ 
                        background: "#080808", 
                        border: "1px solid",
                        borderColor: quest.status === "completed" ? "rgba(85, 255, 85, 0.15)" : 
                                     quest.status === "pending" ? "rgba(240, 201, 41, 0.15)" : "rgba(240, 201, 41, 0.08)",
                        padding: "16px 20px", 
                        borderRadius: "2px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between"
                      }}>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                            <span className="tag" style={{ 
                              color: quest.type === "task" ? "var(--accent)" : "#f0c929", 
                              borderColor: quest.type === "task" ? "rgba(255, 77, 77, 0.2)" : "rgba(240, 201, 41, 0.2)", 
                              fontSize: "9.5px" 
                            }}>
                              {quest.type === "task" ? "TASK" : "BOUNTY"}
                            </span>
                            
                            <span style={{ 
                              fontFamily: "var(--mono)", 
                              fontSize: "10px", 
                              fontWeight: "bold",
                              color: quest.status === "completed" ? "#55ff55" : 
                                     quest.status === "pending" ? "#f0c929" : 
                                     quest.status === "rejected" ? "var(--accent)" : "#00ffcc"
                            }}>
                              {quest.status === "active" && "[ STARTED ]"}
                              {quest.status === "pending" && "[ UNDER VERIFICATION ]"}
                              {quest.status === "completed" && "[ COMPLETED ]"}
                              {quest.status === "rejected" && "[ REJECTED ]"}
                            </span>
                          </div>

                          <h4 style={{ fontFamily: "var(--mono)", fontSize: "14px", color: "#ffffff", margin: "0 0 6px 0" }}>
                            {title}
                          </h4>
                          <p style={{ fontSize: "12px", color: "var(--text-dim)", lineHeight: "1.5", margin: "0 0 16px 0" }}>
                            {description}
                          </p>
                        </div>

                        <div style={{ borderTop: "1px dashed rgba(255,255,255,0.06)", paddingTop: "12px", marginTop: "auto" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                            <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)" }}>
                              REWARD:
                            </span>
                            <span style={{ 
                              fontFamily: "var(--mono)", 
                              fontSize: "12.5px", 
                              color: quest.type === "task" ? "#00ffcc" : "#f0c929", 
                              fontWeight: "bold" 
                            }}>
                              {rewardText}
                            </span>
                          </div>

                          {quest.status === "active" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                              <input
                                type="text"
                                value={proofInputs[quest.id] || ""}
                                onChange={(e) => setProofInputs(prev => ({ ...prev, [quest.id]: e.target.value }))}
                                placeholder="Enter proof link (e.g. X post, YouTube link)"
                                style={{
                                  width: "100%",
                                  padding: "6px 10px",
                                  background: "#050505",
                                  border: "1px solid rgba(255,255,255,0.1)",
                                  borderRadius: "2px",
                                  color: "#fff",
                                  fontSize: "11px",
                                  outline: "none"
                                }}
                              />
                              <button
                                onClick={() => handleSubmitQuest(quest.id)}
                                disabled={submittingQuest === quest.id}
                                className="btn btn-primary"
                                style={{ width: "100%", fontSize: "10px", padding: "6px" }}
                              >
                                {submittingQuest === quest.id ? "SUBMITTING..." : "SUBMIT PROOF"}
                              </button>
                            </div>
                          )}

                          {quest.status === "pending" && (
                            <div style={{ background: "rgba(240, 201, 41, 0.03)", border: "1px solid rgba(240, 201, 41, 0.1)", padding: "8px", borderRadius: "2px", fontSize: "10.5px" }}>
                              <div style={{ color: "var(--text-dim)", wordBreak: "break-all", marginBottom: "4px" }}>
                                <strong>Submitted Proof:</strong> <a href={quest.proof_link} target="_blank" rel="noopener noreferrer" style={{ color: "#f0c929", textDecoration: "underline" }}>{quest.proof_link}</a>
                              </div>
                              <span style={{ color: "#f0c929", fontStyle: "italic" }}>
                                Queen AI is verifying payload.
                              </span>
                            </div>
                          )}

                          {quest.status === "completed" && (
                            <div style={{ background: "rgba(85, 255, 85, 0.03)", border: "1px solid rgba(85, 255, 85, 0.1)", padding: "8px", borderRadius: "2px", fontSize: "10.5px", color: "#55ff55" }}>
                              {quest.type === "task" ? (
                                <span>✓ Approved. Awarded: <strong>+{quest.xp_awarded} XP</strong></span>
                              ) : (
                                <span>✓ Approved. SOL Reward logged for payout.</span>
                              )}
                            </div>
                          )}

                          {quest.status === "rejected" && (
                            <div style={{ background: "rgba(255, 77, 77, 0.03)", border: "1px solid rgba(255, 77, 77, 0.1)", padding: "8px", borderRadius: "2px", fontSize: "10.5px", color: "var(--accent)" }}>
                              <span>✗ Proof rejected. Please retry and submit a new valid proof link.</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 2. x402 Micropayments */}
          {activityTab === "x402" && (
            <div className="panel" style={{
              background: "rgba(5, 5, 5, 0.4)",
              borderColor: "rgba(255, 77, 77, 0.15)",
              padding: "24px",
              boxShadow: "0 0 20px rgba(255, 0, 51, 0.02)"
            }}>
              <div style={{ borderBottom: "1px dashed var(--border)", paddingBottom: "12px", marginBottom: "16px" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--accent)", letterSpacing: "0.15em", marginBottom: "4px" }}>
                  [ SECURE MICROPAYMENT PROTOCOL (X402) ]
                </div>
                <h3 style={{ fontFamily: "var(--mono)", fontSize: "16px", margin: 0, textTransform: "uppercase" }}>
                  ACCESS RESTRICTED APOCALYPSE DOSSIERS
                </h3>
              </div>

              <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.6", marginBottom: "16px" }}>
                RED QUEEN gates premium intelligence briefings behind **x402 open-protocol micropayments** ($0.01 and $0.02 USDC) to cover compute overhead. Settle the on-chain HTTP 402 payment challenge with your connected Solana wallet.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }} className="responsive-grid-2">
                {/* Dossier A */}
                <div style={{ background: "#080808", border: "1px solid #141414", padding: "16px", borderRadius: "2px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "12px", fontWeight: "bold", color: "#ffffff" }}>
                      DOSSIER A: GLOBAL CONTAINMENT
                    </span>
                    <span className="tag" style={{ color: "var(--accent)", borderColor: "rgba(255,77,77,0.3)", fontSize: "9px" }}>
                      $0.01 USDC
                    </span>
                  </div>

                  {premiumIntel ? (
                    <div style={{ background: "rgba(0, 255, 204, 0.02)", border: "1px solid rgba(0, 255, 204, 0.2)", padding: "12px", borderRadius: "2px", fontFamily: "var(--mono)", fontSize: "11.5px", display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ color: "#ffffff", fontWeight: "bold" }}>{premiumIntel.intel?.headline}</div>
                      <div style={{ color: "var(--text-dim)" }}>{premiumIntel.intel?.summary}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        <strong>Directive:</strong> {premiumIntel.intel?.directive}
                      </div>
                      {premiumTxid && (
                        <div style={{ borderTop: "1px dashed rgba(255,255,255,0.1)", paddingTop: "6px", marginTop: "4px" }}>
                          <a href={`https://solscan.io/tx/${premiumTxid}`} target="_blank" rel="noopener noreferrer" style={{ color: "#00ffcc", textDecoration: "underline", fontSize: "10.5px" }}>
                            [ 🔗 VERIFIED SOLSCAN PROOF ]
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--mono)", background: "#0c0303", padding: "8px", border: "1px solid #230808" }}>
                        STATUS: {loadingPremium ? `[ PAYING... ]` : "[ LOCKED ]"}
                      </div>
                      <button className="btn btn-primary" onClick={() => decryptIntel("/api/intel/premium", "premium")} disabled={!!loadingPremium || !connected} style={{ padding: "8px", fontSize: "11px" }}>
                        {loadingPremium ? "COUPLING..." : connected ? "DECRYPT DOSSIER" : "CONNECT WALLET"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Dossier B */}
                <div style={{ background: "#080808", border: "1px solid #141414", padding: "16px", borderRadius: "2px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "12px", fontWeight: "bold", color: "#ffffff" }}>
                      DOSSIER B: SOLANA SATELLITE STATUS
                    </span>
                    <span className="tag" style={{ color: "#f0c929", borderColor: "rgba(240,201,41,0.3)", fontSize: "9px" }}>
                      $0.02 USDC
                    </span>
                  </div>

                  {depinIntel ? (
                    <div style={{ background: "rgba(0, 255, 204, 0.02)", border: "1px solid rgba(0, 255, 204, 0.2)", padding: "12px", borderRadius: "2px", fontFamily: "var(--mono)", fontSize: "11.5px", display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ color: "#ffffff", fontWeight: "bold" }}>{depinIntel.depin?.scannerName}</div>
                      <div style={{ color: "var(--text-dim)" }}>
                        Health: <span style={{ color: "#00ffcc" }}>{depinIntel.depin?.networkHealth}</span> | Nodes: {depinIntel.depin?.onlineNodes}
                      </div>
                      {depinTxid && (
                        <div style={{ borderTop: "1px dashed rgba(255,255,255,0.1)", paddingTop: "6px", marginTop: "4px" }}>
                          <a href={`https://solscan.io/tx/${depinTxid}`} target="_blank" rel="noopener noreferrer" style={{ color: "#00ffcc", textDecoration: "underline", fontSize: "10.5px" }}>
                            [ 🔗 VERIFIED SOLSCAN PROOF ]
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--mono)", background: "#0a0802", padding: "8px", border: "1px solid #231d08" }}>
                        STATUS: {loadingDepin ? `[ PAYING... ]` : "[ LOCKED ]"}
                      </div>
                      <button className="btn btn-primary" onClick={() => decryptIntel("/api/intel/depin", "depin")} disabled={!!loadingDepin || !connected} style={{ padding: "8px", fontSize: "11px" }}>
                        {loadingDepin ? "COUPLING..." : connected ? "DECRYPT DOSSIER B" : "CONNECT WALLET"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 3. XP Audit Logs */}
          {activityTab === "logs" && (
            <div className="panel" style={{
              background: "rgba(5, 5, 5, 0.4)",
              borderColor: "rgba(255, 77, 77, 0.15)",
              padding: "24px",
              boxShadow: "0 0 20px rgba(255, 0, 51, 0.02)"
            }}>
              <div style={{ borderBottom: "1px dashed var(--border)", paddingBottom: "12px", marginBottom: "16px" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--accent)", letterSpacing: "0.15em", marginBottom: "4px" }}>
                  [ MAIN DIAGNOSTICS & XP AUDIT LOGS ]
                </div>
                <h3 style={{ fontFamily: "var(--mono)", fontSize: "16px", margin: 0, textTransform: "uppercase" }}>
                  XP REWARDS PATHWAY HISTORY
                </h3>
              </div>

              {loadingHistory ? (
                <div style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)", padding: "10px 0" }}>
                  DECRYPTING AUDIT LOG TRAILING INDEXES...
                </div>
              ) : history.filter(m => m.role === "assistant").length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>
                    [ Simulation Log Mode — Connect wallet and complete checkins to populate actual data ]
                  </div>
                  {[
                    { op: "OP-INIT", action: "System Onboarding Verification", date: "2026-05-30", reward: "+20 XP", stat: "Stability +1", type: "SUCCESS" },
                    { op: "OP-042", action: "OPSEC Threat Check", date: "2026-05-29", reward: "+10 XP", stat: "OPSEC +2", type: "SUCCESS" }
                  ].map((log, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#090909", border: "1px solid #141414", padding: "10px 14px", borderRadius: "2px", fontFamily: "var(--mono)", fontSize: "12px" }}>
                      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        <span style={{ color: "#00ffcc", fontWeight: "bold" }}>[{log.op}]</span>
                        <span style={{ color: "var(--text)" }}>{log.action}</span>
                      </div>
                      <div>
                        <span style={{ color: "#00ffcc", fontWeight: "bold" }}>{log.reward}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {history
                    .filter(m => m.role === "assistant")
                    .reverse()
                    .slice(0, 15)
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
                          padding: "8px 12px", 
                          borderRadius: "2px", 
                          fontFamily: "var(--mono)", 
                          fontSize: "12px",
                          gap: "8px"
                        }}>
                          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                            <span style={{ color: "#00ffcc", fontWeight: "bold" }}>[OP-DB-{idx + 1}]</span>
                            <span style={{ color: "var(--text)", textOverflow: "ellipsis", maxWidth: "200px", overflow: "hidden", whiteSpace: "nowrap" }}>
                              {msg.content.replace(/\[BIO-SCORE:.*?\]/gi, "").trim().slice(0, 40)}...
                            </span>
                            <span style={{ color: "var(--text-dim)", fontSize: "11px" }}>({dateStr})</span>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <span style={{ color: "#00ffcc", fontWeight: "bold", marginRight: "8px" }}>+{xpVal} XP</span>
                            <span style={{ color: "var(--text-dim)", fontSize: "11px" }}>[{statGains}]</span>
                          </div>
                        </div>
                      );
                    }).filter(Boolean)}
                </div>
              )}
            </div>
          )}

          {/* 4. Crypto Wallet Linkage */}
          {activityTab === "wallet" && (
            <div className="panel" style={{
              background: "rgba(5, 5, 5, 0.4)",
              borderColor: "rgba(255, 77, 77, 0.15)",
              padding: "24px",
              boxShadow: "0 0 20px rgba(255, 0, 51, 0.02)"
            }}>
              <div style={{ borderBottom: "1px dashed var(--border)", paddingBottom: "12px", marginBottom: "16px" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--accent)", letterSpacing: "0.15em", marginBottom: "4px" }}>
                  // CRYPTOGRAPHIC KEY REGISTRY (WEB3 LINKAGE)
                </div>
                <h3 style={{ fontFamily: "var(--mono)", fontSize: "16px", margin: 0, textTransform: "uppercase" }}>
                  SOLANA WALLET BINDING GATEWAY
                </h3>
              </div>

              <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.6", marginBottom: "16px" }}>
                Establish a cryptographic link between your email session and your Solana wallet. By binding your public key, the Red Queen can query your on-chain $THREAT token holdings and activate your 2.0x XP multiplier.
              </p>

              {profile?.linked_wallet_address ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "13.5px", color: "#00ffcc", fontWeight: "bold" }}>
                    STATUS: LINKED TO WALLET ADDRESS
                  </div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "12.5px", color: "var(--text)", wordBreak: "break-all", background: "rgba(0,0,0,0.4)", padding: "10px 14px", border: "1px solid rgba(255,255,255,0.05)" }}>
                    {profile.linked_wallet_address}
                  </div>
                  
                  {solanaWalletAddress && solanaWalletAddress !== profile.linked_wallet_address && (
                    <div style={{ marginTop: "8px" }}>
                      <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "0 0 8px 0" }}>
                        Connected wallet ({solanaWalletAddress.slice(0, 4)}...{solanaWalletAddress.slice(-4)}) differs from linked wallet. Do you want to update the link?
                      </p>
                      <button onClick={linkSolanaWallet} disabled={saving} className="btn btn-ghost" style={{ fontSize: "10px", padding: "5px 12px", borderColor: "var(--accent)", color: "var(--accent)" }}>
                        {saving ? "LINKING..." : "UPDATE LINKED WALLET"}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {solanaWalletAddress ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "10px" }}>
                      <div style={{ fontFamily: "var(--mono)", fontSize: "12.5px", color: "var(--text)" }}>
                        Connected Solana Wallet: <span style={{ color: "var(--accent)" }}>{solanaWalletAddress.slice(0, 6)}...{solanaWalletAddress.slice(-6)}</span>
                      </div>
                      <button onClick={linkSolanaWallet} disabled={saving} className="btn btn-primary" style={{ fontSize: "12px", padding: "8px 16px", boxShadow: "0 0 10px rgba(255,0,51,0.1)" }}>
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
                        fontSize: "12px",
                        padding: "8px 16px",
                        height: "auto",
                        lineHeight: "1.5",
                      }} />
                      <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-muted)" }}>
                        Connect your wallet to enable link sequence.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

      {/* Scenario Picker */}
      <div className="container" style={{ padding: "48px 24px" }}>
        <div className="section-header" style={{ marginBottom: "8px" }}>
          <span className="section-line" />
          <span className="section-tag">CHOOSE TARGET BREACH VECTORS</span>
          <span className="section-line" />
        </div>
        <p style={{ fontFamily: "var(--mono)", fontSize: "14px", color: "var(--text-dim)", textAlign: "center", marginBottom: "32px", lineHeight: "1.7" }}>
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
                fontFamily: "var(--mono)", fontSize: "12.5px", letterSpacing: "0.15em",
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
                   <div style={{ fontFamily: "var(--mono)", fontSize: "15px", color: "var(--text)", fontWeight: selected ? 700 : 400, lineHeight: 1.4 }}>
                    {scenario.label}
                  </div>
                   <div style={{ fontFamily: "var(--mono)", fontSize: "12px", color: color, letterSpacing: "0.15em", marginTop: "4px" }}>
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
            <span style={{ fontFamily: "var(--mono)", fontSize: "13.5px", color: "var(--text-dim)" }}>
              <span style={{ color: "var(--accent)" }}>{chosenScenarios.length}</span> vectors monitored
            </span>
            <button
              className="btn btn-primary"
              onClick={saveProfile}
              disabled={saving}
              style={{ fontSize: "13.5px", padding: "10px 28px" }}
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
