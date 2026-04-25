"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Truck } from "lucide-react";

export default function SignupPage() {
  const supabase = createClient();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", company: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function signup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { data, error: err } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { name: form.name } },
    });
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    if (data.user) {
      // Create company + user record
      const { data: co } = await supabase.from("companies").insert({
        name: form.company || `${form.name}'s Fleet`,
        timezone: "America/New_York",
      }).select().single();

      if (co) {
        await supabase.from("users").insert({
          id: data.user.id,
          company_id: co.id,
          name: form.name,
          email: form.email,
          role: "admin",
        });
      }
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--accent)" }}>
            <Truck size={18} className="text-white" />
          </div>
          <span className="font-display font-bold text-2xl text-text">FleetOS</span>
        </div>

        <div className="rounded-2xl border p-8 space-y-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div>
            <h1 className="font-display font-bold text-xl text-text">Create account</h1>
            <p className="text-sm text-text3 mt-1">Start managing your fleet</p>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl border text-sm text-[#ef4444]" style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)" }}>
              {error}
            </div>
          )}

          <form onSubmit={signup} className="space-y-3.5">
            {[
              { key: "name", label: "Full Name", type: "text" },
              { key: "email", label: "Email", type: "email" },
              { key: "company", label: "Company Name", type: "text" },
              { key: "password", label: "Password", type: "password" },
            ].map(({ key, label, type }) => (
              <div key={key} className="space-y-1.5">
                <label className="text-xs font-medium text-text3">{label}</label>
                <input
                  type={type}
                  value={(form as any)[key]}
                  onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                  required={key !== "company"}
                  className="w-full h-9 px-3 rounded-lg border text-sm text-text focus:outline-none focus:border-accent transition-colors"
                  style={{ background: "var(--surface2)", borderColor: "var(--border)" }}
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-9 rounded-lg text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-all"
              style={{ background: "var(--accent)" }}
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-sm text-center text-text3">
            Already have an account?{" "}
            <Link href="/login" className="text-accent hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
