"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import BootSequence from "./BootSequence";
import { RQ_BOOT_COMPLETE_EVENT, RQ_BOOT_REPLAY_EVENT, RQ_BOOT_SESSION_KEY } from "@/lib/rq-boot";

export default function RqBootGate() {
  const [active, setActive] = useState(true);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(RQ_BOOT_SESSION_KEY) === "1") {
        document.documentElement.dataset.rqBoot = "seen";
        setActive(false);
      } else {
        document.documentElement.dataset.rqBoot = "show";
      }
    } catch {
      document.documentElement.dataset.rqBoot = "show";
    }
  }, []);

  useEffect(() => {
    const replay = () => {
      returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      document.documentElement.dataset.rqBoot = "show";
      setActive(true);
    };
    window.addEventListener(RQ_BOOT_REPLAY_EVENT, replay);
    return () => window.removeEventListener(RQ_BOOT_REPLAY_EVENT, replay);
  }, []);

  useEffect(() => {
    if (!active || document.documentElement.dataset.rqBoot !== "show") return;
    const page = document.querySelector<HTMLElement>(".page-bg");
    if (!page) return;
    const wasInert = page.inert;
    page.inert = true;
    return () => { page.inert = wasInert; };
  }, [active]);

  const complete = useCallback(() => {
    try {
      sessionStorage.setItem(RQ_BOOT_SESSION_KEY, "1");
    } catch {
      // The sequence still completes when session storage is unavailable.
    }
    document.documentElement.dataset.rqBoot = "seen";
    window.dispatchEvent(new Event(RQ_BOOT_COMPLETE_EVENT));
    setActive(false);
    requestAnimationFrame(() => {
      const target = returnFocus.current?.isConnected ? returnFocus.current : document.getElementById("rq-main");
      target?.focus({ preventScroll: true });
    });
  }, []);

  return active ? <BootSequence onComplete={complete} /> : null;
}
