"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import SolvivalIcon from "./SolvivalIcon";

const BOOT_LINES = [
  { text: "EYES // VERIFIED SIGNAL GRID", delay: 180, type: "default" },
  { text: "NERVES // LIVE MAP", delay: 430, type: "default" },
  { text: "MEMORY // SURVIVAL CONTEXT", delay: 680, type: "default" },
  { text: "RED QUEEN // ONLINE", delay: 930, type: "done" },
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
        setTimeout(onComplete, 420);
      }, 1350)
    );

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div
      className="boot-screen"
      style={{
        transition: "opacity 0.4s ease",
        opacity: exiting ? 0 : 1,
      }}
    >
      <div className="boot-queen" aria-hidden="true">
        <div className="boot-queen-ring" />
        <Image src="/art/red-queen-presence.png" alt="" width={1199} height={1312} priority />
      </div>

      <div className="boot-brand"><SolvivalIcon size={34} /><div><strong>RED QUEEN</strong><span>SURVIVAL INTELLIGENCE</span></div></div>
      <p className="boot-directive">“I will show you what changed. You decide whether to act.”</p>

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

      <div className="boot-percent">CONNECTING {progress}%</div>
    </div>
  );
}
