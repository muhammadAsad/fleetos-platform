"use client";
import { useState } from "react";
import { Key, Copy, Check, RefreshCw, Eye, EyeOff } from "lucide-react";

export default function ApiKeyPage() {
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [apiKey, setApiKey] = useState("fleetos_live_sk_8f2a3b9c1d4e5f6a7b8c9d0e1f2a3b4c");

  function copy() {
    navigator.clipboard.writeText(apiKey).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function rotate() {
    setRotating(true);
    setTimeout(() => {
      const chars = "abcdef0123456789";
      const newKey = "fleetos_live_sk_" + Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
      setApiKey(newKey);
      setRotating(false);
    }, 1000);
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h2 className="font-display font-bold text-2xl text-text">API Key</h2>
        <p className="text-sm text-text3 mt-0.5">Use this key to access the FleetOS REST API</p>
      </div>

      <div className="rounded-xl border p-5 space-y-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--surface2)" }}>
            <Key size={18} className="text-accent" />
          </div>
          <div>
            <p className="font-medium text-text">Live API Key</p>
            <p className="text-xs text-text3">Full read/write access to your fleet data</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-text3">Secret Key</label>
          <div className="flex items-center gap-2">
            <div
              className="flex-1 flex items-center gap-2 px-3 h-9 rounded-lg border font-mono text-sm"
              style={{ background: "var(--surface2)", borderColor: "var(--border)" }}
            >
              <span className="text-text2 flex-1 overflow-hidden">
                {visible ? apiKey : `${"•".repeat(16)}${apiKey.slice(-8)}`}
              </span>
            </div>
            <button onClick={() => setVisible(!visible)} className="w-9 h-9 flex items-center justify-center rounded-lg border text-text3 hover:text-text transition-colors" style={{ borderColor: "var(--border)", background: "var(--surface2)" }}>
              {visible ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <button onClick={copy} className="flex items-center gap-1.5 px-3 h-9 rounded-lg border text-sm transition-all hover:border-accent/30" style={{ borderColor: "var(--border)", background: "var(--surface2)", color: copied ? "#10b981" : "var(--text2)" }}>
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        <div
          className="px-4 py-3 rounded-xl border text-xs font-mono text-text3"
          style={{ background: "var(--surface2)", borderColor: "var(--border)" }}
        >
          <p className="text-text2 mb-2">Example usage:</p>
          <p style={{ color: "#10b981" }}>curl -H &quot;Authorization: Bearer {visible ? apiKey : "YOUR_API_KEY"}&quot; \</p>
          <p className="text-text3 ml-4">https://api.fleetosdemo.com/v1/vehicles</p>
        </div>

        <div className="pt-2 border-t" style={{ borderColor: "var(--border)" }}>
          <button
            onClick={rotate}
            disabled={rotating}
            className="flex items-center gap-2 px-4 h-9 rounded-lg border text-sm text-text2 hover:text-text hover:border-accent/30 transition-all disabled:opacity-50"
            style={{ borderColor: "var(--border)", background: "var(--surface2)" }}
          >
            <RefreshCw size={13} className={rotating ? "animate-spin" : ""} />
            {rotating ? "Rotating key..." : "Rotate API Key"}
          </button>
          <p className="text-xs text-text3 mt-2">Rotating the key will invalidate the current key immediately.</p>
        </div>
      </div>
    </div>
  );
}
