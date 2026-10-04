"use client";

import { useEffect, useState } from "react";

export default function GamingCurrentPlayers({ appId }: { appId: number }) {
  const [players, setPlayers] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/gaming/steam/current-players?ids=${appId}`).then(response => response.json()).then(data => {
      if (cancelled) return;
      const value = data.counts?.find((item: { appId: number; players: number | null }) => item.appId === appId)?.players;
      setPlayers(typeof value === "number" ? value : null);
      setLoaded(true);
    }).catch(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [appId]);
  return <div className="gaming-detail-metric"><strong>{loaded ? players === null ? "—" : players.toLocaleString() : "…"}</strong><span>PLAYING ON STEAM NOW</span><small>Steam snapshot, cached for about 15 minutes.</small></div>;
}
