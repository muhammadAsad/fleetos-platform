import { Truck, MapPin, Clock, Wifi } from "lucide-react";

interface Props {
  params: { id: string };
}

export default function PublicSharePage({ params }: Props) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0a0f1a", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#1e2d45" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#3b82f6" }}>
            <Truck size={14} className="text-white" />
          </div>
          <span className="font-bold text-lg text-white tracking-tight">FleetOS</span>
          <span className="text-xs font-mono px-2 py-0.5 rounded-lg ml-1" style={{ background: "rgba(59,130,246,0.15)", color: "#60a5fa" }}>
            LIVE SHARE
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-mono" style={{ color: "#10b981" }}>
          <Wifi size={12} />
          Live tracking active
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
        <div className="w-full max-w-lg space-y-4">
          {/* Share info card */}
          <div className="rounded-2xl border p-6 space-y-4" style={{ background: "#0d1627", borderColor: "#1e2d45" }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(59,130,246,0.1)" }}>
                <MapPin size={22} style={{ color: "#3b82f6" }} />
              </div>
              <div>
                <p className="font-bold text-lg text-white">Live Location Share</p>
                <p className="text-sm" style={{ color: "#64748b" }}>Share ID: {params.id}</p>
              </div>
            </div>

            <div className="rounded-xl p-4 space-y-3" style={{ background: "#111827" }}>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: "#64748b" }}>Status</span>
                <span className="flex items-center gap-1.5 font-medium" style={{ color: "#10b981" }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#10b981" }} />
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: "#64748b" }}>Shared by</span>
                <span className="font-mono text-white">FleetOS Demo Fleet</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: "#64748b" }}>Access</span>
                <span className="font-mono" style={{ color: "#3b82f6" }}>View Only</span>
              </div>
            </div>

            {/* Mock location data */}
            <div className="space-y-3">
              {[
                { vehicle: "TRK-001", driver: "John Smith", status: "Driving", speed: "62 mph", lat: "41.8781", lng: "-87.6298", statusColor: "#10b981" },
                { vehicle: "TRK-002", driver: "Maria Garcia", status: "On Duty", speed: "0 mph", lat: "41.5000", lng: "-90.5776", statusColor: "#f59e0b" },
              ].map((t) => (
                <div key={t.vehicle} className="rounded-xl border p-3.5" style={{ background: "#0a0f1a", borderColor: "#1e2d45" }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm" style={{ color: "#3b82f6" }}>{t.vehicle}</span>
                      <span className="text-xs" style={{ color: "#94a3b8" }}>{t.driver}</span>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg"
                      style={{ background: `${t.statusColor}15`, color: t.statusColor }}>
                      {t.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p style={{ color: "#475569" }}>Speed</p>
                      <p className="font-mono text-white">{t.speed}</p>
                    </div>
                    <div>
                      <p style={{ color: "#475569" }}>Latitude</p>
                      <p className="font-mono text-white">{t.lat}</p>
                    </div>
                    <div>
                      <p style={{ color: "#475569" }}>Longitude</p>
                      <p className="font-mono text-white">{t.lng}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-xs" style={{ color: "#475569" }}>
            This link was shared by a FleetOS customer. Location updates every 5 seconds.
          </p>
        </div>
      </div>

      <footer className="px-6 py-4 border-t text-center text-xs" style={{ borderColor: "#1e2d45", color: "#475569" }}>
        Powered by <span className="text-white font-medium">FleetOS</span> — FMCSA-compliant ELD fleet management
      </footer>
    </div>
  );
}
