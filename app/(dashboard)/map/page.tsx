"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Layers, Cloud, Info, Maximize2, X, Truck, Clock, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { formatMinutes, getStatusLabel, getStatusDot, formatSpeed } from "@/lib/utils";

const FleetMap = dynamic(() => import("@/components/map/FleetMap"), { ssr: false });

type PanelType = "layers" | "weather" | null;

const DUTY_FILTERS = [
  { status: "DR", label: "Driving", color: "#10b981" },
  { status: "ON", label: "On Duty", color: "#f59e0b" },
  { status: "SB", label: "Sleeper", color: "#3b82f6" },
  { status: "OFF", label: "Off Duty", color: "#475569" },
];

interface TruckData {
  vehicleId: string;
  driverName: string;
  vehicleNumber: string;
  lat: number;
  lng: number;
  speed: number;
  status: string;
  driveRemaining: number;
  shiftRemaining: number;
  violations: number;
}

export default function MapPage() {
  const [activePanel, setActivePanel] = useState<PanelType>(null);
  const [selectedTruck, setSelectedTruck] = useState<TruckData | null>(null);
  const [baseLayer, setBaseLayer] = useState<"standard" | "satellite" | "terrain">("standard");
  const [overlays, setOverlays] = useState({ traffic: false, clustering: true, alarms: false });
  const [weatherLayers, setWeatherLayers] = useState({
    radar: false, wind: false, snow: false, roadCondition: false,
    thunderstorms: false, temperature: false, humidity: false,
    airQuality: false, lightning: false,
  });

  const toggleOverlay = (key: keyof typeof overlays) =>
    setOverlays((p) => ({ ...p, [key]: !p[key] }));
  const toggleWeather = (key: keyof typeof weatherLayers) =>
    setWeatherLayers((p) => ({ ...p, [key]: !p[key] }));

  const rightTools = [
    { id: "layers" as PanelType, icon: Layers, title: "Map Layers" },
    { id: "weather" as PanelType, icon: Cloud, title: "Weather" },
  ];

  return (
    <div className="relative overflow-hidden" style={{ height: "calc(100vh - 56px)" }}>
      {/* Map */}
      <FleetMap onTruckClick={setSelectedTruck} />

      {/* Top search bar */}
      <div className="absolute top-3 left-3 right-16 flex gap-2 z-10">
        <div
          className="flex items-center gap-2 px-3 h-9 rounded-lg border flex-1 max-w-xs text-sm text-text3"
          style={{ background: "rgba(12,16,24,0.9)", borderColor: "var(--border)", backdropFilter: "blur(8px)" }}
        >
          <Truck size={13} />
          <input
            type="text"
            placeholder="Search by vehicle or driver..."
            className="bg-transparent flex-1 outline-none text-sm text-text placeholder-text3"
          />
        </div>
      </div>

      {/* Right toolbar */}
      <div
        className="absolute right-3 top-3 flex flex-col gap-1 z-10"
        style={{ backdropFilter: "blur(8px)" }}
      >
        {rightTools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActivePanel(activePanel === tool.id ? null : tool.id)}
            title={tool.title}
            className={cn(
              "w-9 h-9 rounded-lg border flex items-center justify-center transition-all",
              activePanel === tool.id
                ? "border-accent bg-accent/20 text-accent"
                : "border-border bg-surface/80 text-text2 hover:text-text hover:border-accent/30"
            )}
          >
            <tool.icon size={15} />
          </button>
        ))}
        <button
          title="Fullscreen"
          className="w-9 h-9 rounded-lg border border-border bg-surface/80 flex items-center justify-center text-text2 hover:text-text transition-colors"
        >
          <Maximize2 size={15} />
        </button>
      </div>

      {/* Layers Panel */}
      {activePanel === "layers" && (
        <MapPanel title="Map Layers" onClose={() => setActivePanel(null)}>
          <section>
            <p className="text-[10px] font-mono text-text3 uppercase tracking-widest mb-2">MAP BASE</p>
            {(["standard", "satellite", "terrain"] as const).map((l) => (
              <label key={l} className="flex items-center gap-2.5 py-1.5 cursor-pointer group">
                <div className={cn(
                  "w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-all",
                  baseLayer === l ? "border-accent" : "border-text3 group-hover:border-text2"
                )}>
                  {baseLayer === l && <div className="w-1.5 h-1.5 rounded-full bg-accent" />}
                </div>
                <span className="text-sm capitalize text-text2 group-hover:text-text">{l}</span>
              </label>
            ))}
          </section>
          <div className="h-px my-3" style={{ background: "var(--border)" }} />
          <section>
            <p className="text-[10px] font-mono text-text3 uppercase tracking-widest mb-2">OVERLAY</p>
            {Object.entries(overlays).map(([key, val]) => (
              <CheckRow
                key={key}
                label={key.charAt(0).toUpperCase() + key.slice(1)}
                checked={val}
                onChange={() => toggleOverlay(key as keyof typeof overlays)}
              />
            ))}
          </section>
        </MapPanel>
      )}

      {/* Weather Panel */}
      {activePanel === "weather" && (
        <MapPanel title="Weather" onClose={() => setActivePanel(null)}>
          <p className="text-[10px] font-mono text-text3 uppercase tracking-widest mb-2">WEATHER LAYERS</p>
          {(Object.keys(weatherLayers) as (keyof typeof weatherLayers)[]).map((key) => (
            <CheckRow
              key={key}
              label={key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())}
              checked={weatherLayers[key]}
              onChange={() => toggleWeather(key)}
            />
          ))}
        </MapPanel>
      )}

      {/* Truck detail panel */}
      {selectedTruck && (
        <div
          className="absolute left-3 top-14 bottom-16 w-72 rounded-xl border overflow-hidden z-10 flex flex-col"
          style={{ background: "rgba(12,16,24,0.95)", borderColor: "var(--border)", backdropFilter: "blur(12px)" }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
            <div>
              <p className="font-medium text-sm text-text">{selectedTruck.vehicleNumber}</p>
              <p className="text-xs text-text3">{selectedTruck.driverName}</p>
            </div>
            <button onClick={() => setSelectedTruck(null)} className="text-text3 hover:text-text">
              <X size={15} />
            </button>
          </div>
          <div className="p-4 space-y-3 overflow-y-auto flex-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: getStatusDot(selectedTruck.status) }} />
              <span className="text-sm font-medium" style={{ color: getStatusDot(selectedTruck.status) }}>
                {getStatusLabel(selectedTruck.status)}
              </span>
              <span className="ml-auto text-xs font-mono text-text2">
                {formatSpeed(selectedTruck.speed)}
              </span>
            </div>

            {selectedTruck.violations > 0 && (
              <div className="px-3 py-2 rounded-lg border" style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.25)" }}>
                <p className="text-xs text-[#ef4444] font-medium">⚠ {selectedTruck.violations} HOS Violation{selectedTruck.violations > 1 ? "s" : ""}</p>
              </div>
            )}

            <div className="space-y-3">
              <HosStat label="Drive Remaining" used={660 - selectedTruck.driveRemaining} total={660} remaining={selectedTruck.driveRemaining} />
              <HosStat label="Shift Remaining" used={840 - selectedTruck.shiftRemaining} total={840} remaining={selectedTruck.shiftRemaining} />
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-text3">
                <span>Latitude</span>
                <span className="font-mono text-text2">{selectedTruck.lat.toFixed(4)}</span>
              </div>
              <div className="flex justify-between text-text3">
                <span>Longitude</span>
                <span className="font-mono text-text2">{selectedTruck.lng.toFixed(4)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom HOS filter bar */}
      <div
        className="absolute bottom-3 left-3 right-3 flex items-center gap-2 z-10 px-3 py-2 rounded-xl border"
        style={{ background: "rgba(12,16,24,0.9)", borderColor: "var(--border)", backdropFilter: "blur(8px)" }}
      >
        <span className="text-xs text-text3 font-mono mr-1">Filter:</span>
        {DUTY_FILTERS.map((f) => (
          <button
            key={f.status}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border border-border hover:border-opacity-50 transition-all"
            style={{ background: `${f.color}10`, color: f.color, borderColor: `${f.color}30` }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: f.color }} />
            {f.label}
          </button>
        ))}
        <div className="flex items-center gap-1.5 ml-auto text-xs text-text3">
          <Wifi size={11} className="text-green" />
          <span>Live updates active</span>
        </div>
      </div>
    </div>
  );
}

function MapPanel({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="absolute right-14 top-3 w-56 rounded-xl border overflow-hidden z-20"
      style={{ background: "rgba(12,16,24,0.97)", borderColor: "var(--border)", backdropFilter: "blur(12px)" }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
        <p className="text-sm font-medium text-text">{title}</p>
        <button onClick={onClose} className="text-text3 hover:text-text"><X size={13} /></button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2.5 py-1.5 cursor-pointer group">
      <div
        onClick={onChange}
        className={cn(
          "w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition-all cursor-pointer",
          checked ? "border-accent bg-accent" : "border-text3 group-hover:border-text2"
        )}
      >
        {checked && <svg width="8" height="6" viewBox="0 0 8 6"><path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>}
      </div>
      <span className="text-sm text-text2 group-hover:text-text">{label}</span>
    </label>
  );
}

function HosStat({ label, used, total, remaining }: { label: string; used: number; total: number; remaining: number }) {
  const pct = Math.min(100, (used / total) * 100);
  const color = pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : "#10b981";
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-text3">{label}</span>
        <span className="font-mono" style={{ color }}>{formatMinutes(remaining)}</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: "var(--surface3)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
