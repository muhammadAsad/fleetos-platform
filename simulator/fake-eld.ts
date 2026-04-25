/**
 * FleetOS Fake ELD Simulator
 * Run: npx tsx simulator/fake-eld.ts
 * Simulates 5 trucks on real US routes, writing GPS + HOS data to Supabase every 5 seconds.
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

interface SimTruck {
  vehicleId: string;
  driverId: string;
  name: string;
  route: { lat: number; lng: number }[];
  speedMph: number;
  status: "DR" | "ON" | "SB" | "OFF";
  driveUsed: number; // minutes
  shiftUsed: number;
  cycleUsed: number;
  violations: number;
}

async function getIds() {
  const [driversRes, vehiclesRes] = await Promise.all([
    supabase.from("drivers").select("id, name").eq("status", "active").order("created_at"),
    supabase.from("vehicles").select("id, vehicle_number").eq("status", "active").order("created_at"),
  ]);
  return { drivers: driversRes.data ?? [], vehicles: vehiclesRes.data ?? [] };
}

let TRUCKS: SimTruck[] = [];

async function initTrucks() {
  const { drivers, vehicles } = await getIds();

  if (drivers.length < 5 || vehicles.length < 5) {
    console.error("❌ Not enough drivers or vehicles in database. Run: npx tsx simulator/seed.ts first.");
    process.exit(1);
  }

  TRUCKS = [
    {
      vehicleId: vehicles[0].id,
      driverId: drivers[0].id,
      name: `${vehicles[0].vehicle_number} / ${drivers[0].name}`,
      route: [
        { lat: 41.8781, lng: -87.6298 }, // Chicago
        { lat: 41.5000, lng: -87.3500 },
        { lat: 41.1000, lng: -86.9000 },
        { lat: 40.7000, lng: -86.4000 },
        { lat: 40.4000, lng: -86.1500 },
        { lat: 39.7684, lng: -86.1581 }, // Indianapolis
      ],
      speedMph: 62, status: "DR", driveUsed: 363, shiftUsed: 410, cycleUsed: 1500, violations: 0,
    },
    {
      vehicleId: vehicles[1].id,
      driverId: drivers[1].id,
      name: `${vehicles[1].vehicle_number} / ${drivers[1].name}`,
      route: [
        { lat: 38.6270, lng: -90.1994 }, // St. Louis
        { lat: 38.0000, lng: -89.9000 },
        { lat: 37.2000, lng: -89.5000 },
        { lat: 36.5000, lng: -89.9000 },
        { lat: 35.1495, lng: -90.0490 }, // Memphis
      ],
      speedMph: 58, status: "DR", driveUsed: 295, shiftUsed: 350, cycleUsed: 1200, violations: 0,
    },
    {
      vehicleId: vehicles[2].id,
      driverId: drivers[2].id,
      name: `${vehicles[2].vehicle_number} / ${drivers[2].name}`,
      route: [
        { lat: 41.4993, lng: -81.6944 }, // Cleveland
        { lat: 41.2000, lng: -81.0000 },
        { lat: 40.9000, lng: -80.5000 },
        { lat: 40.4406, lng: -79.9959 }, // Pittsburgh
      ],
      speedMph: 71, status: "DR", driveUsed: 637, shiftUsed: 700, cycleUsed: 3900, violations: 1, // Near violation!
    },
    {
      vehicleId: vehicles[3].id,
      driverId: drivers[3].id,
      name: `${vehicles[3].vehicle_number} / ${drivers[3].name}`,
      route: [{ lat: 39.7684, lng: -86.1581 }], // Parked at Indianapolis
      speedMph: 0, status: "ON", driveUsed: 198, shiftUsed: 250, cycleUsed: 800, violations: 0,
    },
    {
      vehicleId: vehicles[4].id,
      driverId: drivers[4].id,
      name: `${vehicles[4].vehicle_number} / ${drivers[4].name}`,
      route: [{ lat: 39.9612, lng: -82.9988 }], // Columbus — on break
      speedMph: 0, status: "SB", driveUsed: 660, shiftUsed: 720, cycleUsed: 4100, violations: 0,
    },
  ];
}

const routePositions: Map<string, number> = new Map();

async function tick() {
  for (const truck of TRUCKS) {
    const route = truck.route;
    if (route.length === 0) continue;

    const posIdx = routePositions.get(truck.vehicleId) ?? 0;
    const current = route[posIdx % route.length];

    const jitterLat = (Math.random() - 0.5) * 0.002;
    const jitterLng = (Math.random() - 0.5) * 0.002;
    const lat = current.lat + jitterLat;
    const lng = current.lng + jitterLng;

    const speed = truck.speedMph > 0
      ? Math.max(45, Math.min(78, truck.speedMph + (Math.random() - 0.5) * 6))
      : 0;

    // Write GPS position
    const { error: gpsErr } = await supabase.from("gps_positions").insert({
      vehicle_id: truck.vehicleId,
      driver_id: truck.driverId,
      latitude: lat,
      longitude: lng,
      speed: speed,
      heading: Math.random() * 360,
      recorded_at: new Date().toISOString(),
    });
    if (gpsErr) console.error(`GPS insert error for ${truck.name}:`, gpsErr.message);

    // Update HOS summary
    const driveRemaining = Math.max(0, 660 - truck.driveUsed);
    const shiftRemaining = Math.max(0, 840 - truck.shiftUsed);
    const cycleRemaining = Math.max(0, 4200 - truck.cycleUsed);
    const breakRemaining = truck.driveUsed >= 480 ? 0 : 30;

    const { error: hosErr } = await supabase.from("driver_hos_summary").upsert({
      driver_id: truck.driverId,
      vehicle_id: truck.vehicleId,
      current_duty_status: truck.status,
      current_latitude: lat,
      current_longitude: lng,
      current_speed: speed,
      drive_remaining_minutes: driveRemaining,
      shift_remaining_minutes: shiftRemaining,
      break_remaining_minutes: breakRemaining,
      cycle_remaining_minutes: cycleRemaining,
      drive_used_minutes: Math.round(truck.driveUsed),
      shift_used_minutes: Math.round(truck.shiftUsed),
      cycle_used_minutes: Math.round(truck.cycleUsed),
      violations: truck.violations,
      eld_status: "active",
      online_status: "online",
      last_updated: new Date().toISOString(),
    }, { onConflict: "driver_id" });
    if (hosErr) console.error(`HOS upsert error for ${truck.name}:`, hosErr.message);

    // Advance route position
    if (truck.speedMph > 0 && Math.random() > 0.85) {
      routePositions.set(truck.vehicleId, (posIdx + 1) % route.length);
    }

    // Increment drive/shift/cycle time (~5 second increments)
    if (truck.status === "DR") {
      truck.driveUsed = Math.min(660, truck.driveUsed + (5 / 60));
      truck.shiftUsed = Math.min(840, truck.shiftUsed + (5 / 60));
      truck.cycleUsed = Math.min(4200, truck.cycleUsed + (5 / 60));

      // Auto-detect drive limit violation
      if (truck.driveUsed >= 660) {
        truck.violations = Math.max(1, truck.violations);
      }
    }
  }

  const drivingCount = TRUCKS.filter((t) => t.status === "DR").length;
  console.log(`[${new Date().toLocaleTimeString()}] ✓ Tick — ${TRUCKS.length} trucks (${drivingCount} driving)`);
}

async function main() {
  console.log("🚛 FleetOS ELD Simulator starting...");
  await initTrucks();
  console.log(`✓ Loaded ${TRUCKS.length} trucks:`);
  TRUCKS.forEach((t) => console.log(`  • ${t.name} — ${t.status}`));
  console.log("\nSending updates every 5 seconds. Press Ctrl+C to stop.\n");

  await tick();
  setInterval(tick, 5000);
}

main().catch(console.error);
