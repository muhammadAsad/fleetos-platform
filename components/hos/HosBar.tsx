import { cn } from "@/lib/utils";
import { formatMinutes } from "@/lib/utils";

interface HosBarProps {
  used: number;
  total: number;
  label?: string;
  showLabel?: boolean;
  compact?: boolean;
}

export function HosBar({ used, total, label, showLabel = true, compact = false }: HosBarProps) {
  const pct = Math.min(100, total > 0 ? (used / total) * 100 : 0);
  const remaining = Math.max(0, total - used);
  const color = pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : "#10b981";

  return (
    <div className={cn("space-y-1", compact ? "min-w-[100px]" : "min-w-[130px]")}>
      {showLabel && label && (
        <span className="text-[10px] font-mono text-text3">{label}</span>
      )}
      <div
        className="rounded-full overflow-hidden"
        style={{ height: compact ? 4 : 6, background: "var(--surface3)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      {!compact && (
        <span className="text-[10px] font-mono" style={{ color }}>
          {formatMinutes(remaining)} left
        </span>
      )}
    </div>
  );
}

interface StatusBadgeProps {
  status: string;
  animated?: boolean;
}

const STATUS_CONFIG = {
  DR: { label: "Driving", color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.2)" },
  ON: { label: "On Duty", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.2)" },
  SB: { label: "Sleeper", color: "#3b82f6", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.2)" },
  OFF: { label: "Off Duty", color: "#475569", bg: "rgba(71,85,105,0.1)", border: "rgba(71,85,105,0.2)" },
  VIOLATION: { label: "Violation", color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.2)" },
};

export function StatusBadge({ status, animated }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.OFF;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
    >
      <span
        className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", animated && status === "DR" ? "animate-pulse" : "")}
        style={{ background: cfg.color }}
      />
      {cfg.label}
    </span>
  );
}
