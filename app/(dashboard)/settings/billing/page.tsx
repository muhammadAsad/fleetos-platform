"use client";
import { useState } from "react";
import { CreditCard, Download, CheckCircle2, Plus, Zap, FileText, Truck, Camera, Cpu, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const MOCK_INVOICES = [
  { id: "4", date: "2026-04-01", invoice: "INV-2026-004", amount: 99.00, status: "paid",   paidDate: "2026-04-01" },
  { id: "3", date: "2026-03-01", invoice: "INV-2026-003", amount: 99.00, status: "paid",   paidDate: "2026-03-01" },
  { id: "2", date: "2026-02-01", invoice: "INV-2026-002", amount: 99.00, status: "paid",   paidDate: "2026-02-01" },
  { id: "1", date: "2026-01-01", invoice: "INV-2026-001", amount: 79.00, status: "paid",   paidDate: "2026-01-01" },
];

const ADD_ONS = [
  { id: "vehicles",  icon: Truck,  label: "Extra Vehicles",   price: 5,  unit: "per vehicle/mo",  current: 5  },
  { id: "cameras",   icon: Camera, label: "Camera Storage",   price: 15, unit: "per camera/mo",   current: 2  },
  { id: "eld",       icon: Cpu,    label: "ELD Devices",       price: 4,  unit: "per device/mo",   current: 5  },
];

const PLANS = [
  { id: "starter",  name: "Starter",  price: 49,  features: ["Up to 3 vehicles", "Basic HOS", "GPS Tracking", "Email support"] },
  { id: "pro",      name: "Pro",      price: 99,  features: ["Up to 10 vehicles", "Full HOS + DVIR", "Advanced IFTA", "Weather overlay", "Priority support"], current: true },
  { id: "fleet",    name: "Fleet",    price: 199, features: ["Unlimited vehicles", "All features", "API access", "White-label", "Dedicated support"] },
];

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "invoices" | "usage">("overview");
  const [showOnDemand, setShowOnDemand] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [invoices, setInvoices] = useState(MOCK_INVOICES);
  const [odForm, setOdForm] = useState({ description: "", amount: "", notes: "" });

  function generateInvoice() {
    setGenerating(true);
    setTimeout(() => {
      const newInv = {
        id: Date.now().toString(),
        date: format(new Date(), "yyyy-MM-dd"),
        invoice: `INV-${new Date().getFullYear()}-OD-${String(invoices.length + 1).padStart(3, "0")}`,
        amount: parseFloat(odForm.amount) || 0,
        status: "open",
        paidDate: "",
      };
      setInvoices((prev) => [newInv, ...prev]);
      setShowOnDemand(false);
      setGenerating(false);
      setOdForm({ description: "", amount: "", notes: "" });
    }, 1200);
  }

  const totalThisYear = invoices.reduce((a, i) => a + i.amount, 0);
  const openInvoices = invoices.filter((i) => i.status === "open");

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl text-text">Billing</h2>
          <p className="text-sm text-text3 mt-0.5">Manage subscription, on-demand billing, and invoices</p>
        </div>
        <button
          onClick={() => setShowOnDemand(true)}
          className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm text-white hover:opacity-90 transition-all"
          style={{ background: "var(--accent)" }}
        >
          <Zap size={13} /> Generate Invoice
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: "var(--surface2)" }}>
        {(["overview", "invoices", "usage"] as const).map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${activeTab === t ? "bg-surface text-text shadow" : "text-text3 hover:text-text2"}`}>
            {t}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border p-4 space-y-3" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <p className="text-xs font-mono text-text3 uppercase tracking-wide">Account Status</p>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green" />
                <span className="font-medium text-text">Active</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-text3">Next payment</span>
                  <span className="text-text font-medium">$99.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text3">Due date</span>
                  <span className="text-text2">May 1, 2026</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text3">YTD billed</span>
                  <span className="text-text2 font-mono">${totalThisYear.toFixed(2)}</span>
                </div>
              </div>
              {openInvoices.length > 0 && (
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs"
                  style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>
                  <FileText size={11} />
                  {openInvoices.length} open invoice{openInvoices.length > 1 ? "s" : ""} pending
                </div>
              )}
            </div>

            <div className="rounded-xl border p-4 space-y-3" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <p className="text-xs font-mono text-text3 uppercase tracking-wide">Payment Method</p>
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--surface2)" }}>
                <div className="w-10 h-7 rounded-md bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                  <span className="text-white text-[9px] font-bold">VISA</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-text">•••• •••• •••• 4242</p>
                  <p className="text-xs text-text3">Expires 12/2028</p>
                </div>
              </div>
              <button className="w-full h-8 rounded-lg border text-sm text-text2 hover:text-text hover:border-accent/30 transition-all"
                style={{ borderColor: "var(--border)" }}>
                Update payment method
              </button>
            </div>

            <div className="rounded-xl border p-4 space-y-3" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <p className="text-xs font-mono text-text3 uppercase tracking-wide">On-Demand Billing</p>
              <p className="text-xs text-text3">Generate instant invoices for additional services, repairs, or custom charges.</p>
              <div className="space-y-2">
                {[
                  { label: "Extra route analysis", amount: "$25.00" },
                  { label: "DOT audit support", amount: "$75.00" },
                  { label: "Data export (custom)", amount: "$15.00" },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between text-xs">
                    <span className="text-text3">{item.label}</span>
                    <span className="font-mono text-text2">{item.amount}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowOnDemand(true)}
                className="w-full h-8 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
                style={{ background: "var(--accent)" }}>
                <Zap size={12} /> Generate Invoice
              </button>
            </div>
          </div>

          {/* Plans */}
          <div className="rounded-xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="px-5 py-3 border-b" style={{ borderColor: "var(--border)", background: "var(--surface2)" }}>
              <h3 className="font-medium text-sm text-text">Subscription Plans</h3>
            </div>
            <div className="grid grid-cols-3 gap-0 divide-x" style={{ borderColor: "var(--border)" }}>
              {PLANS.map((plan) => (
                <div key={plan.id} className={`p-5 space-y-4 ${plan.current ? "bg-accent/5" : ""}`}>
                  <div className="flex items-center justify-between">
                    <p className="font-display font-bold text-base text-text">{plan.name}</p>
                    {plan.current && <Badge variant="cyan">Current</Badge>}
                  </div>
                  <p className="font-display font-bold text-3xl text-text">${plan.price}<span className="text-sm font-normal text-text3">/mo</span></p>
                  <ul className="space-y-1.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-text3">
                        <CheckCircle2 size={11} className="text-green flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    className={`w-full h-8 rounded-lg text-sm transition-all ${plan.current ? "border text-text3 cursor-default" : "text-white hover:opacity-90"}`}
                    style={plan.current ? { borderColor: "var(--border)" } : { background: "var(--accent)" }}>
                    {plan.current ? "Current plan" : "Upgrade"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add-ons */}
          <div className="rounded-xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="px-5 py-3 border-b" style={{ borderColor: "var(--border)", background: "var(--surface2)" }}>
              <h3 className="font-medium text-sm text-text">Add-Ons</h3>
            </div>
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {ADD_ONS.map((addon) => (
                <div key={addon.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--surface2)" }}>
                    <addon.icon size={16} className="text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-text">{addon.label}</p>
                    <p className="text-xs text-text3">${addon.price} {addon.unit}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-text3">{addon.current} active</span>
                    <span className="text-xs font-mono font-bold text-text">${(addon.price * addon.current).toFixed(2)}/mo</span>
                    <button className="flex items-center gap-1 px-2.5 h-7 rounded-lg border text-xs text-text2 hover:text-text hover:border-accent/30 transition-all"
                      style={{ borderColor: "var(--border)", background: "var(--surface2)" }}>
                      <Plus size={11} /> Add more
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "invoices" && (
        <div className="rounded-xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-[11px] font-mono text-text3 uppercase" style={{ borderColor: "var(--border)", background: "var(--surface2)" }}>
                {["Invoice #", "Date", "Amount", "Status", "Paid Date", "Action"].map((h) => (
                  <th key={h} className="text-left px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b hover:bg-surface2 transition-colors" style={{ borderColor: "var(--border)" }}>
                  <td className="px-5 py-3.5 font-mono text-xs text-text2">{inv.invoice}</td>
                  <td className="px-5 py-3.5 text-xs text-text2">{format(new Date(inv.date), "MMM d, yyyy")}</td>
                  <td className="px-5 py-3.5 font-mono font-medium text-text">${inv.amount.toFixed(2)}</td>
                  <td className="px-5 py-3.5">
                    <Badge variant={inv.status === "paid" ? "green" : "yellow"} dot>
                      {inv.status === "paid" ? "Paid" : "Open"}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-text2">
                    {inv.paidDate ? format(new Date(inv.paidDate), "MMM d, yyyy") : <span className="text-text3">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button className="flex items-center gap-1 text-xs text-accent hover:underline">
                        <Download size={11} /> PDF
                      </button>
                      {inv.status === "open" && (
                        <button className="flex items-center gap-1 text-xs text-green hover:underline ml-2">
                          Pay now
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-5 py-3 border-t flex items-center justify-between text-xs font-mono text-text3"
            style={{ borderColor: "var(--border)" }}>
            <span>{invoices.length} invoices</span>
            <span>Total: ${invoices.reduce((a, i) => a + i.amount, 0).toFixed(2)}</span>
          </div>
        </div>
      )}

      {activeTab === "usage" && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "API Calls",       used: 8420,  limit: 50000, unit: "calls/mo"   },
              { label: "GPS Storage",     used: 2.4,   limit: 10,    unit: "GB"         },
              { label: "Video Storage",   used: 45,    limit: 100,   unit: "GB"         },
              { label: "Active Drivers",  used: 5,     limit: 10,    unit: "drivers"    },
              { label: "Active Vehicles", used: 5,     limit: 10,    unit: "vehicles"   },
              { label: "ELD Devices",     used: 5,     limit: 10,    unit: "devices"    },
            ].map((item) => {
              const pct = (item.used / item.limit) * 100;
              const color = pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : "#10b981";
              return (
                <div key={item.label} className="rounded-xl border p-4 space-y-3"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-text">{item.label}</span>
                    <span className="font-mono" style={{ color }}>{Math.round(pct)}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface3)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <div className="flex justify-between text-xs font-mono text-text3">
                    <span>{item.used}</span>
                    <span>{item.limit} {item.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* On-Demand Invoice Modal */}
      {showOnDemand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowOnDemand(false)} />
          <div className="relative w-full max-w-md rounded-2xl border shadow-2xl animate-fade-in"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-accent" />
                <h3 className="font-display font-bold text-base text-text">Generate Invoice</h3>
              </div>
              <button onClick={() => setShowOnDemand(false)} className="text-text3 hover:text-text"><X size={15} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text3">Description *</label>
                <input value={odForm.description} onChange={(e) => setOdForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="e.g. Route analysis, DOT audit support..."
                  className="w-full h-9 px-3 rounded-lg border text-sm text-text focus:outline-none focus:border-accent"
                  style={{ background: "var(--surface2)", borderColor: "var(--border)" }} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text3">Amount ($) *</label>
                <input type="number" value={odForm.amount} onChange={(e) => setOdForm((p) => ({ ...p, amount: e.target.value }))}
                  placeholder="0.00"
                  className="w-full h-9 px-3 rounded-lg border text-sm text-text focus:outline-none focus:border-accent"
                  style={{ background: "var(--surface2)", borderColor: "var(--border)" }} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text3">Notes (optional)</label>
                <textarea value={odForm.notes} onChange={(e) => setOdForm((p) => ({ ...p, notes: e.target.value }))}
                  rows={2} placeholder="Additional details..."
                  className="w-full px-3 py-2 rounded-lg border text-sm text-text focus:outline-none focus:border-accent resize-none"
                  style={{ background: "var(--surface2)", borderColor: "var(--border)" }} />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t" style={{ borderColor: "var(--border)" }}>
              <button onClick={() => setShowOnDemand(false)}
                className="px-4 h-8 rounded-lg border text-sm text-text2 hover:text-text transition-all"
                style={{ borderColor: "var(--border)" }}>
                Cancel
              </button>
              <button onClick={generateInvoice} disabled={generating || !odForm.description || !odForm.amount}
                className="flex items-center gap-1.5 px-4 h-8 rounded-lg text-sm text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "var(--accent)" }}>
                <Zap size={12} className={generating ? "animate-spin" : ""} />
                {generating ? "Generating..." : "Generate Invoice"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
