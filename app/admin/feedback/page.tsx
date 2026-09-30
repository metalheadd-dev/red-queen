"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";

type Report = { id: string; surface: string; reason: string; prompt: string; reported_reply: string; detail: string; created_at: string };
export default function AgentFeedbackPage() {
  const { session, loading } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [status, setStatus] = useState("");
  useEffect(() => {
    setReports([]);
    if (!session?.access_token) return;
    const controller = new AbortController();
    setStatus("Loading private feedback…");
    void fetch("/api/agent/feedback", { headers: { Authorization: `Bearer ${session.access_token}` }, cache: "no-store", signal: controller.signal }).then(async response => {
      const data = await response.json();
      if (controller.signal.aborted) return;
      if (!response.ok) { setStatus(response.status === 403 ? "Administrator access required." : "Feedback queue is unavailable."); return; }
      setReports(data.reports || []); setStatus(data.reports?.length ? "User-submitted reports; these are not certified gameplay results." : "No reports received.");
    }).catch(() => { if (!controller.signal.aborted) setStatus("Feedback queue could not be reached."); });
    return () => controller.abort();
  }, [session?.access_token]);
  return <main className="container" style={{ paddingTop: 120, paddingBottom: 80 }}><Link href="/admin">← ADMIN</Link><h1 style={{ marginTop: 24 }}>QUEEN FEEDBACK</h1><p role="status">{loading ? "Checking session…" : !session ? "Sign in with an administrator account." : status}</p>{session && reports.map(report => <article key={report.id} style={{ border: "1px solid var(--border)", padding: 24, marginTop: 20 }}><strong>{report.surface} / {report.reason}</strong><p>{new Date(report.created_at).toLocaleString()}</p><details><summary>Question and reported reply</summary><p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{report.prompt}</p><p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{report.reported_reply}</p></details>{report.detail && <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{report.detail}</p>}</article>)}</main>;
}
