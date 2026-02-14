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

export function registerAgentCommands(program: Command): void {
  const agent = program.command("agent").description("Agent inspection and interaction commands");

  agent
    .command("list")
    .description("List all agents with current state and learning progress")
    .option("--json", "Print JSON output", false)
    .action(async function action(this: Command, options: { json: boolean }) {
      await withClient(this, async (client) => {
        const data = await client.listAgents();
        printOutput(data, options.json);
      });
    });

  agent
    .command("show <agentId>")
    .description("Show detailed state and knowledge for an agent")
    .option("--json", "Print JSON output", false)
    .action(async function action(this: Command, agentId: string, options: { json: boolean }) {
      await withClient(this, async (client) => {
        const data = await client.getAgent(agentId);
        printOutput(data, options.json);
      });
    });

  agent
    .command("ask <agentId> <question>")
    .description("Ask an agent a question — answered from its own learned memory")
    .option("--json", "Print JSON output", false)
    .action(async function action(this: Command, agentId: string, question: string, options: { json: boolean }) {
      await withClient(this, async (client) => {
        const data = await client.askAgent(agentId, question);
        printOutput(data, options.json);
      });
    });
}
