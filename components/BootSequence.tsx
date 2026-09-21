"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import SolvivalIcon from "./SolvivalIcon";

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
  const skip = useRef<HTMLButtonElement>(null);
  const finish = useCallback(() => setExiting(true), []);

  useEffect(() => {
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    skip.current?.focus({ preventScroll: true });
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
      role="dialog"
      aria-modal="true"
      aria-labelledby="rq-boot-title"
      aria-describedby="rq-boot-directive"
      onKeyDown={event => {
        if (event.key === "Escape") finish();
        if (event.key === "Tab") {
          event.preventDefault();
          skip.current?.focus();
        }
      }}
    >
      <button ref={skip} type="button" className="boot-skip" onClick={finish}>
        ENTER RQ <span aria-hidden="true">↗</span>
      </button>

      <div className="boot-core">
        <div className="boot-queen" aria-hidden="true">
          <div className="boot-queen-ring" />
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
          <SolvivalIcon size={34} />
          <div>
            <span>RQ CORP // ENTITY 001</span>
            <strong id="rq-boot-title">RED QUEEN</strong>
            <small>SURVIVAL INTELLIGENCE // SOLANA</small>
          </div>
        </div>

        <p id="rq-boot-directive" className="boot-directive">
          SURVIVAL NETWORK // INITIALIZING
        </p>

        <div className="boot-terminal" aria-live="polite">
          <div className="boot-terminal-head">
            <span>RQ/BOOT</span>
            <span>SURVIVAL INTELLIGENCE SYSTEM</span>
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
          <span>SYSTEM BOOT</span>
          <span>{String(progress).padStart(3, "0")}%</span>
        </div>
      </div>
    </section>
  );
}
