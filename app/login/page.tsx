"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SolvivalIcon from "@/components/SolvivalIcon";

export default function LoginPage() {
  const { user, loginWithEmail, signUpWithEmail } = useAuth();
  const router = useRouter();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push("/operative");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setStatusMsg("");
    setLoading(true);

    if (!email || !password) {
      setErrorMsg("Error: Missing credentials.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Error: Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        setStatusMsg("ESTABLISHING ENCRYPTED SECURE CHANNEL...");
        const { user: newUser, error } = await signUpWithEmail(email, password);
        if (error) {
          setErrorMsg(`Failed to register: ${error.message || error}`);
          setLoading(false);
          return;
        }

        if (newUser) {
          setStatusMsg("INITIALIZING OPERATIVE PROFILE IN DATABASE...");
          // Initialize public profile row
          const initRes = await fetch("/api/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              wallet_address: `email-auth:${newUser.id}`,
              apocalyptic_name: `Operative-${newUser.id.slice(0, 6).toUpperCase()}`,
              chosen_scenarios: []
            })
          });
          const initData = await initRes.json();
          if (initData.error) {
            console.warn("Failed to initialize profile db record on signup:", initData.error);
          }

          setStatusMsg("SUCCESS. VERIFY EMAIL IF REQUIRED, OR SIGN IN.");
          // Log in automatically after signup (Supabase does this by default if email confirmation is disabled)
          setTimeout(() => {
            router.push("/operative");
          }, 1500);
        }
      } else {
        setStatusMsg("VERIFYING IDENTITY CREDENTIALS...");
        const { error } = await loginWithEmail(email, password);
        if (error) {
          setErrorMsg(`Authentication failed: ${error.message || error}`);
          setLoading(false);
          return;
        }
        setStatusMsg("ACCESS GRANTED. REDIRECTING...");
        setTimeout(() => {
          router.push("/operative");
        }, 1000);
      }
    } catch (err: any) {
      setErrorMsg(`System Error: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#050505",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "80px 24px 40px",
      boxSizing: "border-box",
      position: "relative"
    }}>
      {/* Reticle grid decor */}
      <div style={{ position: "absolute", top: "10%", left: "10%", width: "40px", height: "40px", borderTop: "1px solid rgba(255, 0, 51, 0.2)", borderLeft: "1px solid rgba(255, 0, 51, 0.2)" }} />
      <div style={{ position: "absolute", top: "10%", right: "10%", width: "40px", height: "40px", borderTop: "1px solid rgba(255, 0, 51, 0.2)", borderRight: "1px solid rgba(255, 0, 51, 0.2)" }} />
      <div style={{ position: "absolute", bottom: "10%", left: "10%", width: "40px", height: "40px", borderBottom: "1px solid rgba(255, 0, 51, 0.2)", borderLeft: "1px solid rgba(255, 0, 51, 0.2)" }} />
      <div style={{ position: "absolute", bottom: "10%", right: "10%", width: "40px", height: "40px", borderBottom: "1px solid rgba(255, 0, 51, 0.2)", borderRight: "1px solid rgba(255, 0, 51, 0.2)" }} />

      <div className="panel" style={{
        maxWidth: "420px",
        width: "100%",
        background: "rgba(10, 10, 10, 0.8)",
        borderColor: "rgba(255, 0, 51, 0.2)",
        boxShadow: "0 10px 40px rgba(0,0,0,0.8), 0 0 20px rgba(255, 0, 51, 0.05)",
        padding: "40px 32px",
        zIndex: 5
      }}>
        {/* Core bracket decorations */}
        <div style={{ position: "absolute", top: "12px", left: "12px", width: "12px", height: "12px", borderTop: "2px solid var(--accent)", borderLeft: "2px solid var(--accent)" }} />
        <div style={{ position: "absolute", top: "12px", right: "12px", width: "12px", height: "12px", borderTop: "2px solid var(--accent)", borderRight: "2px solid var(--accent)" }} />
        <div style={{ position: "absolute", bottom: "12px", left: "12px", width: "12px", height: "12px", borderBottom: "2px solid var(--accent)", borderLeft: "2px solid var(--accent)" }} />
        <div style={{ position: "absolute", bottom: "12px", right: "12px", width: "12px", height: "12px", borderBottom: "2px solid var(--accent)", borderRight: "2px solid var(--accent)" }} />

        {/* Logo and Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ display: "inline-flex", padding: "8px", background: "rgba(255, 0, 51, 0.05)", borderRadius: "50%", marginBottom: "16px", border: "1px dashed rgba(255, 0, 51, 0.2)" }}>
            <SolvivalIcon size={36} />
          </div>
          <h2 style={{
            fontFamily: "var(--title-font)",
            fontSize: "20px",
            fontWeight: "bold",
            letterSpacing: "0.15em",
            color: "var(--text)",
            margin: "0 0 6px 0",
            textTransform: "uppercase"
          }}>
            [ RED QUEEN UPLINK ]
          </h2>
          <p style={{
            fontFamily: "var(--mono)",
            fontSize: "10.5px",
            color: "var(--text-dim)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            margin: 0
          }}>
            {isSignUp ? "Generate new cryptographic operative passport" : "Establish secure operative session via credentials"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Email Input */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{
              fontFamily: "var(--mono)",
              fontSize: "11px",
              color: "var(--text-muted)",
              letterSpacing: "0.1em",
              textTransform: "uppercase"
            }}>
              // OPERATIVE EMAIL:
            </label>
            <input
              type="email"
              placeholder="e.g., survivor@solvival.corp"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              style={{
                fontFamily: "var(--mono)",
                fontSize: "13px",
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(255, 0, 51, 0.2)",
                borderRadius: "2px",
                padding: "10px 14px",
                color: "var(--text)",
                outline: "none",
                transition: "border-color 0.2s",
                boxSizing: "border-box",
                width: "100%"
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255, 0, 51, 0.2)")}
            />
          </div>

          {/* Password Input */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{
              fontFamily: "var(--mono)",
              fontSize: "11px",
              color: "var(--text-muted)",
              letterSpacing: "0.1em",
              textTransform: "uppercase"
            }}>
              // PASSPORT ACCESS DECRYPTOR:
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              style={{
                fontFamily: "var(--mono)",
                fontSize: "13px",
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(255, 0, 51, 0.2)",
                borderRadius: "2px",
                padding: "10px 14px",
                color: "var(--text)",
                outline: "none",
                transition: "border-color 0.2s",
                boxSizing: "border-box",
                width: "100%"
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255, 0, 51, 0.2)")}
            />
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div style={{
              fontFamily: "var(--mono)",
              fontSize: "11.5px",
              color: "var(--accent)",
              background: "rgba(255, 77, 77, 0.05)",
              border: "1px solid rgba(255, 77, 77, 0.2)",
              padding: "10px 12px",
              borderRadius: "2px",
              lineHeight: "1.4"
            }}>
              {errorMsg}
            </div>
          )}

          {statusMsg && (
            <div style={{
              fontFamily: "var(--mono)",
              fontSize: "11px",
              color: "#00ffcc",
              background: "rgba(0, 255, 204, 0.03)",
              border: "1px dashed rgba(0, 255, 204, 0.2)",
              padding: "10px 12px",
              borderRadius: "2px",
              textAlign: "center"
            }}>
              <span className="loading-dots">{statusMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              width: "100%",
              justifyContent: "center",
              padding: "12px",
              fontFamily: "var(--mono)",
              fontSize: "12.5px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              boxShadow: "0 0 15px rgba(255, 0, 51, 0.15)",
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            {isSignUp ? "INITIALIZE PASSPORT" : "ESTABLISH UPLINK"}
          </button>
        </form>

        {/* Toggle Form Mode */}
        <div style={{
          marginTop: "24px",
          paddingTop: "16px",
          borderTop: "1px dashed var(--border)",
          textAlign: "center"
        }}>
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg("");
              setStatusMsg("");
            }}
            style={{
              background: "none",
              border: "none",
              fontFamily: "var(--mono)",
              fontSize: "11.5px",
              color: "var(--text-dim)",
              textDecoration: "underline",
              cursor: "pointer"
            }}
          >
            {isSignUp ? "[ ALREADY REGISTERED? DECRYPT SESSION ]" : "[ NO PASSPORT? INITIALIZE NEW IDENTITY ]"}
          </button>
        </div>

        {/* Return to Hub */}
        <div style={{ marginTop: "14px", textAlign: "center" }}>
          <Link href="/" style={{
            fontFamily: "var(--mono)",
            fontSize: "11px",
            color: "var(--text-muted)",
            textDecoration: "none",
            letterSpacing: "0.05em"
          }}>
            ← RETURN TO HUB TERMINAL
          </Link>
        </div>
      </div>
    </div>
  );
}
