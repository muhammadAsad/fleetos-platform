/**
 * FleetOS Seed Script
 * Run: npx tsx simulator/seed.ts
 * Creates fake drivers, vehicles, ELD devices, and HOS summaries in your Supabase instance.
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const DRIVERS = [
  { name: "Carlos Martinez", username: "cmartinez", cdl_number: "IL8823441", cdl_state: "IL", email: "carlos@demo.com", phone: "(312) 555-0101" },
  { name: "Ana Garcia", username: "agarcia", cdl_number: "MO3312887", cdl_state: "MO", email: "ana@demo.com", phone: "(314) 555-0202" },
  { name: "Mike Davis", username: "mdavis", cdl_number: "OH4451229", cdl_state: "OH", email: "mike@demo.com", phone: "(216) 555-0303" },
  { name: "Sarah Williams", username: "swilliams", cdl_number: "IN2210556", cdl_state: "IN", email: "sarah@demo.com", phone: "(317) 555-0404" },
  { name: "Kevin Johnson", username: "kjohnson", cdl_number: "OH7734112", cdl_state: "OH", email: "kevin@demo.com", phone: "(614) 555-0505" },
];

const VEHICLES = [
  { vehicle_number: "TRK-001", make: "Freightliner", model: "Cascadia", year: 2022, vin: "1FUJGLDR4CLBF9001", plate_number: "IL-TRK001" },
  { vehicle_number: "TRK-002", make: "Kenworth", model: "T680", year: 2021, vin: "2XKHHD8X4AM395120", plate_number: "MO-TRK002" },
  { vehicle_number: "TRK-003", make: "Peterbilt", model: "389", year: 2023, vin: "1XP4DP9X7JD474492", plate_number: "OH-TRK003" },
  { vehicle_number: "TRK-004", make: "Volvo", model: "VNL 860", year: 2020, vin: "4V4NC9EH9LN243571", plate_number: "IN-TRK004" },
  { vehicle_number: "TRK-005", make: "Mack", model: "Anthem", year: 2022, vin: "1M1AN4GY7NM001432", plate_number: "OH-TRK005" },
];

const ELD_DEVICES = [
  { mac_address: "AA:BB:CC:DD:EE:01", serial_number: "FSIM-001-2024", model: "FLEETOS-SIM-v1", ble_version: "5.0", firmware_version: "2.1.4" },
  { mac_address: "AA:BB:CC:DD:EE:02", serial_number: "FSIM-002-2024", model: "FLEETOS-SIM-v1", ble_version: "5.0", firmware_version: "2.1.4" },
  { mac_address: "AA:BB:CC:DD:EE:03", serial_number: "FSIM-003-2024", model: "FLEETOS-SIM-v1", ble_version: "5.0", firmware_version: "2.1.4" },
  { mac_address: "AA:BB:CC:DD:EE:04", serial_number: "FSIM-004-2024", model: "FLEETOS-SIM-v1", ble_version: "5.0", firmware_version: "2.1.4" },
  { mac_address: "AA:BB:CC:DD:EE:05", serial_number: "FSIM-005-2024", model: "FLEETOS-SIM-v1", ble_version: "5.0", firmware_version: "2.1.4" },
];

async function seed() {
  console.log("🌱 FleetOS Seed Script starting...\n");

  // Get company
  let { data: company } = await supabase.from("companies").select("id, name").single();
  if (!company) {
    console.log("Creating demo company...");
    const { data: newCo } = await supabase.from("companies").insert({
      name: "FleetOS Demo Co.",
      dot_number: "89569",
      timezone: "America/New_York",
      address: "123 Fleet Ave, Chicago, IL 60601",
      email: "demo@fleetosdemo.com",
      phone: "(555) 000-0000",
    }).select().single();
    company = newCo;
  }

  if (!company) {
    console.error("❌ Failed to create/find company");
    process.exit(1);
  }

  console.log(`✓ Company: ${company.name} (${company.id})\n`);

  // Seed drivers
  console.log("Creating drivers...");
  const { data: drivers } = await supabase.from("drivers")
    .upsert(DRIVERS.map((d) => ({ ...d, company_id: company!.id, status: "active", activated_at: new Date().toISOString() })), { onConflict: "username" })
    .select();

  console.log(`✓ ${drivers?.length ?? 0} drivers created\n`);

  // Seed vehicles
  console.log("Creating vehicles...");
  const { data: vehicles } = await supabase.from("vehicles")
    .upsert(VEHICLES.map((v) => ({ ...v, company_id: company!.id, status: "active", activated_at: new Date().toISOString() })), { onConflict: "vin" })
    .select();

  console.log(`✓ ${vehicles?.length ?? 0} vehicles created\n`);

  // Assign drivers to vehicles
  if (drivers && vehicles) {
    for (let i = 0; i < Math.min(drivers.length, vehicles.length); i++) {
      await supabase.from("vehicles").update({ assigned_driver_id: drivers[i].id }).eq("id", vehicles[i].id);
    }
    console.log("✓ Assigned drivers to vehicles\n");
  }

  // Seed ELD devices
  console.log("Creating ELD devices...");
  if (vehicles) {
    const eldData = ELD_DEVICES.map((e, i) => ({
      ...e,
      company_id: company!.id,
      assigned_vehicle_id: vehicles[i]?.id,
      status: "active",
      is_simulated: true,
      is_blocked: false,
      activated_at: new Date().toISOString(),
    }));
    const { data: elds } = await supabase.from("eld_devices")
      .upsert(eldData, { onConflict: "serial_number" })
      .select();
    console.log(`✓ ${elds?.length ?? 0} ELD devices created\n`);
  }

  // Create initial HOS summaries
  if (drivers && vehicles) {
    console.log("Creating initial HOS summaries...");
    const summaries = [
      { driveUsed: 363, shiftUsed: 410, cycleUsed: 1500, status: "DR", lat: 40.7000, lng: -86.4000, speed: 62, violations: 0 },
      { driveUsed: 295, shiftUsed: 350, cycleUsed: 1200, status: "DR", lat: 37.2000, lng: -89.5000, speed: 58, violations: 0 },
      { driveUsed: 637, shiftUsed: 700, cycleUsed: 3900, status: "DR", lat: 40.9000, lng: -80.5000, speed: 71, violations: 1 },
      { driveUsed: 198, shiftUsed: 250, cycleUsed: 800, status: "ON", lat: 39.7684, lng: -86.1581, speed: 0, violations: 0 },
      { driveUsed: 660, shiftUsed: 720, cycleUsed: 4100, status: "SB", lat: 39.9612, lng: -82.9988, speed: 0, violations: 0 },
    ];

    for (let i = 0; i < drivers.length; i++) {
      const s = summaries[i];
      await supabase.from("driver_hos_summary").upsert({
        driver_id: drivers[i].id,
        vehicle_id: vehicles[i].id,
        current_duty_status: s.status,
        current_latitude: s.lat,
        current_longitude: s.lng,
        current_speed: s.speed,
        drive_remaining_minutes: 660 - s.driveUsed,
        shift_remaining_minutes: 840 - s.shiftUsed,
        break_remaining_minutes: s.driveUsed >= 480 ? 0 : 30,
        cycle_remaining_minutes: 4200 - s.cycleUsed,
        drive_used_minutes: s.driveUsed,
        shift_used_minutes: s.shiftUsed,
        cycle_used_minutes: s.cycleUsed,
        violations: s.violations,
        eld_status: "active",
        online_status: "offline",
        last_updated: new Date().toISOString(),
      }, { onConflict: "driver_id" });
    }
    console.log("✓ Initial HOS summaries created\n");
  }

  console.log("✅ Seed complete! Now run:\n   npx tsx simulator/fake-eld.ts\n   npm run dev");
}

seed().catch(console.error);
