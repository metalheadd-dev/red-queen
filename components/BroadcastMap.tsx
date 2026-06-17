"use client";
import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

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
}

interface BroadcastMapProps {
  nodes: MapNode[];
  onSelectNode?: (node: MapNode) => void;
  selectedNode: MapNode | null;
}

function getNodeColor(node: MapNode): string {
  if (node.category === "gdacs") {
    const level = (node as any).alertLevel || "Green";
    if (level === "Red") return "#ff4d4d";
    if (level === "Orange") return "#f97316";
    if (level === "Green") return "#22c55e";
    return "#22c55e";
  }
  if (node.category === "fictional")   return "#a855f7";
  if (node.category === "satirical")   return "#f0c929";
  if (node.category === "algorithmic") return "#00ffcc";
  return "#ff4d4d"; // realistic
}

function getSectorLabel(node: MapNode): string {
  if (node.category === "gdacs") {
    return `TACTICAL FEED // ${(node as any).eventTypeName || node.type}`;
  }
  if (node.category === "realistic")   return `SECTOR ALPHA // ${node.type}`;
  if (node.category === "fictional")   return "SECTOR BETA // ANOMALY";
  if (node.category === "satirical")   return "SECTOR GAMMA // DEGENERACY";
  if (node.category === "algorithmic") return "SECTOR DELTA // ALGORITHMIC";
  return node.type;
}

export default function BroadcastMap({ nodes, onSelectNode, selectedNode }: BroadcastMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const nodesRef = useRef<MapNode[]>(nodes);
  const onSelectRef = useRef(onSelectNode);
  const [mapError, setMapError] = useState<string | null>(null);

  // Sync props to refs to avoid stale closures
  nodesRef.current = nodes;
  onSelectRef.current = onSelectNode;

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
        el.style.cssText = "width:24px;height:24px;position:relative;cursor:pointer;";
        
        // Custom inner HTML with pulsing ring and solid core
        el.innerHTML = `
          <div style="
            border: 2px solid ${color};
            border-radius: 50%;
            height: 24px;
            width: 24px;
            position: absolute;
            top: 0;
            left: 0;
            opacity: 0;
            animation: maplibre-pulse 1.8s infinite ease-out;
            box-shadow: 0 0 8px ${color};
            box-sizing: border-box;
          "></div>
          <div style="
            background: ${color};
            border: 1px solid rgba(255,255,255,0.4);
            border-radius: 50%;
            height: 10px;
            width: 10px;
            position: absolute;
            top: 7px;
            left: 7px;
            box-shadow: 0 0 6px ${color};
            box-sizing: border-box;
          "></div>
        `;

        const popup = new maplibregl.Popup({
          offset: 15,
          closeButton: false,
          className: "tactical-popup"
        }).setHTML(`
          <div style="
            background: rgba(5, 5, 5, 0.95);
            border: 1px solid ${color};
            padding: 12px;
            border-radius: 4px;
            font-family: var(--sans);
            color: #fff;
          ">
            <div style="font-family:var(--mono);font-size:9px;color:${color};border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:4px;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em;">
              [${sectorLabel} // ${node.region || "Global"}]
            </div>
            <div style="font-size:12px;font-weight:bold;color:#fff;margin-bottom:4px;line-height:1.3;">${node.name}</div>
            <div style="font-family:var(--mono);font-size:10px;color:#bbb;">
              Severity: <span style="color:${color};font-weight:bold;">${node.severity}%</span>
            </div>
            ${node.desc ? `
              <div style="font-size:11px;color:#999;margin-top:6px;line-height:1.4;max-width:220px;word-break:word-wrap;">
                ${node.desc.length > 140 ? node.desc.slice(0, 140) + "..." : node.desc}
              </div>
            ` : ""}
          </div>
        `);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(map);

        el.addEventListener("mouseenter", () => popup.addTo(map));
        el.addEventListener("mouseleave", () => popup.remove());
        el.addEventListener("click", () => {
          if (onSelectRef.current) {
            onSelectRef.current(node);
          }
          try {
            map.flyTo({
              center: [lng, lat],
              zoom: 4.5,
              pitch: 30,
              speed: 1.2,
              essential: true
            });
          } catch {}
        });

        markersRef.current.push(marker);
      } catch (err) {
        console.warn("Skipped node mapping:", node?.id, err);
      }
    });
  }

  useEffect(() => {
    if (!mapContainerRef.current) return;

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
        center: [15, 20],
        zoom: 1.5,
        pitch: 15,
        attributionControl: false
      });

      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");
      map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

      map.on("load", () => {
        setTimeout(() => rebuildMarkers(map), 100);
      });

      return () => {
        map.remove();
      };
    } catch (err: any) {
      console.error("MapLibre GL initialization failed:", err);
      setMapError(err.message || "WebGL is unsupported or MapLibre stylesheet is unreachable.");
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
        pitch: 30,
        speed: 1.2,
        essential: true
      });
    } catch {}
  }, [selectedNode]);

  if (mapError) {
    return (
      <div style={{
        position: "relative", width: "100%", height: "100%", minHeight: "550px", borderRadius: "4px",
        overflow: "hidden", border: "1px solid rgba(255,77,77,0.3)",
        background: "rgba(15,10,10,0.9)", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: "24px",
        textAlign: "center", fontFamily: "var(--mono)", boxSizing: "border-box"
      }}>
        <div style={{ position: "absolute", top: "12px", left: "12px", width: "16px", height: "16px", borderTop: "2px solid var(--accent)", borderLeft: "2px solid var(--accent)" }} />
        <div style={{ position: "absolute", top: "12px", right: "12px", width: "16px", height: "16px", borderTop: "2px solid var(--accent)", borderRight: "2px solid var(--accent)" }} />
        <div style={{ position: "absolute", bottom: "12px", left: "12px", width: "16px", height: "16px", borderBottom: "2px solid var(--accent)", borderLeft: "2px solid var(--accent)" }} />
        <div style={{ position: "absolute", bottom: "12px", right: "12px", width: "16px", height: "16px", borderBottom: "2px solid var(--accent)", borderRight: "2px solid var(--accent)" }} />
        
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" style={{ marginBottom: "16px" }}>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span style={{ fontSize: "13px", color: "var(--accent)", letterSpacing: "0.1em", fontWeight: "bold" }}>MAP ENGINE OFFLINE</span>
        <p style={{ fontSize: "11px", color: "var(--text-dim)", marginTop: "8px", maxWidth: "320px", lineHeight: "1.5" }}>
          {mapError}
        </p>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", minHeight: "550px" }}>
      {/* Corner design accents */}
      <div style={{ position: "absolute", top: "2px", left: "2px", width: "12px", height: "12px", borderTop: "2px solid var(--accent)", borderLeft: "2px solid var(--accent)", zIndex: 10, pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "2px", right: "2px", width: "12px", height: "12px", borderTop: "2px solid var(--accent)", borderRight: "2px solid var(--accent)", zIndex: 10, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "2px", left: "2px", width: "12px", height: "12px", borderBottom: "2px solid var(--accent)", borderLeft: "2px solid var(--accent)", zIndex: 10, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "2px", right: "2px", width: "12px", height: "12px", borderBottom: "2px solid var(--accent)", borderRight: "2px solid var(--accent)", zIndex: 10, pointerEvents: "none" }} />
      
      <div ref={mapContainerRef} style={{ width: "100%", height: "100%", minHeight: "550px" }} />
      
      <style jsx global>{`
        /* MapLibre custom popups */
        .maplibregl-popup-content {
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
          box-shadow: none !important;
        }
        .maplibregl-popup-tip {
          display: none !important;
        }
        @keyframes maplibre-pulse {
          0% {
            transform: scale(0.2);
            opacity: 0.8;
          }
          100% {
            transform: scale(2.4);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
