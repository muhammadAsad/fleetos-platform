"use client";
import { Sliders } from "lucide-react";

export default function ConfigurationPage() {
  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h2 className="font-display font-bold text-2xl text-text">Configuration</h2>
        <p className="text-sm text-text3 mt-0.5">Advanced fleet configuration settings</p>
      </div>
      <div className="rounded-xl border flex flex-col items-center justify-center py-20" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <Sliders size={28} className="text-text3 mb-3" />
        <p className="text-sm text-text3">Configuration options coming soon</p>
      </div>
    </div>
  );
}
