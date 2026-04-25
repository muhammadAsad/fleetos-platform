"use client";
import { Video, Camera, Upload, Filter } from "lucide-react";

const DEMO_CLIPS = [
  { id: "1", vehicle: "TRK-001", driver: "Carlos Martinez", event: "Forward Collision Warning", time: "Today 09:23 AM", duration: "0:32", thumbnail: null },
  { id: "2", vehicle: "TRK-003", driver: "Mike Davis", event: "Hard Braking Event", time: "Today 07:44 AM", duration: "0:45", thumbnail: null },
  { id: "3", vehicle: "TRK-002", driver: "Ana Garcia", event: "Lane Departure", time: "Yesterday 3:12 PM", duration: "0:28", thumbnail: null },
  { id: "4", vehicle: "TRK-005", driver: "Kevin Johnson", event: "Requested Clip", time: "Yesterday 11:05 AM", duration: "1:02", thumbnail: null },
];

export default function VideoLibraryPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl text-text">Video Library</h2>
          <p className="text-sm text-text3 mt-0.5">Dashcam footage and safety event recordings</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 h-8 rounded-lg border text-sm text-text2 hover:text-text transition-all" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
            <Filter size={13} /> Filter
          </button>
          <button className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm text-white hover:opacity-90 transition-all" style={{ background: "var(--accent)" }}>
            <Upload size={13} /> Request Clip
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Clips", value: "48", color: "#2563eb" },
          { label: "Safety Events", value: "12", color: "#ef4444" },
          { label: "Cameras Online", value: "4/5", color: "#10b981" },
          { label: "Storage Used", value: "23 GB", color: "#f59e0b" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <p className="text-xs font-mono text-text3 uppercase tracking-wide">{s.label}</p>
            <p className="font-display font-bold text-2xl mt-1" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Clip Grid */}
      <div className="grid grid-cols-2 gap-4">
        {DEMO_CLIPS.map((clip) => (
          <div
            key={clip.id}
            className="rounded-xl border overflow-hidden hover:border-accent/30 transition-all cursor-pointer group"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            {/* Thumbnail */}
            <div
              className="aspect-video flex items-center justify-center relative"
              style={{ background: "var(--surface2)" }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center group-hover:bg-accent/60 transition-colors">
                  <Video size={20} className="text-white ml-0.5" />
                </div>
              </div>
              <Camera size={40} className="text-text3 opacity-20" />
              <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-[10px] font-mono text-white">
                {clip.duration}
              </div>
            </div>
            {/* Info */}
            <div className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-text">{clip.event}</p>
                  <p className="text-xs text-text3 mt-0.5">{clip.vehicle} · {clip.driver}</p>
                </div>
                <span className="text-[10px] font-mono text-text3 flex-shrink-0">{clip.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
