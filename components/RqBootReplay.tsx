"use client";

import { RQ_BOOT_REPLAY_EVENT } from "@/lib/rq-boot";

export default function RqBootReplay() {
  return <button type="button" className="rq-replay-intro" onClick={() => window.dispatchEvent(new Event(RQ_BOOT_REPLAY_EVENT))}>Replay system intro <span aria-hidden="true">↗</span></button>;
}
