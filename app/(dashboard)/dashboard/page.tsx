"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { formatMinutes } from "@/lib/utils";
import {
  Truck, Users, AlertTriangle, Activity,
  Clock, Wifi, RefreshCw, TrendingUp, Zap,
  ArrowUpRight, CheckCircle2, MapPin, Timer, ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import DriverCard from "@/components/drivers/DriverCard";

interface DashboardStats {
  totalDrivers: number;
  activeDrivers: number;
  drivingNow: number;
  violations: number;
  onlineVehicles: number;
  totalVehicles: number;
}

interface AlertItem {
  id: string;
  type: "violation" | "offline" | "warning";
  message: string;
  driver?: string;
  time: string;
}

function seededValues(seed: number, len = 8): number[] {
  let s = Math.max(seed, 1);
  return Array.from({ length: len }, () => {
    s = ((s * 1103515245) + 12345) & 0x7fffffff;
    return (s % 40) + seed + 5;
  });
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const w = 72, h = 28;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * (h * 0.75) - h * 0.12;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const lineD = `M ${pts.join(" L ")}`;
  const areaD = `M ${pts[0]} L ${pts.join(" L ")} L ${w},${h} L 0,${h} Z`;
  const gradId = `sg-${color.replace("#", "")}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradId})`} />
      <path d={lineD} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ComplianceRing({ pct, size = 96 }: { pct: number; size?: number }) {
  const r = 36, cx = 50, cy = 50;
  const circ = 2 * Math.PI * r;
  const dash = Math.min((pct / 100) * circ, circ);
  const ringColor = pct >= 90 ? "#10b981" : pct >= 70 ? "#f59e0b" : "#ef4444";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface3)" strokeWidth="7" />
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={ringColor}
        strokeWidth="7"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
        style={{ transition: "stroke-dasharray 0.8s ease" }}
      />
      <text x="50" y="46" textAnchor="middle" fill="var(--text)" fontSize="17" fontWeight="bold" fontFamily="Syne, sans-serif">
        {pct}%
      </text>
      <text x="50" y="60" textAnchor="middle" fill="var(--text3)" fontSize="8.5" fontFamily="DM Sans, sans-serif">
        compliant
      </text>
    </svg>
  );
}

export default function DashboardPage() {
  const supabase = createClient();
  const [stats, setStats] = useState<DashboardStats>({
    totalDrivers: 0, activeDrivers: 0, drivingNow: 0,
    violations: 0, onlineVehicles: 0, totalVehicles: 0,
  });
  const [driverCards, setDriverCards] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function loadData() {
    const [driversRes, hosRes, vehiclesRes] = await Promise.all([
      supabase.from("drivers").select("*").eq("status", "active"),
      supabase.from("driver_hos_summary").select("*, drivers(name, username), vehicles(vehicle_number)"),
      supabase.from("vehicles").select("*").eq("status", "active"),
    ]);

    const drivers = driversRes.data ?? [];
    const summaries = hosRes.data ?? [];
    const vehicles = vehiclesRes.data ?? [];

    const drivingNow = summaries.filter((s: any) => s.current_duty_status === "DR").length;
    const violations = summaries.reduce((a: number, s: any) => a + (s.violations || 0), 0);
    const onlineVehicles = summaries.filter((s: any) => s.online_status === "online").length;

    setStats({
      totalDrivers: drivers.length,
      activeDrivers: summaries.filter((s: any) => s.online_status === "online").length,
      drivingNow,
      violations,
      onlineVehicles,
      totalVehicles: vehicles.length,
    });

    setDriverCards(summaries.map((s: any) => ({
      id: s.driver_id ?? s.id,
      name: s.drivers?.name ?? "Unknown Driver",
      vehicleNumber: s.vehicles?.vehicle_number,
      status: s.current_duty_status ?? "OFF",
      speed: s.current_speed ?? 0,
      driveUsed: s.drive_used_minutes ?? 0,
      driveCap: 660,
      shiftRemaining: s.shift_remaining_minutes ?? 840,
      cycleUsed: s.cycle_used_minutes,
      cycleCap: 4200,
      violations: s.violations ?? 0,
      online: s.online_status === "online",
      lat: s.current_latitude,
      lng: s.current_longitude,
    })));

    const newAlerts: AlertItem[] = summaries
      .filter((s: any) => s.violations > 0)
      .map((s: any) => ({
        id: s.id,
        type: "violation" as const,
        message: `HOS violation detected`,
        driver: (s as any).drivers?.name ?? "Unknown",
        time: new Date(s.last_updated).toLocaleTimeString(),
      }));
    setAlerts(newAlerts);
    setLastUpdated(new Date());
    setLoading(false);
  }

  useEffect(() => {
    loadData();
    const channel = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "driver_hos_summary" }, loadData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const compliancePct = stats.totalDrivers > 0
    ? Math.round(((stats.totalDrivers - (stats.violations > 0 ? 1 : 0)) / stats.totalDrivers) * 100)
    : 100;

  const kpiCards = [
    {
      label: "Total Drivers",
      value: stats.totalDrivers,
      sub: `${stats.activeDrivers} online now`,
      icon: Users,
      color: "#2563eb",
      href: "/settings/drivers",
      sparkValues: seededValues(stats.totalDrivers + 3),
      trend: { dir: "up" as const, val: "8.2%" },
    },
    {
      label: "Driving Now",
      value: stats.drivingNow,
      sub: "active trips",
      icon: Truck,
      color: "#10b981",
      href: "/map",
      sparkValues: seededValues(stats.drivingNow + 7),
      trend: { dir: "up" as const, val: "12%" },
    },
    {
      label: "HOS Violations",
      value: stats.violations,
      sub: stats.violations === 0 ? "all clear" : "need attention",
      icon: AlertTriangle,
      color: stats.violations > 0 ? "#ef4444" : "#10b981",
      href: "/hos",
      sparkValues: seededValues(stats.violations + 1),
      trend: { dir: stats.violations > 0 ? ("up" as const) : ("down" as const), val: stats.violations > 0 ? `+${stats.violations}` : "0" },
    },
    {
      label: "Vehicles Online",
      value: stats.onlineVehicles,
      sub: `of ${stats.totalVehicles} total`,
      icon: Activity,
      color: "#06b6d4",
      href: "/map",
      sparkValues: seededValues(stats.onlineVehicles + 5),
      trend: { dir: "up" as const, val: "100%" },
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-xl text-text leading-tight">Fleet Overview</h2>
          <p className="text-xs text-text3 mt-0.5">Real-time status and HOS compliance</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 h-8 rounded-lg border text-xs text-text2 hover:text-text transition-all hover:border-accent/40"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} style={{ color: "var(--accent)" }} />
            {lastUpdated ? lastUpdated.toLocaleTimeString() : "—"}
          </button>
          <Link
            href="/map"
            className="flex items-center gap-2 px-3 h-8 rounded-lg text-xs font-medium text-white transition-all hover:opacity-90"
            style={{ background: "var(--accent)" }}
          >
            <MapPin size={12} />
            Live Map
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="group rounded-xl border p-4 transition-all hover:border-accent/30 hover:-translate-y-0.5 block"
            style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-text3">{card.label}</p>
                <p className="font-display font-bold text-3xl text-text mt-1 leading-none">{card.value}</p>
                <p className="text-[11px] text-text3 mt-1">{card.sub}</p>
              </div>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${card.color}18` }}
              >
                <card.icon size={15} style={{ color: card.color }} />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <span
                className="flex items-center gap-1 text-[10px] font-mono font-semibold"
                style={{ color: card.trend.dir === "up" ? "#10b981" : card.color === "#ef4444" ? "#ef4444" : "#94a3b8" }}
              >
                <ArrowUpRight size={10} style={{ transform: card.trend.dir === "down" ? "rotate(90deg)" : undefined }} />
                {card.trend.val}
              </span>
              <Sparkline values={card.sparkValues} color={card.color} />
            </div>
          </Link>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-12 gap-4">
        {/* Driver Cards — 8 cols */}
        <div className="col-span-8 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text">Driver Status</h3>
            <Link href="/hos" className="text-xs text-accent hover:underline flex items-center gap-1">
              View all <ArrowUpRight size={11} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border p-4 space-y-3" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="h-2.5 rounded-full animate-pulse" style={{ background: "var(--surface3)", width: j === 0 ? "55%" : "100%" }} />
                  ))}
                </div>
              ))}
            </div>
          ) : driverCards.length === 0 ? (
            <div
              className="rounded-xl border p-12 text-center"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: "var(--surface2)" }}
              >
                <Truck size={24} className="text-text3" />
              </div>
              <p className="font-semibold text-text mb-1">No driver data yet</p>
              <p className="text-sm text-text3 mb-5">Start the simulator to see live fleet activity</p>
              <button
                onClick={async () => {
                  try {
                    await fetch("/api/simulator", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "start" }) });
                    setTimeout(loadData, 3000);
                  } catch {}
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90 active:scale-95"
                style={{ background: "linear-gradient(135deg, var(--accent), #7c3aed)" }}
              >
                <Zap size={14} />
                Start Demo Fleet
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {driverCards.slice(0, 6).map((driver) => (
                <DriverCard key={driver.id} driver={driver} />
              ))}
            </div>
          )}
        </div>

        {/* Right column — 4 cols */}
        <div className="col-span-4 space-y-4">
          {/* Compliance Ring */}
          <div
            className="rounded-xl border p-4"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-text">HOS Compliance</h3>
              <ShieldCheck size={14} className="text-text3" />
            </div>
            <div className="flex items-center gap-4">
              <ComplianceRing pct={compliancePct} size={88} />
              <div className="space-y-2 flex-1">
                {[
                  { label: "Compliant", value: stats.totalDrivers - (stats.violations > 0 ? 1 : 0), color: "#10b981" },
                  { label: "Violations", value: stats.violations > 0 ? 1 : 0, color: "#ef4444" },
                  { label: "Off Duty", value: Math.max(0, stats.totalDrivers - stats.activeDrivers), color: "#475569" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: row.color }} />
                    <span className="text-[11px] text-text3 flex-1">{row.label}</span>
                    <span className="text-[11px] font-mono font-semibold" style={{ color: row.color }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div
            className="rounded-xl border overflow-hidden"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
              <h3 className="text-sm font-semibold text-text">Active Alerts</h3>
              {alerts.length > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>
                  {alerts.length}
                </span>
              )}
            </div>
            <div className="divide-y divide-border max-h-48 overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="py-7 text-center">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center mx-auto mb-2" style={{ background: "rgba(16,185,129,0.1)" }}>
                    <CheckCircle2 size={16} style={{ color: "#10b981" }} />
                  </div>
                  <p className="text-sm font-medium text-text2">All clear</p>
                  <p className="text-xs text-text3 mt-0.5">No active violations</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className="flex items-start gap-3 px-4 py-3 hover:bg-surface2 transition-colors">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(239,68,68,0.12)" }}>
                      <AlertTriangle size={12} style={{ color: "#ef4444" }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-text truncate">{alert.driver}</p>
                      <p className="text-[11px] text-text3">{alert.message}</p>
                      <p className="text-[10px] font-mono text-text3 mt-0.5">{alert.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Fleet Health */}
          <div
            className="rounded-xl border p-4 space-y-3"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <h3 className="text-sm font-semibold text-text">Fleet Health</h3>
            <div className="space-y-3">
              {[
                { label: "Online", value: stats.activeDrivers, total: stats.totalDrivers, color: "#10b981" },
                { label: "Driving", value: stats.drivingNow, total: stats.totalDrivers, color: "#2563eb" },
                { label: "Violations", value: stats.violations, total: Math.max(stats.totalDrivers, 1), color: "#ef4444" },
              ].map((s) => {
                const pct = s.total > 0 ? Math.min(100, (s.value / s.total) * 100) : 0;
                return (
                  <div key={s.label}>
                    <div className="flex justify-between text-[11px] mb-1.5">
                      <span className="text-text3">{s.label}</span>
                      <span className="font-mono font-semibold" style={{ color: s.color }}>{s.value} / {s.total}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface3)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: s.color,
                          boxShadow: `0 0 6px ${s.color}60`,
                          transition: "width 0.6s ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick links */}
          <div
            className="rounded-xl border p-3 space-y-0.5"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-text3 px-2 mb-2">Quick Access</p>
            {[
              { icon: Clock, label: "HOS Monitor", href: "/hos" },
              { icon: TrendingUp, label: "IFTA Report", href: "/reports/ifta" },
              { icon: Timer, label: "Tracking History", href: "/tracking" },
              { icon: Wifi, label: "Live Map", href: "/map" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs text-text2 hover:text-text hover:bg-surface2 transition-all group"
              >
                <link.icon size={12} style={{ color: "var(--accent)" }} />
                {link.label}
                <ArrowUpRight size={10} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-text3" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
