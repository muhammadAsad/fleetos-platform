"use client";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/map": "Live Map",
  "/live-sharing": "Live Sharing",
  "/proximity": "Proximity Search",
  "/tracking": "Tracking History",
  "/fuel": "Fuel Locations & Pricing",
  "/weather": "Live & Upcoming Weather",
  "/alerts": "Driver Alarms",
  "/hos": "Driver HoS",
  "/logs": "Logs",
  "/events": "Unidentified Events",
  "/dvir": "DVIR",
  "/video": "Video Library",
  "/debug": "Debug Panel",
  "/help": "Help & Support",
  "/reports/ifta": "IFTA Report",
  "/reports/fmcsa": "FMCSA Report",
  "/reports/driver-log": "Driver Log Report",
  "/settings/company": "Company Settings",
  "/settings/billing": "Billing",
  "/settings/users": "Users",
  "/settings/drivers": "Drivers",
  "/settings/vehicles": "Vehicles",
  "/settings/eld": "ELD Devices",
  "/settings/cameras": "Cameras",
  "/settings/configuration": "Configuration",
  "/settings/api-key": "API Key",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "FleetOS";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar title={title} />
        <main className={`flex-1 overflow-auto ${pathname === "/map" ? "p-0" : "p-5"}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
