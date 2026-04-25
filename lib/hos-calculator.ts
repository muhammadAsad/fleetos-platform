import type { DriverHosSummary, HosLog } from "@/types/database";

export const HOS_RULES = {
  MAX_DRIVE_MINUTES: 660,     // 11 hours
  MAX_SHIFT_MINUTES: 840,     // 14 hours
  MIN_BREAK_MINUTES: 30,      // 30 min break after 8h drive
  BREAK_TRIGGER_MINUTES: 480, // break needed after 8h driving
  MAX_CYCLE_MINUTES: 4200,    // 70 hours / 8 days
  MIN_RESTART_MINUTES: 600,   // 10 hour off-duty reset
  FULL_RESTART_MINUTES: 2040, // 34 hour restart for cycle
};

export interface Violation {
  type: "drive_limit" | "shift_limit" | "break_required" | "cycle_limit";
  description: string;
  timestamp?: string;
}

export function calculateViolations(summary: DriverHosSummary): Violation[] {
  const violations: Violation[] = [];

  if (summary.drive_remaining_minutes <= 0 && summary.current_duty_status === "DR") {
    violations.push({ type: "drive_limit", description: "11-hour drive limit exceeded" });
  }
  if (summary.shift_remaining_minutes <= 0) {
    violations.push({ type: "shift_limit", description: "14-hour shift limit exceeded" });
  }
  if (summary.cycle_remaining_minutes <= 0) {
    violations.push({ type: "cycle_limit", description: "70-hour / 8-day cycle limit exceeded" });
  }
  if (
    summary.drive_used_minutes >= HOS_RULES.BREAK_TRIGGER_MINUTES &&
    summary.break_remaining_minutes > 0 &&
    summary.current_duty_status === "DR"
  ) {
    violations.push({ type: "break_required", description: "30-min break required after 8h driving" });
  }

  return violations;
}

export function getRemainingTime(summary: DriverHosSummary) {
  return {
    drive: summary.drive_remaining_minutes,
    shift: summary.shift_remaining_minutes,
    break: summary.break_remaining_minutes,
    cycle: summary.cycle_remaining_minutes,
    canDrive: summary.drive_remaining_minutes > 0 && summary.shift_remaining_minutes > 0,
    needsBreak:
      summary.drive_used_minutes >= HOS_RULES.BREAK_TRIGGER_MINUTES &&
      summary.break_remaining_minutes > 0,
  };
}

export function getHosBarColor(used: number, total: number): string {
  const pct = (used / total) * 100;
  if (pct >= 90) return "#ef4444";
  if (pct >= 70) return "#f59e0b";
  return "#10b981";
}
