import { Command } from "commander";
import { resolveApiUrl } from "../config";
import { EarthlinkApiClient } from "../http/client";
import { printOutput } from "../output/format";

export function registerAstronomyCommands(program: Command): void {
  const astronomy = program.command("astronomy").description("Astronomy query commands");

  astronomy
    .command("show")
    .description("Show current astronomy for a location")
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
        const data = await client.getAstronomy(locationId);
        if (!data) {
          printOutput("No astronomy data for this location at current world date", options.json);
          return;
        }
        printOutput(data, options.json);
      } catch (error) {
        process.stderr.write(`${EarthlinkApiClient.formatError(error)}\n`);
        process.exitCode = 1;
      }
    });
}
