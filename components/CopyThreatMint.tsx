"use client";

import { useState } from "react";
import { THREAT_TOKEN_MINT } from "@/lib/threat-token";

export default function CopyThreatMint() {
  const [copied, setCopied] = useState(false);

  const copyMint = async () => {
    await navigator.clipboard.writeText(THREAT_TOKEN_MINT);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="rq-threat-mint">
      <span>CANONICAL TOKEN CONTRACT</span>
      <div>
        <code title={THREAT_TOKEN_MINT}>{THREAT_TOKEN_MINT}</code>
        <button type="button" onClick={copyMint} aria-label="Copy the canonical THREAT token contract">
          {copied ? "COPIED" : "COPY"}
        </button>
      </div>
    </div>
  );
}
