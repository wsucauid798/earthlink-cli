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
    if (payload.time.local_time) {
      process.stdout.write(`Local Time:       ${payload.time.local_time} ${payload.time.timezone_abbr ?? ""}\n`);
    }
    process.stdout.write(`Tick:             ${payload.time.tick_count}\n`);
    process.stdout.write(`Season:           ${payload.time.season}\n`);
    process.stdout.write(`Locations:        ${payload.location_count.toLocaleString()}\n`);
    process.stdout.write(`Connections:      ${payload.connection_count.toLocaleString()}\n`);
    process.stdout.write(`Weather Stations: ${payload.weather_stations.toLocaleString()}\n`);
    process.stdout.write(`Agents:           ${payload.agent_count ?? 0}\n`);
    if (payload.earth_proxy) {
      process.stdout.write(`Earth Proxy:      ${payload.earth_proxy.adapters} adapters, ${payload.earth_proxy.backend} (TTL ${payload.earth_proxy.ttl_seconds}s, ${payload.earth_proxy.total_resolves} resolves)\n`);
    }
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

  if (isAgentAnswer(payload)) {
    process.stdout.write(`\nAgent: ${payload.agent_id}\n`);
    process.stdout.write(`Question: ${payload.question}\n`);
    process.stdout.write(`Answer: ${payload.answer}\n`);
    process.stdout.write(`Confidence: ${(payload.answer_confidence * 100).toFixed(0)}% (${payload.answer_certainty})\n`);
    process.stdout.write(`Retrieval: ${payload.retrieval_backend}\n`);
    if (payload.supporting_facts && payload.supporting_facts.length > 0) {
      process.stdout.write(`Supporting facts: ${payload.supporting_facts.length}\n`);
    }
    return;
  }

  if (isAgentDetail(payload)) {
    process.stdout.write(`\nAgent: ${payload.name} (${payload.id})\n`);
    process.stdout.write("─".repeat(40) + "\n");
    process.stdout.write(`Location:         ${payload.location_name ?? payload.location_id}\n`);
    process.stdout.write(`Energy:           ${(payload.energy * 100).toFixed(0)}%\n`);
    process.stdout.write(`Knowledge Score:  ${payload.knowledge_score.toFixed(2)}\n`);
    process.stdout.write(`Visited Places:   ${payload.visited_locations}\n`);
    process.stdout.write(`Last Action:      ${payload.last_action}\n`);
    process.stdout.write(`Last Reward:      ${payload.last_reward.toFixed(4)}\n`);
    process.stdout.write(`Policy:           ${payload.policy}\n`);
    if (payload.goal) {
      process.stdout.write(`Goal:             ${payload.goal.type ?? "none"}${payload.goal.target_name ? ` → ${payload.goal.target_name}` : ""}\n`);
    }
    if (payload.top_locations && payload.top_locations.length > 0) {
      process.stdout.write("\nTop Locations:\n");
      console.table(payload.top_locations.map((loc: Record<string, unknown>) => ({
        location: loc.location_name ?? loc.location_id,
        score: (loc.score as number).toFixed(3),
        visits: loc.visits,
      })));
    }
    if (payload.known_conditions && Object.keys(payload.known_conditions).length > 0) {
      process.stdout.write("Known Conditions:\n");
      for (const [condition, count] of Object.entries(payload.known_conditions)) {
        process.stdout.write(`  ${condition}: ${count}\n`);
      }
    }
    return;
  }

  if (isAgentSummaryArray(payload)) {
    if (payload.length === 0) {
      process.stdout.write("No agents in the world.\n");
      return;
    }
    console.table(payload.map((a) => ({
      id: a.id,
      name: a.name,
      location: a.location_name ?? a.location_id,
      energy: `${(a.energy * 100).toFixed(0)}%`,
      knowledge: a.knowledge_score.toFixed(2),
      visited: a.visited_locations,
      action: a.last_action,
      reward: a.last_reward.toFixed(4),
      policy: a.policy,
    })));
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
    && "sunrise" in value;
}

function isAgentSummary(value: unknown): value is Record<string, unknown> {
  return isRecord(value)
    && typeof value.id === "string"
    && typeof value.name === "string"
    && typeof value.knowledge_score === "number"
    && typeof value.energy === "number"
    && typeof value.last_action === "string";
}

function isAgentSummaryArray(value: unknown): value is Array<Record<string, unknown>> {
  return Array.isArray(value) && value.length > 0 && value.every(isAgentSummary);
}

function isAgentDetail(value: unknown): value is Record<string, unknown> {
  return isAgentSummary(value) && "top_locations" in value && "visited_places" in value;
}

function isAgentAnswer(value: unknown): value is Record<string, unknown> {
  return isRecord(value)
    && typeof value.agent_id === "string"
    && typeof value.question === "string"
    && typeof value.answer === "string"
    && typeof value.answer_confidence === "number";
}
