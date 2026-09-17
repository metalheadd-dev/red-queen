"use client";

import { useCallback, useEffect, useState } from "react";
import BootSequence from "./BootSequence";
import { RQ_BOOT_COMPLETE_EVENT, RQ_BOOT_SESSION_KEY } from "@/lib/rq-boot";

export default function RqBootGate() {
  const [active, setActive] = useState(true);

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

  const complete = useCallback(() => {
    try {
      sessionStorage.setItem(RQ_BOOT_SESSION_KEY, "1");
    } catch {
      // The sequence still completes when session storage is unavailable.
    }
    document.documentElement.dataset.rqBoot = "seen";
    window.dispatchEvent(new Event(RQ_BOOT_COMPLETE_EVENT));
    setActive(false);
  }, []);

  return active ? <BootSequence onComplete={complete} /> : null;
}
