"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Fuel, MapPin, TrendingDown, TrendingUp, RefreshCw, Navigation, Search } from "lucide-react";

interface FuelStation {
  id: string;
  name: string;
  brand: string;
  address: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  diesel: number;
  def: number;
  amenities: string[];
  distance?: number;
  truckStop: boolean;
}

// Realistic mock fuel station data along major US trucking corridors
const BASE_STATIONS: Omit<FuelStation, "distance">[] = [
  { id: "1", name: "Pilot Travel Center", brand: "Pilot", address: "4201 S I-55 Frontage Rd", city: "Pontiac", state: "IL", lat: 40.88, lng: -88.63, diesel: 3.789, def: 2.999, amenities: ["Showers", "Restaurant", "Parking", "CAT Scale"], truckStop: true },
  { id: "2", name: "Love's Travel Stop", brand: "Love's", address: "1850 E Lincoln Hwy", city: "Rochelle", state: "IL", lat: 41.91, lng: -89.07, diesel: 3.819, def: 3.049, amenities: ["Showers", "Subway", "Parking", "Laundry"], truckStop: true },
  { id: "3", name: "Flying J", brand: "Flying J", address: "1875 US-30", city: "Joliet", state: "IL", lat: 41.52, lng: -88.10, diesel: 3.759, def: 2.979, amenities: ["Showers", "Denny's", "CAT Scale", "Wi-Fi"], truckStop: true },
  { id: "4", name: "TA Travel Center", brand: "TA", address: "300 W Beltline Hwy", city: "Madison", state: "WI", lat: 43.07, lng: -89.40, diesel: 3.829, def: 3.019, amenities: ["Showers", "Iron Skillet", "Parking", "Tire Service"], truckStop: true },
  { id: "5", name: "Pilot Flying J", brand: "Pilot", address: "2900 N Lake Dr", city: "Milwaukee", state: "WI", lat: 43.02, lng: -87.96, diesel: 3.799, def: 2.989, amenities: ["Showers", "Restaurant", "Parking"], truckStop: true },
  { id: "6", name: "Petro Stopping Center", brand: "Petro", address: "7600 Joliet Rd", city: "Hodgkins", state: "IL", lat: 41.77, lng: -87.87, diesel: 3.769, def: 2.969, amenities: ["Showers", "Iron Skillet", "CAT Scale", "Wi-Fi", "Laundry"], truckStop: true },
  { id: "7", name: "Love's Travel Stop", brand: "Love's", address: "500 N Dupont Hwy", city: "New Castle", state: "DE", lat: 39.67, lng: -75.57, diesel: 3.849, def: 3.059, amenities: ["Showers", "Subway", "Parking"], truckStop: true },
  { id: "8", name: "Pilot Travel Center", brand: "Pilot", address: "1800 US-40", city: "Effingham", state: "IL", lat: 39.12, lng: -88.55, diesel: 3.779, def: 2.999, amenities: ["Showers", "Wendy's", "CAT Scale", "Parking"], truckStop: true },
  { id: "9", name: "Flying J Travel Plaza", brand: "Flying J", address: "9201 Calumet Ave", city: "Munster", state: "IN", lat: 41.55, lng: -87.52, diesel: 3.739, def: 2.959, amenities: ["Showers", "Denny's", "Wi-Fi", "CAT Scale"], truckStop: true },
  { id: "10", name: "Kwik Trip", brand: "Kwik Trip", address: "4400 Mormon Coulee Rd", city: "La Crosse", state: "WI", lat: 43.80, lng: -91.22, diesel: 3.709, def: 2.949, amenities: ["Food", "Wi-Fi", "Parking"], truckStop: false },
  { id: "11", name: "TA Express", brand: "TA", address: "2251 W US-30", city: "Merrillville", state: "IN", lat: 41.47, lng: -87.34, diesel: 3.769, def: 2.989, amenities: ["Restaurant", "Showers", "Parking"], truckStop: true },
  { id: "12", name: "Pilot Travel Center", brand: "Pilot", address: "6601 W Washington St", city: "Indianapolis", state: "IN", lat: 39.77, lng: -86.28, diesel: 3.749, def: 2.979, amenities: ["Showers", "Subway", "CAT Scale", "Parking", "Wi-Fi"], truckStop: true },
];

const BRAND_COLORS: Record<string, string> = {
  "Pilot": "#e63946",
  "Flying J": "#e63946",
  "Love's": "#e05c1a",
  "TA": "#1d4ed8",
  "Petro": "#1d4ed8",
  "Kwik Trip": "#16a34a",
};

const NATIONAL_AVG_DIESEL = 3.812;
const NATIONAL_AVG_DEF = 3.029;

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function FuelPage() {
  const supabase = createClient();
  const [stations, setStations] = useState<FuelStation[]>([]);
  const [search, setSearch] = useState("");
  const [filterTruckStop, setFilterTruckStop] = useState(false);
  const [sortBy, setSortBy] = useState<"distance" | "diesel" | "def">("diesel");
  const [fleetCenter, setFleetCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [loading, setLoading] = useState(false);

  async function loadFleetCenter() {
    setLoading(true);
    const { data } = await supabase.from("driver_hos_summary").select("current_latitude,current_longitude").not("current_latitude", "is", null);
    if (data && data.length > 0) {
      const lats = (data as any[]).map((d) => d.current_latitude).filter(Boolean);
      const lngs = (data as any[]).map((d) => d.current_longitude).filter(Boolean);
      const centerLat = lats.reduce((a: number, b: number) => a + b, 0) / lats.length;
      const centerLng = lngs.reduce((a: number, b: number) => a + b, 0) / lngs.length;
      setFleetCenter({ lat: centerLat, lng: centerLng });
    } else {
      setFleetCenter({ lat: 41.8781, lng: -87.6298 }); // Default: Chicago
    }
    setLoading(false);
    setLastRefreshed(new Date());
  }

  useEffect(() => {
    loadFleetCenter();
  }, []);

  useEffect(() => {
    if (!fleetCenter) return;
    const withDistance = BASE_STATIONS.map((s) => ({
      ...s,
      // Add slight price variation to simulate real-world differences
      diesel: +(s.diesel + (Math.random() - 0.5) * 0.1).toFixed(3),
      def: +(s.def + (Math.random() - 0.5) * 0.05).toFixed(3),
      distance: Math.round(haversineDistance(fleetCenter.lat, fleetCenter.lng, s.lat, s.lng)),
    }));
    setStations(withDistance);
  }, [fleetCenter]);

  const filtered = stations
    .filter((s) => {
      if (filterTruckStop && !s.truckStop) return false;
      if (search) {
        const q = search.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q) || s.state.toLowerCase().includes(q) || s.brand.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "distance") return (a.distance ?? 999) - (b.distance ?? 999);
      if (sortBy === "diesel") return a.diesel - b.diesel;
      return a.def - b.def;
    });

  const cheapestDiesel = Math.min(...stations.map((s) => s.diesel));
  const avgDiesel = stations.length > 0 ? stations.reduce((a, s) => a + s.diesel, 0) / stations.length : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl text-text">Fuel Locations & Pricing</h2>
          <p className="text-sm text-text3 mt-0.5">Diesel prices and truck stop locations along your routes</p>
        </div>
        <button
          onClick={loadFleetCenter}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 h-8 rounded-lg border text-sm text-text2 hover:text-text transition-all hover:border-accent/30"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Updated {lastRefreshed.toLocaleTimeString()}
        </button>
      </div>

      {/* Price Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          {
            label: "Cheapest Diesel Nearby",
            value: `$${cheapestDiesel.toFixed(3)}`,
            sub: "per gallon",
            icon: TrendingDown,
            color: "#10b981",
            bg: "rgba(16,185,129,0.1)",
          },
          {
            label: "Area Average Diesel",
            value: avgDiesel > 0 ? `$${avgDiesel.toFixed(3)}` : "—",
            sub: "per gallon",
            icon: Fuel,
            color: "#3b82f6",
            bg: "rgba(59,130,246,0.1)",
          },
          {
            label: "National Avg Diesel",
            value: `$${NATIONAL_AVG_DIESEL.toFixed(3)}`,
            sub: "EIA weekly average",
            icon: TrendingUp,
            color: "#f59e0b",
            bg: "rgba(245,158,11,0.1)",
          },
          {
            label: "DEF Average",
            value: `$${NATIONAL_AVG_DEF.toFixed(3)}`,
            sub: "per gallon",
            icon: Fuel,
            color: "#8b5cf6",
            bg: "rgba(139,92,246,0.1)",
          },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: card.bg }}>
                <card.icon size={14} style={{ color: card.color }} />
              </div>
              <span className="text-[10px] font-mono text-text3 uppercase tracking-wide">{card.label}</span>
            </div>
            <p className="font-display font-bold text-2xl text-text">{card.value}</p>
            <p className="text-xs text-text3 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Fleet Center Info */}
      {fleetCenter && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border text-sm"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <Navigation size={15} className="text-accent flex-shrink-0" />
          <span className="text-text3">Showing stations near fleet center:</span>
          <span className="font-mono text-text">{fleetCenter.lat.toFixed(3)}, {fleetCenter.lng.toFixed(3)}</span>
          <span className="text-text3 ml-auto text-xs">{stations.length} stations found</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-3 h-8 rounded-lg border flex-1 max-w-xs"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <Search size={13} className="text-text3" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by brand, city, state..."
            className="bg-transparent flex-1 outline-none text-sm text-text placeholder-text3"
          />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: "var(--surface2)" }}>
          {(["diesel", "def", "distance"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${sortBy === s ? "bg-surface text-text shadow" : "text-text3 hover:text-text2"}`}
            >
              Sort: {s === "distance" ? "Distance" : s === "diesel" ? "Diesel $" : "DEF $"}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <div
            onClick={() => setFilterTruckStop(!filterTruckStop)}
            className={`w-8 h-4 rounded-full flex items-center transition-all cursor-pointer ${filterTruckStop ? "justify-end bg-accent" : "justify-start bg-surface3"}`}
          >
            <div className="w-3 h-3 rounded-full bg-white mx-0.5" />
          </div>
          <span className="text-text3 text-xs">Truck stops only</span>
        </label>
      </div>

      {/* Stations Table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-[11px] font-mono text-text3 uppercase" style={{ borderColor: "var(--border)", background: "var(--surface2)" }}>
                {["Station", "Location", "Distance", "Diesel", "DEF", "Savings vs Avg", "Amenities", "Type"].map((h) => (
                  <th key={h} className="text-left px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const dieselVsAvg = avgDiesel > 0 ? s.diesel - avgDiesel : 0;
                const brandColor = BRAND_COLORS[s.brand] ?? "#64748b";
                return (
                  <tr key={s.id} className="border-b hover:bg-surface2 transition-colors" style={{ borderColor: "var(--border)" }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                          style={{ background: brandColor }}>
                          {s.brand.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-text text-xs">{s.name}</p>
                          <p className="text-[10px] text-text3">{s.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-text2 truncate max-w-[140px]">{s.address}</p>
                      <p className="text-[10px] text-text3">{s.city}, {s.state}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {s.distance != null ? (
                        <span className={s.distance < 100 ? "text-green" : "text-text2"}>{s.distance} mi</span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-mono font-bold text-sm ${s.diesel === cheapestDiesel ? "text-green" : "text-text"}`}>
                        ${s.diesel.toFixed(3)}
                      </span>
                      {s.diesel === cheapestDiesel && (
                        <span className="ml-1.5 text-[9px] font-mono font-bold px-1 py-0.5 rounded bg-green/10 text-green">BEST</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-text2">${s.def.toFixed(3)}</td>
                    <td className="px-4 py-3">
                      <span className={`font-mono text-xs font-medium ${dieselVsAvg < 0 ? "text-green" : "text-[#ef4444]"}`}>
                        {dieselVsAvg < 0 ? "↓" : "↑"} ${Math.abs(dieselVsAvg).toFixed(3)}/gal
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {s.amenities.slice(0, 3).map((a) => (
                          <span key={a} className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                            style={{ background: "var(--surface3)", color: "var(--text3)" }}>
                            {a}
                          </span>
                        ))}
                        {s.amenities.length > 3 && (
                          <span className="text-[9px] font-mono text-text3">+{s.amenities.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${s.truckStop ? "bg-accent/10 text-accent" : "bg-surface3 text-text3"}`}>
                        {s.truckStop ? "Truck Stop" : "Gas Station"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t text-xs text-text3 font-mono flex items-center justify-between"
          style={{ borderColor: "var(--border)" }}>
          <span>{filtered.length} stations</span>
          <span className="text-text3">Prices updated {lastRefreshed.toLocaleTimeString()} · Source: Mock data for demo</span>
        </div>
      </div>
    </div>
  );
}
