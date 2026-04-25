"use client";
import { useState } from "react";
import {
  TrendingUp, TrendingDown, Users, DollarSign,
  ArrowUpRight, ArrowDownRight, BarChart3, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MONTHS = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr"];

const MRR_DATA = [12800, 13900, 14800, 15600, 16400, 17100, 18420];
const USER_GROWTH = [820, 910, 980, 1060, 1140, 1200, 1284];
const NEW_SIGNUPS = [18, 24, 21, 31, 28, 22, 35];
const CHURN = [3, 4, 2, 5, 3, 2, 4];

function LineChart({
  data,
  color,
  height = 120,
  label,
  formatY = (v: number) => String(v),
}: {
  data: number[];
  color: string;
  height?: number;
  label: string;
  formatY?: (v: number) => string;
}) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 100, h = 100;

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h * 0.8) - h * 0.1;
    return { x, y, v };
  });

  const lineD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaD = `${lineD} L ${w},${h} L 0,${h} Z`;
  const gradId = `chart-${color.replace("#", "").replace("(", "").replace(")", "")}`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text3">{label}</span>
        <span className="text-xs font-mono font-semibold" style={{ color }}>
          {formatY(data[data.length - 1])}
        </span>
      </div>
      <div style={{ height }}>
        <svg width="100%" height={height} viewBox={`0 0 100 ${h}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaD} fill={`url(#${gradId})`} />
          <path d={lineD} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          {pts.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={color} vectorEffect="non-scaling-stroke" />
          ))}
        </svg>
      </div>
      <div className="flex justify-between text-[10px] font-mono text-text3">
        {MONTHS.map((m) => <span key={m}>{m}</span>)}
      </div>
    </div>
  );
}

function BarChart({ data, color, label, formatY = String }: { data: number[]; color: string; label: string; formatY?: (v: number) => string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text3">{label}</span>
        <span className="text-xs font-mono font-semibold" style={{ color }}>{formatY(data[data.length - 1])}</span>
      </div>
      <div className="flex items-end gap-1 h-24">
        {data.map((v, i) => (
          <div key={i} className="flex-1 rounded-t-sm transition-all" style={{
            height: `${Math.max(4, (v / max) * 100)}%`,
            background: i === data.length - 1 ? color : `${color}60`,
          }} />
        ))}
      </div>
      <div className="flex justify-between text-[10px] font-mono text-text3">
        {MONTHS.map((m) => <span key={m}>{m}</span>)}
      </div>
    </div>
  );
}

const FEATURE_USAGE = [
  { label: "GPS Tracking", pct: 98, color: "#2563eb" },
  { label: "HOS Logs", pct: 94, color: "#10b981" },
  { label: "IFTA Reports", pct: 72, color: "#7c3aed" },
  { label: "Live Sharing", pct: 61, color: "#06b6d4" },
  { label: "DVIR", pct: 55, color: "#f59e0b" },
  { label: "Weather Overlay", pct: 48, color: "#f97316" },
  { label: "Video Library", pct: 39, color: "#a78bfa" },
  { label: "Proximity Search", pct: 28, color: "#94a3b8" },
  { label: "API Access", pct: 22, color: "#64748b" },
];

const COHORT_RETENTION = [
  { month: "Oct 2023", m0: 100, m1: 92, m2: 88, m3: 84 },
  { month: "Nov 2023", m0: 100, m1: 94, m2: 89, m3: 86 },
  { month: "Dec 2023", m0: 100, m1: 91, m2: 87, m3: null },
  { month: "Jan 2024", m0: 100, m1: 95, m2: null, m3: null },
  { month: "Feb 2024", m0: 100, m1: 93, m2: null, m3: null },
  { month: "Mar 2024", m0: 100, m1: null, m2: null, m3: null },
];

function retentionColor(v: number | null) {
  if (v === null) return { bg: "var(--surface3)", color: "var(--text3)" };
  if (v >= 90) return { bg: "rgba(16,185,129,0.2)", color: "#10b981" };
  if (v >= 80) return { bg: "rgba(37,99,235,0.2)", color: "#60a5fa" };
  if (v >= 70) return { bg: "rgba(245,158,11,0.2)", color: "#f59e0b" };
  return { bg: "rgba(239,68,68,0.2)", color: "#ef4444" };
}

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState("7m");

  const mrr = MRR_DATA[MRR_DATA.length - 1];
  const mrrGrowth = ((mrr - MRR_DATA[MRR_DATA.length - 2]) / MRR_DATA[MRR_DATA.length - 2] * 100).toFixed(1);
  const users = USER_GROWTH[USER_GROWTH.length - 1];
  const churnRate = ((CHURN[CHURN.length - 1] / NEW_SIGNUPS[NEW_SIGNUPS.length - 1]) * 100).toFixed(1);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-text3">Revenue, growth, and feature adoption metrics</p>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 p-1 rounded-lg border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            {["3m", "7m", "12m"].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className="px-3 h-7 rounded-md text-xs font-mono font-medium transition-all"
                style={range === r ? { background: "var(--surface2)", color: "var(--text)" } : { color: "var(--text3)" }}
              >
                {r}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 px-3 h-8 rounded-lg border text-xs text-text2 hover:text-text transition-all" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
            <RefreshCw size={11} />
            Refresh
          </button>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Current MRR", value: `$${mrr.toLocaleString()}`, trend: `+${mrrGrowth}%`, up: true, color: "#10b981", icon: DollarSign },
          { label: "Total Users", value: users.toLocaleString(), trend: "+6.8%", up: true, color: "#2563eb", icon: Users },
          { label: "Churn Rate", value: `${churnRate}%`, trend: "-0.5%", up: false, color: "#f59e0b", icon: TrendingDown },
          { label: "Avg Revenue/User", value: `$${(mrr / users * 1000).toFixed(2)}`, trend: "+8.1%", up: true, color: "#7c3aed", icon: BarChart3 },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-start justify-between mb-2">
              <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-text3">{k.label}</p>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${k.color}15` }}>
                <k.icon size={13} style={{ color: k.color }} />
              </div>
            </div>
            <p className="font-display font-bold text-2xl text-text leading-none">{k.value}</p>
            <span
              className="flex items-center gap-1 text-[10px] font-mono font-semibold mt-2"
              style={{ color: k.up ? "#10b981" : "#f59e0b" }}
            >
              {k.up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
              {k.trend} vs last period
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Revenue & growth charts */}
        <div className="col-span-8 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <h3 className="text-sm font-semibold text-text mb-4">MRR Growth</h3>
              <LineChart
                data={MRR_DATA}
                color="#10b981"
                label="Monthly Recurring Revenue"
                formatY={(v) => `$${(v / 1000).toFixed(1)}k`}
              />
            </div>
            <div className="rounded-xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <h3 className="text-sm font-semibold text-text mb-4">Active Users</h3>
              <LineChart
                data={USER_GROWTH}
                color="#2563eb"
                label="Total active users"
                formatY={(v) => v.toLocaleString()}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <h3 className="text-sm font-semibold text-text mb-4">New Signups</h3>
              <BarChart data={NEW_SIGNUPS} color="#7c3aed" label="Companies joined" />
            </div>
            <div className="rounded-xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <h3 className="text-sm font-semibold text-text mb-4">Churn Events</h3>
              <BarChart data={CHURN} color="#ef4444" label="Cancellations per month" />
            </div>
          </div>

          {/* Cohort retention */}
          <div className="rounded-xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <h3 className="text-sm font-semibold text-text mb-4">Cohort Retention</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-left font-mono text-text3 pb-3 pr-4">Cohort</th>
                    {["Month 0", "Month 1", "Month 2", "Month 3"].map((h) => (
                      <th key={h} className="text-center font-mono text-text3 pb-3 px-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="space-y-1">
                  {COHORT_RETENTION.map((row) => (
                    <tr key={row.month}>
                      <td className="font-mono text-text3 pr-4 py-1.5">{row.month}</td>
                      {[row.m0, row.m1, row.m2, row.m3].map((v, i) => {
                        const c = retentionColor(v);
                        return (
                          <td key={i} className="px-2 py-1.5 text-center">
                            {v !== null ? (
                              <span className="px-2 py-1 rounded text-[11px] font-mono font-semibold" style={{ background: c.bg, color: c.color }}>
                                {v}%
                              </span>
                            ) : (
                              <span className="text-text3">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Feature adoption */}
        <div className="col-span-4 space-y-4">
          <div className="rounded-xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <h3 className="text-sm font-semibold text-text mb-4">Feature Adoption</h3>
            <p className="text-[11px] text-text3 mb-4">% of active companies using each feature</p>
            <div className="space-y-3">
              {FEATURE_USAGE.map((f) => (
                <div key={f.label}>
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span className="text-text2">{f.label}</span>
                    <span className="font-mono font-semibold" style={{ color: f.color }}>{f.pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface3)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${f.pct}%`, background: f.color, boxShadow: `0 0 6px ${f.color}50`, transition: "width 0.7s ease" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top companies by revenue */}
          <div className="rounded-xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <h3 className="text-sm font-semibold text-text mb-3">Top Revenue Companies</h3>
            <div className="space-y-2">
              {[
                { name: "Acme Logistics", mrr: 199, drivers: 51 },
                { name: "Lone Star Logistics", mrr: 199, drivers: 38 },
                { name: "Midwest Freight Co.", mrr: 199, drivers: 24 },
                { name: "Blue Ridge Freight", mrr: 99, drivers: 14 },
                { name: "Pacific Trucking LLC", mrr: 99, drivers: 11 },
              ].map((co, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span className="text-[10px] font-mono text-text3 w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-text truncate">{co.name}</p>
                    <p className="text-[10px] text-text3">{co.drivers} drivers</p>
                  </div>
                  <span className="text-[12px] font-mono font-semibold" style={{ color: "#10b981" }}>${co.mrr}/mo</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
