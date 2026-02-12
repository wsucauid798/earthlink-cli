export type SimulationAction = "start" | "pause" | "reset";

export interface ApiVersion {
  version: string;
}

export interface WorldTime {
  current_time: string;
  tick_count: number;
  date: string;
  hour: number;
  minute: number;
  season: string;
}

export interface WorldStateSummary {
  time: WorldTime;
  is_running: boolean;
  location_count: number;
  connection_count: number;
  weather_stations: number;
  weather: Record<string, unknown>;
}

export interface Location {
  id: number;
  name: string;
  type: string;
  lat: number;
  lng: number;
  elevation: number | null;
  terrain: string | null;
  admin_level_1: string | null;
  admin_level_2: string | null;
  admin_level_3: string | null;
  admin_level_4: string | null;
  population: number | null;
}

export interface Connection {
  from_id: number;
  to_id: number;
  distance_km: number;
  connection_type: string;
  route_name: string | null;
  direction: string | null;
}

export interface NearbyLocation {
  location: Location;
  connection: Connection;
}

export interface Weather {
  location_id: number;
  temperature_c: number | null;
  precipitation_mm: number | null;
  humidity_pct: number | null;
  wind_speed_kmh: number | null;
  wind_direction_deg: number | null;
  cloud_cover_pct: number | null;
  visibility_km: number | null;
  pressure_hpa: number | null;
  conditions: string | null;
}

export interface Astronomy {
  sunrise: string | null;
  sunset: string | null;
  day_length_hours: number | null;
  moon_phase: number | null;
  is_daylight: boolean;
}
