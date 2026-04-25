-- FleetOS Database Schema
-- Run this in your Supabase SQL Editor at: https://app.supabase.com

-- Companies (multi-tenant)
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  dot_number text unique,
  timezone text default 'America/New_York',
  address text,
  email text,
  phone text,
  cycle_rule text default 'USA 70 Hour / 8 Day',
  cargo_type text default 'Property',
  rest_break text default '30 min Break',
  cycle_restart text default '34 Hour Restart',
  created_at timestamptz default now()
);

-- Users (fleet managers, dispatchers)
create table if not exists users (
  id uuid primary key references auth.users(id),
  company_id uuid references companies(id),
  name text,
  email text,
  phone text,
  role text default 'manager',
  status text default 'active',
  created_at timestamptz default now()
);

-- Drivers
create table if not exists drivers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id),
  name text not null,
  username text unique,
  cdl_number text,
  cdl_state text,
  co_driver_id uuid references drivers(id),
  email text,
  phone text,
  status text default 'active',
  app_version text,
  created_at timestamptz default now(),
  activated_at timestamptz
);

-- Vehicles
create table if not exists vehicles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id),
  vehicle_number text not null,
  make text,
  model text,
  year int,
  vin text unique,
  plate_number text,
  assigned_driver_id uuid references drivers(id),
  status text default 'active',
  notes text,
  created_at timestamptz default now(),
  activated_at timestamptz
);

-- ELD Devices
create table if not exists eld_devices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id),
  mac_address text unique,
  serial_number text unique,
  model text default 'FLEETOS-SIM-v1',
  ble_version text default '5.0',
  firmware_version text default '2.1.4',
  assigned_vehicle_id uuid references vehicles(id),
  status text default 'active',
  is_blocked boolean default false,
  is_simulated boolean default true,
  created_at timestamptz default now(),
  activated_at timestamptz,
  deactivated_at timestamptz
);

-- GPS Positions (written by simulator every 5 sec)
create table if not exists gps_positions (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid references vehicles(id),
  driver_id uuid references drivers(id),
  latitude float8 not null,
  longitude float8 not null,
  speed float4 default 0,
  heading float4 default 0,
  altitude float4,
  accuracy float4,
  engine_hours float4,
  odometer float8,
  recorded_at timestamptz default now()
);
create index if not exists gps_positions_vehicle_time on gps_positions(vehicle_id, recorded_at desc);

-- HOS Logs
create table if not exists hos_logs (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid references drivers(id),
  vehicle_id uuid references vehicles(id),
  company_id uuid references companies(id),
  duty_status text not null,
  start_time timestamptz not null,
  end_time timestamptz,
  duration_minutes int,
  location text,
  latitude float8,
  longitude float8,
  odometer float8,
  engine_hours float4,
  is_auto boolean default false,
  notes text,
  is_certified boolean default false,
  created_at timestamptz default now()
);
create index if not exists hos_logs_driver_time on hos_logs(driver_id, start_time desc);

-- Driver HOS Summary
create table if not exists driver_hos_summary (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid unique references drivers(id),
  vehicle_id uuid references vehicles(id),
  current_duty_status text default 'OFF',
  current_location text,
  current_latitude float8,
  current_longitude float8,
  current_speed float4 default 0,
  drive_remaining_minutes int default 660,
  shift_remaining_minutes int default 840,
  break_remaining_minutes int default 30,
  cycle_remaining_minutes int default 4200,
  drive_used_minutes int default 0,
  shift_used_minutes int default 0,
  cycle_used_minutes int default 0,
  violations int default 0,
  last_violation_type text,
  eld_status text default 'active',
  online_status text default 'offline',
  last_updated timestamptz default now()
);

-- Unidentified Events
create table if not exists unidentified_events (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid references vehicles(id),
  start_time timestamptz,
  end_time timestamptz,
  distance_miles float4,
  resolved boolean default false,
  resolved_by uuid references drivers(id),
  created_at timestamptz default now()
);

-- Enable Realtime
alter publication supabase_realtime add table gps_positions;
alter publication supabase_realtime add table driver_hos_summary;
alter publication supabase_realtime add table hos_logs;

-- Row Level Security (optional — disable for testing)
alter table companies enable row level security;
alter table drivers enable row level security;
alter table vehicles enable row level security;
alter table gps_positions enable row level security;
alter table hos_logs enable row level security;
alter table driver_hos_summary enable row level security;

-- Allow all access (for demo — tighten in production)
create policy "Allow all" on companies for all using (true) with check (true);
create policy "Allow all" on drivers for all using (true) with check (true);
create policy "Allow all" on vehicles for all using (true) with check (true);
create policy "Allow all" on gps_positions for all using (true) with check (true);
create policy "Allow all" on hos_logs for all using (true) with check (true);
create policy "Allow all" on driver_hos_summary for all using (true) with check (true);
create policy "Allow all" on eld_devices for all using (true) with check (true);
create policy "Allow all" on unidentified_events for all using (true) with check (true);
create policy "Allow all" on users for all using (true) with check (true);

-- Demo company seed
insert into companies (name, dot_number, timezone, address, email, phone)
values ('FleetOS Demo Co.', '89569', 'America/New_York', '123 Fleet Ave, Chicago, IL 60601', 'demo@fleetosdemo.com', '(555) 000-0000')
on conflict (dot_number) do nothing;
