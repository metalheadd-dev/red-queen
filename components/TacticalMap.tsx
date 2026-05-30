"use client";
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Access token fallback
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

export default function TacticalMap({ nodes, onSelectNode, selectedNode }: TacticalMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    try {
      // Initialize map
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [15, 25],
        zoom: 1.4,
        pitch: 25, // tilt the map for cinematic feel
        projection: { name: "globe" } as any // render map as globe
      });

      mapRef.current = map;

      // Add navigation controls
      map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), "top-right");

      // Add atmosphere/fog effect for cinematic look
      map.on("style.load", () => {
        map.setFog({
          color: "rgb(15, 10, 10)", // Reddish ambient fog matching RED QUEEN theme
          "high-color": "rgb(36, 10, 10)",
          "space-color": "rgb(0, 0, 0)",
          "horizon-blend": 0.02
        });
      });

      return () => {
        map.remove();
      };
    } catch (err: any) {
      console.error("Failed to initialize Mapbox:", err);
      setMapError(err.message || "WebGL context is unsupported or Mapbox token is invalid.");
    }
  }, []);

  // Update markers when nodes change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !Array.isArray(nodes)) return;

    try {
      // Clean up old markers
      Object.values(markersRef.current).forEach(marker => marker.remove());
      markersRef.current = {};

      nodes.forEach(node => {
        // Create a custom element for the marker to animate and style
        const el = document.createElement("div");
        el.className = "tactical-marker";
        
        const typeColor = 
          node.type === "ANOMALY" ? "#a855f7" : 
          node.type === "DEGENERACY" ? "#f0c929" : 
          node.type === "ALGORITHMIC" ? "#00ffcc" :
          node.type === "GEOLOGICAL" ? "#ff4d4d" : 
          node.type === "BIOLOGICAL" ? "#ff4d4d" : 
          node.type === "METEOROLOGICAL" ? "#ff4d4d" : 
          node.type === "KINETIC" ? "#ff4d4d" : 
          "#ff4d4d";

        el.innerHTML = `
          <div class="pulse-ring" style="border-color: ${typeColor}; box-shadow: 0 0 10px ${typeColor}80"></div>
          <div class="marker-core" style="background: ${typeColor}"></div>
        `;

        // Set styles on the element
        el.style.width = "20px";
        el.style.height = "20px";
        el.style.position = "relative";
        el.style.cursor = "pointer";

        // Popup content on hover
        let sectorLabel = node.type;
        if (node.category === "realistic") {
          sectorLabel = `SECTOR ALPHA // ${node.type}`;
        } else if (node.category === "fictional") {
          sectorLabel = "SECTOR BETA // ANOMALY";
        } else if (node.category === "satirical") {
          sectorLabel = "SECTOR GAMMA // DEGENERACY";
        } else if (node.category === "algorithmic") {
          sectorLabel = "SECTOR DELTA // ALGORITHMIC";
        }

        const popupHtml = `
          <div style="font-family: var(--mono); font-size: 10px; color: ${typeColor}; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px; margin-bottom: 4px; text-transform: uppercase;">
            [${sectorLabel} // ${node.region}]
          </div>
          <div style="font-family: var(--sans); font-size: 12px; font-weight: bold; color: #fff;">${node.name}</div>
          <div style="font-family: var(--mono); font-size: 10px; color: var(--text-dim); margin-top: 4px;">
            Severity: <span style="color: var(--accent); font-weight: bold;">${node.severity}%</span>
          </div>
        `;

        const popup = new mapboxgl.Popup({
          offset: 15,
          closeButton: false,
          className: "tactical-popup"
        }).setHTML(popupHtml);

        // Add marker to map
        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([node.lng, node.lat])
          .setPopup(popup)
          .addTo(map);

        // Handle hover events
        el.addEventListener("mouseenter", () => popup.addTo(map));
        el.addEventListener("mouseleave", () => popup.remove());

        // Click to select node
        el.addEventListener("click", () => {
          onSelectNode(node);
          try {
            map.flyTo({
              center: [node.lng, node.lat],
              zoom: 4,
              speed: 1.2,
              curve: 1.4,
              essential: true
            });
          } catch (err) {
            console.warn("Failed to fly to coordinate node:", err);
          }
        });

        markersRef.current[node.id] = marker;
      });
    } catch (err) {
      console.error("Failed to update tactical map markers:", err);
    }
  }, [nodes, onSelectNode]);

  // Handle selectedNode flyTo updates from outside click (e.g. list click)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedNode) return;
    
    try {
      map.flyTo({
        center: [selectedNode.lng, selectedNode.lat],
        zoom: 4.5,
        pitch: 35,
        speed: 1.2,
        essential: true
      });
    } catch (err) {
      console.warn("Failed to fly to selected node:", err);
    }
  }, [selectedNode]);

  if (mapError) {
    return (
      <div style={{
        position: "relative",
        width: "100%",
        height: "420px",
        borderRadius: "2px",
        overflow: "hidden",
        border: "1px solid rgba(255, 77, 77, 0.3)",
        background: "rgba(15, 10, 10, 0.9)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        textAlign: "center",
        fontFamily: "var(--mono)",
        boxSizing: "border-box"
      }}>
        {/* Corner bracket decorations */}
        <div style={{ position: "absolute", top: "10px", left: "10px", width: "12px", height: "12px", borderTop: "2px solid var(--accent)", borderLeft: "2px solid var(--accent)" }} />
        <div style={{ position: "absolute", top: "10px", right: "10px", width: "12px", height: "12px", borderTop: "2px solid var(--accent)", borderRight: "2px solid var(--accent)" }} />
        <div style={{ position: "absolute", bottom: "10px", left: "10px", width: "12px", height: "12px", borderBottom: "2px solid var(--accent)", borderLeft: "2px solid var(--accent)" }} />
        <div style={{ position: "absolute", bottom: "10px", right: "10px", width: "12px", height: "12px", borderBottom: "2px solid var(--accent)", borderRight: "2px solid var(--accent)" }} />

        {/* Warning Icon */}
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "16px" }}>
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>

        <h3 style={{
          fontFamily: "var(--title-font)",
          fontSize: "15px",
          fontWeight: "bold",
          color: "var(--accent)",
          margin: "0 0 8px 0",
          letterSpacing: "0.1em",
          textTransform: "uppercase"
        }}>
          [ ⚠️ RADAR UPLINK OFFLINE ]
        </h3>
        
        <p style={{
          fontSize: "12px",
          color: "var(--text)",
          maxWidth: "450px",
          lineHeight: "1.6",
          margin: "0 0 16px 0"
        }}>
          Failed to establish coordinate radar link: <span style={{ color: "rgba(255,255,255,0.7)" }}>{mapError}</span>
        </p>

        <div style={{
          fontSize: "11px",
          color: "var(--text-dim)",
          borderTop: "1px dashed rgba(255, 77, 77, 0.2)",
          paddingTop: "12px",
          maxWidth: "400px"
        }}>
          RECOVERY ACTIONS: Enable WebGL hardware acceleration in your browser settings, or disable restrictive privacy shields that block canvas mapping libraries.
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "420px", borderRadius: "2px", overflow: "hidden" }}>
      {/* Map Element */}
      <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />
      
      {/* CSS injection for marker animations */}
      <style jsx global>{`
        .tactical-marker {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pulse-ring {
          position: absolute;
          width: 24px;
          height: 24px;
          border: 2px solid #ff4d4d;
          border-radius: 50%;
          animation: marker-pulse 2.5s infinite ease-out;
        }
        .marker-core {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          z-index: 2;
        }
        @keyframes marker-pulse {
          0% {
            transform: scale(0.3);
            opacity: 0.8;
          }
          70% {
            transform: scale(1.8);
            opacity: 0;
          }
          100% {
            transform: scale(1.8);
            opacity: 0;
          }
        }
        .mapboxgl-popup-content {
          background: rgba(5, 5, 5, 0.95) !important;
          border: 1px solid var(--border-red) !important;
          border-radius: 2px !important;
          padding: 10px 14px !important;
          color: var(--text) !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.8) !important;
        }
        .mapboxgl-popup-tip {
          border-top-color: var(--border-red) !important;
          border-bottom-color: var(--border-red) !important;
        }
      `}</style>
    </div>
  );
}
