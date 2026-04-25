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
  { icon: LayoutDashboard, label: "Overview",      href: "/admin"                },
  { icon: Users,           label: "Users",         href: "/admin/users"          },
  { icon: CreditCard,      label: "Subscriptions", href: "/admin/subscriptions"  },
  { icon: HeadphonesIcon,  label: "Support",       href: "/admin/support"        },
  { icon: Activity,        label: "Monitoring",    href: "/admin/monitoring"     },
  { icon: BarChart3,       label: "Analytics",     href: "/admin/analytics"      },
  { icon: Settings,        label: "Settings",      href: "/admin/settings"       },
];

function NavLink({ item }: { item: typeof NAV_ITEMS[number] }) {
  const pathname = usePathname();
  const isActive = pathname === item.href;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-200",
        isActive ? "font-bold" : "text-[#9ca3af] hover:text-white hover:bg-[#1f2937]"
      )}
      style={isActive ? { background: "#facc15", color: "#000" } : undefined}
    >
      <item.icon size={14} className="flex-shrink-0" />
      <span className="flex-1">{item.label}</span>
      {isActive && <ChevronRight size={11} />}
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
      style={{ width: 220, background: "#0f172a", borderRight: "1px solid #1f2937" }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 py-[14px] border-b" style={{ borderColor: "#1f2937" }}>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "#facc15" }}
        >
          <Shield size={14} style={{ color: "#000" }} />
        </div>
        <div className="min-w-0">
          <span className="font-display font-bold text-[15px] tracking-tight text-white block leading-none">FleetOS</span>
          <span className="text-[8px] font-mono font-bold tracking-[0.15em] uppercase" style={{ color: "#facc15" }}>
            Super Admin
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        <p className="px-3 mb-2 text-[9px] font-mono font-semibold uppercase tracking-[0.12em]" style={{ color: "#6b7280" }}>
          Admin Panel
        </p>
        <div className="space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>
      </nav>

      {/* Bottom */}
      <div className="px-2 py-3 border-t space-y-1" style={{ borderColor: "#1f2937" }}>
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-200 text-[#9ca3af] hover:text-white hover:bg-[#1f2937]"
        >
          <ArrowLeft size={13} className="flex-shrink-0" />
          Back to App
        </Link>

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
          style={{ background: "#1f2937", borderColor: "#374151" }}
        >
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0"
            style={{ background: "#facc15", color: "#000" }}
          >
            A
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-white truncate">Admin</p>
            <p className="text-[9px] font-mono truncate" style={{ color: "#6b7280" }}>Authenticated session</p>
          </div>
          <div className="w-1.5 h-1.5 rounded-full ml-auto flex-shrink-0" style={{ background: "#10b981", boxShadow: "0 0 5px #10b981" }} />
        </div>
      </div>
    </aside>
  );
}
