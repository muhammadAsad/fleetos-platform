"use client";
import { HelpCircle, BookOpen, MessageSquare, ExternalLink, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

const FAQS = [
  { q: "How do I connect a real ELD device?", a: "Real ELD devices connect via Bluetooth to the FleetOS mobile app. The mobile app then syncs data to your Supabase backend using the same schema as the simulator. Set is_simulated=false for real devices." },
  { q: "How does the fake ELD simulator work?", a: "The simulator (simulator/fake-eld.ts) writes GPS coordinates and HOS status updates to your Supabase database every 5 seconds, mimicking 5 trucks on real US highway routes. Run it with: npm run simulator" },
  { q: "What HOS rules are enforced?", a: "FleetOS enforces USA Property Carrying — 70 Hour / 8 Day rules: 11 hours max drive, 14 hour shift limit, 30-minute break after 8 hours of driving, and a 70-hour/8-day cycle limit." },
  { q: "How do I set up Supabase?", a: "1. Create a free project at supabase.com. 2. Copy and run the SQL from supabase/schema.sql in the SQL editor. 3. Copy your project URL and anon key to .env.local. 4. Run npm run seed to create sample data." },
  { q: "Is there a mobile app for drivers?", a: "FleetOS is currently a web-only fleet manager dashboard. Drivers use a separate mobile app (iOS/Android) that connects to the same Supabase backend. The mobile app is not included in this repository." },
];

export default function HelpPage() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="font-display font-bold text-2xl text-text">Help & Support</h2>
        <p className="text-sm text-text3 mt-0.5">Documentation, FAQs, and support resources</p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: BookOpen, title: "Documentation", desc: "Setup guides and API reference", color: "#2563eb" },
          { icon: MessageSquare, title: "Support Chat", desc: "Talk to our support team", color: "#10b981" },
          { icon: ExternalLink, title: "GitHub Issues", desc: "Report bugs and feature requests", color: "#f59e0b" },
        ].map((item) => (
          <button
            key={item.title}
            className="flex items-start gap-3 p-4 rounded-xl border text-left hover:border-accent/30 transition-all"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${item.color}18` }}>
              <item.icon size={16} style={{ color: item.color }} />
            </div>
            <div>
              <p className="font-medium text-sm text-text">{item.title}</p>
              <p className="text-xs text-text3 mt-0.5">{item.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Getting Started */}
      <div className="rounded-xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)", background: "var(--surface2)" }}>
          <h3 className="font-medium text-text">Getting Started</h3>
        </div>
        <div className="p-5">
          <ol className="space-y-3">
            {[
              { step: 1, text: "Create a free Supabase project and run the SQL schema", link: "supabase.com" },
              { step: 2, text: "Get a free Mapbox token for the live map feature", link: "mapbox.com" },
              { step: 3, text: "Fill in .env.local with your credentials" },
              { step: 4, text: "Run npm run seed to create 5 test drivers and vehicles" },
              { step: 5, text: "Run npm run simulator to start fake GPS + HOS data" },
              { step: 6, text: "Open the dashboard — trucks will be moving on the map!" },
            ].map((item) => (
              <li key={item.step} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-mono font-bold" style={{ background: "var(--accent)", color: "white" }}>
                  {item.step}
                </span>
                <p className="text-sm text-text2 pt-0.5">
                  {item.text}
                  {item.link && <span className="text-accent ml-1 font-mono text-xs">({item.link})</span>}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* FAQs */}
      <div className="rounded-xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)", background: "var(--surface2)" }}>
          <h3 className="font-medium text-text">Frequently Asked Questions</h3>
        </div>
        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          {FAQS.map((faq, i) => (
            <div key={i}>
              <button
                onClick={() => setExpanded(expanded === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-surface2 transition-colors"
              >
                <span className="text-sm font-medium text-text">{faq.q}</span>
                {expanded === i ? <ChevronDown size={15} className="text-text3 flex-shrink-0" /> : <ChevronRight size={15} className="text-text3 flex-shrink-0" />}
              </button>
              {expanded === i && (
                <div className="px-5 pb-4">
                  <p className="text-sm text-text3 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="text-center text-xs text-text3 py-4">
        FleetOS v1.0.0 · Built with Next.js 14, Supabase, Mapbox GL
      </div>
    </div>
  );
}
