"use client";
import { useState } from "react";
import {
  DollarSign, TrendingUp, Users,
  ArrowUpRight, RefreshCw, AlertTriangle,
  CheckCircle2, XCircle, Clock, Edit2, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PLAN_META as SUB_PLAN_META } from "@/lib/subscription";

interface SubRow {
  id: string;
  company: string;
  plan: "free" | "basic" | "pro";
  status: "active" | "past_due" | "canceled" | "trialing" | "suspended";
  mrr: number;
  startDate: string;
  nextBilling: string;
  vehicleLimit: number;
  driverLimit: number;
}

const INITIAL_SUBS: SubRow[] = [
  { id: "s1", company: "Acme Logistics", plan: "pro", status: "active", mrr: 99, startDate: "Sep 7, 2023", nextBilling: "May 7, 2024", vehicleLimit: 25, driverLimit: 25 },
  { id: "s2", company: "Lone Star Logistics", plan: "pro", status: "active", mrr: 99, startDate: "Nov 8, 2023", nextBilling: "May 8, 2024", vehicleLimit: 25, driverLimit: 25 },
  { id: "s3", company: "Midwest Freight Co.", plan: "pro", status: "active", mrr: 99, startDate: "Jan 12, 2024", nextBilling: "May 12, 2024", vehicleLimit: 25, driverLimit: 25 },
  { id: "s4", company: "Blue Ridge Freight", plan: "basic", status: "active", mrr: 49, startDate: "Oct 15, 2023", nextBilling: "May 15, 2024", vehicleLimit: 10, driverLimit: 10 },
  { id: "s5", company: "Pacific Trucking LLC", plan: "basic", status: "active", mrr: 49, startDate: "Feb 3, 2024", nextBilling: "May 3, 2024", vehicleLimit: 10, driverLimit: 10 },
  { id: "s6", company: "Coastal Express Inc.", plan: "basic", status: "active", mrr: 49, startDate: "Mar 21, 2024", nextBilling: "May 21, 2024", vehicleLimit: 10, driverLimit: 10 },
  { id: "s7", company: "Mountain West Transport", plan: "free", status: "past_due", mrr: 0, startDate: "Dec 2, 2023", nextBilling: "Overdue", vehicleLimit: 2, driverLimit: 2 },
  { id: "s8", company: "Great Lakes Haulers", plan: "free", status: "trialing", mrr: 0, startDate: "Apr 19, 2024", nextBilling: "May 3, 2024", vehicleLimit: 2, driverLimit: 2 },
  { id: "s9", company: "Delta Carriers", plan: "free", status: "trialing", mrr: 0, startDate: "Apr 22, 2024", nextBilling: "May 6, 2024", vehicleLimit: 2, driverLimit: 2 },
  { id: "s10", company: "Northern Plains Freight", plan: "basic", status: "canceled", mrr: 0, startDate: "Jun 2023", nextBilling: "—", vehicleLimit: 10, driverLimit: 10 },
];

const STATUS_META: Record<string, { bg: string; color: string; label: string; icon: React.ElementType }> = {
  active: { bg: "rgba(16,185,129,0.12)", color: "#10b981", label: "Active", icon: CheckCircle2 },
  trialing: { bg: "rgba(6,182,212,0.12)", color: "#06b6d4", label: "Trial", icon: Clock },
  past_due: { bg: "rgba(245,158,11,0.12)", color: "#f59e0b", label: "Past Due", icon: AlertTriangle },
  canceled: { bg: "rgba(239,68,68,0.12)", color: "#ef4444", label: "Canceled", icon: XCircle },
  suspended: { bg: "rgba(239,68,68,0.12)", color: "#ef4444", label: "Suspended", icon: XCircle },
};

const MRR_HISTORY = [12800, 13900, 14800, 15600, 16400, 17100, 18420];

function MRRSparkline({ color }: { color: string }) {
  const max = Math.max(...MRR_HISTORY);
  const min = Math.min(...MRR_HISTORY);
  const w = 120, h = 40;
  const pts = MRR_HISTORY.map((v, i) => {
    const x = (i / (MRR_HISTORY.length - 1)) * w;
    const y = h - ((v - min) / (max - min)) * (h * 0.8) - h * 0.1;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const areaD = `M ${pts[0]} L ${pts.join(" L ")} L ${w},${h} L 0,${h} Z`;
  const lineD = `M ${pts.join(" L ")}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id="mrr-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#mrr-grad)" />
      <path d={lineD} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AdminSubscriptionsPage() {
  const [subs, setSubs] = useState<SubRow[]>(INITIAL_SUBS);
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [editTarget, setEditTarget] = useState<SubRow | null>(null);
  const [editForm, setEditForm] = useState({ plan: "free" as SubRow["plan"], status: "active" as SubRow["status"], vehicleLimit: 2, driverLimit: 2 });

  const mrr = subs.filter((s) => s.status === "active").reduce((a, s) => a + s.mrr, 0);
  const arr = mrr * 12;
  const activeCount = subs.filter((s) => s.status === "active").length;
  const pastDueCount = subs.filter((s) => s.status === "past_due").length;

  const filtered = subs.filter((s) => {
    return (statusFilter === "all" || s.status === statusFilter) && (planFilter === "all" || s.plan === planFilter);
  });

  const planRevenue: Record<string, number> = { free: 0, basic: 0, pro: 0 };
  subs.filter((s) => s.status === "active").forEach((s) => { planRevenue[s.plan] += s.mrr; });

  function openEdit(sub: SubRow) {
    setEditForm({ plan: sub.plan, status: sub.status, vehicleLimit: sub.vehicleLimit, driverLimit: sub.driverLimit });
    setEditTarget(sub);
  }

  function applyEdit() {
    if (!editTarget) return;
    const planMeta = SUB_PLAN_META[editForm.plan];
    setSubs((prev) =>
      prev.map((s) =>
        s.id === editTarget.id
          ? {
              ...s,
              plan: editForm.plan,
              status: editForm.status,
              vehicleLimit: editForm.vehicleLimit,
              driverLimit: editForm.driverLimit,
              mrr: editForm.status === "active" ? planMeta.price : 0,
            }
          : s
      )
    );
    setEditTarget(null);
  }

  function syncLimitsFromPlan(plan: SubRow["plan"]) {
    const meta = SUB_PLAN_META[plan];
    setEditForm((f) => ({ ...f, plan, vehicleLimit: meta.vehicle_limit, driverLimit: meta.driver_limit }));
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "MRR", value: `$${mrr.toLocaleString()}`, sub: "Monthly recurring", icon: DollarSign, color: "#10b981", trend: "+14.3%" },
          { label: "ARR", value: `$${(arr / 1000).toFixed(0)}k`, sub: "Annual run rate", icon: TrendingUp, color: "#7c3aed", trend: "+14.3%" },
          { label: "Active Subs", value: activeCount, sub: "Paying companies", icon: Users, color: "#2563eb", trend: `+${activeCount}` },
          { label: "Past Due", value: pastDueCount, sub: "Needs attention", icon: AlertTriangle, color: "#f59e0b", trend: pastDueCount > 0 ? `${pastDueCount} overdue` : "None" },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border p-4 space-y-3" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-text3">{k.label}</p>
                <p className="font-display font-bold text-2xl text-text mt-1 leading-none">{k.value}</p>
                <p className="text-[11px] text-text3 mt-1">{k.sub}</p>
              </div>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${k.color}18` }}>
                <k.icon size={15} style={{ color: k.color }} />
              </div>
            </div>
            <span className="flex items-center gap-1 text-[10px] font-mono font-semibold" style={{ color: "#10b981" }}>
              <ArrowUpRight size={10} /> {k.trend} this month
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Main content */}
        <div className="col-span-8 space-y-4">
          {/* MRR trend */}
          <div className="rounded-xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-text">MRR Growth</h3>
                <p className="text-xs text-text3 mt-0.5">Last 7 months</p>
              </div>
              <div className="text-right">
                <p className="font-display font-bold text-xl text-text">${mrr.toLocaleString()}</p>
                <p className="text-xs text-text3">current MRR</p>
              </div>
            </div>
            <MRRSparkline color="#10b981" />
            <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs font-mono text-text3" style={{ borderColor: "var(--border)" }}>
              {["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr"].map((m) => <span key={m}>{m}</span>)}
            </div>
          </div>

          {/* Subscriptions table */}
          <div>
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              {["all", "active", "trialing", "past_due", "suspended", "canceled"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn("px-3 h-7 rounded-lg text-[11px] font-mono font-medium border transition-all", statusFilter === s ? "text-text" : "text-text3")}
                  style={{ borderColor: statusFilter === s ? "var(--border2)" : "var(--border)", background: statusFilter === s ? "var(--surface2)" : "transparent" }}
                >
                  {s === "past_due" ? "Past Due" : s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
              <div className="ml-auto flex gap-1">
                {(["all", "free", "basic", "pro"] as const).map((p) => {
                  const meta = p !== "all" ? SUB_PLAN_META[p] : null;
                  return (
                    <button
                      key={p}
                      onClick={() => setPlanFilter(p)}
                      className="px-2.5 h-7 rounded-lg text-[11px] font-mono border transition-all"
                      style={{
                        borderColor: planFilter === p ? (meta?.color ?? "var(--border2)") : "var(--border)",
                        background: planFilter === p ? (meta ? `${meta.color}15` : "var(--surface2)") : "transparent",
                        color: planFilter === p ? (meta?.color ?? "var(--text)") : "var(--text3)",
                      }}
                    >
                      {p === "all" ? "All Plans" : SUB_PLAN_META[p].label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                    {["Company", "Plan", "Status", "MRR", "Limits", "Next Billing", ""].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 text-[10px] font-mono font-semibold uppercase tracking-widest text-text3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-10 text-text3 text-sm">No subscriptions match the filters.</td></tr>
                  ) : filtered.map((sub) => {
                    const planMeta = SUB_PLAN_META[sub.plan];
                    const st = STATUS_META[sub.status] ?? STATUS_META.active;
                    const StIcon = st.icon;
                    return (
                      <tr key={sub.id} className="border-b last:border-0 hover:bg-surface2 transition-colors" style={{ borderColor: "var(--border)" }}>
                        <td className="px-4 py-3 font-medium text-text text-[13px]">{sub.company}</td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded" style={{ background: planMeta.bg, color: planMeta.color }}>
                            {planMeta.label} — ${planMeta.price}/mo
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1 text-[11px] font-mono font-semibold w-fit px-2 py-0.5 rounded" style={{ background: st.bg, color: st.color }}>
                            <StIcon size={9} /> {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[13px]" style={{ color: sub.mrr > 0 ? "#10b981" : "var(--text3)" }}>
                          {sub.mrr > 0 ? `$${sub.mrr}` : "—"}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-text3">
                          {sub.vehicleLimit}v · {sub.driverLimit}d
                        </td>
                        <td className="px-4 py-3 text-[12px]" style={{ color: sub.nextBilling === "Overdue" ? "#ef4444" : "var(--text3)" }}>
                          {sub.nextBilling}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => openEdit(sub)}
                            className="p-1.5 rounded-lg text-text3 hover:text-accent hover:bg-accent/10 transition-colors"
                          >
                            <Edit2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Revenue by plan sidebar */}
        <div className="col-span-4 space-y-4">
          <div className="rounded-xl border p-4 space-y-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <h3 className="text-sm font-semibold text-text">Revenue by Plan</h3>
            {(["pro", "basic", "free"] as const).map((plan) => {
              const meta = SUB_PLAN_META[plan];
              const rev = planRevenue[plan] ?? 0;
              const pct = mrr > 0 ? Math.round((rev / mrr) * 100) : 0;
              return (
                <div key={plan} className="space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="font-mono font-semibold" style={{ color: meta.color }}>{meta.label}</span>
                    <span className="text-text2">${rev}/mo ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface3)" }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: meta.color, boxShadow: `0 0 8px ${meta.color}60`, transition: "width 0.7s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Plan info cards */}
          {(["pro", "basic", "free"] as const).map((plan) => {
            const meta = SUB_PLAN_META[plan];
            return (
              <div key={plan} className="rounded-xl border p-4 space-y-2" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded" style={{ background: meta.bg, color: meta.color }}>{meta.label}</span>
                  <span className="font-display font-bold text-lg text-text">{meta.price === 0 ? "Free" : `$${meta.price}`}<span className="text-xs text-text3 font-normal">/mo</span></span>
                </div>
                <div className="flex gap-3 text-[11px] text-text3 font-mono">
                  <span>{meta.vehicle_limit} vehicles</span>
                  <span>·</span>
                  <span>{meta.driver_limit} drivers</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Subscription Modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditTarget(null)} />
          <div className="relative w-full max-w-sm rounded-2xl border shadow-2xl animate-fade-in" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-display font-bold text-base text-text">Edit Subscription</h3>
              <button onClick={() => setEditTarget(null)} className="text-text3 hover:text-text"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-text3">Editing <strong className="text-text">{editTarget.company}</strong></p>

              {/* Plan selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text3">Plan</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["free", "basic", "pro"] as const).map((p) => {
                    const meta = SUB_PLAN_META[p];
                    const sel = editForm.plan === p;
                    return (
                      <button
                        key={p}
                        onClick={() => syncLimitsFromPlan(p)}
                        className="py-2 rounded-xl border text-xs font-mono font-semibold transition-all"
                        style={{ borderColor: sel ? meta.color : "var(--border)", background: sel ? meta.bg : "var(--surface2)", color: sel ? meta.color : "var(--text3)" }}
                      >
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text3">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value as SubRow["status"] }))}
                  className="w-full h-8 px-3 rounded-lg border text-sm text-text bg-surface3 focus:outline-none focus:border-accent"
                  style={{ borderColor: "var(--border)" }}
                >
                  <option value="active">Active</option>
                  <option value="trialing">Trial</option>
                  <option value="past_due">Past Due</option>
                  <option value="suspended">Suspended</option>
                  <option value="canceled">Canceled</option>
                </select>
              </div>

              {/* Custom limits */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text3">Vehicle Limit</label>
                  <input
                    type="number"
                    min={0}
                    value={editForm.vehicleLimit}
                    onChange={(e) => setEditForm((f) => ({ ...f, vehicleLimit: parseInt(e.target.value) || 0 }))}
                    className="w-full h-8 px-3 rounded-lg border text-sm text-text bg-surface3 focus:outline-none focus:border-accent"
                    style={{ borderColor: "var(--border)" }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text3">Driver Limit</label>
                  <input
                    type="number"
                    min={0}
                    value={editForm.driverLimit}
                    onChange={(e) => setEditForm((f) => ({ ...f, driverLimit: parseInt(e.target.value) || 0 }))}
                    className="w-full h-8 px-3 rounded-lg border text-sm text-text bg-surface3 focus:outline-none focus:border-accent"
                    style={{ borderColor: "var(--border)" }}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t" style={{ borderColor: "var(--border)" }}>
              <button onClick={() => setEditTarget(null)} className="px-4 h-8 rounded-lg border text-sm text-text2 hover:text-text transition-all" style={{ borderColor: "var(--border)" }}>Cancel</button>
              <button onClick={applyEdit} className="px-4 h-8 rounded-lg text-sm text-white hover:opacity-90 transition-all" style={{ background: "var(--accent)" }}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
