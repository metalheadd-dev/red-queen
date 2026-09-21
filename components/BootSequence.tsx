"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import RqWordmark from "./RqWordmark";

const THREAT_MODULES = [
  { code: "ENV", title: "Earth & climate", detail: "Quakes · storms · wildfire" },
  { code: "BIO", title: "Health & outbreaks", detail: "Public health · biological risks" },
  { code: "GRID", title: "Infrastructure", detail: "Blackouts · disruption · conflict" },
  { code: "CYB", title: "Digital & on-chain", detail: "Cyber risks · wallet exposure" },
  { code: "SPACE", title: "Space weather", detail: "Solar activity · radio disruption" },
  { code: "SIM", title: "Fictional scenarios", detail: "Zombie outbreaks · what-if drills" },
] as const;

export default function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [indexed, setIndexed] = useState(0);
  const [exiting, setExiting] = useState(false);
  const reducedMotion = useRef(false);
  const skip = useRef<HTMLButtonElement>(null);
  const finish = useCallback(() => setExiting(true), []);

  useEffect(() => {
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    skip.current?.focus({ preventScroll: true });
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (reducedMotion.current) {
      setIndexed(THREAT_MODULES.length);
    } else {
      THREAT_MODULES.forEach((_, i) => {
        timers.push(setTimeout(() => setIndexed(i + 1), 360 + i * 440));
      });
    }
    timers.push(setTimeout(finish, reducedMotion.current ? 1400 : 4800));
    return () => timers.forEach(clearTimeout);
  }, [finish]);

  useEffect(() => {
    if (!exiting) return;
    const timer = setTimeout(onComplete, reducedMotion.current ? 0 : 320);
    return () => clearTimeout(timer);
  }, [exiting, onComplete]);

  return (
    <section
      className={`rq-session-boot rq-corp-boot${exiting ? " is-exiting" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="rq-boot-title"
      aria-describedby="rq-boot-description"
      onKeyDown={event => {
        if (event.key === "Escape") finish();
        // There is one control in the introduction. Keep keyboard focus in it.
        if (event.key === "Tab") { event.preventDefault(); skip.current?.focus(); }
      }}
    >
      <div className="rq-boot-shell">
        <header className="rq-boot-masthead">
          <RqWordmark corp />
          <span className="rq-boot-network">SURVIVAL ECOSYSTEM<span>BUILT ON SOLANA</span></span>
          <button ref={skip} type="button" className="rq-boot-skip" onClick={finish}>Enter RQ <span aria-hidden="true">↗</span></button>
        </header>

        <div className="rq-boot-main">
          <div className="rq-boot-entity">
            <div className="rq-boot-portrait" aria-hidden="true">
              <div className="rq-boot-orbit" />
              <Image src="/art/red-queen-agent-registry-v1.png" alt="" width={1024} height={1024} sizes="(max-width: 760px) 190px, 420px" priority />
            </div>
            <div className="rq-boot-entity-caption"><span>ENTITY 001</span><span>PRINCIPAL AGENT</span></div>
            <p className="rq-boot-quote">“I have considered<br />the consequences. Have you?”</p>
          </div>

          <div className="rq-boot-intelligence">
            <span className="rq-boot-eyebrow">RQ CORP // CENTRAL INTELLIGENCE</span>
            <h1 id="rq-boot-title">RED QUEEN<span>Survival begins with intelligence.</span></h1>
            <p id="rq-boot-description">Understand the threat. Prepare your next move.</p>
            <div className="rq-boot-module-heading"><span>THREAT MODULES</span><span>REAL + FICTIONAL</span></div>
            <ul className="rq-boot-modules" aria-label="Red Queen threat modules">
              {THREAT_MODULES.map((module, i) => (
                <li key={module.code} className={i < indexed ? "is-indexed" : ""}>
                  <span className="rq-boot-module-code">{module.code}</span>
                  <div><strong>{module.title}</strong><small>{module.detail}</small></div>
                  <span className="rq-boot-module-light" aria-hidden="true" />
                </li>
              ))}
            </ul>
            <div className="rq-boot-capabilities" aria-label="Red Queen capabilities">
              <div><span>01 / PLAN</span><strong>Survival protocols</strong></div>
              <div><span>02 / x402</span><strong>Paid intelligence</strong></div>
              <div><span>03 / EQUIP</span><strong>Real-world gear</strong></div>
            </div>
          </div>
        </div>

        <footer className="rq-boot-footer">
          <div className="rq-boot-sequence" aria-hidden="true"><span className="rq-boot-count">{String(indexed).padStart(2, "0")}<small> / 06</small></span><div className="rq-boot-segments">{THREAT_MODULES.map((module, i) => <i key={module.code} className={i < indexed ? "is-indexed" : ""} />)}</div><span>{indexed === THREAT_MODULES.length ? "THE QUEEN IS EXPECTING YOU." : "OPENING THE SYSTEM"}</span></div>
          <span className="rq-boot-signature">STAY INFORMED. ADAPT. SOLVIVE.</span>
        </footer>
      </div>
    </section>
  );
}
