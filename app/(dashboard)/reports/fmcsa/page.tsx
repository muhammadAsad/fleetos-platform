"use client";
import { FileText, Download } from "lucide-react";

export default function FMCSAPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl text-text">FMCSA Report</h2>
          <p className="text-sm text-text3 mt-0.5">Federal Motor Carrier Safety Administration ELD data transfer</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm text-white hover:opacity-90" style={{ background: "var(--accent)" }}>
          <Download size={13} /> Generate Report
        </button>
      </div>
      <div className="rounded-xl border flex flex-col items-center justify-center py-24 space-y-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "var(--surface2)" }}>
          <FileText size={28} className="text-cyan" />
        </div>
        <p className="text-sm text-text3 text-center max-w-xs">
          FMCSA ELD data export (ERODS format) is available once drivers have certified their logs.
        </p>
      </div>
    </div>
  );
}
