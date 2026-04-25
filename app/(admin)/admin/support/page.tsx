"use client";
import { useState } from "react";
import {
  HeadphonesIcon, Clock, CheckCircle2, AlertTriangle,
  MessageSquare, X, Send, User, ArrowUpRight,
  ChevronDown, Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Ticket {
  id: string;
  number: string;
  subject: string;
  company: string;
  user: string;
  priority: "critical" | "high" | "medium" | "low";
  status: "open" | "in_progress" | "waiting" | "resolved";
  category: string;
  created: string;
  updated: string;
  messages: { from: "user" | "admin"; text: string; time: string }[];
}

const TICKETS: Ticket[] = [
  {
    id: "t1", number: "#1048", subject: "ELD device not syncing GPS data",
    company: "Midwest Freight Co.", user: "James Miller", priority: "critical", status: "open",
    category: "ELD Hardware", created: "10m ago", updated: "10m ago",
    messages: [
      { from: "user", text: "Our ELD units stopped syncing GPS data after the last firmware update. Drivers can't see their positions on the map.", time: "10m ago" },
    ],
  },
  {
    id: "t2", number: "#1047", subject: "IFTA report showing incorrect mileage",
    company: "Lone Star Logistics", user: "Robert Davis", priority: "high", status: "in_progress",
    category: "Reports", created: "1h ago", updated: "25m ago",
    messages: [
      { from: "user", text: "The Q1 IFTA report is showing 2,400 miles less than our actual GPS tracking data. This could cause issues with our filing.", time: "1h ago" },
      { from: "admin", text: "I'm looking into this now. Could you confirm which state routes are affected? I'll check the calculation engine for that period.", time: "25m ago" },
    ],
  },
  {
    id: "t3", number: "#1046", subject: "Driver HOS hours not resetting at midnight",
    company: "Pacific Trucking LLC", user: "Sarah Chen", priority: "high", status: "open",
    category: "HOS / ELD", created: "3h ago", updated: "3h ago",
    messages: [
      { from: "user", text: "Two of our drivers noticed their 11-hour drive limit didn't reset at midnight. They're showing hours from the previous day.", time: "3h ago" },
    ],
  },
  {
    id: "t4", number: "#1045", subject: "Cannot add new driver to account",
    company: "Blue Ridge Freight", user: "Kevin Johnson", priority: "medium", status: "waiting",
    category: "Account", created: "6h ago", updated: "2h ago",
    messages: [
      { from: "user", text: "When I try to add a new driver, the form submits but the driver doesn't appear in the list.", time: "6h ago" },
      { from: "admin", text: "Thank you for the report. I've reproduced this on our end. We're deploying a fix within the hour. Can you try again after 3 PM EST?", time: "4h ago" },
      { from: "user", text: "OK, I'll check back then.", time: "2h ago" },
    ],
  },
  {
    id: "t5", number: "#1044", subject: "Live map not loading vehicles",
    company: "Coastal Express Inc.", user: "Michael Torres", priority: "medium", status: "in_progress",
    category: "Map", created: "8h ago", updated: "5h ago",
    messages: [
      { from: "user", text: "The live map page shows a blank screen on Chrome. It works on Firefox.", time: "8h ago" },
      { from: "admin", text: "This is a known Chrome extension conflict with Mapbox. Please try disabling extensions or using Incognito mode. We'll release a fix by end of week.", time: "5h ago" },
    ],
  },
  {
    id: "t6", number: "#1043", subject: "Billing invoice shows wrong amount",
    company: "Great Lakes Haulers", user: "Emily Novak", priority: "low", status: "resolved",
    category: "Billing", created: "1d ago", updated: "18h ago",
    messages: [
      { from: "user", text: "My April invoice shows $99 but I'm on the Starter plan at $49.", time: "1d ago" },
      { from: "admin", text: "This was a billing system error during plan migration. I've issued a credit of $50 to your account and corrected the invoice.", time: "18h ago" },
    ],
  },
  {
    id: "t7", number: "#1042", subject: "API key not working after rotation",
    company: "Acme Logistics", user: "Daniel Brown", priority: "high", status: "resolved",
    category: "API", created: "2d ago", updated: "1d ago",
    messages: [
      { from: "user", text: "After rotating our API key, all webhook deliveries are failing with 401 errors.", time: "2d ago" },
      { from: "admin", text: "New API keys take up to 5 minutes to propagate. Also make sure you're using the full key including the sk_ prefix. Does this resolve it?", time: "1d ago" },
      { from: "user", text: "That fixed it, thank you!", time: "1d ago" },
    ],
  },
];

const PRIORITY_META: Record<string, { color: string; bg: string; label: string }> = {
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.12)", label: "Critical" },
  high: { color: "#f97316", bg: "rgba(249,115,22,0.12)", label: "High" },
  medium: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", label: "Medium" },
  low: { color: "#64748b", bg: "rgba(100,116,139,0.12)", label: "Low" },
};

const STATUS_META: Record<string, { color: string; bg: string; label: string; icon: React.ElementType }> = {
  open: { color: "#ef4444", bg: "rgba(239,68,68,0.12)", label: "Open", icon: AlertTriangle },
  in_progress: { color: "#2563eb", bg: "rgba(37,99,235,0.12)", label: "In Progress", icon: Clock },
  waiting: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", label: "Waiting", icon: Clock },
  resolved: { color: "#10b981", bg: "rgba(16,185,129,0.12)", label: "Resolved", icon: CheckCircle2 },
};

export default function AdminSupportPage() {
  const [selected, setSelected] = useState<Ticket | null>(TICKETS[0]);
  const [reply, setReply] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = TICKETS.filter((t) => {
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    const matchSearch = t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.company.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  function sendReply() {
    if (!reply.trim() || !selected) return;
    setReply("");
  }

  const statCards = [
    { label: "Open", value: TICKETS.filter((t) => t.status === "open").length, color: "#ef4444", icon: AlertTriangle },
    { label: "In Progress", value: TICKETS.filter((t) => t.status === "in_progress").length, color: "#2563eb", icon: Clock },
    { label: "Waiting", value: TICKETS.filter((t) => t.status === "waiting").length, color: "#f59e0b", icon: Clock },
    { label: "Resolved", value: TICKETS.filter((t) => t.status === "resolved").length, color: "#10b981", icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div
            key={s.label}
            onClick={() => setStatusFilter(s.label.toLowerCase().replace(" ", "_"))}
            className="rounded-xl border p-4 flex items-center gap-3 cursor-pointer hover:border-accent/30 transition-all"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}15` }}>
              <s.icon size={18} style={{ color: s.color }} />
            </div>
            <div>
              <p className="font-display font-bold text-2xl text-text leading-none">{s.value}</p>
              <p className="text-xs text-text3 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4" style={{ height: "calc(100vh - 280px)" }}>
        {/* Ticket list */}
        <div className="col-span-5 flex flex-col rounded-xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2 flex-1" style={{ background: "var(--surface2)", borderRadius: 8, padding: "4px 10px" }}>
              <Search size={12} style={{ color: "var(--accent)" }} />
              <input
                type="text"
                placeholder="Search tickets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent outline-none text-xs text-text placeholder:text-text3 w-full"
              />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none pl-2 pr-6 h-7 rounded-lg border text-xs text-text2 outline-none cursor-pointer"
                style={{ background: "var(--surface2)", borderColor: "var(--border2)" }}
              >
                <option value="all">All</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="waiting">Waiting</option>
                <option value="resolved">Resolved</option>
              </select>
              <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-text3 pointer-events-none" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: "var(--border)" }}>
            {filtered.map((ticket) => {
              const pri = PRIORITY_META[ticket.priority];
              const st = STATUS_META[ticket.status];
              const StIcon = st.icon;
              return (
                <div
                  key={ticket.id}
                  onClick={() => setSelected(ticket)}
                  className={cn(
                    "px-4 py-3 cursor-pointer hover:bg-surface2 transition-colors border-l-2",
                    selected?.id === ticket.id ? "bg-surface2" : ""
                  )}
                  style={{ borderLeftColor: selected?.id === ticket.id ? "var(--accent)" : "transparent" }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-[11px] font-mono text-text3">{ticket.number}</span>
                    <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded" style={{ background: pri.bg, color: pri.color }}>
                      {pri.label}
                    </span>
                  </div>
                  <p className="text-[13px] font-medium text-text leading-snug mb-1">{ticket.subject}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-text3">{ticket.company}</span>
                    <span className="flex items-center gap-1 text-[10px] font-mono" style={{ color: st.color }}>
                      <StIcon size={9} />
                      {st.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-text3 mt-1">{ticket.updated}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ticket detail + reply */}
        {selected ? (
          <div className="col-span-7 flex flex-col rounded-xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            {/* Header */}
            <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-mono text-text3">{selected.number}</span>
                    <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded" style={{ background: PRIORITY_META[selected.priority].bg, color: PRIORITY_META[selected.priority].color }}>
                      {PRIORITY_META[selected.priority].label}
                    </span>
                    <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded" style={{ background: STATUS_META[selected.status].bg, color: STATUS_META[selected.status].color }}>
                      {STATUS_META[selected.status].label}
                    </span>
                  </div>
                  <h2 className="text-base font-semibold text-text">{selected.subject}</h2>
                  <p className="text-xs text-text3 mt-0.5">{selected.company} · {selected.user} · {selected.category}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button className="px-3 h-7 rounded-lg border text-xs text-text2 hover:text-text transition-all" style={{ borderColor: "var(--border)", background: "var(--surface2)" }}>
                    Assign
                  </button>
                  <select
                    className="px-2 h-7 rounded-lg border text-xs text-text2 outline-none cursor-pointer"
                    style={{ background: "var(--surface2)", borderColor: "var(--border2)" }}
                    defaultValue={selected.status}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="waiting">Waiting</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {selected.messages.map((msg, i) => (
                <div key={i} className={cn("flex gap-3", msg.from === "admin" ? "flex-row-reverse" : "")}>
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5"
                    style={{ background: msg.from === "admin" ? "var(--accent)" : "rgba(124,58,237,0.3)" }}
                  >
                    {msg.from === "admin" ? "A" : selected.user.charAt(0)}
                  </div>
                  <div className={cn("max-w-[80%]", msg.from === "admin" ? "items-end" : "items-start")} style={{ display: "flex", flexDirection: "column" }}>
                    <div
                      className="px-4 py-3 rounded-xl text-sm text-text"
                      style={{
                        background: msg.from === "admin" ? "rgba(37,99,235,0.12)" : "var(--surface2)",
                        border: `1px solid ${msg.from === "admin" ? "rgba(37,99,235,0.2)" : "var(--border)"}`,
                      }}
                    >
                      {msg.text}
                    </div>
                    <p className="text-[10px] text-text3 mt-1 px-1">{msg.from === "admin" ? "Admin" : selected.user} · {msg.time}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply box */}
            <div className="px-5 py-4 border-t" style={{ borderColor: "var(--border)" }}>
              <div className="flex gap-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5"
                  style={{ background: "var(--accent)" }}
                >
                  A
                </div>
                <div className="flex-1">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Write a reply..."
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm text-text placeholder:text-text3 outline-none resize-none transition-all"
                    style={{ background: "var(--surface2)", borderColor: "var(--border2)", color: "var(--text)" }}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(37,99,235,0.5)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border2)")}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px] text-text3">Replying as Admin</span>
                    <button
                      onClick={sendReply}
                      disabled={!reply.trim()}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-40"
                      style={{ background: "var(--accent)" }}
                    >
                      <Send size={13} />
                      Send Reply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="col-span-7 flex items-center justify-center rounded-xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="text-center">
              <HeadphonesIcon size={32} className="mx-auto mb-2 text-text3" />
              <p className="text-sm text-text2">Select a ticket to view</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
