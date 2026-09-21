"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

const BOOT_LINES = [
  { text: "SOLANA MAINNET // CONNECTED", delay: 260, type: "default" },
  { text: "THREAT ANALYSIS // READY", delay: 760, type: "default" },
  { text: "SURVIVAL PLANS · LOADOUTS // READY", delay: 1260, type: "default" },
  { text: "x402 INTELLIGENCE RAIL // READY", delay: 1760, type: "default" },
  { text: "RED QUEEN // ONLINE", delay: 2260, type: "done" },
] as const;

export default function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [visibleLines, setVisibleLines] = useState(0);
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);
  const reducedMotion = useRef(false);
  const finish = useCallback(() => setExiting(true), []);

  useEffect(() => {
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timers: ReturnType<typeof setTimeout>[] = [];

    if (reducedMotion.current) {
      setVisibleLines(BOOT_LINES.length);
      setProgress(100);
    } else {
      BOOT_LINES.forEach((line, index) => {
        timers.push(setTimeout(() => {
          setVisibleLines(index + 1);
          setProgress(Math.round(((index + 1) / BOOT_LINES.length) * 100));
        }, line.delay));
      });
    }

    timers.push(setTimeout(finish, reducedMotion.current ? 1400 : 3400));
    return () => timers.forEach(clearTimeout);
  }, [finish]);

  useEffect(() => {
    if (!exiting) return;
    const timer = setTimeout(onComplete, reducedMotion.current ? 0 : 360);
    return () => clearTimeout(timer);
  }, [exiting, onComplete]);

  return (
    <section
      className={`boot-screen rq-session-boot${exiting ? " is-exiting" : ""}`}
      role="status"
      aria-live="polite"
      aria-labelledby="rq-boot-title"
      aria-describedby="rq-boot-directive"
    >
      <div className="boot-core">
        <div className="boot-queen" aria-hidden="true">
          <Image
            src="/art/red-queen-agent-registry-v1.png"
            alt=""
            width={1024}
            height={1024}
            sizes="(max-width: 700px) 220px, 320px"
            priority
          />
        </div>

        <div className="boot-brand">
          <strong id="rq-boot-title">RQ CORP</strong>
          <span><b>RED QUEEN</b><em>// PRIMARY AGENT</em></span>
          <small>SURVIVAL INTELLIGENCE · BUILT ON SOLANA</small>
        </div>

        <p id="rq-boot-directive" className="boot-directive">
          SURVIVAL NETWORK // INITIALIZING
        </p>

        <div className="boot-terminal" aria-live="polite">
          <div className="boot-terminal-head">
            <span>SYS://RQ_BOOT</span>
            <span>[ SURVIVAL INTELLIGENCE SYSTEM ]</span>
          </div>
          <div className="boot-lines">
            {BOOT_LINES.slice(0, visibleLines).map((line, index) => (
              <div key={line.text} className={`boot-line ${line.type}`}>
                <span className="boot-prompt" aria-hidden="true">&gt;</span>
                <span>{line.text}</span>
                {index === visibleLines - 1 && !exiting ? <span className="boot-cursor" aria-hidden="true" /> : null}
              </div>
            ))}
          </div>
        </div>

        <div className="boot-progress" aria-hidden="true">
          <div className="boot-progress-bar" style={{ width: `${progress}%` }} />
        </div>
        <div className="boot-percent">
          <span>SYS_BOOT</span>
          <span>[{String(progress).padStart(3, "0")}%]</span>
        </div>
      </div>
    </section>
  );
}
