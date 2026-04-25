"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import { getStatusDot, getStatusLabel, formatSpeed, formatMinutes } from "@/lib/utils";
import type { GpsPosition, DriverHosSummary } from "@/types/database";
import { MapPin, AlertTriangle } from "lucide-react";

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
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

export default function FleetMap({ onTruckClick }: FleetMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const [trucks, setTrucks] = useState<Map<string, TruckData>>(new Map());
  const [mapLoaded, setMapLoaded] = useState(false);
  const [tokenMissing, setTokenMissing] = useState(false);
  const supabase = createClient();

  // Check token
  useEffect(() => {
    if (!MAPBOX_TOKEN || MAPBOX_TOKEN.includes("your-mapbox") || MAPBOX_TOKEN.includes("example")) {
      setTokenMissing(true);
    }
  }, []);

  // Initialize Mapbox
  useEffect(() => {
    if (tokenMissing || !mapContainerRef.current || mapRef.current) return;

    let map: any;

    async function initMap() {
      // Dynamic import to avoid SSR issues
      const mapboxgl = (await import("mapbox-gl")).default;
      await import("mapbox-gl/dist/mapbox-gl.css");

      mapboxgl.accessToken = MAPBOX_TOKEN;

      map = new mapboxgl.Map({
        container: mapContainerRef.current!,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [-89.0, 39.5],
        zoom: 5,
        attributionControl: false,
      });

      map.on("load", () => {
        setMapLoaded(true);
        mapRef.current = map;
      });

      map.on("error", (e: any) => {
        console.warn("Mapbox error:", e?.error?.message ?? e);
      });

      map.addControl(
        new mapboxgl.NavigationControl({ showCompass: false }),
        "bottom-right"
      );
    }

    initMap().catch(console.error);

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();
      map?.remove();
      mapRef.current = null;
    };
  }, [tokenMissing]);

  // Load initial truck positions + Realtime
  useEffect(() => {
    async function loadPositions() {
      const { data: summaries } = await supabase
        .from("driver_hos_summary")
        .select("*, drivers(name, username), vehicles(vehicle_number)");

      if (!summaries) return;

      const newTrucks = new Map<string, TruckData>();
      for (const s of summaries) {
        if (s.current_latitude != null && s.current_longitude != null) {
          const key = s.vehicle_id ?? s.driver_id;
          newTrucks.set(key, {
            vehicleId: key,
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
          });
        }
      }
      setTrucks(newTrucks);
    }

    loadPositions();

    const channel = supabase
      .channel("map-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "gps_positions" },
        (payload: any) => {
          const pos = payload.new as GpsPosition;
          setTrucks((prev) => {
            const updated = new Map(prev);
            const existing = updated.get(pos.vehicle_id);
            if (existing) {
              updated.set(pos.vehicle_id, {
                ...existing,
                lat: pos.latitude,
                lng: pos.longitude,
                speed: pos.speed ?? 0,
              });
            }
            return updated;
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "driver_hos_summary" },
        (payload: any) => {
          const s = payload.new as DriverHosSummary;
          if (s.current_latitude != null && s.current_longitude != null) {
            setTrucks((prev) => {
              const updated = new Map(prev);
              const key = s.vehicle_id ?? s.driver_id;
              const existing = updated.get(key);
              updated.set(key, {
                vehicleId: key,
                driverId: s.driver_id,
                driverName: existing?.driverName ?? "Driver",
                vehicleNumber: existing?.vehicleNumber ?? "TRK",
                lat: s.current_latitude!,
                lng: s.current_longitude!,
                speed: s.current_speed ?? 0,
                status: s.current_duty_status ?? "OFF",
                driveRemaining: s.drive_remaining_minutes ?? 660,
                shiftRemaining: s.shift_remaining_minutes ?? 840,
                violations: s.violations ?? 0,
              });
              return updated;
            });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Update markers
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    async function updateMarkers() {
      const mapboxgl = (await import("mapbox-gl")).default;
      const map = mapRef.current;

      trucks.forEach((truck, key) => {
        const existing = markersRef.current.get(key);
        if (existing) {
          // Smooth animated position update
          existing.setLngLat([truck.lng, truck.lat]);
          const dot = existing.getElement().querySelector(".truck-dot") as HTMLElement | null;
          if (dot) {
            const color = truck.violations > 0 ? "#ef4444" : getStatusDot(truck.status);
            dot.style.background = color;
            dot.style.boxShadow = `0 4px 16px rgba(0,0,0,0.5), 0 0 0 1px ${color}40`;
          }
        } else {
          const el = createMarkerEl(truck);
          const popup = new mapboxgl.Popup({ offset: 20, closeButton: false, maxWidth: "220px" })
            .setHTML(buildPopupHTML(truck));

          el.addEventListener("mouseenter", () => popup.addTo(map));
          el.addEventListener("mouseleave", () => popup.remove());
          el.addEventListener("click", () => {
            popup.remove();
            onTruckClick?.(truck);
          });

          const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
            .setLngLat([truck.lng, truck.lat])
            .addTo(map);

          markersRef.current.set(key, marker);
        }
      });

      // Remove stale markers
      markersRef.current.forEach((marker, key) => {
        if (!trucks.has(key)) {
          marker.remove();
          markersRef.current.delete(key);
        }
      });
    }

    updateMarkers();
  }, [trucks, mapLoaded, onTruckClick]);

  // --- Missing token fallback ---
  if (tokenMissing) {
    return (
      <div
        className="w-full h-full rounded-xl flex flex-col items-center justify-center gap-4 border"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: "var(--surface2)" }}
        >
          <MapPin size={24} className="text-accent" />
        </div>
        <div className="text-center space-y-1.5 max-w-sm px-4">
          <p className="font-display font-bold text-lg text-text">Mapbox Token Required</p>
          <p className="text-sm text-text3">
            Add your free Mapbox token to{" "}
            <code className="text-accent font-mono text-xs">.env.local</code>
          </p>
          <div
            className="mt-3 text-left p-3 rounded-lg font-mono text-xs"
            style={{ background: "var(--surface3)", color: "var(--text2)" }}
          >
            NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...
          </div>
          <p className="text-xs text-text3 mt-2">
            Get a free token at{" "}
            <span className="text-accent">mapbox.com</span>{" "}
            (50k loads/month free)
          </p>
        </div>

        {/* Show static truck list as fallback */}
        <TruckListFallback trucks={Array.from(trucks.values())} />
      </div>
    );
  }

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full overflow-hidden"
      style={{ minHeight: 400 }}
    />
  );
}

function TruckListFallback({ trucks }: { trucks: TruckData[] }) {
  if (trucks.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-2 px-4 mt-2 max-w-lg w-full">
      {trucks.map((t) => (
        <div
          key={t.vehicleId}
          className="rounded-lg p-3 border"
          style={{ background: "var(--surface2)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full" style={{ background: getStatusDot(t.status) }} />
            <span className="text-xs font-mono font-medium text-text2">{t.vehicleNumber}</span>
          </div>
          <p className="text-xs text-text3">{t.driverName}</p>
          <p className="text-[10px] font-mono mt-1" style={{ color: getStatusDot(t.status) }}>
            {getStatusLabel(t.status)} · {formatSpeed(t.speed)}
          </p>
        </div>
      ))}
    </div>
  );
}

function createMarkerEl(truck: TruckData): HTMLElement {
  const color = truck.violations > 0 ? "#ef4444" : getStatusDot(truck.status);
  const el = document.createElement("div");
  el.style.cssText = "position:relative;width:46px;height:46px;cursor:pointer;";

  const pulseStyle = truck.violations > 0
    ? `<div style="position:absolute;inset:0;border-radius:50%;background:rgba(239,68,68,0.3);animation:pulse-ring 1.5s ease-out infinite;"></div>`
    : truck.status === "DR"
      ? `<div style="position:absolute;inset:3px;border-radius:50%;background:rgba(16,185,129,0.15);animation:pulse-ring 2s ease-out infinite;"></div>`
      : "";

  el.innerHTML = `
    <style>
      @keyframes pulse-ring {
        0% { transform: scale(0.8); opacity: 0.8; }
        100% { transform: scale(1.6); opacity: 0; }
      }
    </style>
    ${pulseStyle}
    <div class="truck-dot" style="
      position:absolute;top:5px;left:5px;
      width:36px;height:36px;border-radius:50%;
      background:${color};
      border:2px solid rgba(255,255,255,0.2);
      display:flex;align-items:center;justify-content:center;
      font-size:15px;
      box-shadow:0 4px 16px rgba(0,0,0,0.5), 0 0 0 1px ${color}40;
      transition:transform 0.15s ease, box-shadow 0.15s ease;
    ">🚛</div>
  `;
  el.addEventListener("mouseenter", () => {
    const d = el.querySelector(".truck-dot") as HTMLElement;
    if (d) { d.style.transform = "scale(1.2)"; d.style.boxShadow = `0 6px 20px rgba(0,0,0,0.6), 0 0 0 3px ${color}40`; }
  });
  el.addEventListener("mouseleave", () => {
    const d = el.querySelector(".truck-dot") as HTMLElement;
    if (d) { d.style.transform = ""; d.style.boxShadow = `0 4px 16px rgba(0,0,0,0.5), 0 0 0 1px ${color}40`; }
  });
  return el;
}

function buildPopupHTML(truck: TruckData): string {
  const color = getStatusDot(truck.status);
  return `
    <div style="padding:12px 14px;min-width:190px;font-family:'DM Sans',sans-serif;">
      <div style="font-weight:700;font-size:13px;color:#f1f5f9;margin-bottom:8px;border-bottom:1px solid #1e2d45;padding-bottom:8px;">
        🚛 ${truck.vehicleNumber}
        <span style="font-weight:400;color:#94a3b8;font-size:11px;margin-left:4px;">· ${truck.driverName}</span>
      </div>
      <div style="display:grid;gap:5px;">
        <div style="display:flex;justify-content:space-between;font-size:11px;">
          <span style="color:#94a3b8">Status</span>
          <span style="color:${color};font-weight:600;">● ${getStatusLabel(truck.status)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11px;">
          <span style="color:#94a3b8">Speed</span>
          <span style="color:#f1f5f9;font-family:'JetBrains Mono',monospace;">${formatSpeed(truck.speed)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11px;">
          <span style="color:#94a3b8">Drive Left</span>
          <span style="color:#f1f5f9;font-family:'JetBrains Mono',monospace;">${formatMinutes(truck.driveRemaining)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11px;">
          <span style="color:#94a3b8">Shift Left</span>
          <span style="color:#f1f5f9;font-family:'JetBrains Mono',monospace;">${formatMinutes(truck.shiftRemaining)}</span>
        </div>
        ${truck.violations > 0 ? `
          <div style="margin-top:6px;padding:4px 8px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:6px;font-size:10px;color:#ef4444;text-align:center;font-weight:600;">
            ⚠ ${truck.violations} HOS Violation${truck.violations > 1 ? "s" : ""}
          </div>
        ` : ""}
      </div>
    </div>
  `;
}
