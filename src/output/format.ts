export function printOutput(payload: unknown, asJson: boolean): void {
  if (asJson) {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    return;
  }

  if (typeof payload === "string") {
    process.stdout.write(`${payload}\n`);
    return;
  }

  if (isWorldTime(payload)) {
    process.stdout.write("World Time\n");
    process.stdout.write("----------\n");
    process.stdout.write(`Time: ${String(payload.hour).padStart(2, "0")}:${String(payload.minute).padStart(2, "0")}\n`);
    return;
  }

  if (isWorldState(payload)) {
    process.stdout.write("World State\n");
    process.stdout.write("-----------\n");
    process.stdout.write(`Running:          ${payload.is_running ? "yes" : "no"}\n`);
    process.stdout.write(`Current Time:     ${payload.time.current_time}\n`);
    process.stdout.write(`Tick:             ${payload.time.tick_count}\n`);
    process.stdout.write(`Locations:        ${payload.location_count.toLocaleString()}\n`);
    process.stdout.write(`Connections:      ${payload.connection_count.toLocaleString()}\n`);
    process.stdout.write(`Weather Stations: ${payload.weather_stations.toLocaleString()}\n`);
    return;
  }

  if (isLocation(payload)) {
    console.table([{
      id: payload.id,
      name: payload.name,
      type: payload.type,
      region: payload.admin_level_2,
      lat: payload.lat,
      lng: payload.lng,
      population: payload.population,
    }]);
    return;
  }

  if (isLocationArray(payload)) {
    console.table(payload.map((item) => ({
      id: item.id,
      name: item.name,
      type: item.type,
      region: item.admin_level_2,
      lat: item.lat,
      lng: item.lng,
      population: item.population,
    })));
    return;
  }

  if (isNearbyArray(payload)) {
    console.table(payload.map((item) => ({
      id: item.location.id,
      name: item.location.name,
      type: item.location.type,
      distance_km: item.connection.distance_km,
      direction: item.connection.direction,
      connection_type: item.connection.connection_type,
    })));
    return;
  }

  if (isWeather(payload)) {
    console.table([payload]);
    return;
  }

  if (isAstronomy(payload)) {
    console.table([payload]);
    return;
  }

  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isWorldTime(value: unknown): value is {
  current_time: string;
  tick_count: number;
  date: string;
  hour: number;
  minute: number;
  season: string;
} {
  return isRecord(value)
    && typeof value.current_time === "string"
    && typeof value.tick_count === "number"
    && typeof value.date === "string"
    && typeof value.hour === "number"
    && typeof value.minute === "number"
    && typeof value.season === "string";
}

function isWorldState(value: unknown): value is {
  time: { current_time: string; tick_count: number };
  is_running: boolean;
  location_count: number;
  connection_count: number;
  weather_stations: number;
} {
  return isRecord(value)
    && isRecord(value.time)
    && typeof value.time.current_time === "string"
    && typeof value.time.tick_count === "number"
    && typeof value.is_running === "boolean"
    && typeof value.location_count === "number"
    && typeof value.connection_count === "number"
    && typeof value.weather_stations === "number";
}

function isLocation(value: unknown): value is {
  id: number;
  name: string;
  type: string;
  admin_level_2: string | null;
  lat: number;
  lng: number;
  population: number | null;
} {
  return isRecord(value)
    && typeof value.id === "number"
    && typeof value.name === "string"
    && typeof value.type === "string"
    && (typeof value.admin_level_2 === "string" || value.admin_level_2 === null)
    && typeof value.lat === "number"
    && typeof value.lng === "number"
    && (typeof value.population === "number" || value.population === null);
}

function isLocationArray(value: unknown): value is Array<{
  id: number;
  name: string;
  type: string;
  admin_level_2: string | null;
  lat: number;
  lng: number;
  population: number | null;
}> {
  return Array.isArray(value) && value.every(isLocation);
}

function isNearbyArray(value: unknown): value is Array<{
  location: { id: number; name: string; type: string };
  connection: { distance_km: number; direction: string | null; connection_type: string };
}> {
  return Array.isArray(value) && value.every((item) => {
    if (!isRecord(item) || !isRecord(item.location) || !isRecord(item.connection)) {
      return false;
    }
    return typeof item.location.id === "number"
      && typeof item.location.name === "string"
      && typeof item.location.type === "string"
      && typeof item.connection.distance_km === "number"
      && (typeof item.connection.direction === "string" || item.connection.direction === null)
      && typeof item.connection.connection_type === "string";
  });
}

function isWeather(value: unknown): value is Record<string, unknown> {
  return isRecord(value)
    && typeof value.location_id === "number"
    && (typeof value.conditions === "string" || value.conditions === null);
}

function isAstronomy(value: unknown): value is Record<string, unknown> {
  return isRecord(value)
    && "is_daylight" in value
    && "moon_phase" in value;
}
