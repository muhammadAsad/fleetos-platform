"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { formatMinutes } from "@/lib/utils";
import { HosBar, StatusBadge } from "@/components/hos/HosBar";
import { Badge } from "@/components/ui/badge";
import { Search, RefreshCw, ChevronDown, AlertTriangle, Wifi, WifiOff, MapPin } from "lucide-react";
import type { DriverHosSummary, Driver, Vehicle } from "@/types/database";

type Row = DriverHosSummary & {
  driver?: Driver;
  vehicle?: Vehicle;
};

export default function HosPage() {
  const supabase = createClient();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [onlineFilter, setOnlineFilter] = useState("all");
  const [violationFilter, setViolationFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("driver_hos_summary")
      .select("*, drivers(*), vehicles(vehicle_number, make, model)");
    setRows((data ?? []).map((r: any) => ({ ...r, driver: r.drivers, vehicle: r.vehicles })));
    setLoading(false);
  }

  useEffect(() => {
    load();
    const channel = supabase
      .channel("hos-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "driver_hos_summary" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.driver?.name?.toLowerCase().includes(q) || r.vehicle?.vehicle_number?.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || r.current_duty_status === statusFilter;
    const matchOnline = onlineFilter === "all" || r.online_status === onlineFilter;
    const matchViolation = violationFilter === "all" || (violationFilter === "has" ? r.violations > 0 : r.violations === 0);
    return matchSearch && matchStatus && matchOnline && matchViolation;
  });

  const totalViolations = rows.reduce((a, r) => a + (r.violations ?? 0), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl text-text">Driver HoS</h2>
          <p className="text-sm text-text3 mt-0.5">Hours of Service — USA 70 Hour / 8 Day</p>
        </div>
        {totalViolations > 0 && (
          <Badge variant="red" dot>{totalViolations} violation{totalViolations > 1 ? "s" : ""}</Badge>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
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

        <FilterSelect label="Duty Status" value={statusFilter} onChange={setStatusFilter}
          options={[
            { value: "all", label: "All Statuses" },
            { value: "DR", label: "Driving" },
            { value: "ON", label: "On Duty" },
            { value: "SB", label: "Sleeper" },
            { value: "OFF", label: "Off Duty" },
          ]}
        />

        <FilterSelect label="Online" value={onlineFilter} onChange={setOnlineFilter}
          options={[
            { value: "all", label: "All" },
            { value: "online", label: "Online" },
            { value: "offline", label: "Offline" },
          ]}
        />

        <FilterSelect label="Violations" value={violationFilter} onChange={setViolationFilter}
          options={[
            { value: "all", label: "All" },
            { value: "has", label: "Has Violations" },
            { value: "none", label: "No Violations" },
          ]}
        />

        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 h-8 rounded-lg border text-sm text-text2 hover:text-text transition-all hover:border-accent/30"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-[11px] font-mono text-text3 uppercase tracking-wide" style={{ borderColor: "var(--border)", background: "var(--surface2)" }}>
                <th className="text-left px-4 py-3 w-8">#</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Driver</th>
                <th className="text-left px-4 py-3">Vehicle</th>
                <th className="text-left px-4 py-3">Location</th>
                <th className="text-left px-4 py-3">Break</th>
                <th className="text-left px-4 py-3">Drive</th>
                <th className="text-left px-4 py-3">Shift</th>
                <th className="text-left px-4 py-3">Cycle</th>
                <th className="text-left px-4 py-3">Violations</th>
                <th className="text-left px-4 py-3">Online</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b" style={{ borderColor: "var(--border)" }}>
                    {Array.from({ length: 11 }).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-3 rounded animate-pulse" style={{ background: "var(--surface3)", width: j === 0 ? "20px" : "80%" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-16 text-text3">
                    <div className="space-y-2">
                      <p className="text-base font-medium text-text2">No drivers found</p>
                      <p className="text-sm">Try adjusting your filters or start the simulator to generate data.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((row, i) => (
                  <>
                    <tr
                      key={row.id}
                      onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                      className={`border-b cursor-pointer transition-colors hover:bg-surface2 ${row.violations > 0 ? "bg-red/5" : ""}`}
                      style={{ borderColor: "var(--border)" }}
                    >
                      <td className="px-4 py-3 text-text3 font-mono text-xs">{i + 1}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={row.violations > 0 ? "VIOLATION" : row.current_duty_status} animated />
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-text">{row.driver?.name ?? "—"}</p>
                          <p className="text-xs text-text3 font-mono">{row.driver?.username ?? ""}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text2 font-mono text-xs">
                        {row.vehicle?.vehicle_number ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-xs text-text3">
                          <MapPin size={10} />
                          <span className="truncate max-w-[120px]">
                            {row.current_location
                              ? row.current_location
                              : row.current_latitude != null
                              ? `${row.current_latitude.toFixed(2)}, ${row.current_longitude?.toFixed(2)}`
                              : "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <HosBar used={30 - row.break_remaining_minutes} total={30} compact />
                      </td>
                      <td className="px-4 py-3">
                        <HosBar used={row.drive_used_minutes} total={660} />
                      </td>
                      <td className="px-4 py-3">
                        <HosBar used={row.shift_used_minutes} total={840} />
                      </td>
                      <td className="px-4 py-3">
                        <HosBar used={row.cycle_used_minutes} total={4200} />
                      </td>
                      <td className="px-4 py-3">
                        {row.violations > 0 ? (
                          <span className="flex items-center gap-1 text-xs text-[#ef4444]">
                            <AlertTriangle size={11} />
                            {row.violations}
                          </span>
                        ) : (
                          <span className="text-xs text-green">✓ Clear</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {row.online_status === "online"
                          ? <Wifi size={13} className="text-green" />
                          : <WifiOff size={13} className="text-text3" />
                        }
                      </td>
                    </tr>
                    {expandedId === row.id && (
                      <tr key={`${row.id}-expand`} style={{ borderColor: "var(--border)" }} className="border-b">
                        <td colSpan={11} className="px-6 py-4" style={{ background: "var(--surface2)" }}>
                          <HosTimeline row={row} />
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t text-xs text-text3 font-mono" style={{ borderColor: "var(--border)" }}>
          {filtered.length} drivers shown {filtered.length !== rows.length && `(${rows.length} total)`}
        </div>
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none h-8 pl-3 pr-8 rounded-lg border text-sm text-text2 bg-surface hover:border-accent/30 focus:outline-none focus:border-accent transition-colors cursor-pointer"
        style={{ borderColor: "var(--border)" }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ background: "var(--surface)" }}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text3 pointer-events-none" />
    </div>
  );
}

function HosTimeline({ row }: { row: Row }) {
  const items = [
    { label: "Drive Time Used", used: row.drive_used_minutes, total: 660 },
    { label: "Shift Time Used", used: row.shift_used_minutes, total: 840 },
    { label: "Cycle Time Used", used: row.cycle_used_minutes, total: 4200 },
    { label: "Break Used", used: 30 - row.break_remaining_minutes, total: 30 },
  ];

  return (
    <div className="space-y-3">
      <p className="text-xs font-mono text-text3 uppercase tracking-widest mb-3">HOS Detail — {row.driver?.name}</p>
      <div className="grid grid-cols-2 gap-4">
        {items.map((item) => {
          const pct = Math.min(100, (item.used / item.total) * 100);
          const color = pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : "#10b981";
          return (
            <div key={item.label} className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-text3">{item.label}</span>
                <span className="font-mono" style={{ color }}>
                  {formatMinutes(item.used)} / {formatMinutes(item.total)}
                </span>
              </div>
              <div className="h-2 rounded-full" style={{ background: "var(--surface3)" }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
