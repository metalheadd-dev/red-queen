"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import styles from "./ProfileSteamLink.module.css";

export default function ProfileSteamLink() {
  const { user } = useAuth();
  return <ProfileSteamLinkContent key={user?.id || "guest"} />;
}

function ProfileSteamLinkContent() {
  const { session } = useAuth();
  const [state, setState] = useState<"checking" | "connected" | "ready" | "unavailable">("checking");

  useEffect(() => {
    const token = session?.access_token;
    if (!token) return;
    const controller = new AbortController();
    fetch("/api/gaming/steam/link", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: controller.signal,
    }).then(async (response) => {
      const data = await response.json();
      if (controller.signal.aborted) return;
      setState(response.ok && data.available ? data.steamId ? "connected" : "ready" : "unavailable");
    }).catch(() => { if (!controller.signal.aborted) setState("unavailable"); });
    return () => controller.abort();
  }, [session?.access_token]);

  return <section className={styles.panel} aria-label="Connected gaming accounts">
    <div><span className={styles.kicker}>CONNECTED ACCOUNTS / GAMING</span><h2>Steam identity</h2><p>{state === "connected" ? "Your Steam account is linked privately to this RQ profile." : state === "ready" ? "Connect your Steam identity to this RQ profile for the Gaming Room." : state === "unavailable" ? "Steam connection is currently unavailable." : "Checking Steam connection..."}</p></div>
    <Link href="/gaming/profile">{state === "connected" ? "MANAGE STEAM →" : "OPEN STEAM CONNECTION →"}</Link>
  </section>;
}
