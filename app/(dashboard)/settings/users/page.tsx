"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Search, RefreshCw, Plus, Edit2, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { User } from "@/types/database";
import { format } from "date-fns";

export default function UsersPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("users").select("*").order("created_at", { ascending: false });
    setUsers(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = !q || (u.name ?? "").toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || u.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl text-text">Users</h2>
          <p className="text-sm text-text3 mt-0.5">Fleet managers and dispatchers</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm text-white hover:opacity-90 transition-all" style={{ background: "var(--accent)" }}>
          <Plus size={14} /> Add User
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 h-8 rounded-lg border flex-1 max-w-xs" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <Search size={13} className="text-text3" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..." className="bg-transparent flex-1 outline-none text-sm text-text placeholder-text3" />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-8 pl-3 pr-8 rounded-lg border text-sm text-text2 appearance-none cursor-pointer focus:outline-none"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button onClick={load} className="flex items-center gap-1.5 px-3 h-8 rounded-lg border text-sm text-text2 hover:text-text" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-[11px] font-mono text-text3 uppercase" style={{ borderColor: "var(--border)", background: "var(--surface2)" }}>
              {["#", "Name", "Email", "Phone", "Role", "Status", "Created", "Actions"].map((h) => (
                <th key={h} className="text-left px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-b" style={{ borderColor: "var(--border)" }}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3.5"><div className="h-3 rounded animate-pulse" style={{ background: "var(--surface3)", width: "80%" }} /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-text3 text-sm">No users found</td></tr>
            ) : (
              filtered.map((u, i) => (
                <tr key={u.id} className="border-b hover:bg-surface2 transition-colors" style={{ borderColor: "var(--border)" }}>
                  <td className="px-4 py-3 text-xs font-mono text-text3">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-text">{u.name ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-text2">{u.email ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-text2">{u.phone ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={u.role === "admin" ? "red" : u.role === "manager" ? "cyan" : "gray"}>
                      {u.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={u.status === "active" ? "green" : "gray"} dot>
                      {u.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-text3">
                    {u.created_at ? format(new Date(u.created_at), "MM/dd/yyyy") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button className="p-1 rounded text-text3 hover:text-accent hover:bg-accent/10 transition-colors"><Edit2 size={13} /></button>
                      <button className="p-1 rounded text-text3 hover:text-[#ef4444] hover:bg-red/10 transition-colors"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t text-xs text-text3 font-mono" style={{ borderColor: "var(--border)" }}>{filtered.length} users</div>
      </div>
    </div>
  );
}
