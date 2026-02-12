import { Command } from "commander";
import { resolveApiUrl } from "../config";
import { EarthlinkApiClient } from "../http/client";
import { printOutput } from "../output/format";

export function registerWeatherCommands(program: Command): void {
  const weather = program.command("weather").description("Weather query commands");

  weather
    .command("show")
    .description("Show current weather for a location")
    .argument("<locationId>", "Location ID")
    .option("--json", "Print JSON output", false)
    .action(async function action(this: Command, locationIdArg: string, options: { json: boolean }) {
      const locationId = Number(locationIdArg);
      if (Number.isNaN(locationId) || locationId <= 0) {
        process.stderr.write("Location ID must be a positive integer\n");
        process.exitCode = 1;
        return;
      }

      const root = this.parent?.parent ?? this.parent ?? this;
      const apiUrl = resolveApiUrl(root as Command);
      const client = new EarthlinkApiClient(apiUrl);

      try {
        const data = await client.getWeather(locationId);
        if (!data) {
          printOutput("No weather data for this location at current world time", options.json);
          return;
        }
        printOutput(data, options.json);
      } catch (error) {
        process.stderr.write(`${EarthlinkApiClient.formatError(error)}\n`);
        process.exitCode = 1;
      }
    });
}
