"use client";
import { useState, useEffect } from "react";
import SolvivorIcon from "./SolvivorIcon";

const BOOT_LINES = [
  { text: "INITIALIZING SOLVIVOR PROTOCOLS...", delay: 400, type: "default" },
  { text: "CONNECTING TO GLOBAL MAINFRAME...", delay: 800, type: "default" },
  { text: "LOADING THREAT DATABASE [5 VECTORS]...", delay: 1200, type: "default" },
  { text: "VERIFYING BIO-METRICS...", delay: 1600, type: "default" },
  { text: "SCANNING NEURAL PATTERNS...", delay: 2000, type: "default" },
  { text: "[WARN_0x4F] UNAUTHORIZED ACCESS ATTEMPT LOGGED", delay: 2400, type: "warn" },
  { text: "[OK_0x00] ACCESS GRANTED — CLEARANCE LEVEL PENDING", delay: 2800, type: "done" },
  { text: "RED QUEEN IS ONLINE.", delay: 3200, type: "done" },
];

interface Props {
  onComplete: () => void;
}

export default function BootSequence({ onComplete }: Props) {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    BOOT_LINES.forEach((line, i) => {
      timers.push(
        setTimeout(() => {
          setVisibleLines(i + 1);
          setProgress(Math.round(((i + 1) / BOOT_LINES.length) * 100));
        }, line.delay)
      );
    });

    timers.push(
      setTimeout(() => {
        setExiting(true);
        setTimeout(onComplete, 800);
      }, 3800)
    );

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div
      className="boot-screen"
      style={{
        transition: "opacity 0.8s ease",
        opacity: exiting ? 0 : 1,
      }}
    >
      {/* Logo */}
      <div className="boot-logo">
        <div className="zombie-container">
          <div className="zombie-art">
{`    ██████████
   ██  ████  ██
  ████  ██  ████
 ██  ████████  ██
██  ██  ██  ██  ██
 ████  ████  ████
  ██  ██  ██  ██
   ████████████`}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <SolvivorIcon size={72} />
        </div>
        <div style={{
          textAlign: "center",
          fontFamily: "var(--mono)",
          fontSize: "10px",
          letterSpacing: "0.4em",
          color: "rgba(255,77,77,0.6)",
          marginTop: "12px",
          textTransform: "uppercase"
        }}>
          SOLVIVOR CORP
        </div>
      </div>

      {/* Boot lines */}
      <div className="boot-lines">
        {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
          <div
            key={i}
            className={`boot-line ${line.type}`}
            style={{ animationDelay: "0s" }}
          >
            <span style={{ color: "rgba(255,77,77,0.4)", minWidth: "20px" }}>{">"}</span>
            <span>{line.text}</span>
            {i === visibleLines - 1 && !exiting && <span className="boot-cursor" />}
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="boot-progress">
        <div className="boot-progress-bar" style={{ width: `${progress}%` }} />
      </div>

      <div style={{
        marginTop: "12px",
        fontFamily: "var(--mono)",
        fontSize: "10px",
        color: "rgba(255,77,77,0.4)",
        letterSpacing: "0.2em"
      }}>
        LOADING... {progress}%
      </div>
    </div>
  );
}
