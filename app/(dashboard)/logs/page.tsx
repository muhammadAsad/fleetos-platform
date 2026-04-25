"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { formatMinutes } from "@/lib/utils";
import { StatusBadge } from "@/components/hos/HosBar";
import { Search, RefreshCw, ChevronDown, MapPin, CalendarDays } from "lucide-react";
import type { HosLog, Driver, Vehicle } from "@/types/database";
import { format } from "date-fns";

type LogRow = HosLog & { driver?: Driver; vehicle?: Vehicle };

export default function LogsPage() {
  const supabase = createClient();
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("hos_logs")
      .select("*, drivers(name, username), vehicles(vehicle_number)")
      .order("start_time", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    setLogs((data ?? []).map((r: any) => ({ ...r, driver: r.drivers, vehicle: r.vehicles })));
    setLoading(false);
  }

  useEffect(() => { load(); }, [page]);

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase();
    const matchSearch = !q || l.driver?.name?.toLowerCase().includes(q) || l.vehicle?.vehicle_number?.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || l.duty_status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl text-text">Logs</h2>
          <p className="text-sm text-text3 mt-0.5">HOS duty status change history</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div
          className="flex items-center gap-2 px-3 h-8 rounded-lg border text-sm flex-1 min-w-[200px] max-w-xs"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <Search size={13} className="text-text3" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search driver or vehicle..."
            className="bg-transparent flex-1 outline-none text-sm text-text placeholder-text3"
          />
        </div>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none h-8 pl-3 pr-8 rounded-lg border text-sm text-text2 bg-surface hover:border-accent/30 focus:outline-none focus:border-accent transition-colors cursor-pointer"
            style={{ borderColor: "var(--border)" }}
          >
            {["all", "DR", "ON", "SB", "OFF"].map((v) => (
              <option key={v} value={v} style={{ background: "var(--surface)" }}>
                {v === "all" ? "All Statuses" : v === "DR" ? "Driving" : v === "ON" ? "On Duty" : v === "SB" ? "Sleeper" : "Off Duty"}
              </option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text3 pointer-events-none" />
        </div>

        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 h-8 rounded-lg border text-sm text-text2 hover:text-text transition-all hover:border-accent/30"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-[11px] font-mono text-text3 uppercase tracking-wide" style={{ borderColor: "var(--border)", background: "var(--surface2)" }}>
                <th className="text-left px-4 py-3">#</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Driver</th>
                <th className="text-left px-4 py-3">Vehicle</th>
                <th className="text-left px-4 py-3">Start Time</th>
                <th className="text-left px-4 py-3">End Time</th>
                <th className="text-left px-4 py-3">Duration</th>
                <th className="text-left px-4 py-3">Location</th>
                <th className="text-left px-4 py-3">Source</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b" style={{ borderColor: "var(--border)" }}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div className="h-3 rounded animate-pulse" style={{ background: "var(--surface3)", width: "75%" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-text3">
                    <CalendarDays size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium text-text2">No log entries yet</p>
                    <p className="text-sm mt-1">Start the simulator to generate HOS log entries.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((log, i) => (
                  <tr key={log.id} className="border-b transition-colors hover:bg-surface2" style={{ borderColor: "var(--border)" }}>
                    <td className="px-4 py-3 text-text3 font-mono text-xs">{page * PAGE_SIZE + i + 1}</td>
                    <td className="px-4 py-3"><StatusBadge status={log.duty_status} /></td>
                    <td className="px-4 py-3 font-medium text-text">{log.driver?.name ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-text2">{log.vehicle?.vehicle_number ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-text2">
                      {format(new Date(log.start_time), "MM/dd HH:mm")}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-text2">
                      {log.end_time ? format(new Date(log.end_time), "MM/dd HH:mm") : <span className="text-text3">Active</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-text2">
                      {log.duration_minutes ? formatMinutes(log.duration_minutes) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs text-text3">
                        <MapPin size={10} />
                        <span className="truncate max-w-[120px]">{log.location ?? "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${log.is_auto ? "bg-cyan/10 text-cyan" : "bg-surface3 text-text3"}`}>
                        {log.is_auto ? "AUTO" : "MANUAL"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t text-xs text-text3 font-mono" style={{ borderColor: "var(--border)" }}>
          <span>{filtered.length} entries</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
              className="px-2 h-6 rounded border border-border hover:border-accent/30 disabled:opacity-30 transition-colors">
              ←
            </button>
            <span>Page {page + 1}</span>
            <button onClick={() => setPage(page + 1)} disabled={logs.length < PAGE_SIZE}
              className="px-2 h-6 rounded border border-border hover:border-accent/30 disabled:opacity-30 transition-colors">
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
