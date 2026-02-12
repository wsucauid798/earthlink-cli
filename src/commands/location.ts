import { Command } from "commander";
import { resolveApiUrl } from "../config";
import { EarthlinkApiClient } from "../http/client";
import { printOutput } from "../output/format";

async function withClient(command: Command, run: (client: EarthlinkApiClient) => Promise<void>): Promise<void> {
  const root = command.parent?.parent ?? command.parent ?? command;
  const apiUrl = resolveApiUrl(root as Command);
  const client = new EarthlinkApiClient(apiUrl);

  try {
    await run(client);
  } catch (error) {
    process.stderr.write(`${EarthlinkApiClient.formatError(error)}\n`);
    process.exitCode = 1;
  }
}

export function registerLocationCommands(program: Command): void {
  const location = program.command("location").description("Location query commands");

  location
    .command("list")
    .description("List locations")
    .option("--type <type>", "Filter by type (city, town, village, etc.)")
    .option("--region <region>", "Filter by region (England, Scotland, Wales, Northern Ireland)")
    .option("--search <search>", "Case-insensitive name search")
    .option("--limit <limit>", "Max results", "20")
    .option("--offset <offset>", "Offset", "0")
    .option("--json", "Print JSON output", false)
    .action(async function action(this: Command, options: {
      type?: string;
      region?: string;
      search?: string;
      limit: string;
      offset: string;
      json: boolean;
    }) {
      const limit = Number(options.limit);
      const offset = Number(options.offset);
      if (Number.isNaN(limit) || Number.isNaN(offset) || limit < 1 || offset < 0) {
        process.stderr.write("Invalid --limit/--offset values\n");
        process.exitCode = 1;
        return;
      }

      await withClient(this, async (client) => {
        const data = await client.listLocations({
          type: options.type,
          region: options.region,
          search: options.search,
          limit,
          offset,
        });
        printOutput(data, options.json);
      });
    });

  location
    .command("show")
    .description("Show one location by ID")
    .argument("<id>", "Location ID")
    .option("--json", "Print JSON output", false)
    .action(async function action(this: Command, id: string, options: { json: boolean }) {
      const locationId = Number(id);
      if (Number.isNaN(locationId) || locationId <= 0) {
        process.stderr.write("Location ID must be a positive integer\n");
        process.exitCode = 1;
        return;
      }

      await withClient(this, async (client) => {
        const data = await client.getLocation(locationId);
        printOutput(data, options.json);
      });
    });

  location
    .command("nearby")
    .description("Show nearby connected locations")
    .argument("<id>", "Location ID")
    .option("--limit <limit>", "Max nearby items to print", "10")
    .option("--json", "Print JSON output", false)
    .action(async function action(this: Command, id: string, options: { limit: string; json: boolean }) {
      const locationId = Number(id);
      const limit = Number(options.limit);
      if (Number.isNaN(locationId) || locationId <= 0) {
        process.stderr.write("Location ID must be a positive integer\n");
        process.exitCode = 1;
        return;
      }
      if (Number.isNaN(limit) || limit < 1) {
        process.stderr.write("--limit must be a positive integer\n");
        process.exitCode = 1;
        return;
      }

      await withClient(this, async (client) => {
        const data = await client.getNearbyLocations(locationId);
        printOutput(data.slice(0, limit), options.json);
      });
    });
}
