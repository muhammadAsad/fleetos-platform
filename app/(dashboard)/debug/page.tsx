"use client";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { RefreshCw, Wifi, WifiOff, Database, Activity, MapPin } from "lucide-react";
import { format } from "date-fns";

export default function DebugPage() {
  const supabase = createClient();
  const [gpsPositions, setGpsPositions] = useState<any[]>([]);
  const [hosSummaries, setHosSummaries] = useState<any[]>([]);
  const [realtimeEvents, setRealtimeEvents] = useState<{ time: string; table: string; event: string; data: any }[]>([]);
  const [loading, setLoading] = useState(true);
  const [realtimeStatus, setRealtimeStatus] = useState<"connecting" | "connected" | "error">("connecting");
  const eventsRef = useRef<typeof realtimeEvents>([]);

  async function loadData() {
    setLoading(true);
    const [gpsRes, hosRes] = await Promise.all([
      supabase.from("gps_positions").select("*, vehicles(vehicle_number)").order("timestamp", { ascending: false }).limit(20),
      supabase.from("driver_hos_summary").select("*, drivers(name), vehicles(vehicle_number)").order("last_updated", { ascending: false }),
    ]);
    setGpsPositions(gpsRes.data ?? []);
    setHosSummaries(hosRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();

    const channel = supabase.channel("debug-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "gps_positions" }, (payload: any) => {
        const evt = { time: new Date().toLocaleTimeString(), table: "gps_positions", event: payload.eventType, data: payload.new };
        eventsRef.current = [evt, ...eventsRef.current.slice(0, 49)];
        setRealtimeEvents([...eventsRef.current]);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "driver_hos_summary" }, (payload: any) => {
        const evt = { time: new Date().toLocaleTimeString(), table: "driver_hos_summary", event: payload.eventType, data: payload.new };
        eventsRef.current = [evt, ...eventsRef.current.slice(0, 49)];
        setRealtimeEvents([...eventsRef.current]);
        loadData();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "hos_logs" }, (payload: any) => {
        const evt = { time: new Date().toLocaleTimeString(), table: "hos_logs", event: payload.eventType, data: payload.new };
        eventsRef.current = [evt, ...eventsRef.current.slice(0, 49)];
        setRealtimeEvents([...eventsRef.current]);
      })
      .subscribe((status: any) => {
        setRealtimeStatus(status === "SUBSCRIBED" ? "connected" : status === "CHANNEL_ERROR" ? "error" : "connecting");
      });

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl text-text">Debug Panel</h2>
          <p className="text-sm text-text3 mt-0.5">Realtime data inspector — GPS, HOS, and event stream</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-lg border ${
            realtimeStatus === "connected" ? "bg-green/10 text-green border-green/20" :
            realtimeStatus === "error" ? "bg-red/10 text-[#ef4444] border-red/20" :
            "bg-yellow/10 text-yellow border-yellow/20"
          }`}>
            {realtimeStatus === "connected" ? <Wifi size={11} /> : <WifiOff size={11} />}
            Realtime {realtimeStatus}
          </span>
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg border text-sm text-text2 hover:text-text transition-all hover:border-accent/30"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* GPS Positions */}
        <div className="col-span-1 rounded-xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "var(--border)", background: "var(--surface2)" }}>
            <MapPin size={13} className="text-accent" />
            <h3 className="font-medium text-sm text-text">GPS Positions</h3>
            <span className="ml-auto text-xs font-mono text-text3">{gpsPositions.length} rows</span>
          </div>
          <div className="overflow-y-auto max-h-96">
            {gpsPositions.length === 0 ? (
              <div className="py-10 text-center text-text3 text-sm">
                <Database size={24} className="mx-auto mb-2 opacity-30" />
                No GPS data yet.<br />
                <span className="text-xs">Start the ELD simulator in Settings → ELD Devices</span>
              </div>
            ) : (
              gpsPositions.map((pos, i) => (
                <div key={pos.id ?? i} className="px-4 py-2.5 border-b text-xs" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-mono font-medium text-accent">{pos.vehicles?.vehicle_number ?? pos.vehicle_id?.slice(0, 8)}</span>
                    <span className="text-text3 font-mono">{pos.timestamp ? format(new Date(pos.timestamp), "HH:mm:ss") : "—"}</span>
                  </div>
                  <div className="text-text3 font-mono">
                    {pos.latitude?.toFixed(4)}, {pos.longitude?.toFixed(4)}
                    {pos.speed != null && <span className="ml-2 text-text2">{Math.round(pos.speed)} mph</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* HOS Summaries */}
        <div className="col-span-1 rounded-xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "var(--border)", background: "var(--surface2)" }}>
            <Activity size={13} className="text-cyan" />
            <h3 className="font-medium text-sm text-text">HOS Summaries</h3>
            <span className="ml-auto text-xs font-mono text-text3">{hosSummaries.length} drivers</span>
          </div>
          <div className="overflow-y-auto max-h-96">
            {hosSummaries.length === 0 ? (
              <div className="py-10 text-center text-text3 text-sm">
                <Database size={24} className="mx-auto mb-2 opacity-30" />
                No HOS data yet.
              </div>
            ) : (
              hosSummaries.map((s, i) => (
                <div key={s.id ?? i} className="px-4 py-2.5 border-b text-xs" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-medium text-text">{s.drivers?.name ?? "Unknown"}</span>
                    <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
                      s.current_duty_status === "DR" ? "bg-green/10 text-green" :
                      s.current_duty_status === "ON" ? "bg-yellow/10 text-yellow" :
                      s.current_duty_status === "SB" ? "bg-blue-500/10 text-blue-400" :
                      "bg-surface3 text-text3"
                    }`}>{s.current_duty_status ?? "OFF"}</span>
                  </div>
                  <div className="text-text3 font-mono space-y-0.5">
                    <div>Drive: {s.drive_used_minutes ?? 0}m used / {s.drive_remaining_minutes ?? 660}m left</div>
                    <div>Shift: {s.shift_remaining_minutes ?? 840}m left</div>
                    {s.violations > 0 && <div className="text-[#ef4444]">⚠ {s.violations} violations</div>}
                    {s.current_latitude && <div>📍 {s.current_latitude?.toFixed(3)}, {s.current_longitude?.toFixed(3)}</div>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Realtime Events */}
        <div className="col-span-1 rounded-xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "var(--border)", background: "var(--surface2)" }}>
            <Wifi size={13} className="text-green" />
            <h3 className="font-medium text-sm text-text">Realtime Stream</h3>
            <span className="ml-auto text-xs font-mono text-text3">{realtimeEvents.length} events</span>
          </div>
          <div className="overflow-y-auto max-h-96">
            {realtimeEvents.length === 0 ? (
              <div className="py-10 text-center text-text3 text-sm">
                <Wifi size={24} className="mx-auto mb-2 opacity-30" />
                Waiting for realtime events...<br />
                <span className="text-xs">Events appear here when simulator is running</span>
              </div>
            ) : (
              realtimeEvents.map((evt, i) => (
                <div key={i} className="px-4 py-2.5 border-b text-xs" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-text3">{evt.time}</span>
                    <span className={`px-1 py-0.5 rounded text-[10px] font-mono font-bold ${
                      evt.event === "INSERT" ? "bg-green/10 text-green" :
                      evt.event === "UPDATE" ? "bg-cyan/10 text-cyan" :
                      "bg-red/10 text-[#ef4444]"
                    }`}>{evt.event}</span>
                    <span className="text-accent font-mono">{evt.table}</span>
                  </div>
                  <div className="text-text3 font-mono truncate">
                    {JSON.stringify(evt.data).slice(0, 80)}...
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Environment check */}
      <div className="rounded-xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <h3 className="font-medium text-sm text-text mb-3">Environment Status</h3>
        <div className="grid grid-cols-3 gap-3 text-xs font-mono">
          {[
            { label: "NEXT_PUBLIC_SUPABASE_URL", val: process.env.NEXT_PUBLIC_SUPABASE_URL },
            { label: "NEXT_PUBLIC_MAPBOX_TOKEN", val: process.env.NEXT_PUBLIC_MAPBOX_TOKEN },
          ].map(({ label, val }) => {
            const ok = val && !val.includes("your-") && !val.includes("example");
            return (
              <div key={label} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: "var(--surface2)" }}>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${ok ? "bg-green" : "bg-[#ef4444]"}`} />
                <div className="min-w-0">
                  <div className="text-text3 truncate">{label}</div>
                  <div className={ok ? "text-green" : "text-[#ef4444]"}>{ok ? "✓ configured" : "✗ placeholder"}</div>
                </div>
              </div>
            );
          })}
          <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: "var(--surface2)" }}>
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${realtimeStatus === "connected" ? "bg-green" : "bg-yellow"}`} />
            <div>
              <div className="text-text3">Supabase Realtime</div>
              <div className={realtimeStatus === "connected" ? "text-green" : "text-yellow"}>{realtimeStatus}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
