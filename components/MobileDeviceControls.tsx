"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MOBILE_EXPERIENCE_EVENT,
  mobileSoundEnabled,
  playMobileTone,
  registerRedQueenServiceWorker,
  setMobileSoundEnabled,
} from "@/lib/mobile-experience";
import {
  parseSignalWatchMemory,
  SIGNAL_WATCH_EVENT,
  SIGNAL_WATCH_STORAGE_KEY,
  writeSignalWatchMemory,
} from "@/lib/signal-watch";

type AlertState = NotificationPermission | "unsupported";

export default function MobileDeviceControls() {
  const [sound, setSound] = useState(false);
  const [alerts, setAlerts] = useState<AlertState>("unsupported");
  const [alertArmed, setAlertArmed] = useState(false);

  useEffect(() => {
    const sync = () => {
      setSound(mobileSoundEnabled());
      setAlerts("Notification" in window ? Notification.permission : "unsupported");
      setAlertArmed(parseSignalWatchMemory(localStorage.getItem(SIGNAL_WATCH_STORAGE_KEY)).browserAlerts);
    };
    sync();
    window.addEventListener(MOBILE_EXPERIENCE_EVENT, sync);
    window.addEventListener(SIGNAL_WATCH_EVENT, sync);
    return () => {
      window.removeEventListener(MOBILE_EXPERIENCE_EVENT, sync);
      window.removeEventListener(SIGNAL_WATCH_EVENT, sync);
    };
  }, []);

  function toggleSound() {
    const next = !sound;
    setSound(next);
    setMobileSoundEnabled(next);
    if (next) window.setTimeout(() => playMobileTone("confirm"), 0);
  }

  async function toggleAlerts() {
    if (!("Notification" in window)) return;
    if (alertArmed) {
      const memory = parseSignalWatchMemory(localStorage.getItem(SIGNAL_WATCH_STORAGE_KEY));
      writeSignalWatchMemory(localStorage, { ...memory, browserAlerts: false });
      setAlertArmed(false);
      window.dispatchEvent(new Event(SIGNAL_WATCH_EVENT));
      return;
    }
    await registerRedQueenServiceWorker();
    const permission = await Notification.requestPermission();
    setAlerts(permission);
    if (permission !== "granted") return;
    const memory = parseSignalWatchMemory(localStorage.getItem(SIGNAL_WATCH_STORAGE_KEY));
    writeSignalWatchMemory(localStorage, { ...memory, browserAlerts: true });
    setAlertArmed(true);
    window.dispatchEvent(new Event(SIGNAL_WATCH_EVENT));
    playMobileTone("confirm");
  }

  const alertLabel = alerts === "unsupported" ? "NOT SUPPORTED"
    : alerts === "denied" ? "BLOCKED"
      : alertArmed ? "ALERTS ON" : "ENABLE ALERTS";

  return (
    <section className="rq-mobile-device" aria-label="Mobile app controls">
      <div><span>DEVICE</span><strong>Sound & alerts</strong></div>
      <div className="rq-mobile-device-actions">
        <button type="button" data-rq-silent aria-pressed={sound} onClick={toggleSound}>
          <i>{sound ? "ON" : "OFF"}</i>SOUND
        </button>
        <button type="button" data-rq-silent aria-pressed={alertArmed} disabled={alerts === "unsupported" || alerts === "denied"} onClick={() => void toggleAlerts()}>
          <i>{alertArmed ? "ON" : "OFF"}</i>{alertLabel}
        </button>
        <Link href="/pulse#signal-watch">WATCH →</Link>
      </div>
    </section>
  );
}
