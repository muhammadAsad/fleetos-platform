"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Truck, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState("demo@fleetosdemo.com");
  const [password, setPassword] = useState("demo1234");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--bg)" }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--accent)" }}>
            <Truck size={18} className="text-white" />
          </div>
          <span className="font-display font-bold text-2xl text-text">FleetOS</span>
        </div>

        <div
          className="rounded-2xl border p-8 space-y-5"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div>
            <h1 className="font-display font-bold text-xl text-text">Sign in</h1>
            <p className="text-sm text-text3 mt-1">Fleet management dashboard</p>
          </div>

          {error && (
            <div
              className="px-4 py-3 rounded-xl border text-sm text-[#ef4444]"
              style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)" }}
            >
              {error}
            </div>
          )}

          <form onSubmit={login} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text3">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-9 px-3 rounded-lg border text-sm text-text focus:outline-none focus:border-accent transition-colors"
                style={{ background: "var(--surface2)", borderColor: "var(--border)" }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text3">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-9 px-3 pr-9 rounded-lg border text-sm text-text focus:outline-none focus:border-accent transition-colors"
                  style={{ background: "var(--surface2)", borderColor: "var(--border)" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text3 hover:text-text2"
                >
                  {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-9 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "var(--accent)" }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div
            className="px-4 py-3 rounded-xl border text-xs text-text3 space-y-1"
            style={{ background: "var(--surface2)", borderColor: "var(--border)" }}
          >
            <p className="font-medium text-text2">Demo credentials:</p>
            <p>Email: <span className="font-mono">demo@fleetosdemo.com</span></p>
            <p>Password: <span className="font-mono">demo1234</span></p>
          </div>

          <p className="text-sm text-center text-text3">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-accent hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
