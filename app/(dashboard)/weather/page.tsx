"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Droplets, Eye, RefreshCw, Thermometer, AlertTriangle } from "lucide-react";

interface WeatherData {
  driverName: string;
  vehicleNumber: string;
  lat: number;
  lng: number;
  city?: string;
  current: {
    temp: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    windDir: number;
    visibility: number;
    weatherCode: number;
    description: string;
    icon: string;
  };
  hourly: { time: string; temp: number; precipProb: number; weatherCode: number }[];
  daily: {
    date: string;
    dayName: string;
    high: number;
    low: number;
    precipProb: number;
    weatherCode: number;
    description: string;
  }[];
  alerts: string[];
}

// WMO Weather Code interpretation
function getWeatherInfo(code: number): { description: string; icon: string; severe: boolean } {
  if (code === 0) return { description: "Clear sky", icon: "☀️", severe: false };
  if (code <= 2) return { description: "Partly cloudy", icon: "⛅", severe: false };
  if (code === 3) return { description: "Overcast", icon: "☁️", severe: false };
  if (code <= 49) return { description: "Foggy", icon: "🌫️", severe: false };
  if (code <= 59) return { description: "Drizzle", icon: "🌦️", severe: false };
  if (code <= 69) return { description: "Rain", icon: "🌧️", severe: false };
  if (code <= 79) return { description: "Snow", icon: "❄️", severe: true };
  if (code <= 82) return { description: "Rain showers", icon: "🌧️", severe: false };
  if (code <= 86) return { description: "Snow showers", icon: "🌨️", severe: true };
  if (code <= 99) return { description: "Thunderstorm", icon: "⛈️", severe: true };
  return { description: "Unknown", icon: "🌡️", severe: false };
}

function getWindDirection(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}

function formatDayName(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === new Date(today.getTime() + 86400000).toDateString()) return "Tomorrow";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

async function fetchWeather(lat: number, lng: number): Promise<Omit<WeatherData, "driverName" | "vehicleNumber" | "lat" | "lng" | "city" | "alerts">> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,visibility,weather_code&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=fahrenheit&wind_speed_unit=mph&forecast_days=7&timezone=America%2FChicago`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather API error");
  const data = await res.json();

  const c = data.current;
  const wInfo = getWeatherInfo(c.weather_code);

  const hourly = (data.hourly.time as string[]).slice(0, 24).map((t, i) => ({
    time: new Date(t).toLocaleTimeString("en-US", { hour: "numeric", hour12: true }),
    temp: Math.round(data.hourly.temperature_2m[i]),
    precipProb: data.hourly.precipitation_probability[i] ?? 0,
    weatherCode: data.hourly.weather_code[i],
  }));

  const daily = (data.daily.time as string[]).map((t, i) => ({
    date: t,
    dayName: formatDayName(t),
    high: Math.round(data.daily.temperature_2m_max[i]),
    low: Math.round(data.daily.temperature_2m_min[i]),
    precipProb: data.daily.precipitation_probability_max[i] ?? 0,
    weatherCode: data.daily.weather_code[i],
    description: getWeatherInfo(data.daily.weather_code[i]).description,
  }));

  return {
    current: {
      temp: Math.round(c.temperature_2m),
      feelsLike: Math.round(c.apparent_temperature),
      humidity: c.relative_humidity_2m,
      windSpeed: Math.round(c.wind_speed_10m),
      windDir: c.wind_direction_10m,
      visibility: Math.round((c.visibility ?? 10000) / 1609),
      weatherCode: c.weather_code,
      description: wInfo.description,
      icon: wInfo.icon,
    },
    hourly,
    daily,
  };
}

export default function WeatherPage() {
  const supabase = createClient();
  const [weatherList, setWeatherList] = useState<WeatherData[]>([]);
  const [selected, setSelected] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function loadWeather() {
    setLoading(true);
    setError(null);

    const { data: summaries } = await supabase
      .from("driver_hos_summary")
      .select("*, drivers(name), vehicles(vehicle_number)")
      .not("current_latitude", "is", null);

    // Use real driver positions or fall back to demo locations
    const locations: { driverName: string; vehicleNumber: string; lat: number; lng: number }[] =
      summaries && (summaries as any[]).length > 0
        ? (summaries as any[]).filter((s) => s.current_latitude).map((s) => ({
            driverName: s.drivers?.name ?? "Unknown",
            vehicleNumber: s.vehicles?.vehicle_number ?? "TRK",
            lat: s.current_latitude,
            lng: s.current_longitude,
          }))
        : [
            { driverName: "John Smith", vehicleNumber: "TRK-001", lat: 41.8781, lng: -87.6298 },
            { driverName: "Maria Garcia", vehicleNumber: "TRK-002", lat: 41.9000, lng: -90.5776 },
            { driverName: "Robert Lee", vehicleNumber: "TRK-003", lat: 39.7684, lng: -86.1581 },
          ];

    try {
      const results = await Promise.all(
        locations.slice(0, 5).map(async (loc) => {
          const weather = await fetchWeather(loc.lat, loc.lng);
          const alerts: string[] = [];
          if (weather.current.windSpeed > 45) alerts.push("High Wind Warning");
          if (weather.current.weatherCode >= 80) alerts.push("Severe Weather Alert");
          if (weather.daily[0]?.precipProb > 70) alerts.push("High Precipitation Chance");
          return { ...loc, ...weather, alerts };
        })
      );
      setWeatherList(results);
      setSelected(results[0] ?? null);
    } catch (e) {
      setError("Unable to fetch weather data. Check your internet connection.");
    }
    setLoading(false);
    setLastUpdated(new Date());
  }

  useEffect(() => { loadWeather(); }, []);

  const severeCount = weatherList.filter((w) => w.alerts.length > 0).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl text-text">Live & Upcoming Weather</h2>
          <p className="text-sm text-text3 mt-0.5">Real-time weather at each driver&apos;s location via Open-Meteo</p>
        </div>
        <div className="flex items-center gap-2">
          {severeCount > 0 && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium"
              style={{ background: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.25)", color: "#ef4444" }}>
              <AlertTriangle size={12} />
              {severeCount} weather alert{severeCount > 1 ? "s" : ""}
            </span>
          )}
          <button onClick={loadWeather} disabled={loading}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg border text-sm text-text2 hover:text-text transition-all hover:border-accent/30"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border text-sm"
          style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)", color: "#ef4444" }}>
          <AlertTriangle size={14} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border p-4 space-y-3 h-48" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="h-3 rounded animate-pulse" style={{ background: "var(--surface3)", width: j === 0 ? "60%" : "100%" }} />
              ))}
            </div>
          ))}
        </div>
      ) : weatherList.length === 0 ? (
        <div className="rounded-xl border py-16 text-center" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <Cloud size={32} className="mx-auto text-text3 opacity-30 mb-3" />
          <p className="text-text2 font-medium">No driver locations available</p>
          <p className="text-text3 text-sm mt-1">Start the simulator to get live driver positions</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {/* Driver list */}
          <div className="space-y-2">
            {weatherList.map((w) => {
              const wInfo = getWeatherInfo(w.current.weatherCode);
              return (
                <button
                  key={w.driverName}
                  onClick={() => setSelected(w)}
                  className={`w-full text-left rounded-xl border p-3.5 transition-all hover:border-accent/30 ${selected?.driverName === w.driverName ? "border-accent/40 bg-accent/5" : ""}`}
                  style={{ background: "var(--surface)", borderColor: selected?.driverName === w.driverName ? undefined : "var(--border)" }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <p className="font-medium text-sm text-text">{w.driverName}</p>
                      <p className="text-[11px] font-mono text-text3">{w.vehicleNumber}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl leading-none">{w.current.icon}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-xl text-text">{w.current.temp}°F</span>
                    <span className="text-xs text-text3">{w.current.description}</span>
                  </div>
                  {w.alerts.length > 0 && (
                    <div className="mt-2 flex items-center gap-1 text-[10px] font-mono text-[#ef4444]">
                      <AlertTriangle size={9} />
                      {w.alerts[0]}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="col-span-2 space-y-4">
              {/* Current conditions */}
              <div className="rounded-xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-medium text-text">{selected.driverName}</p>
                    <p className="text-xs font-mono text-text3">{selected.lat.toFixed(3)}, {selected.lng.toFixed(3)}</p>
                  </div>
                  {selected.alerts.length > 0 && (
                    <div className="space-y-1">
                      {selected.alerts.map((a) => (
                        <div key={a} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg"
                          style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                          <AlertTriangle size={10} />
                          {a}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-end gap-4 mb-4">
                  <span className="text-6xl leading-none">{selected.current.icon}</span>
                  <div>
                    <p className="font-display font-bold text-5xl text-text">{selected.current.temp}°F</p>
                    <p className="text-text3 text-sm mt-1">{selected.current.description}</p>
                    <p className="text-xs text-text3">Feels like {selected.current.feelsLike}°F</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  {[
                    { icon: Wind, label: "Wind", value: `${selected.current.windSpeed} mph ${getWindDirection(selected.current.windDir)}` },
                    { icon: Droplets, label: "Humidity", value: `${selected.current.humidity}%` },
                    { icon: Eye, label: "Visibility", value: `${selected.current.visibility} mi` },
                    { icon: Thermometer, label: "Feels Like", value: `${selected.current.feelsLike}°F` },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl p-3 space-y-1" style={{ background: "var(--surface2)" }}>
                      <div className="flex items-center gap-1.5 text-xs text-text3">
                        <item.icon size={11} />
                        {item.label}
                      </div>
                      <p className="font-mono font-medium text-sm text-text">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 24-hour forecast */}
              <div className="rounded-xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <p className="text-xs font-mono text-text3 uppercase tracking-widest mb-3">24-Hour Forecast</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {selected.hourly.filter((_, i) => i % 3 === 0).map((h, i) => {
                    const hInfo = getWeatherInfo(h.weatherCode);
                    return (
                      <div key={i} className="flex flex-col items-center gap-1 min-w-[52px] px-2 py-2 rounded-lg text-center"
                        style={{ background: "var(--surface2)" }}>
                        <span className="text-[10px] font-mono text-text3">{h.time}</span>
                        <span className="text-lg leading-none">{hInfo.icon}</span>
                        <span className="font-mono font-bold text-xs text-text">{h.temp}°</span>
                        {h.precipProb > 20 && (
                          <span className="text-[9px] font-mono text-blue-400">{h.precipProb}%</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 7-day forecast */}
              <div className="rounded-xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <p className="text-xs font-mono text-text3 uppercase tracking-widest px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
                  7-Day Forecast
                </p>
                <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {selected.daily.map((day, i) => {
                    const dInfo = getWeatherInfo(day.weatherCode);
                    return (
                      <div key={i} className="flex items-center gap-4 px-4 py-3">
                        <span className="w-24 text-sm font-medium text-text">{day.dayName}</span>
                        <span className="text-xl">{dInfo.icon}</span>
                        <span className="flex-1 text-xs text-text3">{day.description}</span>
                        {day.precipProb > 20 && (
                          <span className="flex items-center gap-1 text-xs text-blue-400 font-mono">
                            <Droplets size={10} />
                            {day.precipProb}%
                          </span>
                        )}
                        <div className="flex items-center gap-2 font-mono text-sm">
                          <span className="text-text">{day.high}°</span>
                          <span className="text-text3">{day.low}°</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
