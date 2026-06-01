"use client";
import { useState, useRef, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useAuth } from "@/components/AuthProvider";
import SolvivalIcon from "@/components/SolvivalIcon";
import dynamic from "next/dynamic";
import { generateApocalypticName } from "@/lib/names";
import { DEFAULT_STATS, calculateBioScore, parseStatsFromAI, applyStatGains, getClearanceLevel } from "@/lib/progression";


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
  const { publicKey, connected, wallet, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const { user, authIdentifier } = useAuth();
  
  const solanaWalletAddress = publicKey ? publicKey.toString() : null;
  const walletAddress = authIdentifier || solanaWalletAddress;

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
    ctx.font = "bold 12px monospace";
    ctx.textBaseline = "middle";
    ctx.fillText("◉ RED QUEEN CYBERNETIC PROTOCOL NODE 7.4.1", 24, 32);

    // Clearance Label in Header Right
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "right";
    ctx.fillText(`CLEARANCE: ${clearanceInfo.label.toUpperCase()}`, w - 24, 32);
    ctx.textAlign = "left"; // reset alignment

    // 5. Operative Info Panel
    const opPanelY = 64;
    const opPanelH = 60;
    ctx.fillStyle = "rgba(255, 0, 51, 0.03)";
    ctx.fillRect(16, opPanelY, w - 32, opPanelH);
    ctx.strokeStyle = "rgba(255, 0, 51, 0.15)";
    ctx.strokeRect(16, opPanelY, w - 32, opPanelH);

    // Operative Info Text inside panel
    ctx.textBaseline = "top";
    ctx.fillStyle = "#ff4d4d";
    ctx.font = "bold 9px monospace";
    ctx.fillText("OPERATIVE IDENTIFICATION", 28, opPanelY + 10);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px monospace";
    ctx.fillText(apocalypticName || "SUBJECT", 28, opPanelY + 24);

    ctx.fillStyle = "#ff4d4d";
    ctx.font = "bold 9px monospace";
    ctx.fillText("BIO-SCORE", 260, opPanelY + 10);
    const scoreColorHex = scoreVal === 0 ? "#888888" : scoreVal < 20 ? "#ff4d4d" : scoreVal < 60 ? "#f0c929" : "#2ecc40";
    ctx.fillStyle = scoreColorHex;
    ctx.font = "bold 16px monospace";
    ctx.fillText(`${scoreVal}%`, 260, opPanelY + 24);

    ctx.fillStyle = "#ff4d4d";
    ctx.font = "bold 9px monospace";
    ctx.fillText("EXPERIENCE / RANK", 380, opPanelY + 10);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px monospace";
    ctx.fillText(`LEVEL ${stats?.level || 1} (${stats?.xp || 0} XP)`, 380, opPanelY + 24);

    ctx.fillStyle = "#ff4d4d";
    ctx.font = "bold 9px monospace";
    ctx.fillText("UPLINK STATUS", 580, opPanelY + 10);
    ctx.fillStyle = connected ? "#2ecc40" : "#f0c929";
    ctx.font = "bold 12px monospace";
    ctx.fillText(connected ? "DIRECTOR clearance" : "UNVERIFIED PUBLIC", 580, opPanelY + 24);

    // 6. Question Section (if exists)
    let textStartY = 145;
    if (shareModalData.question) {
      // Draw background panel for question
      const qText = shareModalData.question;
      ctx.fillStyle = "rgba(0, 229, 255, 0.02)";
      ctx.strokeStyle = "rgba(0, 229, 255, 0.1)";
      
      // Calculate lines to find dynamic height
      ctx.font = "12px monospace";
      const maxWidth = w - 64;
      const qLines = getWrappedLines(qText, maxWidth);
      const qHeight = qLines.length * 20 + 36;
      
      ctx.fillRect(16, textStartY, w - 32, qHeight);
      ctx.strokeRect(16, textStartY, w - 32, qHeight);
      
      ctx.fillStyle = "#00e5ff";
      ctx.font = "bold 10px monospace";
      ctx.fillText("▼ INCOMING SUBJECT INQUIRY", 28, textStartY + 8);
      
      ctx.fillStyle = "#e0f7fa";
      ctx.font = "12px monospace";
      qLines.forEach((line, index) => {
        ctx.fillText(line, 28, textStartY + 24 + index * 20);
      });
      
      textStartY += qHeight + 15;
    }

    // 7. Response Section
    const rText = shareModalData.content;
    ctx.fillStyle = "rgba(255, 0, 51, 0.015)";
    ctx.strokeStyle = "rgba(255, 0, 51, 0.15)";
    
    ctx.font = "13px monospace";
    const maxWidth = w - 64;
    const rLines = getWrappedLines(rText.replace(/\[BIO-SCORE:\s*\d+%?\]/i, "").replace(/\[SYSTEM NOTICE:.*?\]/g, "").trim(), maxWidth);
    
    // Calculate remaining height to draw the response box
    const rHeight = h - 35 - 30 - textStartY;
    ctx.fillRect(16, textStartY, w - 32, rHeight);
    ctx.strokeRect(16, textStartY, w - 32, rHeight);
    
    ctx.fillStyle = "#ff3366";
    ctx.font = "bold 10px monospace";
    ctx.fillText("▲ DETECTED CENTRAL RESPONSE", 28, textStartY + 10);
    
    ctx.fillStyle = "#ffffff";
    ctx.font = "13px monospace";
    
    // Fit lines to the remaining box space
    const maxAvailableLines = Math.floor((rHeight - 35) / 22);
    for (let i = 0; i < Math.min(rLines.length, maxAvailableLines); i++) {
      ctx.fillText(rLines[i], 28, textStartY + 28 + i * 22);
    }

    // 8. Footer
    ctx.fillStyle = "rgba(255, 77, 77, 0.4)";
    ctx.font = "9px monospace";
    ctx.fillText("RETRANSMISSION SECURITY PROTOCOL ACTIVATED // UPLINK SECURED", 24, h - 30);
    ctx.fillStyle = "#ff0033";
    ctx.textAlign = "right";
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
        const [profileRes, historyRes] = await Promise.all([
          fetch(`/api/profile?wallet=${walletAddress}`).then((r) => r.json()).catch(() => ({})),
          fetch(`/api/history?wallet=${walletAddress}`).then((r) => r.json()).catch(() => ({}))
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
