"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Eye, EyeOff, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [secret, setSecret] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/admin"), 800);
      } else {
        setError("Incorrect secret. Access denied.");
        setSecret("");
      }
    } catch {
      setError("Connection error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--bg)" }}
    >
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
          >
            <Shield size={24} className="text-white" />
          </div>
          <h1 className="font-display font-bold text-xl text-text">Admin Access</h1>
          <p className="text-sm text-text3 mt-1">Restricted area — authorized personnel only</p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border p-6 space-y-4"
          style={{ background: "var(--surface)", borderColor: "var(--border2)" }}
        >
          <div>
            <label className="block text-[10px] font-mono font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text3)" }}>
              Admin Secret
            </label>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Enter admin secret..."
                autoComplete="current-password"
                className="w-full px-4 py-3 rounded-xl border text-sm pr-10 outline-none transition-all"
                style={{ background: "var(--surface2)", borderColor: "var(--border2)", color: "var(--text)" }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(124,58,237,0.6)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border2)")}
                required
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text3 hover:text-text2 transition-colors"
              >
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm"
              style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.25)", color: "#ef4444" }}
            >
              <AlertTriangle size={14} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm"
              style={{ background: "rgba(16,185,129,0.08)", borderColor: "rgba(16,185,129,0.25)", color: "#10b981" }}
            >
              <CheckCircle2 size={14} className="flex-shrink-0" />
              Access granted — redirecting...
            </div>
          )}

          <button
            type="submit"
            disabled={loading || success || !secret}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 active:scale-95"
            style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
          >
            {loading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Shield size={15} />
            )}
            {loading ? "Verifying..." : success ? "Redirecting..." : "Access Admin Panel"}
          </button>
        </form>

        <p className="text-center text-[11px] text-text3 mt-5">
          Not an admin?{" "}
          <a href="/dashboard" className="hover:underline" style={{ color: "var(--accent)" }}>
            Return to dashboard
          </a>
        </p>
      </div>
    </div>
  );
}
