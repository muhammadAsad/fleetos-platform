"use client";
import { useState } from "react";
import {
  Search, Filter, MoreHorizontal, UserX, UserCheck, Eye,
  ChevronLeft, ChevronRight, Building2,
  Download, RefreshCw, CheckCircle2, XCircle,
  AlertTriangle, Trash2, CreditCard, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PLAN_META as SUB_PLAN_META } from "@/lib/subscription";

interface Company {
  id: string;
  name: string;
  adminName: string;
  email: string;
  plan: "free" | "basic" | "pro";
  status: "active" | "trial" | "past_due" | "canceled" | "suspended";
  drivers: number;
  vehicles: number;
  lastActive: string;
  joined: string;
  mrr: number;
  city: string;
}

const INITIAL_COMPANIES: Company[] = [
  { id: "c1", name: "Midwest Freight Co.", adminName: "James Miller", email: "james@midwestfreight.com", plan: "pro", status: "active", drivers: 24, vehicles: 21, lastActive: "2m ago", joined: "Jan 12, 2024", mrr: 99, city: "Chicago, IL" },
  { id: "c2", name: "Pacific Trucking LLC", adminName: "Sarah Chen", email: "sarah@pacifictrucking.com", plan: "basic", status: "active", drivers: 11, vehicles: 10, lastActive: "14m ago", joined: "Feb 3, 2024", mrr: 49, city: "Los Angeles, CA" },
  { id: "c3", name: "Lone Star Logistics", adminName: "Robert Davis", email: "rdavis@lonestar.com", plan: "pro", status: "active", drivers: 23, vehicles: 18, lastActive: "1h ago", joined: "Nov 8, 2023", mrr: 99, city: "Dallas, TX" },
  { id: "c4", name: "Great Lakes Haulers", adminName: "Emily Novak", email: "emily@greatlakes.com", plan: "free", status: "trial", drivers: 1, vehicles: 1, lastActive: "3h ago", joined: "Apr 19, 2024", mrr: 0, city: "Detroit, MI" },
  { id: "c5", name: "Coastal Express Inc.", adminName: "Michael Torres", email: "m.torres@coastal.com", plan: "basic", status: "active", drivers: 9, vehicles: 8, lastActive: "5h ago", joined: "Mar 21, 2024", mrr: 49, city: "Miami, FL" },
  { id: "c6", name: "Mountain West Transport", adminName: "Linda Park", email: "linda@mountainwest.com", plan: "free", status: "past_due", drivers: 2, vehicles: 2, lastActive: "2d ago", joined: "Dec 2, 2023", mrr: 0, city: "Denver, CO" },
  { id: "c7", name: "Blue Ridge Freight", adminName: "Kevin Johnson", email: "kevin@blueridge.com", plan: "basic", status: "active", drivers: 8, vehicles: 7, lastActive: "30m ago", joined: "Oct 15, 2023", mrr: 49, city: "Charlotte, NC" },
  { id: "c8", name: "Delta Carriers", adminName: "Amanda Ross", email: "a.ross@deltacarriers.com", plan: "free", status: "trial", drivers: 1, vehicles: 1, lastActive: "1d ago", joined: "Apr 22, 2024", mrr: 0, city: "Atlanta, GA" },
  { id: "c9", name: "Acme Logistics", adminName: "Daniel Brown", email: "dbrown@acmelogistics.com", plan: "pro", status: "active", drivers: 22, vehicles: 20, lastActive: "8m ago", joined: "Sep 7, 2023", mrr: 99, city: "Phoenix, AZ" },
  { id: "c10", name: "Northern Plains Freight", adminName: "Susan White", email: "swhite@norplains.com", plan: "basic", status: "canceled", drivers: 0, vehicles: 0, lastActive: "14d ago", joined: "Jun 2023", mrr: 0, city: "Minneapolis, MN" },
];

const STATUS_META: Record<string, { bg: string; color: string; label: string; icon: React.ElementType }> = {
  active: { bg: "rgba(16,185,129,0.12)", color: "#10b981", label: "Active", icon: CheckCircle2 },
  trial: { bg: "rgba(6,182,212,0.12)", color: "#06b6d4", label: "Trial", icon: CheckCircle2 },
  past_due: { bg: "rgba(245,158,11,0.12)", color: "#f59e0b", label: "Past Due", icon: AlertTriangle },
  canceled: { bg: "rgba(239,68,68,0.12)", color: "#ef4444", label: "Canceled", icon: XCircle },
  suspended: { bg: "rgba(239,68,68,0.12)", color: "#ef4444", label: "Suspended", icon: XCircle },
};

const PAGE_SIZE = 8;

export default function AdminUsersPage() {
  const [companies, setCompanies] = useState<Company[]>(INITIAL_COMPANIES);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  // Modals
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);
  const [assignTarget, setAssignTarget] = useState<Company | null>(null);
  const [assignPlan, setAssignPlan] = useState<"free" | "basic" | "pro">("free");
  const [viewTarget, setViewTarget] = useState<Company | null>(null);

  const filtered = companies.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = c.name.toLowerCase().includes(q) || c.adminName.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
    const matchPlan = planFilter === "all" || c.plan === planFilter;
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchPlan && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSuspend(id: string) {
    setCompanies((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: c.status === "suspended" ? "active" : "suspended" }
          : c
      )
    );
    setMenuOpen(null);
  }

  function deleteCompany(id: string) {
    setCompanies((prev) => prev.filter((c) => c.id !== id));
    setDeleteTarget(null);
  }

  function assignPlanToCompany() {
    if (!assignTarget) return;
    const meta = SUB_PLAN_META[assignPlan];
    setCompanies((prev) =>
      prev.map((c) =>
        c.id === assignTarget.id
          ? { ...c, plan: assignPlan, mrr: meta.price, status: assignPlan === "free" ? c.status : "active" }
          : c
      )
    );
    setAssignTarget(null);
  }

  const summaryStats = [
    { label: "Total", value: companies.length, color: "var(--text)" },
    { label: "Active", value: companies.filter((c) => c.status === "active").length, color: "#10b981" },
    { label: "Trial", value: companies.filter((c) => c.status === "trial").length, color: "#06b6d4" },
    { label: "Past Due", value: companies.filter((c) => c.status === "past_due").length, color: "#f59e0b" },
    { label: "Suspended", value: companies.filter((c) => c.status === "suspended").length, color: "#ef4444" },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Summary strip */}
      <div className="flex items-center gap-4 p-4 rounded-xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <Building2 size={16} className="text-text3 flex-shrink-0" />
        {summaryStats.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-text3 uppercase">{s.label}</span>
            <span className="font-display font-bold text-lg" style={{ color: s.color }}>{s.value}</span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 h-8 rounded-lg border text-xs text-text2 hover:text-text transition-all" style={{ borderColor: "var(--border)", background: "var(--surface2)" }}>
            <Download size={12} /> Export CSV
          </button>
          <button className="flex items-center gap-1.5 px-3 h-8 rounded-lg border text-xs text-text2 hover:text-text transition-all" style={{ borderColor: "var(--border)", background: "var(--surface2)" }}>
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 h-9 rounded-lg border text-sm text-text2 flex-1 max-w-xs" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <Search size={13} style={{ color: "var(--accent)", flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search companies, admins..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="bg-transparent outline-none text-sm text-text placeholder:text-text3 w-full"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs text-text3"><Filter size={12} /> Plan:</div>
        {["all", "free", "basic", "pro"].map((p) => (
          <button
            key={p}
            onClick={() => { setPlanFilter(p); setPage(1); }}
            className={cn("px-3 h-8 rounded-lg text-xs font-mono font-medium border transition-all", planFilter === p ? "text-text" : "text-text3 hover:text-text2")}
            style={{ borderColor: planFilter === p ? "var(--border2)" : "var(--border)", background: planFilter === p ? "var(--surface2)" : "transparent" }}
          >
            {p === "all" ? "All" : p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}

        <div className="h-4 w-px" style={{ background: "var(--border)" }} />
        <div className="text-xs text-text3">Status:</div>
        {["all", "active", "trial", "past_due", "suspended", "canceled"].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={cn("px-3 h-8 rounded-lg text-xs font-mono font-medium border transition-all", statusFilter === s ? "text-text" : "text-text3 hover:text-text2")}
            style={{ borderColor: statusFilter === s ? "var(--border2)" : "var(--border)", background: statusFilter === s ? "var(--surface2)" : "transparent" }}
          >
            {s === "past_due" ? "Past Due" : s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: "var(--border)" }}>
              {["Company", "Admin", "Plan", "Status", "Drivers", "MRR", "Last Active", "Actions"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-[10px] font-mono font-semibold uppercase tracking-widest text-text3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-text3 text-sm">No companies match the current filters.</td>
              </tr>
            ) : paged.map((co) => {
              const planMeta = SUB_PLAN_META[co.plan];
              const st = STATUS_META[co.status] ?? STATUS_META.active;
              const StIcon = st.icon;
              return (
                <tr key={co.id} className="border-b last:border-0 hover:bg-surface2 transition-colors" style={{ borderColor: "var(--border)" }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white" style={{ background: "rgba(124,58,237,0.25)" }}>
                        {co.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-text text-[13px]">{co.name}</p>
                        <p className="text-[11px] text-text3">{co.city}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-[13px] text-text">{co.adminName}</p>
                    <p className="text-[11px] text-text3">{co.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded" style={{ background: planMeta.bg, color: planMeta.color }}>
                      {planMeta.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-[11px] font-mono font-semibold w-fit px-2 py-0.5 rounded" style={{ background: st.bg, color: st.color }}>
                      <StIcon size={9} />
                      {st.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-text2 text-[13px]">{co.drivers}</td>
                  <td className="px-4 py-3 font-mono text-[13px]" style={{ color: co.mrr > 0 ? "#10b981" : "var(--text3)" }}>
                    {co.mrr > 0 ? `$${co.mrr}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-text3">{co.lastActive}</td>
                  <td className="px-4 py-3">
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpen(menuOpen === co.id ? null : co.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-text3 hover:text-text hover:bg-surface3 transition-all"
                      >
                        <MoreHorizontal size={14} />
                      </button>
                      {menuOpen === co.id && (
                        <div
                          className="absolute right-0 top-8 w-48 rounded-xl border z-50 overflow-hidden"
                          style={{ background: "var(--surface2)", borderColor: "var(--border2)", boxShadow: "0 20px 40px rgba(0,0,0,0.6)" }}
                        >
                          <button
                            onClick={() => { setViewTarget(co); setMenuOpen(null); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] hover:bg-surface3 transition-all text-left"
                            style={{ color: "var(--text2)" }}
                          >
                            <Eye size={13} /> View Details
                          </button>
                          <button
                            onClick={() => { setAssignPlan(co.plan); setAssignTarget(co); setMenuOpen(null); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] hover:bg-surface3 transition-all text-left"
                            style={{ color: "#a78bfa" }}
                          >
                            <CreditCard size={13} /> Assign Plan
                          </button>
                          <button
                            onClick={() => toggleSuspend(co.id)}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] hover:bg-surface3 transition-all text-left"
                            style={{ color: co.status === "suspended" ? "#10b981" : "#f59e0b" }}
                          >
                            {co.status === "suspended" ? <UserCheck size={13} /> : <UserX size={13} />}
                            {co.status === "suspended" ? "Unsuspend" : "Suspend"}
                          </button>
                          <div className="h-px mx-3" style={{ background: "var(--border)" }} />
                          <button
                            onClick={() => { setDeleteTarget(co); setMenuOpen(null); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] hover:bg-surface3 transition-all text-left"
                            style={{ color: "#ef4444" }}
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "var(--border)" }}>
          <span className="text-xs text-text3">
            Showing {filtered.length === 0 ? 0 : Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="w-7 h-7 rounded-lg flex items-center justify-center text-text3 hover:text-text hover:bg-surface2 transition-all disabled:opacity-40">
              <ChevronLeft size={13} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className="w-7 h-7 rounded-lg text-xs font-mono font-medium transition-all"
                style={{ background: page === p ? "var(--accent)" : "transparent", color: page === p ? "white" : "var(--text3)" }}
              >
                {p}
              </button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-7 h-7 rounded-lg flex items-center justify-center text-text3 hover:text-text hover:bg-surface2 transition-all disabled:opacity-40">
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* View Details Modal */}
      {viewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewTarget(null)} />
          <div className="relative w-full max-w-sm rounded-2xl border shadow-2xl animate-fade-in" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-display font-bold text-base text-text">Company Details</h3>
              <button onClick={() => setViewTarget(null)} className="text-text3 hover:text-text"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3">
              {[
                ["Company", viewTarget.name],
                ["City", viewTarget.city],
                ["Admin", viewTarget.adminName],
                ["Email", viewTarget.email],
                ["Plan", SUB_PLAN_META[viewTarget.plan].label],
                ["Status", STATUS_META[viewTarget.status]?.label ?? viewTarget.status],
                ["Drivers", String(viewTarget.drivers)],
                ["Vehicles", String(viewTarget.vehicles)],
                ["MRR", viewTarget.mrr > 0 ? `$${viewTarget.mrr}/mo` : "—"],
                ["Joined", viewTarget.joined],
                ["Last Active", viewTarget.lastActive],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-text3">{k}</span>
                  <span className="text-text font-medium">{v}</span>
                </div>
              ))}
            </div>
            <div className="px-5 py-4 border-t flex justify-end" style={{ borderColor: "var(--border)" }}>
              <button onClick={() => setViewTarget(null)} className="px-4 h-8 rounded-lg border text-sm text-text2 hover:text-text transition-all" style={{ borderColor: "var(--border)" }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Plan Modal */}
      {assignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAssignTarget(null)} />
          <div className="relative w-full max-w-sm rounded-2xl border shadow-2xl animate-fade-in" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-display font-bold text-base text-text">Assign Plan</h3>
              <button onClick={() => setAssignTarget(null)} className="text-text3 hover:text-text"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-text3">Assign a plan to <strong className="text-text">{assignTarget.name}</strong>.</p>
              {(["free", "basic", "pro"] as const).map((p) => {
                const meta = SUB_PLAN_META[p];
                const selected = assignPlan === p;
                return (
                  <button
                    key={p}
                    onClick={() => setAssignPlan(p)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left"
                    style={{
                      borderColor: selected ? meta.color : "var(--border)",
                      background: selected ? meta.bg : "var(--surface2)",
                    }}
                  >
                    <div>
                      <p className="text-sm font-semibold" style={{ color: meta.color }}>{meta.label}</p>
                      <p className="text-xs text-text3">{meta.vehicle_limit} vehicles · {meta.driver_limit} drivers</p>
                    </div>
                    <span className="text-sm font-mono font-bold" style={{ color: meta.color }}>
                      {meta.price === 0 ? "Free" : `$${meta.price}/mo`}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t" style={{ borderColor: "var(--border)" }}>
              <button onClick={() => setAssignTarget(null)} className="px-4 h-8 rounded-lg border text-sm text-text2 hover:text-text transition-all" style={{ borderColor: "var(--border)" }}>Cancel</button>
              <button
                onClick={assignPlanToCompany}
                className="px-4 h-8 rounded-lg text-sm text-white hover:opacity-90 transition-all"
                style={{ background: "var(--accent)" }}
              >
                Apply Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative w-full max-w-sm rounded-2xl border shadow-2xl animate-fade-in" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-display font-bold text-base text-text">Delete Company</h3>
              <button onClick={() => setDeleteTarget(null)} className="text-text3 hover:text-text"><X size={16} /></button>
            </div>
            <div className="p-5">
              <div className="flex items-start gap-3 p-4 rounded-xl border" style={{ background: "rgba(239,68,68,0.05)", borderColor: "rgba(239,68,68,0.2)" }}>
                <AlertTriangle size={18} className="text-[#ef4444] mt-0.5 flex-shrink-0" />
                <p className="text-sm text-text2">
                  Permanently delete <strong className="text-text">{deleteTarget.name}</strong> and all their data? This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t" style={{ borderColor: "var(--border)" }}>
              <button onClick={() => setDeleteTarget(null)} className="px-4 h-8 rounded-lg border text-sm text-text2 hover:text-text transition-all" style={{ borderColor: "var(--border)" }}>Cancel</button>
              <button
                onClick={() => deleteCompany(deleteTarget.id)}
                className="px-4 h-8 rounded-lg text-sm text-white hover:opacity-90 transition-all"
                style={{ background: "#ef4444" }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close menu on outside click */}
      {menuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />
      )}
    </div>
  );
}
