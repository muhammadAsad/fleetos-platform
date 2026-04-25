"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { RefreshCw, ChevronDown, AlertTriangle, CheckCircle2, UserPlus } from "lucide-react";
import type { UnidentifiedEvent, Vehicle } from "@/types/database";
import { format } from "date-fns";

type EventRow = UnidentifiedEvent & { vehicle?: Vehicle };
type GroupedEvents = { vehicle: Vehicle; events: UnidentifiedEvent[] }[];

export default function EventsPage() {
  const supabase = createClient();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedVehicle, setExpandedVehicle] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("unidentified_events")
      .select("*, vehicles(vehicle_number, vin, make, model)")
      .order("created_at", { ascending: false });
    setEvents((data ?? []).map((r: any) => ({ ...r, vehicle: r.vehicles })));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  // Group by vehicle
  const grouped: GroupedEvents = [];
  events.forEach((e) => {
    if (!e.vehicle) return;
    const existing = grouped.find((g) => g.vehicle.id === e.vehicle_id);
    if (existing) {
      existing.events.push(e);
    } else {
      grouped.push({ vehicle: e.vehicle as Vehicle, events: [e] });
    }
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl text-text">Unidentified Events</h2>
          <p className="text-sm text-text3 mt-0.5">Driving events without a logged-in driver</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 h-8 rounded-lg border text-sm text-text2 hover:text-text transition-all hover:border-accent/30"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-[11px] font-mono text-text3 uppercase tracking-wide" style={{ borderColor: "var(--border)", background: "var(--surface2)" }}>
              <th className="text-left px-4 py-3 w-8"></th>
              <th className="text-left px-4 py-3">Vehicle Number</th>
              <th className="text-left px-4 py-3">VIN</th>
              <th className="text-left px-4 py-3">Make / Model</th>
              <th className="text-left px-4 py-3">Unidentified Events</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b" style={{ borderColor: "var(--border)" }}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-3 rounded animate-pulse" style={{ background: "var(--surface3)", width: "80%" }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : grouped.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-16 text-text3">
                  <CheckCircle2 size={32} className="mx-auto mb-3 text-green opacity-70" />
                  <p className="font-medium text-text2">No unidentified events</p>
                  <p className="text-sm mt-1">All driving events have been assigned to drivers.</p>
                </td>
              </tr>
            ) : (
              grouped.map(({ vehicle, events: vEvents }) => (
                <>
                  <tr
                    key={vehicle.id}
                    onClick={() => setExpandedVehicle(expandedVehicle === vehicle.id ? null : vehicle.id)}
                    className="border-b cursor-pointer transition-colors hover:bg-surface2"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <td className="px-4 py-3">
                      <ChevronDown
                        size={13}
                        className={`text-text3 transition-transform ${expandedVehicle === vehicle.id ? "rotate-180" : ""}`}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-text">{vehicle.vehicle_number}</td>
                    <td className="px-4 py-3 font-mono text-xs text-text3">{vehicle.vin ?? "—"}</td>
                    <td className="px-4 py-3 text-text2">{vehicle.make} {vehicle.model}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5">
                        {vEvents.filter(e => !e.resolved).length > 0 ? (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono bg-red/10 text-[#ef4444] border border-red/20">
                            <AlertTriangle size={10} />
                            {vEvents.filter(e => !e.resolved).length} unresolved
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono bg-green/10 text-green border border-green/20">
                            <CheckCircle2 size={10} />
                            All resolved
                          </span>
                        )}
                        <span className="text-xs text-text3">{vEvents.length} total</span>
                      </span>
                    </td>
                  </tr>
                  {expandedVehicle === vehicle.id && (
                    <tr key={`${vehicle.id}-expand`} className="border-b" style={{ borderColor: "var(--border)" }}>
                      <td colSpan={5} className="p-0">
                        <div style={{ background: "var(--surface2)" }}>
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b text-[10px] font-mono text-text3 uppercase" style={{ borderColor: "var(--border)" }}>
                                <th className="text-left pl-12 pr-4 py-2.5">Date</th>
                                <th className="text-left px-4 py-2.5">Start Time</th>
                                <th className="text-left px-4 py-2.5">End Time</th>
                                <th className="text-left px-4 py-2.5">Miles</th>
                                <th className="text-left px-4 py-2.5">Status</th>
                                <th className="text-left px-4 py-2.5">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {vEvents.map((ev) => (
                                <tr key={ev.id} className="border-b" style={{ borderColor: "var(--border)" }}>
                                  <td className="pl-12 pr-4 py-2.5 font-mono text-xs text-text2">
                                    {ev.start_time ? format(new Date(ev.start_time), "MM/dd/yyyy") : "—"}
                                  </td>
                                  <td className="px-4 py-2.5 font-mono text-xs text-text2">
                                    {ev.start_time ? format(new Date(ev.start_time), "HH:mm:ss") : "—"}
                                  </td>
                                  <td className="px-4 py-2.5 font-mono text-xs text-text2">
                                    {ev.end_time ? format(new Date(ev.end_time), "HH:mm:ss") : "Active"}
                                  </td>
                                  <td className="px-4 py-2.5 font-mono text-xs text-text2">
                                    {ev.distance_miles?.toFixed(1) ?? "—"} mi
                                  </td>
                                  <td className="px-4 py-2.5">
                                    {ev.resolved ? (
                                      <span className="text-xs text-green">Resolved</span>
                                    ) : (
                                      <span className="text-xs text-yellow">Unresolved</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-2.5">
                                    {!ev.resolved && (
                                      <button className="flex items-center gap-1 text-xs text-accent hover:underline">
                                        <UserPlus size={11} />
                                        Assign driver
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
