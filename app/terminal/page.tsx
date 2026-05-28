"use client";
import { useState, useRef, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import SolvivalIcon from "@/components/SolvivalIcon";
import dynamic from "next/dynamic";
import { generateApocalypticName } from "@/lib/names";


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

export default function TerminalPage() {
  const { publicKey, connected, wallet, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const walletAddress = publicKey ? publicKey.toString() : null;

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
  const [apocalypticName, setApocalypticName] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [limitBlocked, setLimitBlocked] = useState(false);

  useEffect(() => {
    if (connected) {
      setLimitBlocked(false);
    }
  }, [connected]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    async function loadProfileAndHistory() {
      if (!connected || !walletAddress) return;
      setLoadingHistory(true);

      const generated = generateApocalypticName(walletAddress);
      setApocalypticName(generated);

      try {
        const [profileRes, historyRes] = await Promise.all([
          fetch(`/api/profile?wallet=${walletAddress}`).then((r) => r.json()).catch(() => ({})),
          fetch(`/api/history?wallet=${walletAddress}`).then((r) => r.json()).catch(() => ({}))
        ]);

        if (profileRes && profileRes.profile) {
          setApocalypticName(profileRes.profile.apocalyptic_name || generated);
          if (profileRes.profile.last_bio_score !== null) {
            setCurrentScore(profileRes.profile.last_bio_score.toString());
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
  }, [connected, walletAddress]);

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
- /scan : Instructs Red Queen to run deep metadata checks (x402 Compute).
- /decrypt [ID] : Decrypts a specific vector file (x402 Compute).

Note: Custom computed actions must be triggered from the specific dossier pages in Sector Delta.`;
      } else if (cmd === "/bio") {
        reply = `[BIO-SCORE TELEMETRY RECON]

Subject Passport: ${walletAddress ? walletAddress.slice(0, 4) + "..." + walletAddress.slice(-4) : "UNKNOWN"}
Active Score: ${currentScore ? currentScore + "%" : "PENDING (Speak to Red Queen to evaluate)"}
Status: ${currentScore && parseInt(currentScore) < 20 ? "CRITICAL OUTLOOK" : currentScore && parseInt(currentScore) < 60 ? "STABLE THREATENED" : "OPTIMAL RESISTANCE"}

Maintain vigilance.`;
      } else if (cmd === "/scan" || cmd === "/decrypt") {
        reply = `[COMPUTE GATE FAILURE]

Running direct trace commands from the terminal root is restricted. 
To initiate x402 metered diagnostics:
1. Navigate to the [THREAT ARCHIVES](/threat-vector).
2. Choose a dossier file under SECTOR DELTA (Algorithmic Warfare).
3. Click "REQUEST SYSTEM ACCESS" to authorize compute node allocation.`;
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

  const scoreNum = currentScore ? parseInt(currentScore) : null;
  const scoreColor =
    scoreNum === null ? "var(--text-dim)" :
    scoreNum < 20 ? "#ff4d4d" :
    scoreNum < 60 ? "#f0c929" :
    "#2ecc40";

  const userMessageCount = messages.filter((m) => m.role === "user").length;
  const isLocked = !connected && (userMessageCount >= 4 || limitBlocked);

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
        {currentScore && (
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)", letterSpacing: "0.2em", marginBottom: "4px" }}>
              YOUR BIO-SCORE
            </div>
            <div style={{
              fontFamily: "var(--mono)",
              fontSize: "32px",
              fontWeight: 700,
              color: scoreColor,
              lineHeight: 1,
            }}>
              {currentScore}%
            </div>
          </div>
        )}
      </div>

      {/* Info bar */}
      <div className="alert alert-red" style={{ margin: "0", borderRadius: "0", border: "none", borderBottom: "1px solid rgba(255,77,77,0.15)" }}>
        <strong>[NOTICE]</strong> All communications are monitored. Your survival intelligence is being evaluated. Claim Level 5 access by connecting your wallet if you hold <strong>$THREAT tokens</strong>.
      </div>

      {/* Main split workspace */}
      <div style={{ display: "flex", flex: 1, minHeight: 0, position: "relative" }} className="responsive-grid-2-large">
        
        {/* Left Side: Chat Panel */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
          {/* Messages */}
          <div style={{
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
                  {msg.bioScore && msg.bioScore !== "PENDING" && (
                    <div className="bio-score" style={{ color: scoreColor }}>
                      ▶ BIO-SCORE UPDATED: {msg.bioScore}%
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
            <div ref={messagesEndRef} />
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
                You have sent 4 telemetry packets. To protect the integrity of the network, the RED QUEEN requires operative passport verification to continue neural analysis. Connect your Solana wallet now to unlock permanent clearance.
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
        </div>

        {/* Right Side: Compute Allocation HUD Sidebar */}
        <aside style={{
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
                <span>METERED RATE:</span>
                <span style={{ color: "#00ffcc" }}>0.05 USDC / SCAN</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>STATUS:</span>
                <span style={{ color: "#2ecc40" }}>ACTIVE CONNECT</span>
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
                  Run deep metadata leak analysis (x402 COMPUTE).
                </div>
              </div>

              <div>
                <span style={{ color: "var(--accent)", fontWeight: "bold" }}>/decrypt [ID]</span>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                  Force-decrypt classified threat records (x402 COMPUTE).
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

      </div>
    </div>
  );
}
