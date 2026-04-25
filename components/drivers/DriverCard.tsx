"use client";
import { formatMinutes, formatSpeed } from "@/lib/utils";
import { Wifi, WifiOff, AlertTriangle, MapPin, Gauge } from "lucide-react";

interface DriverCardData {
  id: string;
  name: string;
  vehicleNumber?: string;
  status: string;
  speed: number;
  driveUsed: number;
  driveCap: number;
  shiftRemaining: number;
  cycleUsed?: number;
  cycleCap?: number;
  violations: number;
  online: boolean;
  lat?: number;
  lng?: number;
}

interface DriverCardProps {
  driver: DriverCardData;
  onClick?: () => void;
}

function HosBar({ label, used, total, color }: { label: string; used: number; total: number; color: string }) {
  const pct = Math.min(100, total > 0 ? (used / total) * 100 : 0);
  const remaining = Math.max(0, total - used);
  return (
    <div className="space-y-1">
      <div className="flex justify-between" style={{ fontSize: 10 }}>
        <span style={{ color: "var(--text3)", fontFamily: "JetBrains Mono, monospace" }}>{label}</span>
        <span style={{ color, fontFamily: "JetBrains Mono, monospace", fontWeight: 600 }}>{formatMinutes(remaining)}</span>
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--surface3)" }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: color,
            boxShadow: pct > 80 ? `0 0 4px ${color}80` : undefined,
            transition: "width 0.5s ease",
          }}
        />
      </div>
    </div>
  );
}

function getInitials(name: string): string {
  return name.split(" ").filter(Boolean).map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

const STATUS_PALETTE: Record<string, { bg: string; fg: string; label: string; dot: string }> = {
  DR: { bg: "rgba(16,185,129,0.12)", fg: "#10b981", label: "Driving", dot: "#10b981" },
  ON: { bg: "rgba(245,158,11,0.12)", fg: "#f59e0b", label: "On Duty", dot: "#f59e0b" },
  SB: { bg: "rgba(139,92,246,0.12)", fg: "#8b5cf6", label: "Sleeper", dot: "#8b5cf6" },
  OFF: { bg: "rgba(71,85,105,0.12)", fg: "#64748b", label: "Off Duty", dot: "#475569" },
};

export default function DriverCard({ driver, onClick }: DriverCardProps) {
  const palette = STATUS_PALETTE[driver.status] ?? STATUS_PALETTE.OFF;
  const drivePct = (driver.driveUsed / driver.driveCap) * 100;
  const driveColor = drivePct >= 90 ? "#ef4444" : drivePct >= 70 ? "#f59e0b" : "#10b981";

  return (
    <div
      onClick={onClick}
      className="rounded-xl border p-4 space-y-3 transition-all hover:border-accent/30 cursor-pointer"
      style={{
        background: "var(--surface)",
        borderColor: driver.violations > 0 ? "rgba(239,68,68,0.35)" : "var(--border)",
        boxShadow: driver.violations > 0 ? "0 0 0 1px rgba(239,68,68,0.1)" : "var(--shadow-sm)",
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {/* Avatar */}
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-bold font-display flex-shrink-0"
            style={{ background: palette.bg, color: palette.fg }}
          >
            {getInitials(driver.name)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text truncate leading-tight">{driver.name}</p>
            <p className="text-[11px] font-mono truncate mt-0.5" style={{ color: "var(--text3)" }}>
              {driver.vehicleNumber ?? "No vehicle"}
            </p>
          </div>
        </div>

        {/* Status pill */}
        <span
          className="flex items-center gap-1.5 text-[11px] font-mono font-semibold px-2 py-1 rounded-lg flex-shrink-0"
          style={{ background: palette.bg, color: palette.fg }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: palette.dot }} />
          {palette.label}
        </span>
      </div>

      {/* Violation banner */}
      {driver.violations > 0 && (
        <div
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs border"
          style={{ background: "rgba(239,68,68,0.07)", borderColor: "rgba(239,68,68,0.2)" }}
        >
          <AlertTriangle size={11} style={{ color: "#ef4444", flexShrink: 0 }} />
          <span style={{ color: "#ef4444", fontWeight: 500 }}>
            {driver.violations} HOS violation{driver.violations > 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* HOS bars */}
      <div className="space-y-2">
        <HosBar label="Drive" used={driver.driveUsed} total={driver.driveCap} color={driveColor} />
        <HosBar
          label="Shift"
          used={Math.max(0, 840 - driver.shiftRemaining)}
          total={840}
          color={driver.shiftRemaining < 120 ? "#f59e0b" : "#475569"}
        />
        {driver.cycleUsed != null && driver.cycleCap != null && (
          <HosBar
            label="Cycle"
            used={driver.cycleUsed}
            total={driver.cycleCap}
            color={driver.cycleUsed / driver.cycleCap >= 0.9 ? "#ef4444" : "#334155"}
          />
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-0.5 border-t" style={{ borderColor: "var(--surface3)" }}>
        <span className="flex items-center gap-1 text-[10px] font-mono" style={{ color: "var(--text3)" }}>
          {driver.lat != null ? (
            <>
              <MapPin size={9} />
              {driver.lat.toFixed(3)}, {driver.lng?.toFixed(3)}
            </>
          ) : (
            <>
              <MapPin size={9} />
              No GPS
            </>
          )}
        </span>
        <div className="flex items-center gap-2">
          {driver.speed > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-mono" style={{ color: "var(--text3)" }}>
              <Gauge size={9} />
              {formatSpeed(driver.speed)}
            </span>
          )}
          <span
            className="flex items-center gap-1 text-[10px] font-mono font-semibold"
            style={{ color: driver.online ? "#10b981" : "var(--text3)" }}
          >
            {driver.online ? <Wifi size={9} /> : <WifiOff size={9} />}
            {driver.online ? "Online" : "Offline"}
          </span>
        </div>
      </div>
    </div>
  );
}
