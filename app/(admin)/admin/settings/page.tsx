"use client";
import { useState } from "react";
import {
  Shield, Bell, Key, Database, Save, CheckCircle2, Loader2,
  AlertTriangle, Plus, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_FLAGS, getFlags, saveFlags, type FeatureFlag } from "@/lib/feature-flags";

const PLAN_LIMITS = [
  { plan: "Starter", color: "#94a3b8", bg: "rgba(71,85,105,0.12)", drivers: 5, vehicles: 5, storage: "5 GB", api_calls: "10k/mo", support: "Community" },
  { plan: "Pro", color: "#60a5fa", bg: "rgba(37,99,235,0.12)", drivers: 20, vehicles: 20, storage: "50 GB", api_calls: "100k/mo", support: "Email (48h)" },
  { plan: "Fleet", color: "#a78bfa", bg: "rgba(124,58,237,0.12)", drivers: 999, vehicles: 999, storage: "500 GB", api_calls: "Unlimited", support: "Priority (4h)" },
];

const TABS = ["Feature Flags", "Plan Limits", "Notifications", "Security", "API & Keys"];

const SCOPE_COLORS: Record<string, { color: string; bg: string }> = {
  all:   { color: "#94a3b8", bg: "rgba(100,116,139,0.1)" },
  pro:   { color: "#60a5fa", bg: "rgba(37,99,235,0.1)"   },
  fleet: { color: "#a78bfa", bg: "rgba(124,58,237,0.1)"  },
};

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("Feature Flags");
  const [flags, setFlags] = useState<FeatureFlag[]>(() => getFlags());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [notifSettings, setNotifSettings] = useState({
    newSignup: true, paymentFailed: true, ticketOpened: true,
    highErrorRate: true, churnAlert: false, weeklyReport: true,
  });

  function toggleFlag(key: string) {
    setFlags((prev) => prev.map((f) => f.key === key ? { ...f, enabled: !f.enabled } : f));
  }

  async function handleSave() {
    setSaving(true);
    saveFlags(flags);
    await new Promise((r) => setTimeout(r, 700));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Tab nav */}
      <div className="flex items-center gap-1 p-1 rounded-xl border w-fit" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition-all", activeTab === tab ? "text-text" : "text-text3 hover:text-text2")}
            style={activeTab === tab ? { background: "var(--surface2)", boxShadow: "var(--shadow-sm)" } : undefined}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Feature Flags */}
      {activeTab === "Feature Flags" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text3">Toggle features on or off globally. Click <strong className="text-text">Save Changes</strong> to push to all users.</p>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-70"
              style={{ background: saved ? "#10b981" : "var(--accent)" }}
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : saved ? <CheckCircle2 size={13} /> : <Save size={13} />}
              {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
            </button>
          </div>

          <div className="rounded-xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            {flags.map((flag, i) => {
              const scope = SCOPE_COLORS[flag.scope];
              return (
                <div
                  key={flag.key}
                  className={cn("flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface2", i < flags.length - 1 ? "border-b" : "")}
                  style={{ borderColor: "var(--border)" }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-text">{flag.label}</p>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase" style={{ background: scope.bg, color: scope.color }}>
                        {flag.scope === "all" ? "All Plans" : flag.scope}
                      </span>
                    </div>
                    <p className="text-[12px] text-text3">{flag.description}</p>
                  </div>
                  <button onClick={() => toggleFlag(flag.key)} className="flex items-center gap-2 transition-all">
                    <div
                      className="relative w-11 h-6 rounded-full transition-all duration-300"
                      style={{ background: flag.enabled ? "var(--accent)" : "var(--surface3)" }}
                    >
                      <div
                        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300"
                        style={{ transform: flag.enabled ? "translateX(22px)" : "translateX(2px)" }}
                      />
                    </div>
                    <span className="text-[11px] font-mono text-text3 w-12">{flag.enabled ? "ON" : "OFF"}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Plan Limits */}
      {activeTab === "Plan Limits" && (
        <div className="space-y-4">
          <p className="text-sm text-text3">Configure resource limits for each subscription plan.</p>
          <div className="grid grid-cols-3 gap-4">
            {PLAN_LIMITS.map((plan) => (
              <div key={plan.plan} className="rounded-xl border p-5 space-y-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold px-2.5 py-1 rounded-lg font-mono" style={{ background: plan.bg, color: plan.color }}>{plan.plan}</span>
                  <button className="text-xs hover:underline" style={{ color: "var(--accent)" }}>Edit</button>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Max Drivers", value: plan.drivers === 999 ? "Unlimited" : String(plan.drivers) },
                    { label: "Max Vehicles", value: plan.vehicles === 999 ? "Unlimited" : String(plan.vehicles) },
                    { label: "Storage", value: plan.storage },
                    { label: "API Calls", value: plan.api_calls },
                    { label: "Support", value: plan.support },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-[12px] text-text3">{item.label}</span>
                      <span className="text-[12px] font-mono font-semibold text-text">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notifications */}
      {activeTab === "Notifications" && (
        <div className="space-y-4">
          <p className="text-sm text-text3">Configure which events trigger admin notifications.</p>
          <div className="rounded-xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            {[
              { key: "newSignup", label: "New Company Signup", desc: "Email when a new company registers" },
              { key: "paymentFailed", label: "Payment Failed", desc: "Alert when a subscription payment fails" },
              { key: "ticketOpened", label: "Support Ticket Opened", desc: "Notification for new support tickets" },
              { key: "highErrorRate", label: "High Error Rate", desc: "Alert when error rate exceeds 1% for 5 minutes" },
              { key: "churnAlert", label: "Churn Alert", desc: "Notify when a company cancels their subscription" },
              { key: "weeklyReport", label: "Weekly Admin Report", desc: "Weekly summary of key metrics (every Monday 9 AM)" },
            ].map((item, i, arr) => (
              <div
                key={item.key}
                className={cn("flex items-center gap-4 px-5 py-4 hover:bg-surface2 transition-colors", i < arr.length - 1 ? "border-b" : "")}
                style={{ borderColor: "var(--border)" }}
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-text">{item.label}</p>
                  <p className="text-[12px] text-text3 mt-0.5">{item.desc}</p>
                </div>
                <button onClick={() => setNotifSettings((p) => ({ ...p, [item.key]: !p[item.key as keyof typeof p] }))}>
                  <div className="relative w-11 h-6 rounded-full transition-all duration-300" style={{ background: notifSettings[item.key as keyof typeof notifSettings] ? "var(--accent)" : "var(--surface3)" }}>
                    <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300" style={{ transform: notifSettings[item.key as keyof typeof notifSettings] ? "translateX(22px)" : "translateX(2px)" }} />
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security */}
      {activeTab === "Security" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Shield,        label: "2FA Required",   desc: "Require two-factor authentication for all admin accounts",     color: "#7c3aed" },
              { icon: AlertTriangle, label: "IP Allowlist",   desc: "Restrict admin panel access to specific IP ranges",            color: "#f59e0b" },
              { icon: Key,           label: "Session Timeout",desc: "Auto-logout after 30 minutes of inactivity",                   color: "#2563eb" },
              { icon: Database,      label: "Audit Logging",  desc: "Log all admin actions to the audit trail",                     color: "#10b981" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border p-5 flex items-start gap-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${item.color}15` }}>
                  <item.icon size={18} style={{ color: item.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text">{item.label}</p>
                  <p className="text-[12px] text-text3 mt-0.5">{item.desc}</p>
                </div>
                <div className="relative w-11 h-6 rounded-full flex-shrink-0" style={{ background: "var(--accent)" }}>
                  <div className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-white shadow-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* API & Keys */}
      {activeTab === "API & Keys" && (
        <div className="space-y-4">
          <div className="rounded-xl border p-5 space-y-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text">Admin API Keys</h3>
              <button className="flex items-center gap-1.5 px-3 h-7 rounded-lg border text-xs text-text2 hover:text-text transition-all" style={{ borderColor: "var(--border)", background: "var(--surface2)" }}>
                <Plus size={12} /> New Key
              </button>
            </div>
            {[
              { name: "Production API Key",     key: "sk_live_••••••••••••••••••••••Xk9f", created: "Jan 12, 2024", lastUsed: "2m ago" },
              { name: "Webhook Signing Secret",  key: "whsec_••••••••••••••••••••••Mz3p",  created: "Jan 12, 2024", lastUsed: "5m ago" },
              { name: "Staging API Key",         key: "sk_test_••••••••••••••••••••••Ab2q", created: "Mar 8, 2024",  lastUsed: "1d ago" },
            ].map((k) => (
              <div key={k.name} className="flex items-center gap-4 p-4 rounded-xl border" style={{ background: "var(--surface2)", borderColor: "var(--border2)" }}>
                <Key size={14} className="text-text3 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text">{k.name}</p>
                  <p className="text-[11px] font-mono text-text3 mt-0.5">{k.key}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[11px] text-text3">Created {k.created}</p>
                  <p className="text-[11px] text-text3">Used {k.lastUsed}</p>
                </div>
                <button className="text-text3 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
