"use client";
import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP_STYLES, readTheme, THEME_EVENT, type RedQueenTheme } from "@/lib/theme";

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
  focus?: { lat: number; lng: number; label: string } | null;
  focusMode?: boolean;
}

function escapeHtml(value: string | number) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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

export default function TacticalMap({ nodes, onSelectNode, selectedNode, focus = null, focusMode = false }: TacticalMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const focusMarkerRef = useRef<maplibregl.Marker | null>(null);
  const nodesRef = useRef<MapNode[]>(nodes);
  const onSelectRef = useRef(onSelectNode);
  const focusModeRef = useRef(focusMode);
  const focusRef = useRef(focus);
  const [mapError, setMapError] = useState<string | null>(null);

  nodesRef.current = nodes;
  onSelectRef.current = onSelectNode;
  focusModeRef.current = focusMode;
  focusRef.current = focus;

  function rebuildFocus(map: maplibregl.Map) {
    focusMarkerRef.current?.remove();
    focusMarkerRef.current = null;
    const currentFocus = focusRef.current;
    if (!currentFocus || !Number.isFinite(currentFocus.lat) || !Number.isFinite(currentFocus.lng)) return;

    const element = document.createElement("div");
    element.className = "tactical-focus-marker";
    element.setAttribute("aria-label", `Broad monitoring area: ${currentFocus.label}`);
    element.innerHTML = '<span></span><i></i>';
    focusMarkerRef.current = new maplibregl.Marker({ element, anchor: "center" })
      .setLngLat([currentFocus.lng, currentFocus.lat])
      .setPopup(new maplibregl.Popup({ offset: 20, closeButton: false }).setText(`BROAD AREA // ${currentFocus.label}`))
      .addTo(map);

    if (focusModeRef.current) {
      try { map.flyTo({ center: [currentFocus.lng, currentFocus.lat], zoom: 4.6, pitch: 28, speed: 1.1, essential: true }); } catch {}
    }
  }

  function rebuildMarkers(map: maplibregl.Map) {
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
        el.style.cssText = "width:20px;height:20px;position:absolute;cursor:pointer;";
        el.innerHTML = `
          <div class="pulse-ring" style="border-color:${color};box-shadow:0 0 10px ${color}80"></div>
          <div class="marker-core" style="background:${color}"></div>
        `;

        const popup = new maplibregl.Popup({
          offset: 15,
          closeButton: false,
          className: "tactical-popup tactical-popup-" + (node.category || "realistic")
        }).setHTML(`
          <div style="font-family:var(--mono);font-size:10px;color:${color};border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:4px;margin-bottom:4px;text-transform:uppercase;">
            [${escapeHtml(sectorLabel)} // ${escapeHtml(node.region)}]
          </div>
          <div style="font-family:var(--sans);font-size:12px;font-weight:bold;color:#fff;">${escapeHtml(node.name)}</div>
          <div style="font-family:var(--mono);font-size:10px;color:var(--text-dim);margin-top:4px;">
            Severity: <span style="color:${color};font-weight:bold;">${escapeHtml(node.severity)}%</span>
          </div>
        `);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(map);

        el.addEventListener("mouseenter", () => popup.addTo(map));
        el.addEventListener("mouseleave", () => popup.remove());
        el.addEventListener("click", () => {
          onSelectRef.current(node);
          try { map.flyTo({ center: [lng, lat], zoom: 4.5, speed: 1.2, curve: 1.4, essential: true }); } catch {}
        });

        markersRef.current.push(marker);
      } catch (err) {
        console.warn("Skipped node:", node?.id, err);
      }
    });

    if (nodesRef.current.length > 25 && !focusModeRef.current) {
      try { map.flyTo({ center: [15, 20], zoom: 1.4, speed: 1.0, essential: true }); } catch {}
    }
  }

  useEffect(() => {
    if (!mapContainerRef.current) return;

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: MAP_STYLES[readTheme()],
        center: [15, 25],
        zoom: 1.4,
        pitch: 20,
        attributionControl: false
      });

      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");
      map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

      map.on("load", () => {
        setTimeout(() => {
          rebuildMarkers(map);
          rebuildFocus(map);
        }, 100);
      });

      const syncMapTheme = (event: Event) => {
        const theme = (event as CustomEvent<RedQueenTheme>).detail;
        if (theme !== "dark" && theme !== "light") return;
        map.setStyle(MAP_STYLES[theme]);
        map.once("style.load", () => {
          rebuildMarkers(map);
          rebuildFocus(map);
        });
      };
      window.addEventListener(THEME_EVENT, syncMapTheme);

      return () => {
        window.removeEventListener(THEME_EVENT, syncMapTheme);
        map.remove();
      };
    } catch (err: any) {
      console.error("MapLibre init failed on main page:", err);
      setMapError(err.message || "WebGL context is unsupported or MapLibre stylesheet is offline.");
    }
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (map.isStyleLoaded()) {
      rebuildMarkers(map);
    }
  }, [nodes]);

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

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    rebuildFocus(map);
  }, [focus, focusMode]);

  if (mapError) {
    return (
      <div style={{
        position: "relative", width: "100%", height: "500px", borderRadius: "2px",
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
    <div style={{ position: "relative", width: "100%", height: "clamp(540px, 68vh, 760px)", borderRadius: "2px", overflow: "hidden" }}>
      <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />
      <style jsx global>{`
        .tactical-marker { display:flex;align-items:center;justify-content:center; }
        .pulse-ring { position:absolute;width:24px;height:24px;border:2px solid #ff4d4d;border-radius:50%;animation:marker-pulse 2.5s infinite ease-out; }
        .marker-core { width:8px;height:8px;border-radius:50%;z-index:2; }
        .tactical-focus-marker { position:relative;width:34px;height:34px;display:grid;place-items:center;cursor:help; }
        .tactical-focus-marker > span { position:absolute;inset:0;border:1px solid rgba(112,199,232,.85);border-radius:50%;box-shadow:0 0 20px rgba(112,199,232,.5);animation:focus-pulse 2.8s infinite ease-out; }
        .tactical-focus-marker > i { width:10px;height:10px;border:2px solid #fff;border-radius:50%;background:#70c7e8;box-shadow:0 0 16px #70c7e8; }
        @keyframes focus-pulse { 0%,100% { transform:scale(.72);opacity:.85; } 70% { transform:scale(1.65);opacity:.12; } }
        @keyframes marker-pulse {
          0%   { transform:scale(0.3);opacity:0.8; }
          70%  { transform:scale(1.8);opacity:0; }
          100% { transform:scale(1.8);opacity:0; }
        }
        .maplibregl-popup-content { background:rgba(5,5,5,0.95)!important;border:1px solid #ff4d4d!important;border-radius:2px!important;padding:10px 14px!important;color:var(--text)!important;box-shadow:0 4px 20px rgba(0,0,0,0.8)!important; }
        .maplibregl-popup-tip { border-top-color:#ff4d4d!important;border-bottom-color:#ff4d4d!important; }
        .tactical-popup-realistic .maplibregl-popup-content { border-color:#ff4d4d!important; }
        .tactical-popup-fictional  .maplibregl-popup-content { border-color:#a855f7!important; }
        .tactical-popup-fictional  .maplibregl-popup-tip     { border-top-color:#a855f7!important;border-bottom-color:#a855f7!important; }
        .tactical-popup-satirical  .maplibregl-popup-content { border-color:#f0c929!important; }
        .tactical-popup-satirical  .maplibregl-popup-tip     { border-top-color:#f0c929!important;border-bottom-color:#f0c929!important; }
        .tactical-popup-algorithmic .maplibregl-popup-content { border-color:#00ffcc!important; }
        .tactical-popup-algorithmic .maplibregl-popup-tip    { border-top-color:#00ffcc!important;border-bottom-color:#00ffcc!important; }
        .maplibregl-ctrl-logo { display:none!important; }
        .maplibregl-ctrl-attrib { background:rgba(0,0,0,0.4)!important;font-size:9px!important;opacity:0.4!important;transition:opacity 0.2s; }
        .maplibregl-ctrl-attrib:hover { opacity:1!important; }
        .maplibregl-ctrl-attrib a { color:#666!important; }
      `}</style>
    </div>
  );
}
