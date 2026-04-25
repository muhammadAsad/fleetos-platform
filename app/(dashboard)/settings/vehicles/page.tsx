"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useSubscription, checkVehicleLimit, PLAN_META } from "@/lib/subscription";
import { Search, RefreshCw, Plus, Edit2, Trash2, X, AlertCircle, Lock, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Vehicle, Driver, EldDevice } from "@/types/database";
import { format } from "date-fns";
import Link from "next/link";

type VehicleRow = Vehicle & { driver?: Driver; eld?: EldDevice };
const TABS = ["Active", "Deactivated", "History", "Groups"] as const;
type Tab = (typeof TABS)[number];

export default function VehiclesPage() {
  const supabase = createClient();
  const { subscription } = useSubscription();
  const [tab, setTab] = useState<Tab>("Active");
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [limitBlocked, setLimitBlocked] = useState(false);
  const [form, setForm] = useState({ vehicle_number: "", make: "", model: "", year: "", vin: "", plate_number: "", assigned_driver_id: "", notes: "" });

  async function load() {
    setLoading(true);
    const statusFilter = tab === "Active" ? "active" : "deactivated";
    const [vehiclesRes, driversRes, eldRes] = await Promise.all([
      supabase.from("vehicles").select("*").eq("status", statusFilter).order("created_at", { ascending: false }),
      supabase.from("drivers").select("*").eq("status", "active"),
      supabase.from("eld_devices").select("*"),
    ]);
    const driverMap = new Map((driversRes.data ?? []).map((d: any) => [d.id, d]));
    const eldMap = new Map((eldRes.data ?? []).map((e: any) => [e.assigned_vehicle_id, e]));
    setVehicles((vehiclesRes.data ?? []).map((v: any) => ({
      ...v,
      driver: v.assigned_driver_id ? driverMap.get(v.assigned_driver_id) : undefined,
      eld: eldMap.get(v.id),
    })));
    setDrivers(driversRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [tab]);

  async function addVehicle() {
    if (!form.vehicle_number.trim()) return;
    const { data: companyData } = await supabase.from("companies").select("id").single();
    await supabase.from("vehicles").insert({
      ...form,
      year: form.year ? parseInt(form.year) : undefined,
      company_id: (companyData as any)?.id ?? null,
      status: "active",
    });
    setShowAdd(false);
    load();
  }

  const filtered = vehicles.filter((v) => {
    const q = search.toLowerCase();
    return !q || v.vehicle_number.toLowerCase().includes(q) || (v.vin ?? "").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl text-text">Vehicles</h2>
          <p className="text-sm text-text3 mt-0.5">Manage your fleet vehicles</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-text3">
            {tab === "Active" ? (
              <span>
                {vehicles.length} / <span style={{ color: PLAN_META[subscription.plan].color }}>{subscription.vehicle_limit}</span> vehicles
              </span>
            ) : null}
          </span>
          <button
            onClick={async () => {
              const check = await checkVehicleLimit(subscription);
              if (!check.allowed) { setLimitBlocked(true); return; }
              setShowAdd(true);
            }}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm text-white hover:opacity-90 transition-all"
            style={{ background: "var(--accent)" }}
          >
            <Plus size={14} /> Add Vehicle
          </button>
        </div>
      </div>

      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--surface2)", width: "fit-content" }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === t ? "bg-surface text-text shadow" : "text-text3 hover:text-text2"}`}>{t}</button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 h-8 rounded-lg border flex-1 max-w-xs" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <Search size={13} className="text-text3" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search vehicle # or VIN..." className="bg-transparent flex-1 outline-none text-sm text-text placeholder-text3" />
        </div>
        <button onClick={load} className="flex items-center gap-1.5 px-3 h-8 rounded-lg border text-sm text-text2 hover:text-text transition-all" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-[11px] font-mono text-text3 uppercase" style={{ borderColor: "var(--border)", background: "var(--surface2)" }}>
                {["#", "Vehicle #", "Make/Model", "Year", "VIN", "Plate", "Driver", "ELD", "Status", "Created", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b" style={{ borderColor: "var(--border)" }}>
                    {Array.from({ length: 11 }).map((_, j) => (
                      <td key={j} className="px-4 py-3.5"><div className="h-3 rounded animate-pulse" style={{ background: "var(--surface3)", width: "80%" }} /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-16 text-text3">
                  <p className="font-medium text-text2 mb-1">No vehicles found</p>
                  <button onClick={() => setShowAdd(true)} className="text-sm text-accent hover:underline">+ Add your first vehicle</button>
                </td></tr>
              ) : (
                filtered.map((v, i) => (
                  <tr key={v.id} className="border-b transition-colors hover:bg-surface2" style={{ borderColor: "var(--border)" }}>
                    <td className="px-4 py-3 text-xs font-mono text-text3">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-text">{v.vehicle_number}</td>
                    <td className="px-4 py-3 text-text2">{v.make} {v.model}</td>
                    <td className="px-4 py-3 font-mono text-xs text-text2">{v.year ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-text3">{v.vin ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-text2">{v.plate_number ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-text2">{v.driver?.name ?? <span className="text-text3">—</span>}</td>
                    <td className="px-4 py-3">
                      {v.eld ? (
                        <Badge variant="cyan" dot>{v.eld.model}</Badge>
                      ) : <span className="text-xs text-text3">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={v.status === "active" ? "green" : "gray"} dot>
                        {v.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-text3">{v.created_at ? format(new Date(v.created_at), "MM/dd/yyyy") : "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button className="p-1 rounded text-text3 hover:text-accent hover:bg-accent/10 transition-colors"><Edit2 size={13} /></button>
                        <button onClick={() => setDeleteId(v.id)} className="p-1 rounded text-text3 hover:text-[#ef4444] hover:bg-red/10 transition-colors"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t text-xs text-text3 font-mono" style={{ borderColor: "var(--border)" }}>{filtered.length} vehicles</div>
      </div>

      {/* Limit Blocked Modal */}
      {limitBlocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setLimitBlocked(false)} />
          <div className="relative w-full max-w-sm rounded-2xl border shadow-2xl animate-fade-in" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(245,158,11,0.12)" }}>
                <Lock size={24} style={{ color: "#f59e0b" }} />
              </div>
              <h3 className="font-display font-bold text-lg text-text mb-1">Vehicle Limit Reached</h3>
              <p className="text-sm text-text3 mb-2">
                Your <strong style={{ color: PLAN_META[subscription.plan].color }}>{PLAN_META[subscription.plan].label}</strong> plan
                allows up to <strong className="text-text">{subscription.vehicle_limit} active vehicles</strong>.
              </p>
              <p className="text-sm text-text3 mb-5">Upgrade your plan to add more vehicles.</p>
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

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
          <div className="relative w-full max-w-lg rounded-2xl border shadow-2xl animate-fade-in" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-display font-bold text-base text-text">Add Vehicle</h3>
              <button onClick={() => setShowAdd(false)} className="text-text3 hover:text-text"><X size={16} /></button>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "vehicle_number", label: "Vehicle Number *" },
                  { key: "make", label: "Make" },
                  { key: "model", label: "Model" },
                  { key: "year", label: "Year" },
                  { key: "vin", label: "VIN *" },
                  { key: "plate_number", label: "Plate Number" },
                ].map(({ key, label }) => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-xs font-medium text-text3">{label}</label>
                    <input
                      value={(form as any)[key]}
                      onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                      className="w-full h-8 px-3 rounded-lg border text-sm text-text bg-surface3 focus:outline-none focus:border-accent"
                      style={{ borderColor: "var(--border)" }}
                    />
                  </div>
                ))}
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-medium text-text3">Assign Driver</label>
                  <select value={form.assigned_driver_id} onChange={(e) => setForm((p) => ({ ...p, assigned_driver_id: e.target.value }))} className="w-full h-8 px-3 rounded-lg border text-sm text-text bg-surface3 focus:outline-none focus:border-accent" style={{ borderColor: "var(--border)" }}>
                    <option value="">— None —</option>
                    {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-medium text-text3">Notes</label>
                  <input value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} className="w-full h-8 px-3 rounded-lg border text-sm text-text bg-surface3 focus:outline-none focus:border-accent" style={{ borderColor: "var(--border)" }} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t" style={{ borderColor: "var(--border)" }}>
              <button onClick={() => setShowAdd(false)} className="px-4 h-8 rounded-lg border text-sm text-text2 hover:text-text" style={{ borderColor: "var(--border)" }}>Cancel</button>
              <button onClick={addVehicle} className="px-4 h-8 rounded-lg text-sm text-white hover:opacity-90" style={{ background: "var(--accent)" }}>Add Vehicle</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
