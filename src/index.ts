#!/usr/bin/env node

import { Command } from "commander";
import { EarthlinkApiClient } from "./http/client";
import { resolveApiUrl } from "./config";
import { printOutput } from "./output/format";
import { registerWorldCommands } from "./commands/world";
import { registerStreamCommands } from "./commands/stream";
import { registerLocationCommands } from "./commands/location";
import { registerWeatherCommands } from "./commands/weather";
import { registerAstronomyCommands } from "./commands/astronomy";

const CLI_VERSION = "0.0.1";

async function main(): Promise<void> {
  const program = new Command();

  program
    .name("earthlink")
    .description("EarthLink production CLI frontend")
    .version(CLI_VERSION)
    .option("--url <apiUrl>", "EarthLink server base URL (overrides EARTHLINK_API_URL)");

  program.showHelpAfterError();
  program.showSuggestionAfterError();
  program.addHelpText(
    "after",
    `
Examples:
  earthlink ping
  earthlink world state
  earthlink world start
  earthlink location list --limit 10
  earthlink weather show 10287
  earthlink stream world

Use "earthlink commands" for a compact command list.
`,
  );

  program
    .command("commands")
    .description("Show common commands")
    .action(() => {
      process.stdout.write(
        [
          "Common commands:",
          "  earthlink ping",
          "  earthlink world state",
          "  earthlink world time",
          "  earthlink world start|pause|reset",
          "  earthlink location list --limit 10",
          "  earthlink location show <id>",
          "  earthlink location nearby <id> --limit 5",
          "  earthlink weather show <locationId>",
          "  earthlink astronomy show <locationId>",
          "  earthlink stream world",
          "",
          "Use --json on query commands for machine-readable output.",
        ].join("\n") + "\n",
      );
    });

  program
    .command("ping")
    .description("Ping server and print version")
    .option("--json", "Print JSON output", false)
    .action(async function action(options: { json: boolean }) {
      const apiUrl = resolveApiUrl(program);
      const client = new EarthlinkApiClient(apiUrl);
      try {
        try {
          const version = await client.getVersion();
          if (options.json) {
            printOutput({ ok: true, apiUrl, ...version }, true);
          } else {
            printOutput(`ok ${version.version} @ ${apiUrl}`, false);
          }
          return;
        } catch {
          const state = await client.getWorldState();
          if (options.json) {
            printOutput({ ok: true, apiUrl, version: "unknown", tick_count: state.time.tick_count }, true);
          } else {
            printOutput(`ok @ ${apiUrl} (version unknown)`, false);
          }
        }
      } catch (error) {
        process.stderr.write(`${EarthlinkApiClient.formatError(error)}\n`);
        process.exitCode = 1;
      }
    });

  registerWorldCommands(program);
  registerLocationCommands(program);
  registerWeatherCommands(program);
  registerAstronomyCommands(program);
  registerStreamCommands(program);

  if (process.argv.length <= 2) {
    program.outputHelp();
    return;
  }

  await program.parseAsync(process.argv);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
