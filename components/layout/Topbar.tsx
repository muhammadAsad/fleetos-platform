"use client";
import { useEffect, useState, useRef } from "react";
import {
  Search, Bell, AlertTriangle, Clock, WifiOff, Gauge,
  X, ChevronDown, LogOut, Settings, User, Camera, Save, Loader2, CheckCircle2,
} from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface TopbarProps {
  title: string;
  simulatorRunning?: boolean;
  onToggleSimulator?: () => void;
}

interface AlertItem {
  id: string;
  type: "violation" | "break" | "offline" | "speed";
  driver: string;
  message: string;
  time: string;
  read: boolean;
}

const ALERT_ICONS: Record<AlertItem["type"], React.ElementType> = {
  violation: AlertTriangle,
  break: Clock,
  offline: WifiOff,
  speed: Gauge,
};

const ALERT_COLORS: Record<AlertItem["type"], string> = {
  violation: "#ef4444",
  break: "#f59e0b",
  offline: "#64748b",
  speed: "#f97316",
};

export default function Topbar({ title }: TopbarProps) {
  const supabase = createClient();
  const router = useRouter();

  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileRole, setProfileRole] = useState("Fleet Administrator");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const alertsRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Load auth user — real Supabase first, fall back to localStorage (demo/mock mode)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (user?.email) {
        const meta = user.user_metadata ?? {};
        setProfileEmail(user.email);
        setProfileName(meta.full_name ?? meta.name ?? user.email.split("@")[0]);
        if (meta.role) setProfileRole(meta.role);
        return;
      }
      // Mock/demo mode: use email stored at login
      const storedEmail = localStorage.getItem("fleetos_user_email") ?? "";
      if (storedEmail) {
        setProfileEmail(storedEmail);
        setProfileName(storedEmail.split("@")[0]);
      }
    });
  }, []);

  // Clock
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
      setDate(now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  // Load alerts
  useEffect(() => {
    async function loadAlerts() {
      const { data } = await supabase
        .from("driver_hos_summary")
        .select("*, drivers(name)")
        .or("violations.gt.0,online_status.eq.offline");
      if (!data) return;
      const items: AlertItem[] = [];
      data.forEach((s: any) => {
        if (s.violations > 0) {
          items.push({
            id: `v-${s.id}`,
            type: "violation",
            driver: s.drivers?.name ?? "Unknown",
            message: `HOS violation — ${s.violations} rule${s.violations > 1 ? "s" : ""} exceeded`,
            time: s.last_updated ? new Date(s.last_updated).toLocaleTimeString() : "",
            read: false,
          });
        }
        if (s.online_status === "offline" && s.drivers?.name) {
          items.push({
            id: `o-${s.id}`,
            type: "offline",
            driver: s.drivers.name,
            message: "ELD device went offline",
            time: s.last_updated ? new Date(s.last_updated).toLocaleTimeString() : "",
            read: false,
          });
        }
        if (s.drive_remaining_minutes != null && s.drive_remaining_minutes < 60 && s.current_duty_status === "DR") {
          items.push({
            id: `b-${s.id}`,
            type: "break",
            driver: s.drivers?.name ?? "Unknown",
            message: `Break required in ${s.drive_remaining_minutes}min`,
            time: "",
            read: false,
          });
        }
      });
      setAlerts(items);
    }
    loadAlerts();
    const channel = supabase.channel("topbar-alerts")
      .on("postgres_changes", { event: "*", schema: "public", table: "driver_hos_summary" }, loadAlerts)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (alertsRef.current && !alertsRef.current.contains(e.target as Node)) setShowAlerts(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUser(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close profile modal on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setShowProfile(false);
    }
    if (showProfile) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [showProfile]);

  const unread = alerts.filter((a) => !a.read).length;
  function markAllRead() { setAlerts((p) => p.map((a) => ({ ...a, read: true }))); }

  async function handleSignOut() {
    setSigningOut(true);
    try { await supabase.auth.signOut(); } catch {}
    router.push("/login");
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    setProfileSaving(false);
    setProfileSaved(true);
    setTimeout(() => { setProfileSaved(false); setShowProfile(false); }, 1800);
  }

  const avatar = profileName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <>
      <header
        className="flex items-center gap-3 px-5 border-b flex-shrink-0"
        style={{
          height: 52,
          borderColor: "var(--border)",
          background: "var(--sidebar)",
          boxShadow: "0 1px 0 var(--border)",
          zIndex: 40,
          position: "relative",
        }}
      >
        {/* Page title */}
        <h1 className="font-display font-bold text-[15px] text-text flex-1 min-w-0 truncate">{title}</h1>

        {/* Search pill */}
        <div
          className="flex items-center gap-2 px-3 h-8 rounded-full border text-xs text-text3 cursor-pointer hover:border-accent/40 hover:text-text2 transition-all"
          style={{ borderColor: "var(--border2)", background: "var(--surface2)", minWidth: 200 }}
        >
          <Search size={12} style={{ color: "var(--accent)", flexShrink: 0 }} />
          <span className="truncate">Search drivers, vehicles...</span>
          <kbd className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: "var(--surface3)", color: "var(--text3)" }}>⌘K</kbd>
        </div>

        {/* Clock */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono flex-shrink-0">
          <span className="text-text3">{date}</span>
          <span className="font-semibold text-text2">{time}</span>
        </div>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Alerts bell */}
        <div className="relative flex-shrink-0" ref={alertsRef}>
          <button
            onClick={() => { setShowAlerts((v) => !v); setShowUser(false); }}
            className={cn(
              "relative w-8 h-8 rounded-lg border flex items-center justify-center transition-all",
              showAlerts
                ? "border-yellow-400/50 bg-yellow-400/10 text-yellow-400"
                : "text-text2 hover:text-text hover:bg-surface2"
            )}
            style={{ borderColor: showAlerts ? "rgba(250,204,21,0.5)" : "var(--border)" }}
          >
            <Bell size={14} />
            {unread > 0 && (
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
                style={{ background: "#ef4444" }}
              >
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>

          {showAlerts && (
            <div
              className="absolute right-0 w-80 rounded-xl border overflow-hidden"
              style={{
                top: "calc(100% + 8px)",
                background: "var(--surface)",
                borderColor: "var(--border2)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
                zIndex: 100,
              }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-text">Alerts</p>
                  {unread > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold" style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}>
                      {unread} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unread > 0 && (
                    <button onClick={markAllRead} className="text-xs hover:underline" style={{ color: "#facc15" }}>
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setShowAlerts(false)} className="text-text3 hover:text-text">
                    <X size={13} />
                  </button>
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="py-8 text-center">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2" style={{ background: "rgba(16,185,129,0.1)" }}>
                      <Bell size={16} style={{ color: "#10b981" }} />
                    </div>
                    <p className="text-sm font-medium text-text2">All clear</p>
                    <p className="text-xs text-text3 mt-0.5">No active alerts</p>
                  </div>
                ) : (
                  alerts.map((alert) => {
                    const Icon = ALERT_ICONS[alert.type];
                    const color = ALERT_COLORS[alert.type];
                    return (
                      <div
                        key={alert.id}
                        className={cn(
                          "flex items-start gap-3 px-4 py-3 border-b transition-colors hover:bg-surface2",
                          !alert.read ? "bg-accent/[0.03]" : ""
                        )}
                        style={{ borderColor: "var(--border)" }}
                      >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${color}18` }}>
                          <Icon size={13} style={{ color }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-text truncate">{alert.driver}</p>
                            {!alert.read && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#facc15" }} />}
                          </div>
                          <p className="text-xs text-text3 mt-0.5">{alert.message}</p>
                          {alert.time && <p className="text-[10px] font-mono text-text3 mt-1">{alert.time}</p>}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* User avatar dropdown */}
        <div className="relative flex-shrink-0" ref={userRef}>
          <button
            onClick={() => { setShowUser((v) => !v); setShowAlerts(false); }}
            className="flex items-center gap-2 pl-1 pr-2.5 h-8 rounded-lg border transition-all hover:bg-surface2"
            style={{
              borderColor: showUser ? "var(--border2)" : "var(--border)",
              background: showUser ? "var(--surface2)" : "transparent",
            }}
          >
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold font-display flex-shrink-0"
              style={{ background: "#facc15", color: "#000" }}
            >
              {avatar}
            </div>
            <span className="text-xs font-medium text-text2 max-w-[80px] truncate">{profileName.split(" ")[0]}</span>
            <ChevronDown size={11} className={cn("text-text3 transition-transform duration-200", showUser && "rotate-180")} />
          </button>

          {showUser && (
            <div
              className="absolute right-0 w-56 rounded-xl border overflow-hidden"
              style={{
                top: "calc(100% + 8px)",
                background: "var(--surface)",
                borderColor: "var(--border2)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
                zIndex: 100,
              }}
            >
              {/* User info header */}
              <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold font-display flex-shrink-0"
                    style={{ background: "#facc15", color: "#000" }}
                  >
                    {avatar}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text truncate">{profileName}</p>
                    <p className="text-[10px] text-text3 truncate">{profileEmail}</p>
                  </div>
                </div>
                <span
                  className="inline-block mt-2 text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
                  style={{ background: "rgba(250,204,21,0.12)", color: "#facc15" }}
                >
                  {profileRole}
                </span>
              </div>

              {/* Menu items */}
              <div className="p-1.5">
                <button
                  onClick={() => { setShowProfile(true); setShowUser(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-text2 hover:text-text hover:bg-surface2 transition-all text-left"
                >
                  <User size={13} />
                  Edit Profile
                </button>
                <Link
                  href="/settings/company"
                  onClick={() => setShowUser(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-text2 hover:text-text hover:bg-surface2 transition-all"
                >
                  <Settings size={13} />
                  Settings
                </Link>
                <div className="border-t my-1" style={{ borderColor: "var(--border)" }} />
                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all text-left disabled:opacity-50"
                  style={{ color: "#ef4444" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {signingOut ? <Loader2 size={13} className="animate-spin" /> : <LogOut size={13} />}
                  {signingOut ? "Signing out..." : "Sign Out"}
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ─── Profile Modal (outside header to avoid stacking-context clipping) ─── */}
      {showProfile && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", zIndex: 9999 }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) setShowProfile(false); }}
        >
          <div
            className="w-full max-w-md rounded-2xl border overflow-hidden"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border2)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.8)",
            }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <h2 className="font-display font-bold text-base text-text">My Profile</h2>
              <button
                onClick={() => setShowProfile(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-text3 hover:text-text hover:bg-surface2 transition-all"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-5">
              {/* Avatar row */}
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold font-display flex-shrink-0"
                  style={{ background: "#facc15", color: "#000" }}
                >
                  {avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text">{profileName}</p>
                  <p className="text-xs text-text3 mt-0.5">{profileRole}</p>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 mt-2 text-xs hover:underline"
                    style={{ color: "#facc15" }}
                  >
                    <Camera size={11} />
                    Change avatar
                  </button>
                </div>
              </div>

              {/* Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text3)" }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border text-sm text-text outline-none transition-all"
                    style={{ background: "var(--surface2)", borderColor: "var(--border2)", color: "var(--text)" }}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(250,204,21,0.6)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border2)")}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text3)" }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-all"
                    style={{ background: "var(--surface2)", borderColor: "var(--border2)", color: "var(--text)" }}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(250,204,21,0.6)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border2)")}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text3)" }}>
                    Role
                  </label>
                  <select
                    value={profileRole}
                    onChange={(e) => setProfileRole(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-all cursor-pointer"
                    style={{ background: "var(--surface2)", borderColor: "var(--border2)", color: "var(--text)" }}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(250,204,21,0.6)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border2)")}
                  >
                    <option value="Fleet Administrator">Fleet Administrator</option>
                    <option value="Dispatcher">Dispatcher</option>
                    <option value="Safety Manager">Safety Manager</option>
                    <option value="Owner/Operator">Owner / Operator</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={profileSaving || profileSaved}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-70 active:scale-95"
                  style={{ background: profileSaved ? "#10b981" : "#facc15", color: profileSaved ? "#fff" : "#000" }}
                >
                  {profileSaving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : profileSaved ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    <Save size={14} />
                  )}
                  {profileSaving ? "Saving..." : profileSaved ? "Saved!" : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowProfile(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-text2 hover:text-text hover:bg-surface2 transition-all border"
                  style={{ borderColor: "var(--border2)" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
