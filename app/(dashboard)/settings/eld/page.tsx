"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Search, RefreshCw, Plus, Play, Square, Cpu, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { EldDevice, Vehicle } from "@/types/database";
import { format } from "date-fns";

type EldRow = EldDevice & { vehicle?: Vehicle };

export default function EldPage() {
  const supabase = createClient();
  const [devices, setDevices] = useState<EldRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [simRunning, setSimRunning] = useState(false);
  const [simLoading, setSimLoading] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("eld_devices")
      .select("*, vehicles(vehicle_number, make, model)")
      .order("created_at", { ascending: false });
    setDevices((data ?? []).map((d: any) => ({ ...d, vehicle: d.vehicles })));
    setLoading(false);
  }

  async function checkSimStatus() {
    try {
      const res = await fetch("/api/simulator");
      const json = await res.json();
      setSimRunning(json.running);
    } catch {}
  }

  useEffect(() => { load(); checkSimStatus(); }, []);

  async function toggleSimulator() {
    setSimLoading(true);
    try {
      const res = await fetch("/api/simulator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: simRunning ? "stop" : "start" }),
      });
      const json = await res.json();
      setSimRunning(json.running);
    } catch {}
    setSimLoading(false);
  }

  async function addSimulatedDevice() {
    const mac = Array.from({ length: 6 }, () =>
      Math.floor(Math.random() * 256).toString(16).padStart(2, "0").toUpperCase()
    ).join(":");
    const sn = `FSIM-${Math.floor(Math.random() * 9000 + 1000)}-${new Date().getFullYear()}`;
    const { data: companyData } = await supabase.from("companies").select("id").single();
    await supabase.from("eld_devices").insert({
      mac_address: mac,
      serial_number: sn,
      model: "FLEETOS-SIM-v1",
      ble_version: "5.0",
      firmware_version: "2.1.4",
      company_id: (companyData as any)?.id ?? null,
      status: "active",
      is_simulated: true,
      is_blocked: false,
    });
    load();
  }

  const filtered = devices.filter((d) => {
    const q = search.toLowerCase();
    return !q || d.mac_address.toLowerCase().includes(q) || d.serial_number.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl text-text">ELD Devices</h2>
          <p className="text-sm text-text3 mt-0.5">Electronic Logging Device management</p>
        </div>
        <button
          onClick={addSimulatedDevice}
          className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm text-white hover:opacity-90 transition-all"
          style={{ background: "var(--accent)" }}
        >
          <Plus size={14} /> Add Simulated ELD
        </button>
      </div>

      {/* Simulator Control Panel */}
      <div
        className="rounded-xl border p-5"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--surface2)" }}>
              <Cpu size={18} className="text-cyan" />
            </div>
            <div>
              <h3 className="font-medium text-text">ELD Device Simulator</h3>
              <p className="text-sm text-text3 mt-0.5">Testing mode — fake GPS + HOS data, no real hardware required</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${simRunning ? "bg-green animate-pulse" : "bg-text3"}`} />
                <span className="text-sm font-medium text-text">{simRunning ? "Running" : "Stopped"}</span>
              </div>
              <p className="text-xs text-text3 mt-0.5">
                {simRunning ? `${devices.filter(d => d.is_simulated).length} trucks active • 5s interval` : "No active simulation"}
              </p>
            </div>
            <button
              onClick={toggleSimulator}
              disabled={simLoading}
              className="flex items-center gap-2 px-4 h-9 rounded-lg border text-sm font-medium transition-all disabled:opacity-50"
              style={simRunning
                ? { borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.1)", color: "#ef4444" }
                : { borderColor: "rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.1)", color: "#10b981" }
              }
            >
              {simRunning ? <Square size={14} /> : <Play size={14} />}
              {simLoading ? "..." : simRunning ? "Stop Simulator" : "Start Simulator"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
          {[
            { label: "TRK-001 Carlos Martinez", route: "Chicago → Indianapolis", status: "DR", color: "#10b981" },
            { label: "TRK-002 Ana Garcia", route: "St. Louis → Memphis", status: "DR", color: "#10b981" },
            { label: "TRK-003 Mike Davis", route: "Cleveland → Pittsburgh", status: "DR", color: "#ef4444" },
            { label: "TRK-004 Sarah Williams", route: "Indianapolis (parked)", status: "ON", color: "#f59e0b" },
            { label: "TRK-005 Kevin Johnson", route: "Columbus (on break)", status: "SB", color: "#3b82f6" },
          ].slice(0, 4).map((truck) => (
            <div key={truck.label} className="rounded-lg p-3 space-y-1" style={{ background: "var(--surface2)" }}>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: truck.color }} />
                <span className="text-xs font-mono font-medium text-text2">{truck.status}</span>
              </div>
              <p className="text-[11px] font-medium text-text">{truck.label}</p>
              <p className="text-[10px] text-text3">{truck.route}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 h-8 rounded-lg border flex-1 max-w-xs" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <Search size={13} className="text-text3" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by MAC or serial..." className="bg-transparent flex-1 outline-none text-sm text-text placeholder-text3" />
        </div>
        <button onClick={load} className="flex items-center gap-1.5 px-3 h-8 rounded-lg border text-sm text-text2 hover:text-text transition-all" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-[11px] font-mono text-text3 uppercase" style={{ borderColor: "var(--border)", background: "var(--surface2)" }}>
                {["#", "ELD MAC", "Serial #", "Model", "Vehicle", "BLE", "Firmware", "Status", "Blocked", "Activated"].map((h) => (
                  <th key={h} className="text-left px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b" style={{ borderColor: "var(--border)" }}>
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j} className="px-4 py-3.5"><div className="h-3 rounded animate-pulse" style={{ background: "var(--surface3)", width: "80%" }} /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-12 text-text3">
                  <Cpu size={28} className="mx-auto mb-3 opacity-30" />
                  <p className="font-medium text-text2">No ELD devices found</p>
                  <button onClick={addSimulatedDevice} className="text-sm text-accent hover:underline mt-1">+ Add simulated ELD</button>
                </td></tr>
              ) : (
                filtered.map((d, i) => (
                  <tr key={d.id} className="border-b transition-colors hover:bg-surface2" style={{ borderColor: "var(--border)" }}>
                    <td className="px-4 py-3 text-xs font-mono text-text3">{i + 1}</td>
                    <td className="px-4 py-3 font-mono text-xs text-text2">{d.mac_address}</td>
                    <td className="px-4 py-3 font-mono text-xs text-text2">{d.serial_number}</td>
                    <td className="px-4 py-3 text-xs text-text2">
                      <div className="flex items-center gap-1.5">
                        {d.is_simulated && <Badge variant="cyan">SIM</Badge>}
                        {d.model}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-text2">{d.vehicle?.vehicle_number ?? <span className="text-text3">—</span>}</td>
                    <td className="px-4 py-3 font-mono text-xs text-text3">{d.ble_version ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-text3">{d.firmware_version ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={d.status === "active" ? "green" : "gray"} dot>
                        {d.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {d.is_blocked ? (
                        <Badge variant="red">Blocked</Badge>
                      ) : (
                        <span className="text-xs text-text3">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-text3">
                      {d.activated_at ? format(new Date(d.activated_at), "MM/dd/yyyy") : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t text-xs text-text3 font-mono" style={{ borderColor: "var(--border)" }}>{filtered.length} devices</div>
      </div>
    </div>
  );
}
