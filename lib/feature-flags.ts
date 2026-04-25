export interface FeatureFlag {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  scope: "all" | "fleet" | "pro";
}

export const DEFAULT_FLAGS: FeatureFlag[] = [
  { key: "realtime_tracking", label: "Real-time GPS Tracking", description: "Live position updates via Supabase realtime", enabled: true, scope: "all" },
  { key: "video_library", label: "Video Library", description: "Dashcam footage storage and playback", enabled: true, scope: "fleet" },
  { key: "advanced_ifta", label: "Advanced IFTA Reports", description: "Multi-state IFTA with tax rate lookup", enabled: true, scope: "pro" },
  { key: "live_sharing", label: "Live Location Sharing", description: "Public share links for vehicle tracking", enabled: true, scope: "all" },
  { key: "weather_overlay", label: "Weather Overlay", description: "Live weather data on fleet map", enabled: true, scope: "all" },
  { key: "api_access", label: "API Access", description: "REST API and webhook delivery", enabled: true, scope: "fleet" },
  { key: "ai_dispatch", label: "AI Dispatch Assistant", description: "AI-powered route optimization (beta)", enabled: false, scope: "fleet" },
  { key: "fuel_optimizer", label: "Fuel Price Optimizer", description: "Automatic cheapest stop suggestions along route", enabled: false, scope: "pro" },
  { key: "maintenance_alerts", label: "Maintenance Alerts", description: "Predictive maintenance notifications", enabled: false, scope: "all" },
];

const LS_KEY = "fleetos_feature_flags";

export function getFlags(): FeatureFlag[] {
  if (typeof window === "undefined") return DEFAULT_FLAGS;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULT_FLAGS;
    const saved: Record<string, boolean> = JSON.parse(raw);
    return DEFAULT_FLAGS.map((f) => ({ ...f, enabled: f.key in saved ? saved[f.key] : f.enabled }));
  } catch {
    return DEFAULT_FLAGS;
  }
}

export function saveFlags(flags: FeatureFlag[]): void {
  if (typeof window === "undefined") return;
  const map: Record<string, boolean> = {};
  flags.forEach((f) => { map[f.key] = f.enabled; });
  localStorage.setItem(LS_KEY, JSON.stringify(map));
  // Dispatch event so other tabs/components can react
  window.dispatchEvent(new CustomEvent("fleetos_flags_changed", { detail: map }));
}

export function isEnabled(key: string): boolean {
  return getFlags().find((f) => f.key === key)?.enabled ?? true;
}
