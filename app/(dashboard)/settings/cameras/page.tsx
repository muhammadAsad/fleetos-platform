"use client";
import { Camera, Wifi, WifiOff, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const DEMO_CAMERAS = [
  { id: "1", vehicle: "TRK-001", type: "Front + Cabin", model: "DashCam Pro 4K", status: "online", lastEvent: "2 hours ago" },
  { id: "2", vehicle: "TRK-002", type: "Front + Cabin", model: "DashCam Pro 4K", status: "online", lastEvent: "5 hours ago" },
  { id: "3", vehicle: "TRK-003", type: "Front Only", model: "DashCam Lite", status: "offline", lastEvent: "1 day ago" },
  { id: "4", vehicle: "TRK-004", type: "Front + Cabin", model: "DashCam Pro 4K", status: "online", lastEvent: "30 min ago" },
];

export default function CamerasPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl text-text">Cameras</h2>
          <p className="text-sm text-text3 mt-0.5">Fleet dashcam management</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm text-white hover:opacity-90 transition-all" style={{ background: "var(--accent)" }}>
          <Plus size={14} /> Add Camera
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {DEMO_CAMERAS.map((cam) => (
          <div
            key={cam.id}
            className="rounded-xl border p-4 hover:border-accent/20 transition-all"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--surface2)" }}>
                  <Camera size={18} className={cam.status === "online" ? "text-green" : "text-text3"} />
                </div>
                <div>
                  <p className="font-medium text-sm text-text">{cam.vehicle}</p>
                  <p className="text-xs text-text3">{cam.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                {cam.status === "online"
                  ? <><Wifi size={12} className="text-green" /><span className="text-green">Online</span></>
                  : <><WifiOff size={12} className="text-text3" /><span className="text-text3">Offline</span></>
                }
              </div>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-text3">Model</span>
                <span className="text-text2">{cam.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text3">Last Event</span>
                <span className="text-text2">{cam.lastEvent}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
