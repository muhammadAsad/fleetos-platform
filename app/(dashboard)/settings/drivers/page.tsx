"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useSubscription, checkDriverLimit, PLAN_META } from "@/lib/subscription";
import { Search, RefreshCw, Plus, Edit2, Trash2, AlertCircle, X, Lock, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Driver, Vehicle } from "@/types/database";
import { format } from "date-fns";
import Link from "next/link";

type DriverRow = Driver & { vehicle?: Vehicle };

const TABS = ["Active", "Deactivated", "History"] as const;
type Tab = (typeof TABS)[number];

export default function DriversPage() {
  const supabase = createClient();
  const { subscription } = useSubscription();
  const [tab, setTab] = useState<Tab>("Active");
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [limitBlocked, setLimitBlocked] = useState(false);

  const [form, setForm] = useState({
    name: "", username: "", cdl_number: "", cdl_state: "",
    email: "", phone: "", assigned_vehicle_id: "",
  });

  async function load() {
    setLoading(true);
    const statusMap: Record<Tab, string> = { Active: "active", Deactivated: "deactivated", History: "deactivated" };
    const [driversRes, vehiclesRes] = await Promise.all([
      supabase.from("drivers").select("*").eq("status", statusMap[tab]).order("created_at", { ascending: false }),
      supabase.from("vehicles").select("*").eq("status", "active"),
    ]);
    const vehicleMap = new Map((vehiclesRes.data ?? []).map((v: any) => [v.id, v]));
    setDrivers((driversRes.data ?? []).map((d: any) => ({
      ...d,
      vehicle: d.id ? vehicleMap.get(d.id) : undefined,
    })));
    setVehicles(vehiclesRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [tab]);

  async function addDriver() {
    if (!form.name.trim()) return;
    const { data: companyData } = await supabase.from("companies").select("id").single();
    await supabase.from("drivers").insert({
      ...form,
      company_id: (companyData as any)?.id ?? null,
      status: "active",
    });
    setShowAdd(false);
    setForm({ name: "", username: "", cdl_number: "", cdl_state: "", email: "", phone: "", assigned_vehicle_id: "" });
    load();
  }

  async function deleteDriver(id: string) {
    await supabase.from("drivers").update({ status: "deactivated" }).eq("id", id);
    setDeleteId(null);
    load();
  }

  const filtered = drivers.filter((d) => {
    const q = search.toLowerCase();
    return !q || d.name.toLowerCase().includes(q) || (d.username ?? "").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl text-text">Drivers</h2>
          <p className="text-sm text-text3 mt-0.5">Manage your fleet drivers</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Subscription limit badge */}
          <span className="text-[11px] font-mono text-text3">
            {tab === "Active" ? (
              <span>
                {drivers.length} / <span style={{ color: PLAN_META[subscription.plan].color }}>{subscription.driver_limit}</span> drivers
              </span>
            ) : null}
          </span>
          <button
            onClick={async () => {
              const check = await checkDriverLimit(subscription);
              if (!check.allowed) { setLimitBlocked(true); return; }
              setShowAdd(true);
            }}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm text-white transition-all hover:opacity-90"
            style={{ background: "var(--accent)" }}
          >
            <Plus size={14} /> Add Driver
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--surface2)", width: "fit-content" }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === t ? "bg-surface text-text shadow" : "text-text3 hover:text-text2"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div
          className="flex items-center gap-2 px-3 h-8 rounded-lg border flex-1 max-w-xs"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <Search size={13} className="text-text3" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or username..."
            className="bg-transparent flex-1 outline-none text-sm text-text placeholder-text3"
          />
        </div>
        <button onClick={load} className="flex items-center gap-1.5 px-3 h-8 rounded-lg border text-sm text-text2 hover:text-text transition-all hover:border-accent/30" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-[11px] font-mono text-text3 uppercase tracking-wide" style={{ borderColor: "var(--border)", background: "var(--surface2)" }}>
                {["#", "Driver", "Username", "CDL", "Vehicle", "Email", "Phone", "Status", "Created", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b" style={{ borderColor: "var(--border)" }}>
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div className="h-3 rounded animate-pulse" style={{ background: "var(--surface3)", width: "80%" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-16 text-text3">
                    <p className="font-medium text-text2 mb-1">No drivers found</p>
                    <button onClick={() => setShowAdd(true)} className="text-sm text-accent hover:underline">
                      + Add your first driver
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map((driver, i) => (
                  <tr key={driver.id} className="border-b transition-colors hover:bg-surface2" style={{ borderColor: "var(--border)" }}>
                    <td className="px-4 py-3 text-xs font-mono text-text3">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-text">{driver.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-text3">{driver.username ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-text2">
                      {driver.cdl_number ? `${driver.cdl_number} (${driver.cdl_state})` : "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-text2">{driver.vehicle?.vehicle_number ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-text2">{driver.email ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-text2">{driver.phone ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={driver.status === "active" ? "green" : "gray"} dot>
                        {driver.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-text3">
                      {driver.created_at ? format(new Date(driver.created_at), "MM/dd/yyyy") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button className="p-1 rounded text-text3 hover:text-accent hover:bg-accent/10 transition-colors">
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteId(driver.id)}
                          className="p-1 rounded text-text3 hover:text-[#ef4444] hover:bg-red/10 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t text-xs text-text3 font-mono" style={{ borderColor: "var(--border)" }}>
          {filtered.length} drivers
        </div>
      </div>

      {/* Add Driver Modal */}
      {showAdd && (
        <Modal title="Add Driver" onClose={() => setShowAdd(false)} onSave={addDriver}>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "name", label: "Name *" },
              { key: "username", label: "Username *" },
              { key: "cdl_number", label: "CDL Number" },
              { key: "cdl_state", label: "CDL State" },
              { key: "email", label: "Email" },
              { key: "phone", label: "Phone" },
            ].map(({ key, label }) => (
              <div key={key} className="space-y-1.5">
                <label className="text-xs font-medium text-text3">{label}</label>
                <input
                  value={(form as any)[key]}
                  onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                  className="w-full h-8 px-3 rounded-lg border text-sm text-text bg-surface3 focus:outline-none focus:border-accent transition-colors"
                  style={{ borderColor: "var(--border)" }}
                />
              </div>
            ))}
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-medium text-text3">Assign Vehicle</label>
              <select
                value={form.assigned_vehicle_id}
                onChange={(e) => setForm((p) => ({ ...p, assigned_vehicle_id: e.target.value }))}
                className="w-full h-8 px-3 rounded-lg border text-sm text-text bg-surface3 focus:outline-none focus:border-accent transition-colors"
                style={{ borderColor: "var(--border)" }}
              >
                <option value="">— None —</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.vehicle_number} — {v.make} {v.model}</option>
                ))}
              </select>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      {deleteId && (
        <Modal title="Deactivate Driver" onClose={() => setDeleteId(null)} onSave={() => deleteDriver(deleteId)} saveLabel="Deactivate" danger>
          <div className="flex items-start gap-3 p-4 rounded-xl border" style={{ background: "rgba(239,68,68,0.05)", borderColor: "rgba(239,68,68,0.2)" }}>
            <AlertCircle size={18} className="text-[#ef4444] mt-0.5 flex-shrink-0" />
            <p className="text-sm text-text2">
              This driver will be deactivated and removed from the active roster. Their logs will be preserved.
            </p>
          </div>
        </Modal>
      )}

      {/* Limit Blocked Modal */}
      {limitBlocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setLimitBlocked(false)} />
          <div className="relative w-full max-w-sm rounded-2xl border shadow-2xl animate-fade-in" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(245,158,11,0.12)" }}>
                <Lock size={24} style={{ color: "#f59e0b" }} />
              </div>
              <h3 className="font-display font-bold text-lg text-text mb-1">Driver Limit Reached</h3>
              <p className="text-sm text-text3 mb-2">
                Your <strong style={{ color: PLAN_META[subscription.plan].color }}>{PLAN_META[subscription.plan].label}</strong> plan
                allows up to <strong className="text-text">{subscription.driver_limit} active drivers</strong>.
              </p>
              <p className="text-sm text-text3 mb-5">Upgrade your plan to add more drivers.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setLimitBlocked(false)}
                  className="flex-1 h-9 rounded-xl border text-sm text-text2 hover:text-text transition-all"
                  style={{ borderColor: "var(--border)" }}
                >
                  Cancel
                </button>
                <Link
                  href="/settings/billing"
                  onClick={() => setLimitBlocked(false)}
                  className="flex-1 h-9 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-1.5 hover:opacity-90 transition-all"
                  style={{ background: "var(--accent)" }}
                >
                  Upgrade Plan <ArrowUpRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Modal({ title, onClose, onSave, saveLabel = "Save", danger = false, children }: {
  title: string;
  onClose: () => void;
  onSave: () => void;
  saveLabel?: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-2xl border shadow-2xl animate-fade-in"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h3 className="font-display font-bold text-base text-text">{title}</h3>
          <button onClick={onClose} className="text-text3 hover:text-text"><X size={16} /></button>
        </div>
        <div className="p-5">{children}</div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t" style={{ borderColor: "var(--border)" }}>
          <button onClick={onClose} className="px-4 h-8 rounded-lg border text-sm text-text2 hover:text-text transition-all" style={{ borderColor: "var(--border)" }}>
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-4 h-8 rounded-lg text-sm text-white transition-all hover:opacity-90"
            style={{ background: danger ? "#ef4444" : "var(--accent)" }}
          >
            {saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
