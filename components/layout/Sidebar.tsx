"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Map, Share2, Search, Clock, FileText,
  AlertTriangle, Video, BarChart2, Settings, HelpCircle,
  Truck, ChevronDown, ChevronRight, Users, Car, Cpu, Camera,
  Sliders, Key, Building2, CreditCard, UserCircle,
  ClipboardCheck, History, Zap, Fuel, Cloud, Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getFlags } from "@/lib/feature-flags";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href?: string;
  badge?: string | number;
  badgeVariant?: "red" | "cyan" | "yellow" | "green";
  soon?: boolean;
  flagKey?: string;
  children?: NavItem[];
}

const SETTINGS_ITEMS: NavItem[] = [
  { icon: Building2,   label: "Company",       href: "/settings/company"       },
  { icon: CreditCard,  label: "Billing",        href: "/settings/billing"       },
  { icon: Users,       label: "Users",          href: "/settings/users"         },
  { icon: UserCircle,  label: "Drivers",        href: "/settings/drivers"       },
  { icon: Car,         label: "Vehicles",       href: "/settings/vehicles"      },
  { icon: Cpu,         label: "ELD Devices",    href: "/settings/eld"           },
  { icon: Camera,      label: "Cameras",        href: "/settings/cameras"       },
  { icon: Sliders,     label: "Configuration",  href: "/settings/configuration" },
  { icon: Key,         label: "API Key",        href: "/settings/api-key"       },
];

function NavLink({ item, depth = 0 }: { item: NavItem; depth?: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(() => {
    if (item.children) return item.children.some((c) => c.href && pathname.startsWith(c.href));
    return false;
  });
  const isActive = item.href ? pathname === item.href || pathname.startsWith(item.href + "/") : false;

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all", "text-text2 hover:text-text hover:bg-surface2", open && "text-text")}
        >
          <item.icon size={14} className="flex-shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
          {open ? <ChevronDown size={12} className="text-text3" /> : <ChevronRight size={12} className="text-text3" />}
        </button>
        {open && (
          <div className="ml-4 mt-0.5 space-y-0.5 border-l pl-3" style={{ borderColor: "var(--border2)" }}>
            {item.children.map((child) => <NavLink key={child.href} item={child} depth={depth + 1} />)}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href!}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all relative",
        isActive ? "text-accent font-medium" : "text-text2 hover:text-text hover:bg-surface2"
      )}
      style={isActive ? { background: "var(--accent-glow)" } : undefined}
    >
      {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full" style={{ background: "var(--accent)" }} />}
      <item.icon size={14} className="flex-shrink-0" />
      <span className="flex-1">{item.label}</span>
      {item.soon && (
        <span className="text-[9px] font-mono font-bold px-1 py-0.5 rounded border" style={{ background: "rgba(6,182,212,0.1)", color: "var(--cyan)", borderColor: "rgba(6,182,212,0.2)" }}>
          SOON
        </span>
      )}
      {item.badge !== undefined && (
        <span className={cn(
          "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded",
          item.badgeVariant === "red"   ? "bg-red/10 text-[#ef4444]" :
          item.badgeVariant === "cyan"  ? "bg-cyan/10 text-cyan" :
          item.badgeVariant === "green" ? "bg-green/10 text-green" :
          "bg-yellow/10 text-yellow"
        )}>
          {item.badge}
        </span>
      )}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(pathname.startsWith("/settings"));
  const [enabledFlags, setEnabledFlags] = useState<Record<string, boolean>>({});

  useEffect(() => {
    function loadFlags() {
      const map: Record<string, boolean> = {};
      getFlags().forEach((f) => { map[f.key] = f.enabled; });
      setEnabledFlags(map);
    }
    loadFlags();
    window.addEventListener("fleetos_flags_changed", loadFlags as EventListener);
    return () => window.removeEventListener("fleetos_flags_changed", loadFlags as EventListener);
  }, []);

  function flagOn(key: string) {
    // If flags haven't loaded yet or key not in map, default true
    return key in enabledFlags ? enabledFlags[key] : true;
  }

  const NAV_GROUPS: { label?: string; items: NavItem[] }[] = [
    {
      items: [
        { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
      ],
    },
    {
      label: "Fleet",
      items: [
        { icon: Map,     label: "Live Map",         href: "/map"          },
        ...(flagOn("live_sharing")    ? [{ icon: Share2,  label: "Live Sharing",     href: "/live-sharing" }] : []),
        { icon: Search,  label: "Proximity Search",  href: "/proximity"    },
        { icon: History, label: "Tracking History",  href: "/tracking"     },
        ...(flagOn("fuel_optimizer")  ? [{ icon: Fuel,    label: "Fuel Locations",   href: "/fuel"         }] : []),
        ...(flagOn("weather_overlay") ? [{ icon: Cloud,   label: "Weather",          href: "/weather"      }] : []),
      ],
    },
    {
      label: "Driver Logs",
      items: [
        { icon: Clock,        label: "Driver HoS",         href: "/hos"    },
        { icon: FileText,     label: "Logs",                href: "/logs"   },
        { icon: AlertTriangle,label: "Unidentified Events", href: "/events" },
        { icon: Bell,         label: "Driver Alarms",       href: "/alerts" },
        { icon: ClipboardCheck,label: "DVIR",               href: "/dvir"   },
        ...(flagOn("video_library")   ? [{ icon: Video,      label: "Video Library",    href: "/video"  }] : []),
      ],
    },
    {
      label: "Reports",
      items: [
        {
          icon: BarChart2,
          label: "Reports",
          children: [
            ...(flagOn("advanced_ifta") ? [{ icon: BarChart2, label: "IFTA",       href: "/reports/ifta"       }] : []),
            { icon: BarChart2, label: "FMCSA",      href: "/reports/fmcsa"      },
            { icon: BarChart2, label: "Driver Log",  href: "/reports/driver-log" },
          ],
        },
      ],
    },
  ];

  return (
    <aside
      className="flex flex-col h-full"
      style={{ width: 224, background: "var(--sidebar)", borderRight: "1px solid var(--border)", flexShrink: 0 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-[14px] border-b" style={{ borderColor: "var(--border)" }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--accent)" }}>
          <Truck size={14} className="text-white" />
        </div>
        <div className="min-w-0">
          <span className="font-display font-bold text-[15px] tracking-tight text-text block leading-none">FleetOS</span>
          <span className="text-[9px] font-mono text-text3 tracking-wide">ELD PLATFORM</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-4 overflow-y-auto min-h-0">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p className="px-3 mb-1 text-[9px] font-mono font-semibold text-text3 uppercase tracking-[0.12em]">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink key={item.label} item={item} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-2 border-t space-y-0.5" style={{ borderColor: "var(--border)" }}>
        <NavLink item={{ icon: HelpCircle, label: "Help & Support", href: "/help" }} />

        {/* Settings accordion */}
        <button
          onClick={() => setSettingsOpen(!settingsOpen)}
          className={cn(
            "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all",
            settingsOpen ? "text-text bg-surface2" : "text-text2 hover:text-text hover:bg-surface2"
          )}
        >
          <Settings size={14} className="flex-shrink-0" />
          <span className="flex-1 text-left">Settings</span>
          {settingsOpen ? <ChevronDown size={12} className="text-text3" /> : <ChevronRight size={12} className="text-text3" />}
        </button>
        {settingsOpen && (
          <div className="ml-4 border-l pl-3 space-y-0.5" style={{ borderColor: "var(--border2)" }}>
            {SETTINGS_ITEMS.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* Demo + Company badge */}
      <div className="px-3 pb-3 pt-2 border-t space-y-2" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={async () => {
            try {
              await fetch("/api/simulator", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "start" }) });
              window.location.href = "/dashboard";
            } catch {}
          }}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[13px] font-semibold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: "linear-gradient(135deg, var(--accent), #7c3aed)", boxShadow: "0 2px 12px rgba(37,99,235,0.3)" }}
        >
          <Zap size={13} />
          Try Demo Fleet
        </button>

        {/* Company badge */}
        <div
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg border"
          style={{ background: "var(--surface2)", borderColor: "var(--border2)" }}
        >
          <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white" style={{ background: "var(--accent)" }}>
            V
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-text truncate">VER 89569</p>
            <p className="text-[9px] font-mono text-text3">Active plan</p>
          </div>
          <div className="w-1.5 h-1.5 rounded-full ml-auto flex-shrink-0" style={{ background: "#10b981", boxShadow: "0 0 6px #10b981" }} />
        </div>
      </div>
    </aside>
  );
}
