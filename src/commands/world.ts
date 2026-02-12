import { Command } from "commander";
import { EarthlinkApiClient } from "../http/client";
import { printOutput } from "../output/format";
import { resolveApiUrl } from "../config";

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

export function registerWorldCommands(program: Command): void {
  const world = program.command("world").description("World state and control commands");

  world
    .command("state")
    .description("Get world summary state")
    .option("--json", "Print JSON output", false)
    .action(async function action(this: Command, options: { json: boolean }) {
      await withClient(this, async (client) => {
        const data = await client.getWorldState();
        printOutput(data, options.json);
      });
    });

  world
    .command("time")
    .description("Get current world time")
    .option("--json", "Print JSON output", false)
    .action(async function action(this: Command, options: { json: boolean }) {
      await withClient(this, async (client) => {
        const data = await client.getWorldTime();
        printOutput(data, options.json);
      });
    });

  world
    .command("start")
    .description("Start world simulation")
    .action(async function action(this: Command) {
      await withClient(this, async (client) => {
        const data = await client.controlSimulation("start");
        printOutput(data, false);
      });
    });

  world
    .command("pause")
    .description("Pause world simulation")
    .action(async function action(this: Command) {
      await withClient(this, async (client) => {
        const data = await client.controlSimulation("pause");
        printOutput(data, false);
      });
    });

  world
    .command("reset")
    .description("Reset world simulation")
    .action(async function action(this: Command) {
      await withClient(this, async (client) => {
        const data = await client.controlSimulation("reset");
        printOutput(data, false);
      });
    });
}
