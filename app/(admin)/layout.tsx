"use client";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { usePathname } from "next/navigation";
import { Shield } from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";

const PAGE_TITLES: Record<string, string> = {
  "/admin": "Overview",
  "/admin/users": "User Management",
  "/admin/subscriptions": "Subscriptions",
  "/admin/support": "Support Center",
  "/admin/monitoring": "System Monitoring",
  "/admin/analytics": "Analytics",
  "/admin/settings": "Admin Settings",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "Admin";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>
      <AdminSidebar />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Admin topbar */}
        <header
          className="flex items-center gap-3 px-5 border-b flex-shrink-0"
          style={{
            height: 52,
            background: "var(--sidebar)",
            borderColor: "var(--border)",
            boxShadow: "0 1px 0 var(--border)",
          }}
        >
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <span
              className="flex items-center gap-1.5 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border flex-shrink-0"
              style={{
                background: "rgba(124,58,237,0.12)",
                color: "#a78bfa",
                borderColor: "rgba(124,58,237,0.25)",
              }}
            >
              <Shield size={9} />
              ADMIN
            </span>
            <h1 className="font-display font-bold text-[15px] text-text truncate">{title}</h1>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono"
              style={{ background: "rgba(16,185,129,0.08)", borderColor: "rgba(16,185,129,0.2)", color: "#10b981" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              All systems operational
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-auto p-5">
          {children}
        </main>
      </div>
    </div>
  );
}
