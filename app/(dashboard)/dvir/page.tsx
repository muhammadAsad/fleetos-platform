"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { ClipboardCheck, Plus, CheckCircle, XCircle, AlertCircle, X, ChevronDown } from "lucide-react";
import { format } from "date-fns";

interface DvirReport {
  id: string;
  driver_name: string;
  vehicle_number: string;
  report_date: string;
  odometer: number;
  defects: string[];
  defects_corrected: boolean;
  driver_signature: boolean;
  mechanic_signature: boolean;
  condition: "satisfactory" | "unsatisfactory" | "corrected";
}

const VEHICLE_ITEMS = [
  "Air Brakes", "Coupling Devices", "Defroster/Heater", "Emergency Equipment",
  "Engine", "Exhaust", "Fuel/Oil Leaks", "Headlights", "Horn", "Lights (Other)",
  "Mirrors", "Steering", "Suspension", "Tires", "Trailer Brake Connections",
  "Wheels/Rims", "Windshield Wipers",
];

const TRAILER_ITEMS = [
  "Brakes", "Coupling (Kingpin/5th Wheel)", "Coupling (Other)", "Doors",
  "Hitch", "Landing Gear", "Lights", "Roof", "Suspension", "Tarpaulin",
  "Tires", "Wheels/Rims",
];

const MOCK_REPORTS: DvirReport[] = [
  {
    id: "1", driver_name: "John Smith", vehicle_number: "TRK-001",
    report_date: new Date().toISOString(), odometer: 142334,
    defects: ["Tires", "Lights (Other)"], defects_corrected: true,
    driver_signature: true, mechanic_signature: true, condition: "corrected",
  },
  {
    id: "2", driver_name: "Maria Garcia", vehicle_number: "TRK-002",
    report_date: new Date(Date.now() - 86400000).toISOString(), odometer: 98210,
    defects: [], defects_corrected: false,
    driver_signature: true, mechanic_signature: false, condition: "satisfactory",
  },
  {
    id: "3", driver_name: "Robert Lee", vehicle_number: "TRK-003",
    report_date: new Date(Date.now() - 172800000).toISOString(), odometer: 203120,
    defects: ["Air Brakes", "Steering"], defects_corrected: false,
    driver_signature: true, mechanic_signature: false, condition: "unsatisfactory",
  },
];

export default function DvirPage() {
  const supabase = createClient();
  const [reports, setReports] = useState<DvirReport[]>(MOCK_REPORTS);
  const [showForm, setShowForm] = useState(false);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({ driver_id: "", vehicle_id: "", odometer: "", notes: "" });

  useEffect(() => {
    supabase.from("drivers").select("id,name").eq("status", "active").then(({ data }: { data: any }) => setDrivers(data ?? []));
    supabase.from("vehicles").select("id,vehicle_number").eq("status", "active").then(({ data }: { data: any }) => setVehicles(data ?? []));
  }, []);

  function toggleItem(item: string) {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  }

  function submitReport() {
    const driver = drivers.find((d) => d.id === form.driver_id);
    const vehicle = vehicles.find((v) => v.id === form.vehicle_id);
    const defects = Array.from(checkedItems);
    const newReport: DvirReport = {
      id: Date.now().toString(),
      driver_name: driver?.name ?? "Unknown",
      vehicle_number: vehicle?.vehicle_number ?? "Unknown",
      report_date: new Date().toISOString(),
      odometer: parseInt(form.odometer) || 0,
      defects,
      defects_corrected: false,
      driver_signature: true,
      mechanic_signature: false,
      condition: defects.length === 0 ? "satisfactory" : "unsatisfactory",
    };
    setReports((prev) => [newReport, ...prev]);
    setShowForm(false);
    setCheckedItems(new Set());
    setForm({ driver_id: "", vehicle_id: "", odometer: "", notes: "" });
  }

  const conditionConfig = {
    satisfactory: { icon: CheckCircle, color: "#10b981", label: "Satisfactory", bg: "rgba(16,185,129,0.1)" },
    corrected: { icon: CheckCircle, color: "#3b82f6", label: "Defects Corrected", bg: "rgba(59,130,246,0.1)" },
    unsatisfactory: { icon: XCircle, color: "#ef4444", label: "Defects Found", bg: "rgba(239,68,68,0.1)" },
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl text-text">DVIR</h2>
          <p className="text-sm text-text3 mt-0.5">Driver Vehicle Inspection Reports — FMCSA §396.11</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm text-white transition-all hover:opacity-90"
          style={{ background: "var(--accent)" }}
        >
          <Plus size={14} /> New Inspection
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Reports", value: reports.length, color: "text-text" },
          { label: "Defects Found", value: reports.filter((r) => r.condition === "unsatisfactory").length, color: "text-[#ef4444]" },
          { label: "Satisfactory", value: reports.filter((r) => r.condition === "satisfactory" || r.condition === "corrected").length, color: "text-green" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <p className="text-xs font-mono text-text3 uppercase tracking-wide">{s.label}</p>
            <p className={`font-display font-bold text-3xl mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Reports Table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-[11px] font-mono text-text3 uppercase" style={{ borderColor: "var(--border)", background: "var(--surface2)" }}>
                {["Date", "Driver", "Vehicle", "Odometer", "Defects", "Condition", "Signatures"].map((h) => (
                  <th key={h} className="text-left px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => {
                const cfg = conditionConfig[r.condition];
                const Icon = cfg.icon;
                return (
                  <tr key={r.id} className="border-b hover:bg-surface2 transition-colors" style={{ borderColor: "var(--border)" }}>
                    <td className="px-4 py-3 font-mono text-xs text-text2">
                      {format(new Date(r.report_date), "MM/dd/yyyy HH:mm")}
                    </td>
                    <td className="px-4 py-3 font-medium text-text">{r.driver_name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-text2">{r.vehicle_number}</td>
                    <td className="px-4 py-3 font-mono text-xs text-text3">{r.odometer.toLocaleString()} mi</td>
                    <td className="px-4 py-3">
                      {r.defects.length === 0 ? (
                        <span className="text-xs text-text3">None</span>
                      ) : (
                        <span className="text-xs text-[#ef4444] font-medium">{r.defects.slice(0, 2).join(", ")}{r.defects.length > 2 ? ` +${r.defects.length - 2}` : ""}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-lg w-fit"
                        style={{ background: cfg.bg, color: cfg.color }}>
                        <Icon size={11} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${r.driver_signature ? "bg-green/10 text-green" : "bg-surface3 text-text3"}`}>
                          Driver
                        </span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${r.mechanic_signature ? "bg-green/10 text-green" : "bg-surface3 text-text3"}`}>
                          Mechanic
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t text-xs text-text3 font-mono" style={{ borderColor: "var(--border)" }}>
          {reports.length} inspection reports
        </div>
      </div>

      {/* New Report Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 overflow-y-auto">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-2xl rounded-2xl border shadow-2xl animate-fade-in mb-8"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2.5">
                <ClipboardCheck size={18} className="text-accent" />
                <h3 className="font-display font-bold text-base text-text">New DVIR</h3>
              </div>
              <button onClick={() => setShowForm(false)} className="text-text3 hover:text-text"><X size={16} /></button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text3">Driver</label>
                  <select value={form.driver_id} onChange={(e) => setForm((p) => ({ ...p, driver_id: e.target.value }))}
                    className="w-full h-9 px-3 rounded-lg border text-sm text-text appearance-none focus:outline-none focus:border-accent"
                    style={{ background: "var(--surface2)", borderColor: "var(--border)" }}>
                    <option value="">Select driver</option>
                    {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text3">Vehicle</label>
                  <select value={form.vehicle_id} onChange={(e) => setForm((p) => ({ ...p, vehicle_id: e.target.value }))}
                    className="w-full h-9 px-3 rounded-lg border text-sm text-text appearance-none focus:outline-none focus:border-accent"
                    style={{ background: "var(--surface2)", borderColor: "var(--border)" }}>
                    <option value="">Select vehicle</option>
                    {vehicles.map((v) => <option key={v.id} value={v.id}>{v.vehicle_number}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text3">Odometer (miles)</label>
                  <input type="number" value={form.odometer} onChange={(e) => setForm((p) => ({ ...p, odometer: e.target.value }))}
                    placeholder="e.g. 142500"
                    className="w-full h-9 px-3 rounded-lg border text-sm text-text focus:outline-none focus:border-accent"
                    style={{ background: "var(--surface2)", borderColor: "var(--border)" }} />
                </div>
              </div>

              {/* Vehicle items */}
              <div>
                <p className="text-xs font-medium text-text3 mb-2">Vehicle Inspection — check any defects found:</p>
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                  <div className="p-3 border-b text-[10px] font-mono font-semibold text-text3 uppercase tracking-widest"
                    style={{ borderColor: "var(--border)", background: "var(--surface2)" }}>
                    POWER UNIT
                  </div>
                  <div className="grid grid-cols-3 gap-0">
                    {VEHICLE_ITEMS.map((item) => (
                      <label key={item} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-surface2 transition-colors border-r border-b text-xs"
                        style={{ borderColor: "var(--border)" }}>
                        <div
                          onClick={() => toggleItem(item)}
                          className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center flex-shrink-0 cursor-pointer transition-all
                            ${checkedItems.has(item) ? "border-[#ef4444] bg-[#ef4444]" : "border-border hover:border-text2"}`}
                        >
                          {checkedItems.has(item) && <svg width="8" height="6" viewBox="0 0 8 6"><path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>}
                        </div>
                        <span className={checkedItems.has(item) ? "text-[#ef4444]" : "text-text2"}>{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {checkedItems.size > 0 && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg border text-xs"
                  style={{ background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.2)" }}>
                  <AlertCircle size={13} className="text-[#ef4444] mt-0.5 flex-shrink-0" />
                  <span className="text-[#ef4444]">
                    {checkedItems.size} defect{checkedItems.size > 1 ? "s" : ""} marked: {Array.from(checkedItems).join(", ")}
                  </span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text3">Notes (optional)</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border text-sm text-text focus:outline-none focus:border-accent resize-none"
                  style={{ background: "var(--surface2)", borderColor: "var(--border)" }}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t" style={{ borderColor: "var(--border)" }}>
              <button onClick={() => setShowForm(false)}
                className="px-4 h-8 rounded-lg border text-sm text-text2 hover:text-text transition-all"
                style={{ borderColor: "var(--border)" }}>
                Cancel
              </button>
              <button onClick={submitReport}
                className="px-4 h-8 rounded-lg text-sm text-white transition-all hover:opacity-90"
                style={{ background: "var(--accent)" }}>
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
