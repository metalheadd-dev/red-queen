"use client";
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const DEFAULT_USER_TOKEN = "pk.eyJ1IjoicG9seWh1bnQyMyIsImEiOiJjbXBzbjh1bjkwZWZjMnFzZTNraDN6dzU2In0.AaOHetOyEbtDlQnlR4qz3Q";
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || DEFAULT_USER_TOKEN;

interface MapNode {
  id: string;
  name: string;
  type: string;
  category?: string;
  severity: number;
  lat: number;
  lng: number;
  region: string;
  desc: string;
  solution: string;
  analysis: string;
}

interface TacticalMapProps {
  nodes: MapNode[];
  onSelectNode: (node: MapNode) => void;
  selectedNode: MapNode | null;
}

function getNodeColor(node: MapNode): string {
  if (node.category === "fictional")   return "#a855f7";
  if (node.category === "satirical")   return "#f0c929";
  if (node.category === "algorithmic") return "#00ffcc";
  if (node.category === "realistic")   return "#ff4d4d";
  if (node.type === "ANOMALY")         return "#a855f7";
  if (node.type === "DEGENERACY")      return "#f0c929";
  if (node.type === "ALGORITHMIC")     return "#00ffcc";
  return "#ff4d4d";
}

function getSectorLabel(node: MapNode): string {
  if (node.category === "realistic")   return `SECTOR ALPHA // ${node.type}`;
  if (node.category === "fictional")   return "SECTOR BETA // ANOMALY";
  if (node.category === "satirical")   return "SECTOR GAMMA // DEGENERACY";
  if (node.category === "algorithmic") return "SECTOR DELTA // ALGORITHMIC";
  return node.type;
}

export default function TacticalMap({ nodes, onSelectNode, selectedNode }: TacticalMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const nodesRef = useRef<MapNode[]>(nodes);
  const onSelectRef = useRef(onSelectNode);
  const [mapError, setMapError] = useState<string | null>(null);

  // Keep refs in sync with latest props (avoid stale closures)
  nodesRef.current = nodes;
  onSelectRef.current = onSelectNode;

  // ── Core function: clear all markers and re-add from nodesRef ──
  function rebuildMarkers(map: mapboxgl.Map) {
    // Remove existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    nodesRef.current.forEach(node => {
      try {
        const lat = Number(node.lat);
        const lng = Number(node.lng);
        if (!isFinite(lat) || !isFinite(lng)) return;

        const color = getNodeColor(node);
        const sectorLabel = getSectorLabel(node);

        const el = document.createElement("div");
        el.className = "tactical-marker";
        el.style.cssText = "width:20px;height:20px;position:relative;cursor:pointer;";
        el.innerHTML = `
          <div class="pulse-ring" style="border-color:${color};box-shadow:0 0 10px ${color}80"></div>
          <div class="marker-core" style="background:${color}"></div>
        `;

        const popup = new mapboxgl.Popup({
          offset: 15,
          closeButton: false,
          className: "tactical-popup tactical-popup-" + (node.category || "realistic")
        }).setHTML(`
          <div style="font-family:var(--mono);font-size:10px;color:${color};border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:4px;margin-bottom:4px;text-transform:uppercase;">
            [${sectorLabel} // ${node.region}]
          </div>
          <div style="font-family:var(--sans);font-size:12px;font-weight:bold;color:#fff;">${node.name}</div>
          <div style="font-family:var(--mono);font-size:10px;color:var(--text-dim);margin-top:4px;">
            Severity: <span style="color:${color};font-weight:bold;">${node.severity}%</span>
          </div>
        `);

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(map);

        el.addEventListener("mouseenter", () => popup.addTo(map));
        el.addEventListener("mouseleave", () => popup.remove());
        el.addEventListener("click", () => {
          onSelectRef.current(node);
          try { map.flyTo({ center: [lng, lat], zoom: 4, speed: 1.2, curve: 1.4, essential: true }); } catch {}
        });

        markersRef.current.push(marker);
      } catch (err) {
        console.warn("Skipped node:", node?.id, err);
      }
    });

    // If many nodes (all sectors view), zoom to global so all colors visible
    if (nodesRef.current.length > 25) {
      try { map.flyTo({ center: [15, 20], zoom: 1.4, speed: 1.0, essential: true }); } catch {}
    }
  }

  // ── Initialize map once ──
  useEffect(() => {
    if (!mapContainerRef.current) return;

    try {
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [15, 25],
        zoom: 1.4,
        pitch: 25,
        projection: { name: "globe" } as any
      });

      mapRef.current = map;
      map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), "top-right");

      // When style loads: set fog then immediately build markers
      map.on("style.load", () => {
        try {
          map.setFog({
            color: "rgb(15, 10, 10)",
            "high-color": "rgb(36, 10, 10)",
            "space-color": "rgb(0, 0, 0)",
            "horizon-blend": 0.02
          });
        } catch {}
        rebuildMarkers(map);
      });

      return () => { map.remove(); };
    } catch (err: any) {
      console.error("Mapbox init failed:", err);
      setMapError(err.message || "WebGL context is unsupported or Mapbox token is invalid.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Rebuild markers when nodes prop changes ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (map.isStyleLoaded()) {
      rebuildMarkers(map);
    } else {
      // Style not ready yet — wait for it (handled by the style.load listener above)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes]);

  // ── Fly to selected node when it changes ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedNode || !map.isStyleLoaded()) return;
    try {
      map.flyTo({
        center: [selectedNode.lng, selectedNode.lat],
        zoom: 4.5,
        pitch: 35,
        speed: 1.2,
        essential: true
      });
    } catch {}
  }, [selectedNode]);

  if (mapError) {
    return (
      <div style={{
        position: "relative", width: "100%", height: "420px", borderRadius: "2px",
        overflow: "hidden", border: "1px solid rgba(255,77,77,0.3)",
        background: "rgba(15,10,10,0.9)", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: "24px",
        textAlign: "center", fontFamily: "var(--mono)", boxSizing: "border-box"
      }}>
        <div style={{ position: "absolute", top: "10px", left: "10px", width: "12px", height: "12px", borderTop: "2px solid var(--accent)", borderLeft: "2px solid var(--accent)" }} />
        <div style={{ position: "absolute", top: "10px", right: "10px", width: "12px", height: "12px", borderTop: "2px solid var(--accent)", borderRight: "2px solid var(--accent)" }} />
        <div style={{ position: "absolute", bottom: "10px", left: "10px", width: "12px", height: "12px", borderBottom: "2px solid var(--accent)", borderLeft: "2px solid var(--accent)" }} />
        <div style={{ position: "absolute", bottom: "10px", right: "10px", width: "12px", height: "12px", borderBottom: "2px solid var(--accent)", borderRight: "2px solid var(--accent)" }} />
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "16px" }}>
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <h3 style={{ fontFamily: "var(--title-font)", fontSize: "15px", fontWeight: "bold", color: "var(--accent)", margin: "0 0 8px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          [ ⚠️ RADAR UPLINK OFFLINE ]
        </h3>
        <p style={{ fontSize: "12px", color: "var(--text)", maxWidth: "450px", lineHeight: "1.6", margin: "0 0 16px" }}>
          Failed to establish coordinate radar link: <span style={{ color: "rgba(255,255,255,0.7)" }}>{mapError}</span>
        </p>
        <div style={{ fontSize: "11px", color: "var(--text-dim)", borderTop: "1px dashed rgba(255,77,77,0.2)", paddingTop: "12px", maxWidth: "400px" }}>
          RECOVERY ACTIONS: Enable WebGL hardware acceleration in your browser settings, or disable restrictive privacy shields that block canvas mapping libraries.
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "420px", borderRadius: "2px", overflow: "hidden" }}>
      <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />
      <style jsx global>{`
        .tactical-marker { display:flex;align-items:center;justify-content:center; }
        .pulse-ring { position:absolute;width:24px;height:24px;border:2px solid #ff4d4d;border-radius:50%;animation:marker-pulse 2.5s infinite ease-out; }
        .marker-core { width:8px;height:8px;border-radius:50%;z-index:2; }
        @keyframes marker-pulse {
          0%   { transform:scale(0.3);opacity:0.8; }
          70%  { transform:scale(1.8);opacity:0; }
          100% { transform:scale(1.8);opacity:0; }
        }
        .mapboxgl-popup-content { background:rgba(5,5,5,0.95)!important;border:1px solid #ff4d4d!important;border-radius:2px!important;padding:10px 14px!important;color:var(--text)!important;box-shadow:0 4px 20px rgba(0,0,0,0.8)!important; }
        .mapboxgl-popup-tip { border-top-color:#ff4d4d!important;border-bottom-color:#ff4d4d!important; }
        .tactical-popup-realistic .mapboxgl-popup-content { border-color:#ff4d4d!important; }
        .tactical-popup-fictional  .mapboxgl-popup-content { border-color:#a855f7!important; }
        .tactical-popup-fictional  .mapboxgl-popup-tip     { border-top-color:#a855f7!important;border-bottom-color:#a855f7!important; }
        .tactical-popup-satirical  .mapboxgl-popup-content { border-color:#f0c929!important; }
        .tactical-popup-satirical  .mapboxgl-popup-tip     { border-top-color:#f0c929!important;border-bottom-color:#f0c929!important; }
        .tactical-popup-algorithmic .mapboxgl-popup-content { border-color:#00ffcc!important; }
        .tactical-popup-algorithmic .mapboxgl-popup-tip    { border-top-color:#00ffcc!important;border-bottom-color:#00ffcc!important; }
      `}</style>
    </div>
  );
}
