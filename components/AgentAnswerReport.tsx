"use client";

import { useId, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { AGENT_REPORT_REASONS, type AgentReportReason } from "@/lib/agent-feedback";
import styles from "./AgentAnswerReport.module.css";

export default function AgentAnswerReport({ prompt, reply, generationId, surface = "CORE" }: { prompt: string; reply: string; generationId?: string; surface?: "CORE" | "GAMING" }) {
  const { session } = useAuth();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<AgentReportReason>("INCORRECT");
  const [detail, setDetail] = useState("");
  const [sending, setSending] = useState(false);
  const [received, setReceived] = useState(false);
  const [status, setStatus] = useState("");
  async function send() {
    if (sending || received) return;
    setSending(true); setStatus("");
    try {
      const response = await fetch("/api/agent/feedback", { method: "POST", headers: { "Content-Type": "application/json", ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) }, body: JSON.stringify({ prompt, reply, generationId, surface, reason, detail }) });
      const data = await response.json();
      if (!response.ok || !data.received) throw new Error(data.error || "The report could not be submitted. Try again.");
      setReceived(true); setOpen(false); setStatus("Report received for review. Thank you.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Report service could not be reached. Nothing was submitted."); }
    finally { setSending(false); }
  }
  return <div className={styles.report}>
    {!received && <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)} disabled={sending}>REPORT THIS REPLY</button>}
    {open && <div id={id} className={styles.form}><label>Reason<select value={reason} onChange={event => setReason(event.target.value as AgentReportReason)} disabled={sending}>{AGENT_REPORT_REASONS.map(value => <option key={value} value={value}>{value === "INCORRECT" ? "Incorrect advice" : value === "UNSAFE" ? "Unsafe advice" : value === "OFFENSIVE" ? "Offensive content" : value === "SPOILER" ? "Unwanted spoiler" : "Other concern"}</option>)}</select></label><label>Details (optional)<textarea rows={3} value={detail} maxLength={1000} onChange={event => setDetail(event.target.value)} disabled={sending} /></label><p>Sending shares this question, reply and your explanation with RQ for review. Avoid adding private information.</p><div><button type="button" onClick={() => void send()} disabled={sending}>{sending ? "SENDING…" : "SEND REPORT"}</button><button type="button" onClick={() => setOpen(false)} disabled={sending}>CANCEL</button></div></div>}
    {status && <p role="status">{status}</p>}
  </div>;
}
