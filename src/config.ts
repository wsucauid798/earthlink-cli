import { Command } from "commander";

export const DEFAULT_API_URL = "http://localhost:8000";

export function resolveApiUrl(command: Command): string {
  const fromOption = command.opts<{ url?: string }>().url;
  const fromEnv = process.env.EARTHLINK_API_URL;
  return (fromOption || fromEnv || DEFAULT_API_URL).replace(/\/$/, "");
}
