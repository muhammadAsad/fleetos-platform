"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Search, MapPin, Navigation, Truck, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { getStatusDot, getStatusLabel, formatSpeed, formatMinutes } from "@/lib/utils";
import { StatusBadge } from "@/components/hos/HosBar";
import type { TruckData } from "@/components/map/FleetMap";

const FleetMap = dynamic(() => import("@/components/map/FleetMap"), { ssr: false });

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const PRESET_LOCATIONS = [
  { label: "Chicago, IL",       lat: "41.8781", lng: "-87.6298" },
  { label: "Indianapolis, IN",  lat: "39.7684", lng: "-86.1581" },
  { label: "Columbus, OH",      lat: "39.9612", lng: "-82.9988" },
  { label: "Memphis, TN",       lat: "35.1495", lng: "-90.0490" },
];

export default function ProximityPage() {
  const supabase = createClient();
  const [searchLat, setSearchLat] = useState("41.8781");
  const [searchLng, setSearchLng] = useState("-87.6298");
  const [radiusMiles, setRadiusMiles] = useState("100");
  const [allTrucks, setAllTrucks] = useState<TruckData[]>([]);
  const [results, setResults] = useState<TruckData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedTruck, setSelectedTruck] = useState<TruckData | null>(null);

  async function loadTrucks() {
    setLoading(true);
    const { data } = await supabase
      .from("driver_hos_summary")
      .select("*, drivers(name), vehicles(vehicle_number)");

    const trucks: TruckData[] = (data ?? [])
      .filter((s: any) => s.current_latitude != null)
      .map((s: any) => ({
        vehicleId: s.vehicle_id ?? s.driver_id,
        vehicleNumber: s.vehicles?.vehicle_number ?? "TRK",
        driverName: s.drivers?.name ?? "Unknown",
        lat: s.current_latitude,
        lng: s.current_longitude,
        speed: s.current_speed ?? 0,
        status: s.current_duty_status ?? "OFF",
        driveRemaining: s.drive_remaining_minutes ?? 660,
        shiftRemaining: s.shift_remaining_minutes ?? 840,
        violations: s.violations ?? 0,
      }));

    setAllTrucks(trucks);
    setLoading(false);
    return trucks;
  }

  useEffect(() => { loadTrucks(); }, []);

  function search() {
    const lat = parseFloat(searchLat);
    const lng = parseFloat(searchLng);
    const radius = parseFloat(radiusMiles);
    if (isNaN(lat) || isNaN(lng) || isNaN(radius)) return;

    const nearby = allTrucks
      .map((t) => ({ ...t, distanceMiles: haversine(lat, lng, t.lat, t.lng) }))
      .filter((t) => (t as any).distanceMiles <= radius)
      .sort((a, b) => ((a as any).distanceMiles - (b as any).distanceMiles));

    setResults(nearby);
    setSearched(true);
    setSelectedTruck(null);
  }

  const mapTrucks = searched ? results : allTrucks;
  const searchLatNum = parseFloat(searchLat);
  const searchLngNum = parseFloat(searchLng);

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* Header */}
      <div>
        <h2 className="font-display font-bold text-2xl text-text">Proximity Search</h2>
        <p className="text-sm text-text3 mt-0.5">Find trucks near any location — shown live on map</p>
      </div>

      {/* Search Panel */}
      <div className="rounded-xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1.5 flex-1 min-w-[120px]">
            <label className="text-xs font-medium text-text3">Latitude</label>
            <input
              value={searchLat}
              onChange={(e) => setSearchLat(e.target.value)}
              placeholder="41.8781"
              className="w-full h-9 px-3 rounded-lg border text-sm text-text font-mono focus:outline-none transition-colors"
              style={{ background: "var(--surface2)", borderColor: "var(--border)" }}
              onFocus={(e) => (e.target.style.borderColor = "#facc15")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>
          <div className="space-y-1.5 flex-1 min-w-[120px]">
            <label className="text-xs font-medium text-text3">Longitude</label>
            <input
              value={searchLng}
              onChange={(e) => setSearchLng(e.target.value)}
              placeholder="-87.6298"
              className="w-full h-9 px-3 rounded-lg border text-sm text-text font-mono focus:outline-none transition-colors"
              style={{ background: "var(--surface2)", borderColor: "var(--border)" }}
              onFocus={(e) => (e.target.style.borderColor = "#facc15")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>
          <div className="space-y-1.5 w-36">
            <label className="text-xs font-medium text-text3">Radius</label>
            <select
              value={radiusMiles}
              onChange={(e) => setRadiusMiles(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border text-sm text-text cursor-pointer appearance-none"
              style={{ background: "var(--surface2)", borderColor: "var(--border)" }}
            >
              {["25","50","100","200","500"].map((r) => (
                <option key={r} value={r}>{r} miles</option>
              ))}
            </select>
          </div>
          <button
            onClick={search}
            disabled={loading}
            className="flex items-center gap-2 px-5 h-9 rounded-lg text-sm font-bold transition-all disabled:opacity-50 hover:opacity-90 active:scale-95"
            style={{ background: "#facc15", color: "#000" }}
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
            Search
          </button>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="text-xs text-text3">Quick:</span>
          {PRESET_LOCATIONS.map((loc) => (
            <button
              key={loc.label}
              onClick={() => { setSearchLat(loc.lat); setSearchLng(loc.lng); }}
              className="flex items-center gap-1 px-2.5 h-7 rounded-lg border text-xs transition-all hover:text-white"
              style={{ borderColor: "var(--border)", background: "var(--surface2)", color: "var(--text2)" }}
            >
              <MapPin size={10} /> {loc.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map + Results side by side */}
      <div className="flex gap-4 flex-1 min-h-0" style={{ height: 520 }}>
        {/* Map */}
        <div className="flex-1 rounded-xl overflow-hidden border relative" style={{ borderColor: "var(--border)", minWidth: 0 }}>
          <FleetMap
            trucks={mapTrucks}
            centerLat={!isNaN(searchLatNum) ? searchLatNum : undefined}
            centerLng={!isNaN(searchLngNum) ? searchLngNum : undefined}
            centerMarker={searched}
            zoom={searched ? 7 : 5}
            height="100%"
            onTruckClick={setSelectedTruck}
          />
          {/* Map badge */}
          <div
            className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono z-[1000]"
            style={{ background: "rgba(15,23,42,0.92)", color: "#9ca3af", border: "1px solid #1f2937" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            {mapTrucks.length} trucks shown
          </div>
        </div>

        {/* Results panel */}
        <div className="w-72 flex flex-col gap-3 overflow-y-auto flex-shrink-0">
          {/* Selected truck detail */}
          {selectedTruck && (
            <div
              className="rounded-xl border p-4 flex-shrink-0"
              style={{ background: "var(--surface)", borderColor: "#facc15" }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-bold text-sm text-text">{selectedTruck.vehicleNumber}</p>
                  <p className="text-xs text-text3">{selectedTruck.driverName}</p>
                </div>
                <StatusBadge status={selectedTruck.status} />
              </div>
              <div className="space-y-1.5 text-xs">
                {(selectedTruck as any).distanceMiles != null && (
                  <div className="flex justify-between">
                    <span className="text-text3">Distance</span>
                    <span className="font-mono font-bold" style={{ color: "#facc15" }}>
                      {(selectedTruck as any).distanceMiles.toFixed(1)} mi
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-text3">Speed</span>
                  <span className="font-mono text-text2">{formatSpeed(selectedTruck.speed)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text3">Drive Remaining</span>
                  <span className="font-mono text-text2">{formatMinutes(selectedTruck.driveRemaining)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text3">Coordinates</span>
                  <span className="font-mono text-text3">{selectedTruck.lat.toFixed(3)}, {selectedTruck.lng.toFixed(3)}</span>
                </div>
                {selectedTruck.violations > 0 && (
                  <div className="mt-1 px-3 py-1.5 rounded-lg text-xs text-center font-semibold" style={{ background: "rgba(239,68,68,.1)", color: "#ef4444" }}>
                    ⚠ {selectedTruck.violations} HOS Violation{selectedTruck.violations > 1 ? "s" : ""}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Result list */}
          {searched ? (
            results.length === 0 ? (
              <div className="rounded-xl border flex flex-col items-center justify-center py-10 text-center" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <Navigation size={24} className="text-text3 mb-2 opacity-40" />
                <p className="text-sm text-text3">No trucks found</p>
                <p className="text-xs text-text3 mt-1">Try a larger radius</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-text3 font-mono">{results.length} truck{results.length !== 1 ? "s" : ""} within {radiusMiles} mi</p>
                {results.map((truck) => (
                  <button
                    key={truck.vehicleId}
                    onClick={() => setSelectedTruck(truck)}
                    className="rounded-xl border p-3 text-left transition-all hover:border-yellow-400/40 w-full"
                    style={{
                      background: "var(--surface)",
                      borderColor: selectedTruck?.vehicleId === truck.vehicleId ? "#facc15" : "var(--border)",
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: getStatusDot(truck.status) }} />
                        <span className="text-sm font-semibold text-text">{truck.vehicleNumber}</span>
                      </div>
                      <span className="text-xs font-mono font-bold" style={{ color: "#facc15" }}>
                        {(truck as any).distanceMiles?.toFixed(1)} mi
                      </span>
                    </div>
                    <p className="text-xs text-text3 mb-1">{truck.driverName}</p>
                    <div className="flex justify-between text-[10px] font-mono text-text3">
                      <span>{getStatusLabel(truck.status)}</span>
                      <span>{formatSpeed(truck.speed)}</span>
                    </div>
                  </button>
                ))}
              </>
            )
          ) : (
            <div className="rounded-xl border flex flex-col items-center justify-center py-10 text-center" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <Search size={24} className="text-text3 mb-2 opacity-40" />
              <p className="text-sm text-text2 font-medium">{allTrucks.length || 8} trucks in fleet</p>
              <p className="text-xs text-text3 mt-1">Click Search to find nearby</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
