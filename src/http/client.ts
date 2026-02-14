import {
  AgentAnswer,
  AgentDetail,
  AgentSummary,
  ApiVersion,
  Astronomy,
  Location,
  NearbyLocation,
  SimulationAction,
  Weather,
  WorldStateSummary,
  WorldTime,
} from "../types/api";

class HttpClientError extends Error {
  constructor(
    message: string,
    public readonly endpoint: string,
    public readonly status?: number,
    public readonly detail?: string,
  ) {
    super(message);
  }
}

export class EarthlinkApiClient {
  private readonly baseURL: string;
  private readonly startupRetryCount = 6;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async getVersion(): Promise<ApiVersion> {
    return this.request<ApiVersion>("/api/version");
  }

  async getWorldState(): Promise<WorldStateSummary> {
    return this.request<WorldStateSummary>("/api/world/state");
  }

  async getWorldTime(): Promise<WorldTime> {
    return this.request<WorldTime>("/api/time");
  }

  async controlSimulation(action: SimulationAction): Promise<{ status: string }> {
    return this.request<{ status: string }>("/api/simulation/control", {
      method: "POST",
      body: JSON.stringify({ action }),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async listLocations(params: {
    type?: string;
    region?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Location[]> {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        query.set(key, String(value));
      }
    }
    const suffix = query.size > 0 ? `?${query.toString()}` : "";
    return this.request<Location[]>(`/api/locations${suffix}`);
  }

  async getLocation(locationId: number): Promise<Location> {
    return this.request<Location>(`/api/locations/${locationId}`);
  }

  async getNearbyLocations(locationId: number): Promise<NearbyLocation[]> {
    return this.request<NearbyLocation[]>(`/api/locations/${locationId}/nearby`);
  }

  async getWeather(locationId: number): Promise<Weather | null> {
    return this.request<Weather | null>(`/api/weather/${locationId}`);
  }

  async getAstronomy(locationId: number): Promise<Astronomy | null> {
    return this.request<Astronomy | null>(`/api/astronomy/${locationId}`);
  }

  async listAgents(): Promise<AgentSummary[]> {
    return this.request<AgentSummary[]>("/api/agents");
  }

  async getAgent(agentId: string): Promise<AgentDetail> {
    return this.request<AgentDetail>(`/api/agents/${encodeURIComponent(agentId)}`);
  }

  async askAgent(agentId: string, question: string): Promise<AgentAnswer> {
    const query = new URLSearchParams({ question });
    return this.request<AgentAnswer>(`/api/agents/${encodeURIComponent(agentId)}/ask?${query.toString()}`);
  }

  private async request<T>(endpoint: string, init?: RequestInit): Promise<T> {
    for (let attempt = 1; attempt <= this.startupRetryCount; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
          ...init,
          signal: controller.signal,
        });

        const rawBody = await response.text();
        const body = rawBody ? JSON.parse(rawBody) as unknown : null;

        if (!response.ok) {
          const detail =
            body && typeof body === "object" && body !== null && "detail" in body
              ? String((body as { detail?: unknown }).detail ?? "")
              : undefined;
          throw new HttpClientError(
            `Request failed (${response.status})`,
            endpoint,
            response.status,
            detail,
          );
        }

        return body as T;
      } catch (error) {
        if (error instanceof HttpClientError) {
          throw error;
        }

        const isAbort = error instanceof Error && error.name === "AbortError";
        const isLastAttempt = attempt === this.startupRetryCount;
        if (isLastAttempt) {
          if (isAbort) {
            throw new HttpClientError("Request timed out", endpoint);
          }
          throw new HttpClientError(
            error instanceof Error ? `Network error: ${error.message}` : "Network error",
            endpoint,
          );
        }

        await EarthlinkApiClient.delay(attempt * 500);
      } finally {
        clearTimeout(timeout);
      }
    }

    throw new HttpClientError("Network error", endpoint);
  }

  private static async delay(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  static formatError(error: unknown): string {
    if (error instanceof HttpClientError) {
      if (error.status) {
        return `Request failed (${error.status}) at ${error.endpoint}${error.detail ? `: ${error.detail}` : ""}`;
      }
      return `${error.message} at ${error.endpoint}`;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return "Unknown error";
  }
}
