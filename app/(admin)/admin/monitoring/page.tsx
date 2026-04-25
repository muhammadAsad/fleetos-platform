"use client";
import { useEffect, useState } from "react";
import {
  Activity, Server, Database, Cpu, MemoryStick,
  AlertTriangle, CheckCircle2, Clock, RefreshCw,
  Wifi, Globe, ZapOff, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

function useRealtime(base: number, variance: number) {
  const [value, setValue] = useState(base);
  useEffect(() => {
    const id = setInterval(() => {
      setValue(base + (Math.random() - 0.5) * variance);
    }, 2000);
    return () => clearInterval(id);
  }, [base, variance]);
  return value;
}

function Gauge({ value, max, label, unit, color, warningAt }: {
  value: number; max: number; label: string; unit: string; color: string; warningAt?: number;
}) {
  const pct = Math.min(100, (value / max) * 100);
  const isWarning = warningAt != null && value >= warningAt;
  const activeColor = isWarning ? "#f59e0b" : color;
  return (
    <div
      className="rounded-xl border p-4 space-y-3"
      style={{ background: "var(--surface)", borderColor: isWarning ? "rgba(245,158,11,0.3)" : "var(--border)" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono font-semibold text-text3 uppercase tracking-wide">{label}</span>
        {isWarning && <AlertTriangle size={12} style={{ color: "#f59e0b" }} />}
      </div>
      <div className="flex items-end gap-1">
        <span className="font-display font-bold text-3xl text-text leading-none">{typeof value === "number" ? value.toFixed(value < 10 ? 1 : 0) : value}</span>
        <span className="text-sm text-text3 mb-0.5">{unit}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface3)" }}>
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, background: activeColor, boxShadow: `0 0 8px ${activeColor}60` }}
        />
      </div>
      <p className="text-[10px] text-text3">{pct.toFixed(0)}% of {max}{unit}</p>
    </div>
  );
}

const ERROR_LOGS = [
  { level: "error", message: "Supabase realtime subscription timeout for company c_9841", time: "2m ago", service: "realtime" },
  { level: "warn", message: "High memory usage on worker-3 (82%)", time: "8m ago", service: "worker" },
  { level: "error", message: "ELD webhook delivery failed: 3 retries exhausted for device ELD-4421", time: "22m ago", service: "webhooks" },
  { level: "info", message: "Auto-scaled worker pool from 3 → 4 instances", time: "35m ago", service: "autoscaler" },
  { level: "warn", message: "Mapbox rate limit approaching: 84% of monthly tile requests used", time: "1h ago", service: "maps" },
  { level: "error", message: "Payment webhook from Stripe failed: invalid signature", time: "2h ago", service: "billing" },
  { level: "info", message: "Database backup completed successfully (2.4 GB)", time: "3h ago", service: "database" },
  { level: "info", message: "Deployed version 2.4.1 to production", time: "6h ago", service: "deploy" },
];

const LOG_META: Record<string, { color: string; bg: string }> = {
  error: { color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  warn: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  info: { color: "#64748b", bg: "rgba(100,116,139,0.1)" },
};

const SERVICES = [
  { name: "API Gateway", status: "operational", latency: 42, uptime: "99.98%" },
  { name: "Database (Primary)", status: "operational", latency: 8, uptime: "100%" },
  { name: "Database (Replica)", status: "operational", latency: 11, uptime: "99.99%" },
  { name: "Realtime (Supabase)", status: "operational", latency: 95, uptime: "99.97%" },
  { name: "ELD Webhook Worker", status: "degraded", latency: 312, uptime: "99.2%" },
  { name: "Map Tile Cache", status: "operational", latency: 24, uptime: "100%" },
  { name: "Email Notifications", status: "operational", latency: 180, uptime: "99.95%" },
  { name: "Payment Processing", status: "operational", latency: 210, uptime: "99.99%" },
];

export default function AdminMonitoringPage() {
  const apiLatency = useRealtime(42, 18);
  const cpuPct = useRealtime(34, 12);
  const memPct = useRealtime(58, 8);
  const dbConns = useRealtime(18, 4);
  const reqPerMin = useRealtime(284, 60);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const allOperational = SERVICES.filter((s) => s.status !== "operational").length === 0;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Status banner */}
      <div
        className="flex items-center gap-3 px-5 py-3 rounded-xl border"
        style={{
          background: allOperational ? "rgba(16,185,129,0.06)" : "rgba(245,158,11,0.06)",
          borderColor: allOperational ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.25)",
        }}
      >
        {allOperational
          ? <CheckCircle2 size={18} style={{ color: "#10b981" }} />
          : <AlertTriangle size={18} style={{ color: "#f59e0b" }} />}
        <div className="flex-1">
          <p className="text-sm font-semibold text-text">
            {allOperational ? "All systems operational" : "Some services degraded"}
          </p>
          <p className="text-xs text-text3">Last checked: {lastRefresh.toLocaleTimeString()}</p>
        </div>
        <button
          onClick={() => setLastRefresh(new Date())}
          className="flex items-center gap-1.5 px-3 h-7 rounded-lg border text-xs text-text2 hover:text-text transition-all"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          <RefreshCw size={11} />
          Refresh
        </button>
      </div>

      {/* Live metric gauges */}
      <div className="grid grid-cols-5 gap-4">
        <Gauge label="API Latency" value={apiLatency} max={200} unit="ms" color="#2563eb" warningAt={150} />
        <Gauge label="CPU Usage" value={cpuPct} max={100} unit="%" color="#7c3aed" warningAt={80} />
        <Gauge label="Memory" value={memPct} max={100} unit="%" color="#f59e0b" warningAt={85} />
        <Gauge label="DB Connections" value={dbConns} max={100} unit="" color="#10b981" warningAt={80} />
        <Gauge label="Req / Min" value={reqPerMin} max={500} unit="" color="#06b6d4" />
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Service status */}
        <div className="col-span-7 space-y-3">
          <h3 className="text-sm font-semibold text-text">Service Status</h3>
          <div className="rounded-xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            {SERVICES.map((svc, i) => {
              const isOk = svc.status === "operational";
              const isDegraded = svc.status === "degraded";
              return (
                <div
                  key={i}
                  className="flex items-center gap-4 px-4 py-3 border-b last:border-0 hover:bg-surface2 transition-colors"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      background: isOk ? "#10b981" : isDegraded ? "#f59e0b" : "#ef4444",
                      boxShadow: `0 0 6px ${isOk ? "#10b981" : isDegraded ? "#f59e0b" : "#ef4444"}`,
                    }}
                  />
                  <span className="text-sm font-medium text-text flex-1">{svc.name}</span>
                  <span
                    className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded"
                    style={{
                      background: isOk ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
                      color: isOk ? "#10b981" : "#f59e0b",
                    }}
                  >
                    {svc.status === "operational" ? "Operational" : "Degraded"}
                  </span>
                  <span className="text-[12px] font-mono text-text3 w-16 text-right">{svc.latency}ms</span>
                  <span className="text-[12px] font-mono text-text3 w-14 text-right">{svc.uptime}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error log */}
        <div className="col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text">System Logs</h3>
            <div className="flex gap-1">
              {["error", "warn", "info"].map((level) => (
                <span key={level} className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: LOG_META[level].bg, color: LOG_META[level].color }}>
                  {level}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="max-h-[420px] overflow-y-auto">
              {ERROR_LOGS.map((log, i) => {
                const meta = LOG_META[log.level];
                return (
                  <div
                    key={i}
                    className="flex items-start gap-3 px-4 py-3 border-b last:border-0 hover:bg-surface2 transition-colors"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <span
                      className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase mt-0.5 flex-shrink-0"
                      style={{ background: meta.bg, color: meta.color }}
                    >
                      {log.level}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] text-text leading-snug">{log.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono text-text3">{log.service}</span>
                        <span className="text-[10px] text-text3">·</span>
                        <span className="text-[10px] font-mono text-text3">{log.time}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Active Sessions", value: "1,284", icon: Wifi, color: "#10b981" },
              { label: "Requests Today", value: "418k", icon: Globe, color: "#2563eb" },
              { label: "Errors (24h)", value: "31", icon: ZapOff, color: "#ef4444" },
              { label: "Uptime (30d)", value: "99.97%", icon: Zap, color: "#7c3aed" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border p-3 flex items-center gap-3"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}15` }}>
                  <s.icon size={14} style={{ color: s.color }} />
                </div>
                <div>
                  <p className="font-display font-bold text-lg text-text leading-none">{s.value}</p>
                  <p className="text-[10px] text-text3 mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
