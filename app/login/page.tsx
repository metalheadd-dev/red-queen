"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuth } from "@/components/AuthProvider";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false },
);

export default function LoginPage() {
  const { user, loginWithEmail, signUpWithEmail, loginWithWallet } = useAuth();
  const { connected } = useWallet();
  const router = useRouter();
  const walletAttempted = useRef(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace("/profile");
      return;
    }
    if (!connected || walletAttempted.current) return;

    walletAttempted.current = true;
    setStatusMsg("Confirm the sign-in message in your wallet. No transaction will be sent.");
    void loginWithWallet().then(({ error }) => {
      if (error) {
        setErrorMsg(`Wallet sign-in failed: ${error.message || error}`);
        setStatusMsg("");
        walletAttempted.current = false;
      } else {
        setStatusMsg("Identity confirmed. Opening My Readiness…");
      }
    });
  }, [connected, user, router, loginWithWallet]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg("");
    setStatusMsg("");

    if (!email.trim() || !password) {
      setErrorMsg("Enter your email and password.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must contain at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { user: newUser, error } = await signUpWithEmail(email.trim(), password);
        if (error) throw error;
        setStatusMsg(newUser
          ? "Account created. Check your inbox if email confirmation is required."
          : "Check your inbox to confirm your account.");
      } else {
        const { error } = await loginWithEmail(email.trim(), password);
        if (error) throw error;
        setStatusMsg("Identity confirmed. Opening My Readiness…");
      }
    } catch (error: any) {
      setErrorMsg(error?.message || "Sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rq-login-page">
      <div className="rq-login-grid" aria-hidden="true" />
      <section className="rq-login-intro">
        <Link href="/" className="rq-login-back">← RETURN TO PULSE</Link>
        <div className="rq-login-orb"><i /></div>
        <span className="rq-login-kicker">PRIVATE CONTEXT CHANNEL</span>
        <h1>Your survival context, remembered.</h1>
        <p>
          Sign in only when you want RED QUEEN to preserve your readiness, evidence and clearance across sessions.
          The public intelligence platform remains open without an account.
        </p>
        <div className="rq-login-benefits">
          <div><span>01</span><strong>Save verified readiness</strong><small>BIO-SCORE evidence, Queen history and your SOLvivor identity.</small></div>
          <div><span>02</span><strong>Keep Queen in context</strong><small>Account history persists; broad-area and checklist preferences remain on your device.</small></div>
          <div><span>03</span><strong>Verify $THREAT utility</strong><small>Connect Solana only when you want holder clearance and premium depth.</small></div>
        </div>
      </section>

      <section className="rq-login-card">
        <div className="rq-login-card-head">
          <span>RED QUEEN ACCESS</span>
          <strong>{isSignUp ? "Create your private readiness record" : "Continue your readiness record"}</strong>
          <p>Choose email or Solana. Both lead to the same core platform.</p>
        </div>

        <div className="rq-login-wallet">
          <div><strong>Continue with Solana</strong><small>Sign a message to prove wallet ownership.</small></div>
          <WalletMultiButton />
          <p>READ-ONLY IDENTITY CHECK · NO TRANSACTION · NO SPENDING APPROVAL</p>
        </div>

        <div className="rq-login-divider"><span>OR USE EMAIL</span></div>

        <form onSubmit={handleSubmit} className="rq-login-form">
          <label>
            <span>EMAIL</span>
            <input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={loading}
              required
            />
          </label>
          <label>
            <span>PASSWORD</span>
            <input
              type="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={loading}
              minLength={6}
              required
            />
          </label>

          {errorMsg && <div className="rq-login-message is-error" role="alert">{errorMsg}</div>}
          {statusMsg && <div className="rq-login-message is-status" role="status">{statusMsg}</div>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "SECURING CHANNEL…" : isSignUp ? "CREATE ACCOUNT" : "SIGN IN WITH EMAIL"}
          </button>
        </form>

        <button
          type="button"
          className="rq-login-switch"
          onClick={() => { setIsSignUp((value) => !value); setErrorMsg(""); setStatusMsg(""); }}
        >
          {isSignUp ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>

        <div className="rq-login-public">
          <strong>Just exploring?</strong>
          <p>Pulse, Live Map, Queen, Prepare and the Library work before you sign in.</p>
          <Link href="/">CONTINUE WITHOUT AN ACCOUNT →</Link>
        </div>
      </section>
    </div>
  );
}
