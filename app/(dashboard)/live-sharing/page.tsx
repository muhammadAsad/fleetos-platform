"use client";
import { useState } from "react";
import { Share2, Copy, Check, ExternalLink, Lock, Globe, Truck } from "lucide-react";

interface ShareLink {
  id: string;
  name: string;
  vehicles: string[];
  url: string;
  expiresAt: string;
  active: boolean;
}

const DEMO_LINKS: ShareLink[] = [
  {
    id: "1",
    name: "Customer Delivery Share",
    vehicles: ["TRK-001", "TRK-002"],
    url: "https://share.fleetosdemo.com/s/abc123",
    expiresAt: "2026-05-01",
    active: true,
  },
  {
    id: "2",
    name: "Dispatch Team View",
    vehicles: ["TRK-001", "TRK-002", "TRK-003", "TRK-004", "TRK-005"],
    url: "https://share.fleetosdemo.com/s/xyz789",
    expiresAt: "2026-06-01",
    active: true,
  },
];

export default function LiveSharingPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newLinkName, setNewLinkName] = useState("");
  const [shareType, setShareType] = useState<"public" | "private">("private");

  function copy(url: string, id: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl text-text">Live Sharing</h2>
          <p className="text-sm text-text3 mt-0.5">
            Share real-time vehicle locations with customers or team members
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 h-9 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-all"
          style={{ background: "var(--accent)" }}
        >
          <Share2 size={14} /> Create Share Link
        </button>
      </div>

      {/* How it works */}
      <div
        className="rounded-xl border p-5 grid grid-cols-3 gap-4"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        {[
          { icon: Share2, color: "#2563eb", title: "Create a link", desc: "Choose which vehicles to share and set an expiry date" },
          { icon: Globe, color: "#10b981", title: "Share the URL", desc: "Send the link to customers, brokers, or team members" },
          { icon: Truck, color: "#06b6d4", title: "Live tracking", desc: "Recipients see real-time truck positions on an interactive map" },
        ].map((step) => (
          <div key={step.title} className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: `${step.color}18` }}>
              <step.icon size={16} style={{ color: step.color }} />
            </div>
            <div>
              <p className="text-sm font-medium text-text">{step.title}</p>
              <p className="text-xs text-text3 mt-0.5">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Active Links */}
      <div>
        <h3 className="font-medium text-sm text-text2 mb-3">Active Share Links</h3>
        <div className="space-y-3">
          {DEMO_LINKS.map((link) => (
            <div
              key={link.id}
              className="rounded-xl border p-4"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-text">{link.name}</p>
                    <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-green/10 text-green border border-green/20">
                      <span className="w-1 h-1 rounded-full bg-green" /> LIVE
                    </span>
                  </div>
                  <p className="text-xs text-text3">
                    {link.vehicles.join(", ")} · Expires {link.expiresAt}
                  </p>
                  <div
                    className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg border w-fit"
                    style={{ background: "var(--surface2)", borderColor: "var(--border)" }}
                  >
                    <span className="text-xs font-mono text-text3 truncate max-w-[280px]">{link.url}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => copy(link.url, link.id)}
                    className="flex items-center gap-1.5 px-3 h-8 rounded-lg border text-sm transition-all hover:border-accent/30"
                    style={{ borderColor: "var(--border)", background: "var(--surface2)", color: copied === link.id ? "#10b981" : "var(--text2)" }}
                  >
                    {copied === link.id ? <Check size={13} /> : <Copy size={13} />}
                    {copied === link.id ? "Copied!" : "Copy"}
                  </button>
                  <button className="flex items-center gap-1.5 px-3 h-8 rounded-lg border text-sm text-text2 hover:text-text transition-all hover:border-accent/30" style={{ borderColor: "var(--border)", background: "var(--surface2)" }}>
                    <ExternalLink size={13} /> Open
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Link Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative w-full max-w-md rounded-2xl border shadow-2xl animate-fade-in" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-display font-bold text-base text-text">Create Share Link</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text3">Link Name</label>
                <input
                  value={newLinkName}
                  onChange={(e) => setNewLinkName(e.target.value)}
                  placeholder="e.g. Customer Delivery Tracking"
                  className="w-full h-9 px-3 rounded-lg border text-sm text-text focus:outline-none focus:border-accent"
                  style={{ background: "var(--surface2)", borderColor: "var(--border)" }}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text3">Access Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["private", "public"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setShareType(type)}
                      className="flex items-center gap-2 p-3 rounded-lg border transition-all text-sm"
                      style={{
                        borderColor: shareType === type ? "var(--accent)" : "var(--border)",
                        background: shareType === type ? "rgba(37,99,235,0.1)" : "var(--surface2)",
                        color: shareType === type ? "var(--accent)" : "var(--text2)",
                      }}
                    >
                      {type === "private" ? <Lock size={14} /> : <Globe size={14} />}
                      {type === "private" ? "Password Protected" : "Public Link"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t" style={{ borderColor: "var(--border)" }}>
              <button onClick={() => setShowCreate(false)} className="px-4 h-8 rounded-lg border text-sm text-text2" style={{ borderColor: "var(--border)" }}>Cancel</button>
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 h-8 rounded-lg text-sm text-white hover:opacity-90"
                style={{ background: "var(--accent)" }}
              >
                Generate Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
