"use client";
import { useState, useRef, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import SolvivalIcon from "@/components/SolvivalIcon";
import dynamic from "next/dynamic";

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
  const { publicKey, connected } = useWallet();
  const walletAddress = publicKey ? publicKey.toString() : null;

  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: INTRO_MESSAGE, bioScore: "PENDING" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentScore, setCurrentScore] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    async function loadHistory() {
      if (!connected || !walletAddress) return;
      setLoadingHistory(true);
      try {
        const res = await fetch(`/api/history?wallet=${walletAddress}`);
        const data = await res.json();
        if (data.history && data.history.length > 0) {
          const mapped = data.history.map((m: any) => {
            const parsed = extractBioScore(m.content);
            return {
              role: m.role,
              content: m.content,
              bioScore: parsed.score || undefined
            };
          });
          setMessages(mapped);

          // Find the last bioScore in history
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
          setCurrentScore(null);
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
      }
      setLoadingHistory(false);
    }
    loadHistory();
  }, [connected, walletAddress]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
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

  if (!connected) {
    return (
      <div style={{ padding: "60px 0 0", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#050505" }}>
        <div style={{
          textAlign: "center",
          maxWidth: "500px",
          padding: "48px 32px",
          border: "1px solid var(--border)",
          background: "var(--surface)",
          borderRadius: "4px",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(255, 77, 77, 0.05)"
        }}>
          <div className="tag tag-red" style={{ marginBottom: "24px", letterSpacing: "0.2em" }}>SECURE UPLINK REQUIRED</div>
          
          <div style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            border: "1px solid rgba(255, 77, 77, 0.3)",
            background: "rgba(255, 77, 77, 0.03)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            boxShadow: "0 0 20px rgba(255, 77, 77, 0.1)"
          }}>
            <SolvivalIcon size={40} />
          </div>

          <h1 className="glow-text" style={{ fontSize: "28px", marginBottom: "16px", letterSpacing: "0.05em" }}>
            RED QUEEN <span style={{ color: "var(--accent)" }}>UPLINK</span>
          </h1>
          
          <p style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)", lineHeight: "1.8", marginBottom: "32px" }}>
            [WARN_0x1E] Unauthorized access detected. The RED QUEEN AI survival intelligence is restricted to verified operatives. 
            <br />
            <br />
            Connect your Solana wallet to establish a secure neural link and begin survival assessment.
          </p>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <WalletMultiButton style={{
              background: "var(--accent)",
              border: "none",
              color: "#000",
              fontFamily: "var(--mono)",
              fontSize: "13px",
              padding: "12px 28px",
              height: "auto",
              lineHeight: "1.5",
              fontWeight: "bold",
              cursor: "pointer",
              borderRadius: "2px",
            }} />
          </div>
        </div>
      </div>
    );
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
                {msg.role === "user" ? "[ YOU — SUBJECT ]" : "[ RED QUEEN — LEVEL 5 ]"}
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
  );
}
