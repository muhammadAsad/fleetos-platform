"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { FileText, Download, ChevronDown, Search } from "lucide-react";
import { StatusBadge } from "@/components/hos/HosBar";
import { formatMinutes } from "@/lib/utils";
import { format } from "date-fns";
import type { Driver } from "@/types/database";

export default function DriverLogReportPage() {
  const supabase = createClient();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState(
    format(new Date(Date.now() - 7 * 86400000), "yyyy-MM-dd")
  );
  const [dateTo, setDateTo] = useState(format(new Date(), "yyyy-MM-dd"));
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from("drivers").select("*").eq("status", "active").then(({ data }: { data: any }) => {
      setDrivers(data ?? []);
    });
    loadReport();
  }, []);

  async function loadReport() {
    setLoading(true);
    let query = supabase
      .from("hos_logs")
      .select("*, drivers(name, cdl_number, cdl_state), vehicles(vehicle_number)")
      .gte("start_time", `${dateFrom}T00:00:00`)
      .lte("start_time", `${dateTo}T23:59:59`)
      .order("start_time", { ascending: false });

    if (selectedDriver !== "all") {
      query = query.eq("driver_id", selectedDriver);
    }

    const { data } = await query;
    setLogs(data ?? []);
    setLoading(false);
  }

  // Group logs by driver
  const grouped: Record<string, { driver: any; logs: any[] }> = {};
  logs.forEach((log) => {
    const key = log.driver_id;
    if (!grouped[key]) {
      grouped[key] = { driver: log.drivers, logs: [] };
    }
    grouped[key].logs.push(log);
  });

  const totalDriveMinutes = logs
    .filter((l) => l.duty_status === "DR")
    .reduce((a, l) => a + (l.duration_minutes ?? 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl text-text">Driver Log Report</h2>
          <p className="text-sm text-text3 mt-0.5">Individual driver HOS log for FMCSA compliance</p>
        </div>
        <button
          className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm text-white hover:opacity-90 transition-all"
          style={{ background: "var(--accent)" }}
        >
          <Download size={13} /> Export PDF
        </button>
      </div>

      {/* Filters */}
      <div
        className="rounded-xl border p-4 flex flex-wrap items-end gap-3"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text3">Driver</label>
          <div className="relative">
            <select
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              className="h-9 pl-3 pr-8 rounded-lg border text-sm text-text appearance-none cursor-pointer focus:outline-none focus:border-accent min-w-[200px]"
              style={{ background: "var(--surface2)", borderColor: "var(--border)" }}
            >
              <option value="all">All Drivers</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text3 pointer-events-none" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text3">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 px-3 rounded-lg border text-sm text-text focus:outline-none focus:border-accent"
            style={{ background: "var(--surface2)", borderColor: "var(--border)" }}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text3">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9 px-3 rounded-lg border text-sm text-text focus:outline-none focus:border-accent"
            style={{ background: "var(--surface2)", borderColor: "var(--border)" }}
          />
        </div>
        <button
          onClick={loadReport}
          disabled={loading}
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg border text-sm text-text2 hover:text-text transition-all hover:border-accent/30"
          style={{ borderColor: "var(--border)", background: "var(--surface2)" }}
        >
          <Search size={13} className={loading ? "animate-spin" : ""} />
          Generate Report
        </button>
      </div>

      {/* Summary */}
      {logs.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total Entries", value: logs.length },
            { label: "Drive Time", value: formatMinutes(totalDriveMinutes) },
            { label: "Drivers", value: Object.keys(grouped).length },
            { label: "Date Range", value: `${dateFrom} → ${dateTo}` },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border p-4"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <p className="text-xs font-mono text-text3 uppercase tracking-wide">{s.label}</p>
              <p className="font-display font-bold text-xl text-text mt-1">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Log Table */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        {logs.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <FileText size={32} className="text-text3 mb-3 opacity-30" />
            <p className="font-medium text-text2">No log entries in this period</p>
            <p className="text-sm text-text3 mt-1">
              {logs.length === 0 && "Try running the simulator to generate log data, or adjust the date range."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-[11px] font-mono text-text3 uppercase" style={{ borderColor: "var(--border)", background: "var(--surface2)" }}>
                  {["#", "Driver", "CDL", "Vehicle", "Status", "Start", "End", "Duration", "Source"].map((h) => (
                    <th key={h} className="text-left px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b" style={{ borderColor: "var(--border)" }}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-3 rounded animate-pulse" style={{ background: "var(--surface3)", width: "80%" }} /></td>
                      ))}
                    </tr>
                  ))
                ) : (
                  logs.map((log, i) => (
                    <tr key={log.id} className="border-b hover:bg-surface2 transition-colors" style={{ borderColor: "var(--border)" }}>
                      <td className="px-4 py-3 text-xs font-mono text-text3">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-text">{log.drivers?.name ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-text3">
                        {log.drivers?.cdl_number ?? "—"}
                        {log.drivers?.cdl_state && ` (${log.drivers.cdl_state})`}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-text2">{log.vehicles?.vehicle_number ?? "—"}</td>
                      <td className="px-4 py-3"><StatusBadge status={log.duty_status} /></td>
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
        )}
        <div className="px-4 py-3 border-t text-xs text-text3 font-mono" style={{ borderColor: "var(--border)" }}>
          {logs.length} log entries
        </div>
      </div>
    </div>
  );
}
