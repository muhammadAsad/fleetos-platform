import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMinutes(minutes: number): string {
  if (minutes <= 0) return "0h 00m";
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

export function formatSpeed(mph: number): string {
  return `${Math.round(mph)} mph`;
}

export function getStatusColor(status: string) {
  switch (status) {
    case "DR": return "text-green-400 bg-green-500/10";
    case "ON": return "text-yellow-400 bg-yellow-500/10";
    case "SB": return "text-blue-400 bg-blue-500/10";
    case "OFF": return "text-text3 bg-surface3";
    default: return "text-text2 bg-surface2";
  }
}

export function getStatusLabel(status: string) {
  switch (status) {
    case "DR": return "Driving";
    case "ON": return "On Duty";
    case "SB": return "Sleeper";
    case "OFF": return "Off Duty";
    default: return status;
  }
}

export function getStatusDot(status: string) {
  switch (status) {
    case "DR": return "#10b981";
    case "ON": return "#f59e0b";
    case "SB": return "#3b82f6";
    case "OFF": return "#475569";
    default: return "#475569";
  }
}
