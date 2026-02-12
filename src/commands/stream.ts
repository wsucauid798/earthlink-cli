import { Command } from "commander";
import { resolveApiUrl } from "../config";
import { streamWorld } from "../http/ws";
import { EarthlinkApiClient } from "../http/client";
import { printOutput } from "../output/format";

export function registerStreamCommands(program: Command): void {
  const stream = program.command("stream").description("Live stream commands");

  stream
    .command("world")
    .description("Stream world ticks over websocket")
    .option("--json", "Print JSON output", false)
    .action(async function action(this: Command, options: { json: boolean }) {
      const root = this.parent?.parent ?? this.parent ?? this;
      const apiUrl = resolveApiUrl(root as Command);

      try {
        await streamWorld(apiUrl, (message) => {
          printOutput(message, options.json);
        });
      } catch (error) {
        process.stderr.write(`${EarthlinkApiClient.formatError(error)}\n`);
        process.exitCode = 1;
      }
    });
}
