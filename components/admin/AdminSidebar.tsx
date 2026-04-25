"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, CreditCard, HeadphonesIcon,
  Activity, Settings, BarChart3, ArrowLeft, Shield,
  ChevronRight, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Overview", href: "/admin" },
  { icon: Users, label: "Users", href: "/admin/users" },
  { icon: CreditCard, label: "Subscriptions", href: "/admin/subscriptions" },
  { icon: HeadphonesIcon, label: "Support", href: "/admin/support" },
  { icon: Activity, label: "Monitoring", href: "/admin/monitoring" },
  { icon: BarChart3, label: "Analytics", href: "/admin/analytics" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
];

function NavLink({ item }: { item: typeof NAV_ITEMS[number] }) {
  const pathname = usePathname();
  const isActive = pathname === item.href;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all relative",
        isActive ? "font-medium" : "text-text2 hover:text-text hover:bg-surface2"
      )}
      style={isActive ? { background: "rgba(124,58,237,0.12)", color: "#a78bfa" } : undefined}
    >
      {isActive && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
          style={{ background: "#7c3aed" }}
        />
      )}
      <item.icon size={14} className="flex-shrink-0" />
      <span className="flex-1">{item.label}</span>
      {isActive && <ChevronRight size={11} style={{ color: "#a78bfa" }} />}
    </Link>
  );
}

export default function AdminSidebar() {
  const router = useRouter();

  async function handleSignOut() {
    await fetch("/api/admin-auth", { method: "DELETE" });
    router.push("/dashboard");
  }

  return (
    <aside
      className="flex flex-col h-full flex-shrink-0"
      style={{
        width: 220,
        background: "var(--sidebar)",
        borderRight: "1px solid var(--border)",
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 py-[14px] border-b" style={{ borderColor: "var(--border)" }}>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
        >
          <Shield size={14} className="text-white" />
        </div>
        <div className="min-w-0">
          <span className="font-display font-bold text-[15px] tracking-tight text-text block leading-none">FleetOS</span>
          <span className="text-[8px] font-mono font-bold tracking-[0.15em] uppercase" style={{ color: "#a78bfa" }}>
            Super Admin
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        <p className="px-3 mb-2 text-[9px] font-mono font-semibold uppercase tracking-[0.12em] text-text3">
          Admin Panel
        </p>
        <div className="space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>
      </nav>

      {/* Bottom */}
      <div className="px-2 py-3 border-t space-y-1" style={{ borderColor: "var(--border)" }}>
        {/* Back to app */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-text2 hover:text-text hover:bg-surface2 transition-all"
        >
          <ArrowLeft size={13} className="flex-shrink-0" />
          Back to App
        </Link>

        {/* Sign out of admin */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all text-left"
          style={{ color: "#ef4444" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <LogOut size={13} className="flex-shrink-0" />
          Exit Admin
        </button>

        {/* Admin identity badge */}
        <div
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg border mt-1"
          style={{ background: "var(--surface2)", borderColor: "var(--border2)" }}
        >
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
          >
            A
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-text truncate">Admin</p>
            <p className="text-[9px] font-mono text-text3 truncate">Authenticated session</p>
          </div>
          <div className="w-1.5 h-1.5 rounded-full ml-auto flex-shrink-0" style={{ background: "#10b981", boxShadow: "0 0 5px #10b981" }} />
        </div>
      </div>
    </aside>
  );
}
