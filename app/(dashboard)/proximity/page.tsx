"use client";
import { useState, useEffect } from "react";
import { Search, MapPin, Navigation, Truck, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { getStatusDot, getStatusLabel, formatSpeed, formatMinutes } from "@/lib/utils";
import { StatusBadge } from "@/components/hos/HosBar";

interface TruckPosition {
  vehicleNumber: string;
  driverName: string;
  lat: number;
  lng: number;
  speed: number;
  status: string;
  driveRemaining: number;
  distanceMiles?: number;
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8; // miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function ProximityPage() {
  const supabase = createClient();
  const [searchLat, setSearchLat] = useState("41.8781");
  const [searchLng, setSearchLng] = useState("-87.6298");
  const [radiusMiles, setRadiusMiles] = useState("100");
  const [allTrucks, setAllTrucks] = useState<TruckPosition[]>([]);
  const [results, setResults] = useState<TruckPosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function loadTrucks() {
    setLoading(true);
    const { data } = await supabase
      .from("driver_hos_summary")
      .select("*, drivers(name), vehicles(vehicle_number)");

    const trucks: TruckPosition[] = (data ?? [])
      .filter((s: any) => s.current_latitude != null && s.current_longitude != null)
      .map((s: any) => ({
        vehicleNumber: s.vehicles?.vehicle_number ?? "TRK",
        driverName: s.drivers?.name ?? "Unknown",
        lat: s.current_latitude,
        lng: s.current_longitude,
        speed: s.current_speed ?? 0,
        status: s.current_duty_status ?? "OFF",
        driveRemaining: s.drive_remaining_minutes ?? 660,
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
      .filter((t) => t.distanceMiles! <= radius)
      .sort((a, b) => a.distanceMiles! - b.distanceMiles!);

    setResults(nearby);
    setSearched(true);
  }

  const PRESET_LOCATIONS = [
    { label: "Chicago, IL", lat: "41.8781", lng: "-87.6298" },
    { label: "Indianapolis, IN", lat: "39.7684", lng: "-86.1581" },
    { label: "Columbus, OH", lat: "39.9612", lng: "-82.9988" },
    { label: "Memphis, TN", lat: "35.1495", lng: "-90.0490" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-bold text-2xl text-text">Proximity Search</h2>
        <p className="text-sm text-text3 mt-0.5">Find trucks near a specific location</p>
      </div>

      {/* Search Panel */}
      <div
        className="rounded-xl border p-5 space-y-4"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text3">Latitude</label>
            <input
              value={searchLat}
              onChange={(e) => setSearchLat(e.target.value)}
              placeholder="e.g. 41.8781"
              className="w-full h-9 px-3 rounded-lg border text-sm text-text font-mono focus:outline-none focus:border-accent transition-colors"
              style={{ background: "var(--surface2)", borderColor: "var(--border)" }}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text3">Longitude</label>
            <input
              value={searchLng}
              onChange={(e) => setSearchLng(e.target.value)}
              placeholder="e.g. -87.6298"
              className="w-full h-9 px-3 rounded-lg border text-sm text-text font-mono focus:outline-none focus:border-accent transition-colors"
              style={{ background: "var(--surface2)", borderColor: "var(--border)" }}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text3">Radius (miles)</label>
            <select
              value={radiusMiles}
              onChange={(e) => setRadiusMiles(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border text-sm text-text bg-surface2 focus:outline-none focus:border-accent transition-colors appearance-none cursor-pointer"
              style={{ borderColor: "var(--border)" }}
            >
              {["25", "50", "100", "200", "500"].map((r) => (
                <option key={r} value={r}>{r} miles</option>
              ))}
            </select>
          </div>
        </div>

        {/* Preset locations */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-text3">Quick select:</span>
          {PRESET_LOCATIONS.map((loc) => (
            <button
              key={loc.label}
              onClick={() => { setSearchLat(loc.lat); setSearchLng(loc.lng); }}
              className="flex items-center gap-1 px-2.5 h-7 rounded-lg border text-xs transition-all hover:border-accent/50 hover:text-text"
              style={{ borderColor: "var(--border)", background: "var(--surface2)", color: "var(--text2)" }}
            >
              <MapPin size={10} /> {loc.label}
            </button>
          ))}
        </div>

        <button
          onClick={search}
          disabled={loading}
          className="flex items-center gap-2 px-5 h-9 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-all disabled:opacity-50"
          style={{ background: "var(--accent)" }}
        >
          {loading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
          Search Nearby Trucks
        </button>
      </div>

      {/* Results */}
      {searched && (
        <div>
          <p className="text-sm text-text2 mb-3">
            {results.length === 0
              ? `No trucks found within ${radiusMiles} miles`
              : `${results.length} truck${results.length > 1 ? "s" : ""} found within ${radiusMiles} miles`}
          </p>

          {results.length === 0 ? (
            <div
              className="rounded-xl border flex flex-col items-center justify-center py-16"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <Navigation size={28} className="text-text3 mb-3 opacity-50" />
              <p className="text-sm text-text3">No trucks in this area</p>
              <p className="text-xs text-text3 mt-1">Try increasing the search radius</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {results.map((truck) => (
                <div
                  key={truck.vehicleNumber}
                  className="rounded-xl border p-4 hover:border-accent/30 transition-all"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ background: "var(--surface2)" }}>
                        🚛
                      </div>
                      <div>
                        <p className="font-medium text-sm text-text">{truck.vehicleNumber}</p>
                        <p className="text-xs text-text3">{truck.driverName}</p>
                      </div>
                    </div>
                    <StatusBadge status={truck.status} />
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-text3">Distance</span>
                      <span className="font-mono font-semibold text-accent">
                        {truck.distanceMiles!.toFixed(1)} mi
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text3">Speed</span>
                      <span className="font-mono text-text2">{formatSpeed(truck.speed)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text3">Drive Remaining</span>
                      <span className="font-mono text-text2">{formatMinutes(truck.driveRemaining)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text3">Coordinates</span>
                      <span className="font-mono text-text3">
                        {truck.lat.toFixed(3)}, {truck.lng.toFixed(3)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!searched && allTrucks.length > 0 && (
        <div
          className="rounded-xl border p-6 flex flex-col items-center justify-center text-center"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <Search size={24} className="text-text3 mb-3 opacity-50" />
          <p className="text-sm text-text2 font-medium">{allTrucks.length} trucks in fleet</p>
          <p className="text-xs text-text3 mt-1">Enter a location above and click Search to find nearby trucks</p>
        </div>
      )}
    </div>
  );
}
