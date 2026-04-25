"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import {
  Bell, AlertTriangle, Clock, WifiOff, Gauge, CheckCircle,
  RefreshCw, Settings, X, ChevronRight, Zap,
} from "lucide-react";
import { format } from "date-fns";

interface Alarm {
  id: string;
  type: "hos_violation" | "break_required" | "speeding" | "offline" | "cycle_limit" | "geofence";
  severity: "critical" | "warning" | "info";
  driver: string;
  vehicle: string;
  message: string;
  detail: string;
  timestamp: Date;
  acknowledged: boolean;
}

const ALARM_CONFIG = {
  hos_violation:  { icon: AlertTriangle, label: "HOS Violation",   color: "#ef4444", bg: "rgba(239,68,68,0.1)"   },
  break_required: { icon: Clock,         label: "Break Required",  color: "#f59e0b", bg: "rgba(245,158,11,0.1)"  },
  speeding:       { icon: Gauge,         label: "Speeding",        color: "#f97316", bg: "rgba(249,115,22,0.1)"  },
  offline:        { icon: WifiOff,       label: "Device Offline",  color: "#64748b", bg: "rgba(100,116,139,0.1)" },
  cycle_limit:    { icon: AlertTriangle, label: "Cycle Limit",     color: "#ef4444", bg: "rgba(239,68,68,0.1)"   },
  geofence:       { icon: Zap,           label: "Geofence Alert",  color: "#8b5cf6", bg: "rgba(139,92,246,0.1)"  },
};

interface AlarmRule {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
  type: Alarm["type"];
}

const DEFAULT_RULES: AlarmRule[] = [
  { id: "1", name: "HOS Violation", enabled: true, description: "Alert when driver exceeds drive/shift hours", type: "hos_violation" },
  { id: "2", name: "Break Required", enabled: true, description: "Alert when 30-min break is due within 30 min", type: "break_required" },
  { id: "3", name: "Speeding Alert", enabled: true, description: "Alert when speed exceeds 70 mph", type: "speeding" },
  { id: "4", name: "Device Offline", enabled: true, description: "Alert when ELD device goes offline", type: "offline" },
  { id: "5", name: "70-Hour Cycle Limit", enabled: false, description: "Alert when driver is within 2 hours of 70h cycle limit", type: "cycle_limit" },
  { id: "6", name: "Geofence Breach", enabled: false, description: "Alert when vehicle leaves assigned zone", type: "geofence" },
];

export default function AlertsPage() {
  const supabase = createClient();
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [rules, setRules] = useState<AlarmRule[]>(DEFAULT_RULES);
  const [loading, setLoading] = useState(true);
  const [showRules, setShowRules] = useState(false);
  const [filter, setFilter] = useState<"all" | "critical" | "warning" | "unacked">("all");

  async function loadAlarms() {
    setLoading(true);
    const { data } = await supabase
      .from("driver_hos_summary")
      .select("*, drivers(name), vehicles(vehicle_number)");

    const newAlarms: Alarm[] = [];
    (data ?? []).forEach((s: any) => {
      const driver = s.drivers?.name ?? "Unknown";
      const vehicle = s.vehicles?.vehicle_number ?? "—";
      const ts = s.last_updated ? new Date(s.last_updated) : new Date();

      if (s.violations > 0) {
        newAlarms.push({
          id: `v-${s.id}`,
          type: "hos_violation",
          severity: "critical",
          driver, vehicle,
          message: "HOS Violation Detected",
          detail: `${s.violations} rule violation${s.violations > 1 ? "s" : ""}. Immediate action required.`,
          timestamp: ts,
          acknowledged: false,
        });
      }
      if (s.drive_remaining_minutes != null && s.drive_remaining_minutes <= 30 && s.current_duty_status === "DR") {
        newAlarms.push({
          id: `b-${s.id}`,
          type: "break_required",
          severity: "warning",
          driver, vehicle,
          message: "30-Minute Break Required Soon",
          detail: `Driver has ${s.drive_remaining_minutes}min of drive time remaining before mandatory rest.`,
          timestamp: ts,
          acknowledged: false,
        });
      }
      if (s.current_speed != null && s.current_speed > 70 && s.current_duty_status === "DR") {
        newAlarms.push({
          id: `sp-${s.id}`,
          type: "speeding",
          severity: "warning",
          driver, vehicle,
          message: "Speed Limit Exceeded",
          detail: `Current speed ${Math.round(s.current_speed)} mph exceeds 70 mph threshold.`,
          timestamp: ts,
          acknowledged: false,
        });
      }
      if (s.online_status === "offline") {
        newAlarms.push({
          id: `o-${s.id}`,
          type: "offline",
          severity: "info",
          driver, vehicle,
          message: "ELD Device Offline",
          detail: "Device has lost connection. GPS and HOS data may be delayed.",
          timestamp: ts,
          acknowledged: false,
        });
      }
      if (s.cycle_used_minutes != null && s.cycle_used_minutes >= (70 * 60 - 120)) {
        newAlarms.push({
          id: `c-${s.id}`,
          type: "cycle_limit",
          severity: "critical",
          driver, vehicle,
          message: "Approaching 70-Hour Cycle Limit",
          detail: `Driver has used ${Math.floor(s.cycle_used_minutes / 60)}h of their 70-hour cycle.`,
          timestamp: ts,
          acknowledged: false,
        });
      }
    });

    // Add some demo alarms if DB is empty
    if (newAlarms.length === 0) {
      newAlarms.push(
        { id: "demo1", type: "hos_violation", severity: "critical", driver: "John Smith", vehicle: "TRK-001", message: "HOS Violation Detected", detail: "Drive time exceeded 11 hours. Driver must stop immediately.", timestamp: new Date(Date.now() - 600000), acknowledged: false },
        { id: "demo2", type: "break_required", severity: "warning", driver: "Maria Garcia", vehicle: "TRK-002", message: "30-Minute Break Due in 15min", detail: "Driver approaching 8 consecutive hours on duty. Break required.", timestamp: new Date(Date.now() - 300000), acknowledged: false },
        { id: "demo3", type: "speeding", severity: "warning", driver: "Robert Lee", vehicle: "TRK-003", message: "Speed Limit Exceeded", detail: "Current speed 74 mph exceeds 70 mph threshold.", timestamp: new Date(Date.now() - 120000), acknowledged: false },
        { id: "demo4", type: "offline", severity: "info", driver: "Carlos Martinez", vehicle: "TRK-004", message: "ELD Device Offline", detail: "Device went offline 8 minutes ago. Last known position: I-90 mile 142.", timestamp: new Date(Date.now() - 480000), acknowledged: false },
      );
    }

    setAlarms(newAlarms.sort((a, b) => {
      const sev = { critical: 0, warning: 1, info: 2 };
      return sev[a.severity] - sev[b.severity];
    }));
    setLoading(false);
  }

  useEffect(() => {
    loadAlarms();
    const channel = supabase
      .channel("alerts-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "driver_hos_summary" }, loadAlarms)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  function acknowledge(id: string) {
    setAlarms((prev) => prev.map((a) => a.id === id ? { ...a, acknowledged: true } : a));
  }

  function acknowledgeAll() {
    setAlarms((prev) => prev.map((a) => ({ ...a, acknowledged: true })));
  }

  const filtered = alarms.filter((a) => {
    if (filter === "critical") return a.severity === "critical";
    if (filter === "warning") return a.severity === "warning";
    if (filter === "unacked") return !a.acknowledged;
    return true;
  });

  const criticalCount = alarms.filter((a) => a.severity === "critical" && !a.acknowledged).length;
  const warningCount = alarms.filter((a) => a.severity === "warning" && !a.acknowledged).length;
  const unackedCount = alarms.filter((a) => !a.acknowledged).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl text-text">Driver Alarms</h2>
          <p className="text-sm text-text3 mt-0.5">Real-time alerts for HOS violations, speeding, and device status</p>
        </div>
        <div className="flex items-center gap-2">
          {unackedCount > 0 && (
            <button onClick={acknowledgeAll}
              className="flex items-center gap-1.5 px-3 h-8 rounded-lg border text-sm text-text2 hover:text-text hover:border-accent/30 transition-all"
              style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
              <CheckCircle size={13} />
              Acknowledge All
            </button>
          )}
          <button onClick={() => setShowRules(!showRules)}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg border text-sm text-text2 hover:text-text hover:border-accent/30 transition-all"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
            <Settings size={13} />
            Rules
          </button>
          <button onClick={loadAlarms} disabled={loading}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg border text-sm text-text2 hover:text-text hover:border-accent/30 transition-all"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Critical", value: criticalCount, color: "#ef4444", bg: "rgba(239,68,68,0.1)", filter: "critical" as const },
          { label: "Warnings", value: warningCount, color: "#f59e0b", bg: "rgba(245,158,11,0.1)", filter: "warning" as const },
          { label: "Unacknowledged", value: unackedCount, color: "#3b82f6", bg: "rgba(59,130,246,0.1)", filter: "unacked" as const },
          { label: "Total Alarms", value: alarms.length, color: "#64748b", bg: "rgba(100,116,139,0.1)", filter: "all" as const },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => setFilter(s.filter)}
            className={`rounded-xl border p-4 text-left transition-all hover:border-accent/30 ${filter === s.filter ? "ring-1 ring-accent/30" : ""}`}
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <p className="text-[10px] font-mono text-text3 uppercase tracking-wide">{s.label}</p>
            <p className="font-display font-bold text-3xl mt-1" style={{ color: s.value > 0 ? s.color : "var(--text3)" }}>
              {s.value}
            </p>
          </button>
        ))}
      </div>

      <div className={`grid gap-4 ${showRules ? "grid-cols-3" : "grid-cols-1"}`}>
        {/* Alarms List */}
        <div className={`space-y-2 ${showRules ? "col-span-2" : ""}`}>
          {/* Filter tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl w-fit" style={{ background: "var(--surface2)" }}>
            {(["all", "critical", "warning", "unacked"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${filter === f ? "bg-surface text-text shadow" : "text-text3 hover:text-text2"}`}>
                {f === "unacked" ? "Unread" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border p-4 h-20 space-y-2" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <div className="h-3 rounded animate-pulse" style={{ background: "var(--surface3)", width: "50%" }} />
                <div className="h-3 rounded animate-pulse" style={{ background: "var(--surface3)", width: "80%" }} />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border py-14 text-center" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="w-12 h-12 rounded-full bg-green/10 flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={20} className="text-green" />
              </div>
              <p className="font-medium text-text2">No alarms</p>
              <p className="text-sm text-text3 mt-1">
                {filter === "unacked" ? "All alarms acknowledged" : "All clear — no active alerts"}
              </p>
            </div>
          ) : (
            filtered.map((alarm) => {
              const cfg = ALARM_CONFIG[alarm.type];
              const Icon = cfg.icon;
              return (
                <div
                  key={alarm.id}
                  className={`rounded-xl border p-4 transition-all ${alarm.acknowledged ? "opacity-50" : ""}`}
                  style={{
                    background: "var(--surface)",
                    borderColor: alarm.acknowledged ? "var(--border)" : `${cfg.color}30`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: cfg.bg }}>
                      <Icon size={15} style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <span className="font-medium text-sm text-text">{alarm.message}</span>
                          <span className="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded"
                            style={{ background: cfg.bg, color: cfg.color }}>
                            {cfg.label}
                          </span>
                          {alarm.severity === "critical" && !alarm.acknowledged && (
                            <span className="ml-1.5 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#ef4444]/10 text-[#ef4444] animate-pulse">
                              CRITICAL
                            </span>
                          )}
                        </div>
                        {!alarm.acknowledged && (
                          <button onClick={() => acknowledge(alarm.id)}
                            className="text-text3 hover:text-text flex-shrink-0 transition-colors">
                            <X size={14} />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-text3 mb-2">{alarm.detail}</p>
                      <div className="flex items-center gap-3 text-[11px] font-mono text-text3">
                        <span className="text-text2">{alarm.driver}</span>
                        <span>·</span>
                        <span>{alarm.vehicle}</span>
                        <span>·</span>
                        <span>{format(alarm.timestamp, "HH:mm:ss")}</span>
                        {alarm.acknowledged && (
                          <span className="flex items-center gap-1 text-green ml-auto">
                            <CheckCircle size={10} />
                            Acknowledged
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Rules Panel */}
        {showRules && (
          <div className="rounded-xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)", background: "var(--surface2)" }}>
              <h3 className="font-medium text-sm text-text">Alarm Rules</h3>
              <button onClick={() => setShowRules(false)} className="text-text3 hover:text-text"><X size={14} /></button>
            </div>
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {rules.map((rule) => {
                const cfg = ALARM_CONFIG[rule.type];
                const Icon = cfg.icon;
                return (
                  <div key={rule.id} className="flex items-center gap-3 px-4 py-3.5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: rule.enabled ? cfg.bg : "var(--surface3)" }}>
                      <Icon size={13} style={{ color: rule.enabled ? cfg.color : "var(--text3)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text">{rule.name}</p>
                      <p className="text-[11px] text-text3 truncate">{rule.description}</p>
                    </div>
                    <div
                      onClick={() => setRules((prev) => prev.map((r) => r.id === rule.id ? { ...r, enabled: !r.enabled } : r))}
                      className={`w-9 h-5 rounded-full flex items-center transition-all cursor-pointer flex-shrink-0 ${rule.enabled ? "justify-end" : "justify-start"}`}
                      style={{ background: rule.enabled ? cfg.color : "var(--surface3)" }}
                    >
                      <div className="w-3.5 h-3.5 rounded-full bg-white mx-0.5 shadow-sm" />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="px-4 py-3 border-t text-xs text-text3" style={{ borderColor: "var(--border)" }}>
              {rules.filter((r) => r.enabled).length} of {rules.length} rules active
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
