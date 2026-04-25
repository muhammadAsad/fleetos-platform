"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Edit2, Save, X } from "lucide-react";
import type { Company } from "@/types/database";

export default function CompanyPage() {
  const supabase = createClient();
  const [company, setCompany] = useState<Company | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Company>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("companies").select("*").single().then(({ data }: { data: any }) => {
      setCompany(data);
      setForm(data ?? {});
    });
  }, []);

  async function save() {
    if (!company) return;
    setSaving(true);
    const { data } = await supabase.from("companies").update(form).eq("id", company.id).select().single();
    setCompany(data);
    setEditing(false);
    setSaving(false);
  }

  const fields = {
    "General Information": [
      { key: "name", label: "Company Name" },
      { key: "dot_number", label: "DOT Number" },
      { key: "timezone", label: "Company Timezone" },
      { key: "address", label: "Company Address" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
    ],
    "Carrier Settings": [
      { key: "cycle_rule", label: "Cycle Rule" },
      { key: "cargo_type", label: "Cargo Type" },
      { key: "rest_break", label: "Rest Break" },
      { key: "cycle_restart", label: "Cycle Restart" },
    ],
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl text-text">Company Settings</h2>
          <p className="text-sm text-text3 mt-0.5">Manage your fleet company information</p>
        </div>
        {editing ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setEditing(false); setForm(company ?? {}); }}
              className="flex items-center gap-1.5 px-3 h-8 rounded-lg border text-sm text-text2 hover:text-text transition-all"
              style={{ borderColor: "var(--border)", background: "var(--surface)" }}
            >
              <X size={13} /> Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 h-8 rounded-lg border text-sm text-white transition-all disabled:opacity-50"
              style={{ borderColor: "var(--accent)", background: "var(--accent)" }}
            >
              <Save size={13} /> {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg border text-sm text-text2 hover:text-text transition-all hover:border-accent/30"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}
          >
            <Edit2 size={13} /> Edit
          </button>
        )}
      </div>

      {Object.entries(fields).map(([section, sectionFields]) => (
        <div
          key={section}
          className="rounded-xl border overflow-hidden"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="px-5 py-3.5 border-b" style={{ borderColor: "var(--border)", background: "var(--surface2)" }}>
            <h3 className="font-medium text-sm text-text">{section}</h3>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {sectionFields.map(({ key, label }) => (
              <div key={key} className="flex items-center px-5 py-3.5 gap-4">
                <span className="text-sm text-text3 w-44 flex-shrink-0">{label}</span>
                {editing ? (
                  <input
                    value={(form as any)[key] ?? ""}
                    onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                    className="flex-1 h-8 px-3 rounded-lg border text-sm text-text bg-surface3 focus:outline-none focus:border-accent transition-colors"
                    style={{ borderColor: "var(--border)" }}
                  />
                ) : (
                  <span className="text-sm text-text">{(company as any)?.[key] ?? <span className="text-text3">—</span>}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
