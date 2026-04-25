"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { History, Play, Pause, SkipBack, ChevronDown, MapPin } from "lucide-react";
import { format } from "date-fns";

export default function TrackingHistoryPage() {
  const supabase = createClient();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState("all");
  const [dateFrom, setDateFrom] = useState(format(new Date(Date.now() - 86400000), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(format(new Date(), "yyyy-MM-dd"));
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [playIndex, setPlayIndex] = useState(0);

  useEffect(() => {
    supabase.from("vehicles").select("id,vehicle_number,make,model").eq("status", "active").then(({ data }: { data: any }) => setVehicles(data ?? []));
    supabase.from("drivers").select("id,name").eq("status", "active").then(({ data }: { data: any }) => setDrivers(data ?? []));
  }, []);

  async function loadHistory() {
    setLoading(true);
    setPlaying(false);
    setPlayIndex(0);
    let query = supabase
      .from("gps_positions")
      .select("*, vehicles(vehicle_number)")
      .gte("timestamp", `${dateFrom}T00:00:00`)
      .lte("timestamp", `${dateTo}T23:59:59`)
      .order("timestamp", { ascending: true })
      .limit(500);
    if (selectedVehicle !== "all") query = query.eq("vehicle_id", selectedVehicle);
    const { data } = await query;
    setPositions(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    if (!playing || positions.length === 0) return;
    if (playIndex >= positions.length - 1) { setPlaying(false); return; }
    const t = setTimeout(() => setPlayIndex((p) => p + 1), 150);
    return () => clearTimeout(t);
  }, [playing, playIndex, positions.length]);

  const currentPos = positions[playIndex];
  const progress = positions.length > 0 ? (playIndex / (positions.length - 1)) * 100 : 0;

  // Group by vehicle for summary
  const byVehicle: Record<string, any[]> = {};
  positions.forEach((p) => {
    const k = p.vehicle_id;
    if (!byVehicle[k]) byVehicle[k] = [];
    byVehicle[k].push(p);
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl text-text">Tracking History</h2>
          <p className="text-sm text-text3 mt-0.5">Replay vehicle routes and GPS history</p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border p-4 flex flex-wrap items-end gap-3"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text3">Vehicle</label>
          <div className="relative">
            <select value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)}
              className="h-9 pl-3 pr-8 rounded-lg border text-sm text-text appearance-none focus:outline-none focus:border-accent min-w-[180px]"
              style={{ background: "var(--surface2)", borderColor: "var(--border)" }}>
              <option value="all">All Vehicles</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.vehicle_number}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text3 pointer-events-none" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text3">From</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 px-3 rounded-lg border text-sm text-text focus:outline-none focus:border-accent"
            style={{ background: "var(--surface2)", borderColor: "var(--border)" }} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text3">To</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="h-9 px-3 rounded-lg border text-sm text-text focus:outline-none focus:border-accent"
            style={{ background: "var(--surface2)", borderColor: "var(--border)" }} />
        </div>
        <button onClick={loadHistory} disabled={loading}
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm text-white transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--accent)" }}>
          <History size={13} className={loading ? "animate-spin" : ""} />
          Load History
        </button>
      </div>

      {positions.length > 0 && (
        <>
          {/* Replay Controls */}
          <div className="rounded-xl border p-4 space-y-3" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm text-text">Route Replay</h3>
              <span className="text-xs font-mono text-text3">{positions.length} GPS points</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => { setPlayIndex(0); setPlaying(false); }}
                className="w-8 h-8 rounded-lg border flex items-center justify-center text-text2 hover:text-text transition-colors"
                style={{ borderColor: "var(--border)", background: "var(--surface2)" }}>
                <SkipBack size={13} />
              </button>
              <button onClick={() => setPlaying(!playing)}
                className="flex items-center gap-1.5 px-4 h-8 rounded-lg text-sm text-white transition-all hover:opacity-90"
                style={{ background: "var(--accent)" }}>
                {playing ? <Pause size={13} /> : <Play size={13} />}
                {playing ? "Pause" : "Play"}
              </button>
              <div className="flex-1 space-y-1">
                <div className="h-2 rounded-full overflow-hidden cursor-pointer" style={{ background: "var(--surface3)" }}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pct = (e.clientX - rect.left) / rect.width;
                    setPlayIndex(Math.floor(pct * (positions.length - 1)));
                  }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: "var(--accent)" }} />
                </div>
                {currentPos && (
                  <div className="flex justify-between text-[10px] font-mono text-text3">
                    <span>{format(new Date(currentPos.timestamp), "MM/dd HH:mm:ss")}</span>
                    <span>{playIndex + 1} / {positions.length}</span>
                  </div>
                )}
              </div>
            </div>

            {currentPos && (
              <div className="flex items-center gap-4 px-3 py-2.5 rounded-lg text-xs font-mono"
                style={{ background: "var(--surface2)" }}>
                <span className="flex items-center gap-1 text-accent">
                  <MapPin size={11} />
                  {currentPos.vehicles?.vehicle_number ?? currentPos.vehicle_id?.slice(0, 8)}
                </span>
                <span className="text-text3">{currentPos.latitude?.toFixed(4)}, {currentPos.longitude?.toFixed(4)}</span>
                <span className="text-text2">{Math.round(currentPos.speed ?? 0)} mph</span>
                <span className="text-text3">{format(new Date(currentPos.timestamp), "HH:mm:ss")}</span>
              </div>
            )}
          </div>

          {/* Vehicle summaries */}
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(byVehicle).slice(0, 6).map(([vehicleId, pts]) => {
              const vehicle = vehicles.find((v) => v.id === vehicleId);
              const first = pts[0];
              const last = pts[pts.length - 1];
              const maxSpeed = Math.max(...pts.map((p) => p.speed ?? 0));
              return (
                <div key={vehicleId} className="rounded-xl border p-4 space-y-2"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-medium text-sm text-accent">
                      {vehicle?.vehicle_number ?? vehicleId.slice(0, 8)}
                    </span>
                    <span className="text-[10px] font-mono text-text3">{pts.length} pts</span>
                  </div>
                  <div className="text-xs text-text3 space-y-1">
                    <div>Start: <span className="text-text2">{first?.timestamp ? format(new Date(first.timestamp), "HH:mm") : "—"}</span></div>
                    <div>End: <span className="text-text2">{last?.timestamp ? format(new Date(last.timestamp), "HH:mm") : "—"}</span></div>
                    <div>Max Speed: <span className="text-text2">{Math.round(maxSpeed)} mph</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {positions.length === 0 && !loading && (
        <div className="rounded-xl border py-16 flex flex-col items-center gap-3"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="w-14 h-14 rounded-2xl bg-surface2 flex items-center justify-center">
            <History size={24} className="text-text3 opacity-50" />
          </div>
          <p className="font-medium text-text2">No tracking data found</p>
          <p className="text-sm text-text3">Select a vehicle and date range, then click Load History</p>
        </div>
      )}
    </div>
  );
}
