export type DutyStatus = "DR" | "ON" | "SB" | "OFF";
export type OnlineStatus = "online" | "offline";
export type EldStatus = "active" | "malfunction" | "diagnostic";

export interface Company {
  id: string;
  name: string;
  dot_number?: string;
  timezone: string;
  address?: string;
  email?: string;
  phone?: string;
  cycle_rule: string;
  cargo_type: string;
  rest_break: string;
  cycle_restart: string;
  created_at: string;
}

export interface User {
  id: string;
  company_id: string;
  name?: string;
  email?: string;
  phone?: string;
  role: "manager" | "dispatcher" | "admin";
  status: "active" | "inactive";
  created_at: string;
}

export interface Driver {
  id: string;
  company_id: string;
  name: string;
  username?: string;
  cdl_number?: string;
  cdl_state?: string;
  co_driver_id?: string;
  email?: string;
  phone?: string;
  status: "active" | "deactivated";
  app_version?: string;
  created_at: string;
  activated_at?: string;
}

export interface Vehicle {
  id: string;
  company_id: string;
  vehicle_number: string;
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  plate_number?: string;
  assigned_driver_id?: string;
  status: "active" | "deactivated";
  notes?: string;
  created_at: string;
  activated_at?: string;
}

export interface EldDevice {
  id: string;
  company_id: string;
  mac_address: string;
  serial_number: string;
  model: string;
  ble_version?: string;
  firmware_version?: string;
  assigned_vehicle_id?: string;
  status: "active" | "inactive";
  is_blocked: boolean;
  is_simulated: boolean;
  created_at: string;
  activated_at?: string;
  deactivated_at?: string;
}

export interface GpsPosition {
  id: string;
  vehicle_id: string;
  driver_id?: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  altitude?: number;
  accuracy?: number;
  engine_hours?: number;
  odometer?: number;
  recorded_at: string;
}

export interface HosLog {
  id: string;
  driver_id: string;
  vehicle_id?: string;
  company_id: string;
  duty_status: DutyStatus;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  location?: string;
  latitude?: number;
  longitude?: number;
  odometer?: number;
  engine_hours?: number;
  is_auto: boolean;
  notes?: string;
  is_certified: boolean;
  created_at: string;
}

export interface DriverHosSummary {
  id: string;
  driver_id: string;
  vehicle_id?: string;
  current_duty_status: DutyStatus;
  current_location?: string;
  current_latitude?: number;
  current_longitude?: number;
  current_speed: number;
  drive_remaining_minutes: number;
  shift_remaining_minutes: number;
  break_remaining_minutes: number;
  cycle_remaining_minutes: number;
  drive_used_minutes: number;
  shift_used_minutes: number;
  cycle_used_minutes: number;
  violations: number;
  last_violation_type?: string;
  eld_status: EldStatus;
  online_status: OnlineStatus;
  last_updated: string;
}

export interface UnidentifiedEvent {
  id: string;
  vehicle_id: string;
  start_time?: string;
  end_time?: string;
  distance_miles?: number;
  resolved: boolean;
  resolved_by?: string;
  created_at: string;
}

// Joined types for UI
export interface DriverWithSummary extends Driver {
  hos_summary?: DriverHosSummary;
  vehicle?: Vehicle;
}

export interface VehicleWithDetails extends Vehicle {
  assigned_driver?: Driver;
  eld_device?: EldDevice;
  latest_position?: GpsPosition;
}

type TableDef<T> = {
  Row: T;
  Insert: Partial<T>;
  Update: Partial<T>;
  Relationships: never[];
};

export type Database = {
  public: {
    Tables: {
      companies: TableDef<Company>;
      users: TableDef<User>;
      drivers: TableDef<Driver>;
      vehicles: TableDef<Vehicle>;
      eld_devices: TableDef<EldDevice>;
      gps_positions: TableDef<GpsPosition>;
      hos_logs: TableDef<HosLog>;
      driver_hos_summary: TableDef<DriverHosSummary>;
      unidentified_events: TableDef<UnidentifiedEvent>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
