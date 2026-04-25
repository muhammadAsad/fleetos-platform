"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Building2, Users, DollarSign, TrendingUp, ArrowUpRight,
  ArrowDownRight, Activity, AlertTriangle, CheckCircle2,
  Clock, CreditCard, HeadphonesIcon, Zap,
} from "lucide-react";

const MOCK_COMPANIES = [
  { name: "Midwest Freight Co.", plan: "Fleet", drivers: 24, status: "active", joined: "Jan 2024" },
  { name: "Pacific Trucking LLC", plan: "Pro", drivers: 11, status: "active", joined: "Feb 2024" },
  { name: "Lone Star Logistics", plan: "Fleet", drivers: 38, status: "active", joined: "Nov 2023" },
  { name: "Great Lakes Haulers", plan: "Starter", drivers: 4, status: "trial", joined: "Apr 2024" },
  { name: "Coastal Express Inc.", plan: "Pro", drivers: 9, status: "active", joined: "Mar 2024" },
  { name: "Mountain West Transport", plan: "Starter", drivers: 3, status: "past_due", joined: "Dec 2023" },
];

const PLAN_COLORS: Record<string, { bg: string; color: string }> = {
  Fleet: { bg: "rgba(124,58,237,0.12)", color: "#a78bfa" },
  Pro: { bg: "rgba(37,99,235,0.12)", color: "#60a5fa" },
  Starter: { bg: "rgba(71,85,105,0.12)", color: "#94a3b8" },
};

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  active: { bg: "rgba(16,185,129,0.12)", color: "#10b981", label: "Active" },
  trial: { bg: "rgba(6,182,212,0.12)", color: "#06b6d4", label: "Trial" },
  past_due: { bg: "rgba(245,158,11,0.12)", color: "#f59e0b", label: "Past Due" },
  canceled: { bg: "rgba(239,68,68,0.12)", color: "#ef4444", label: "Canceled" },
};

function MiniBar({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-0.5 h-8">
      {values.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm transition-all"
          style={{
            height: `${Math.max(10, (v / max) * 100)}%`,
            background: i === values.length - 1 ? color : `${color}50`,
          }}
        />
      ))}
    </div>
  );
}

export default function AdminOverviewPage() {
  const [_tab] = useState("7d");

  const kpiCards = [
    {
      label: "Total Companies",
      value: "142",
      sub: "+12 this month",
      trend: "+9.2%",
      up: true,
      icon: Building2,
      color: "#7c3aed",
      bars: [88, 95, 102, 110, 118, 128, 142],
    },
    {
      label: "Monthly Recurring Revenue",
      value: "$18,420",
      sub: "After churn & upgrades",
      trend: "+14.3%",
      up: true,
      icon: DollarSign,
      color: "#10b981",
      bars: [12800, 13900, 14800, 15600, 16400, 17100, 18420],
    },
    {
      label: "Active Users",
      value: "1,284",
      sub: "across all companies",
      trend: "+6.8%",
      up: true,
      icon: Users,
      color: "#2563eb",
      bars: [980, 1040, 1100, 1155, 1200, 1240, 1284],
    },
    {
      label: "Open Support Tickets",
      value: "23",
      sub: "4 critical",
      trend: "-8%",
      up: false,
      icon: HeadphonesIcon,
      color: "#f59e0b",
      bars: [41, 38, 33, 29, 26, 25, 23],
    },
  ];

  const planCounts = { Fleet: 38, Pro: 61, Starter: 43 };
  const total = Object.values(planCounts).reduce((a, b) => a + b, 0);

  const systemHealth = [
    { label: "API Latency", value: "42ms", status: "good" },
    { label: "DB Connections", value: "18 / 100", status: "good" },
    { label: "Uptime (30d)", value: "99.97%", status: "good" },
    { label: "Error Rate", value: "0.03%", status: "good" },
  ];

  const recentActivity = [
    { type: "signup", text: "New company signed up: Blue Ridge Freight", time: "2m ago", icon: Building2, color: "#10b981" },
    { type: "upgrade", text: "Acme Logistics upgraded to Fleet plan", time: "18m ago", icon: TrendingUp, color: "#7c3aed" },
    { type: "ticket", text: "Support ticket #1042 opened — ELD sync issue", time: "34m ago", icon: HeadphonesIcon, color: "#f59e0b" },
    { type: "payment", text: "Payment failed: Mountain West Transport", time: "1h ago", icon: CreditCard, color: "#ef4444" },
    { type: "signup", text: "New company signed up: Delta Carriers", time: "2h ago", icon: Building2, color: "#10b981" },
    { type: "ticket", text: "Support ticket #1041 resolved", time: "3h ago", icon: CheckCircle2, color: "#10b981" },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border p-4 space-y-3"
            style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-text3">{card.label}</p>
                <p className="font-display font-bold text-2xl text-text mt-1 leading-none">{card.value}</p>
                <p className="text-[11px] text-text3 mt-1">{card.sub}</p>
              </div>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${card.color}18` }}>
                <card.icon size={15} style={{ color: card.color }} />
              </div>
            </div>
            <div className="flex items-end justify-between gap-3">
              <span
                className="flex items-center gap-1 text-[10px] font-mono font-semibold"
                style={{ color: card.up ? "#10b981" : "#f59e0b" }}
              >
                {card.up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                {card.trend} vs last month
              </span>
              <MiniBar values={card.bars} color={card.color} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Recent Companies */}
        <div className="col-span-8 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text">Recent Companies</h3>
            <Link href="/admin/users" className="text-xs hover:underline flex items-center gap-1" style={{ color: "var(--accent)" }}>
              View all <ArrowUpRight size={11} />
            </Link>
          </div>
          <div className="rounded-xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                  {["Company", "Plan", "Drivers", "Status", "Joined"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-[10px] font-mono font-semibold uppercase tracking-widest text-text3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_COMPANIES.map((co, i) => {
                  const plan = PLAN_COLORS[co.plan];
                  const st = STATUS_COLORS[co.status];
                  return (
                    <tr
                      key={i}
                      className="border-b last:border-0 hover:bg-surface2 transition-colors cursor-pointer"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <td className="px-4 py-3 font-medium text-text">{co.name}</td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded" style={{ background: plan.bg, color: plan.color }}>
                          {co.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-text2">{co.drivers}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-[11px] font-mono font-semibold w-fit px-2 py-0.5 rounded" style={{ background: st.bg, color: st.color }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.color }} />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text3 text-[12px]">{co.joined}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div className="col-span-4 space-y-4">
          {/* Plan distribution */}
          <div className="rounded-xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <h3 className="text-sm font-semibold text-text mb-3">Plan Distribution</h3>
            <div className="space-y-2.5">
              {Object.entries(planCounts).map(([plan, count]) => {
                const pct = Math.round((count / total) * 100);
                const c = PLAN_COLORS[plan].color;
                return (
                  <div key={plan}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-text2">{plan}</span>
                      <span className="font-mono font-semibold" style={{ color: c }}>{count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface3)" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: c, transition: "width 0.6s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* System health */}
          <div className="rounded-xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-text">System Health</h3>
              <Link href="/admin/monitoring" className="text-[11px] hover:underline" style={{ color: "var(--accent)" }}>Details</Link>
            </div>
            <div className="space-y-2">
              {systemHealth.map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-[11px] text-text3">{item.label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono text-text2">{item.value}</span>
                    <CheckCircle2 size={11} style={{ color: "#10b981" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent activity */}
          <div className="rounded-xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
              <h3 className="text-sm font-semibold text-text">Activity Feed</h3>
            </div>
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {recentActivity.map((ev, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-2.5 hover:bg-surface2 transition-colors">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${ev.color}15` }}>
                    <ev.icon size={12} style={{ color: ev.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-text leading-snug">{ev.text}</p>
                    <p className="text-[10px] font-mono text-text3 mt-0.5">{ev.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Zap, label: "Trigger Simulator", desc: "Start a demo fleet for testing", color: "#7c3aed", href: "/api/simulator" },
          { icon: Activity, label: "View Monitoring", desc: "Check real-time system metrics", color: "#10b981", href: "/admin/monitoring" },
          { icon: Clock, label: "Audit Logs", desc: "Review admin action history", color: "#f59e0b", href: "/admin/settings" },
        ].map((a) => (
          <Link
            key={a.label}
            href={a.href}
            className="flex items-center gap-3 p-4 rounded-xl border transition-all hover:border-accent/30 hover:-translate-y-0.5"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${a.color}15` }}>
              <a.icon size={18} style={{ color: a.color }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-text">{a.label}</p>
              <p className="text-xs text-text3 mt-0.5">{a.desc}</p>
            </div>
            <ArrowUpRight size={14} className="ml-auto text-text3" />
          </Link>
        ))}
      </div>
    </div>
  );
}
