"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import { getStatusDot, getStatusLabel, formatSpeed, formatMinutes } from "@/lib/utils";

export interface TruckData {
  vehicleId: string;
  driverId?: string;
  driverName: string;
  vehicleNumber: string;
  lat: number;
  lng: number;
  speed: number;
  status: string;
  driveRemaining: number;
  shiftRemaining: number;
  violations: number;
}

interface FleetMapProps {
  onTruckClick?: (truck: TruckData) => void;
  trucks?: TruckData[];
  centerLat?: number;
  centerLng?: number;
  centerMarker?: boolean;
  zoom?: number;
  height?: string;
}

// Demo trucks spread across US when no real data available
const DEMO_TRUCKS: TruckData[] = [
  { vehicleId: "d1", driverName: "James Wilson",   vehicleNumber: "TRK-101", lat: 41.878,  lng: -87.630,  speed: 65, status: "DR",  driveRemaining: 380, shiftRemaining: 520, violations: 0 },
  { vehicleId: "d2", driverName: "Maria Santos",   vehicleNumber: "TRK-102", lat: 39.768,  lng: -86.158,  speed: 58, status: "ON",  driveRemaining: 200, shiftRemaining: 320, violations: 1 },
  { vehicleId: "d3", driverName: "Robert Chen",    vehicleNumber: "TRK-103", lat: 39.961,  lng: -82.999,  speed: 0,  status: "SB",  driveRemaining: 660, shiftRemaining: 840, violations: 0 },
  { vehicleId: "d4", driverName: "Lisa Johnson",   vehicleNumber: "TRK-104", lat: 35.149,  lng: -90.049,  speed: 72, status: "DR",  driveRemaining: 540, shiftRemaining: 680, violations: 0 },
  { vehicleId: "d5", driverName: "Ahmed Hassan",   vehicleNumber: "TRK-105", lat: 43.049,  lng: -76.147,  speed: 45, status: "DR",  driveRemaining: 120, shiftRemaining: 210, violations: 2 },
  { vehicleId: "d6", driverName: "Sarah Miller",   vehicleNumber: "TRK-106", lat: 33.749,  lng: -84.388,  speed: 0,  status: "OFF", driveRemaining: 660, shiftRemaining: 840, violations: 0 },
  { vehicleId: "d7", driverName: "Tom Bradley",    vehicleNumber: "TRK-107", lat: 29.760,  lng: -95.370,  speed: 61, status: "DR",  driveRemaining: 290, shiftRemaining: 430, violations: 0 },
  { vehicleId: "d8", driverName: "Diana Ross",     vehicleNumber: "TRK-108", lat: 36.174,  lng: -86.768,  speed: 55, status: "ON",  driveRemaining: 440, shiftRemaining: 580, violations: 0 },
];

export default function FleetMap({ onTruckClick, trucks: externalTrucks, centerLat, centerLng, centerMarker, zoom = 5, height }: FleetMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const centerMarkerRef = useRef<any>(null);
  const [liveTrucks, setLiveTrucks] = useState<TruckData[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const supabase = createClient();

  const trucks = externalTrucks ?? (liveTrucks.length > 0 ? liveTrucks : DEMO_TRUCKS);

  // Load Supabase positions (only when no external trucks provided)
  useEffect(() => {
    if (externalTrucks) return;

    async function load() {
      const { data } = await supabase
        .from("driver_hos_summary")
        .select("*, drivers(name), vehicles(vehicle_number)");
      if (!data?.length) return;

      const parsed: TruckData[] = data
        .filter((s: any) => s.current_latitude != null)
        .map((s: any) => ({
          vehicleId: s.vehicle_id ?? s.driver_id,
          driverId: s.driver_id,
          driverName: s.drivers?.name ?? "Unknown",
          vehicleNumber: s.vehicles?.vehicle_number ?? "TRK",
          lat: s.current_latitude,
          lng: s.current_longitude,
          speed: s.current_speed ?? 0,
          status: s.current_duty_status ?? "OFF",
          driveRemaining: s.drive_remaining_minutes ?? 660,
          shiftRemaining: s.shift_remaining_minutes ?? 840,
          violations: s.violations ?? 0,
        }));
      if (parsed.length) setLiveTrucks(parsed);
    }
    load();
  }, [externalTrucks]);

  // Init Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    let map: any;
    let L: any;

    async function init() {
      L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      map = L.map(mapContainerRef.current, {
        center: [centerLat ?? 39.5, centerLng ?? -89.0],
        zoom,
        zoomControl: false,
        attributionControl: false,
      });

      // Dark CartoDB tiles — free, no API key
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        { subdomains: "abcd", maxZoom: 19 }
      ).addTo(map);

      // Zoom control bottom-right
      L.control.zoom({ position: "bottomright" }).addTo(map);

      mapRef.current = map;
      setMapReady(true);
    }

    init().catch(console.error);

    return () => {
      map?.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync center marker
  useEffect(() => {
    if (!mapReady || !centerMarker || centerLat == null || centerLng == null) return;

    const lat = centerLat as number;
    const lng = centerLng as number;

    async function addCenter() {
      const L = (await import("leaflet")).default;
      const map = mapRef.current;
      if (!map) return;

      if (centerMarkerRef.current) centerMarkerRef.current.remove();

      const el = document.createElement("div");
      el.innerHTML = `
        <div style="width:18px;height:18px;border-radius:50%;background:#facc15;border:3px solid #fff;box-shadow:0 0 0 4px rgba(250,204,21,0.3),0 4px 12px rgba(0,0,0,0.5);"></div>
      `;
      el.style.cssText = "cursor:default;";

      centerMarkerRef.current = L.marker([lat, lng], {
        icon: L.divIcon({ html: el.outerHTML, className: "", iconSize: [18, 18], iconAnchor: [9, 9] }),
      }).addTo(map);

      map.setView([lat, lng], Math.max(zoom, 7));
    }
    addCenter();
  }, [mapReady, centerLat, centerLng, centerMarker]);

  // Update truck markers
  useEffect(() => {
    if (!mapReady) return;

    async function sync() {
      const L = (await import("leaflet")).default;
      const map = mapRef.current;
      if (!map) return;

      const seen = new Set<string>();

      for (const truck of trucks) {
        const key = truck.vehicleId;
        seen.add(key);

        const color = truck.violations > 0 ? "#ef4444" : getStatusDot(truck.status);
        const isPulse = truck.status === "DR" || truck.violations > 0;

        const markerHtml = `
          <div style="position:relative;width:44px;height:44px;cursor:pointer;">
            ${isPulse ? `<div style="
              position:absolute;inset:0;border-radius:50%;
              background:${color}30;
              animation:flm-pulse 2s ease-out infinite;
            "></div>` : ""}
            <div style="
              position:absolute;top:4px;left:4px;
              width:36px;height:36px;border-radius:50%;
              background:${color};
              border:2px solid rgba(255,255,255,0.25);
              display:flex;align-items:center;justify-content:center;
              font-size:15px;
              box-shadow:0 4px 14px rgba(0,0,0,0.5),0 0 0 1px ${color}50;
              transition:transform .15s ease;
            " class="flm-dot">🚛</div>
          </div>
        `;

        const popup = buildPopup(truck);

        if (markersRef.current.has(key)) {
          const m = markersRef.current.get(key);
          m.setLatLng([truck.lat, truck.lng]);
          m.setPopupContent(popup);
        } else {
          const icon = L.divIcon({ html: markerHtml, className: "", iconSize: [44, 44], iconAnchor: [22, 22] });
          const marker = L.marker([truck.lat, truck.lng], { icon })
            .bindPopup(popup, { closeButton: false, offset: [0, -16], maxWidth: 240, className: "flm-popup" })
            .addTo(map);

          marker.on("mouseover", () => marker.openPopup());
          marker.on("mouseout", () => marker.closePopup());
          marker.on("click", () => {
            marker.closePopup();
            onTruckClick?.(truck);
          });

          markersRef.current.set(key, marker);
        }
      }

      // Remove stale
      markersRef.current.forEach((m, key) => {
        if (!seen.has(key)) { m.remove(); markersRef.current.delete(key); }
      });
    }

    sync();
  }, [trucks, mapReady, onTruckClick]);

  return (
    <>
      <style>{`
        @keyframes flm-pulse {
          0%   { transform: scale(0.8); opacity: .8; }
          100% { transform: scale(1.8); opacity: 0;  }
        }
        .flm-popup .leaflet-popup-content-wrapper {
          background: #0f172a !important;
          border: 1px solid #1f2937 !important;
          border-radius: 10px !important;
          box-shadow: 0 20px 40px rgba(0,0,0,.7) !important;
          padding: 0 !important;
          color: #f9fafb !important;
        }
        .flm-popup .leaflet-popup-tip-container { display: none !important; }
        .flm-popup .leaflet-popup-content { margin: 0 !important; }
        .leaflet-control-zoom { border: none !important; }
        .leaflet-control-zoom a {
          background: #1f2937 !important;
          color: #9ca3af !important;
          border: 1px solid #374151 !important;
          width: 30px !important; height: 30px !important;
          line-height: 28px !important;
          border-radius: 6px !important;
          margin-bottom: 3px !important;
          font-size: 16px !important;
        }
        .leaflet-control-zoom a:hover { background: #374151 !important; color: #f9fafb !important; }
        .leaflet-bar { border: none !important; box-shadow: none !important; }
      `}</style>
      <div
        ref={mapContainerRef}
        style={{ width: "100%", height: height ?? "100%", minHeight: 340, borderRadius: 12 }}
      />
    </>
  );
}

function buildPopup(truck: TruckData): string {
  const color = getStatusDot(truck.status);
  return `
    <div style="padding:12px 14px;min-width:200px;font-family:'DM Sans',sans-serif;">
      <div style="font-weight:700;font-size:13px;color:#f9fafb;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #1f2937;">
        🚛 ${truck.vehicleNumber}
        <span style="font-weight:400;color:#9ca3af;font-size:11px;margin-left:4px;">· ${truck.driverName}</span>
      </div>
      <div style="display:grid;gap:5px;">
        <div style="display:flex;justify-content:space-between;font-size:11px;">
          <span style="color:#9ca3af">Status</span>
          <span style="color:${color};font-weight:600;">● ${getStatusLabel(truck.status)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11px;">
          <span style="color:#9ca3af">Speed</span>
          <span style="color:#f9fafb;font-family:monospace;">${formatSpeed(truck.speed)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11px;">
          <span style="color:#9ca3af">Drive Left</span>
          <span style="color:#f9fafb;font-family:monospace;">${formatMinutes(truck.driveRemaining)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11px;">
          <span style="color:#9ca3af">Shift Left</span>
          <span style="color:#f9fafb;font-family:monospace;">${formatMinutes(truck.shiftRemaining)}</span>
        </div>
        ${truck.violations > 0 ? `
        <div style="margin-top:4px;padding:4px 8px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);border-radius:6px;font-size:10px;color:#ef4444;text-align:center;font-weight:600;">
          ⚠ ${truck.violations} HOS Violation${truck.violations > 1 ? "s" : ""}
        </div>` : ""}
      </div>
    </div>
  `;
}
