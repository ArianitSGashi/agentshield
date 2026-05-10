#!/usr/bin/env node
import { runAgent } from "./orchestrator.js";

const USAGE = `agentshield — protect AI coding agents from prompt injection.

Usage:
  agentshield run <command> [args...]    Start the proxy and run <command> through it.

Examples:
  agentshield run claude
  agentshield run opencode chat
  agentshield run codex --some-flag

The proxy listens on a free local port. HTTP_PROXY, HTTPS_PROXY, and
NODE_EXTRA_CA_CERTS are set in the agent's environment so its outbound
HTTPS traffic is intercepted and analyzed before reaching the agent.

When the agent exits, the proxy is shut down with it.
`;

function printUsage(stream: NodeJS.WriteStream): void {
  stream.write(USAGE);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "-h" || args[0] === "--help") {
    printUsage(args.length === 0 ? process.stderr : process.stdout);
    process.exit(args.length === 0 ? 1 : 0);
  }

  const [verb, ...rest] = args;

  if (verb !== "run") {
    process.stderr.write(`agentshield: unknown command "${verb}"\n\n`);
    printUsage(process.stderr);
    process.exit(1);
  }

  if (rest.length === 0) {
    process.stderr.write("agentshield run: missing <command>\n\n");
    printUsage(process.stderr);
    process.exit(1);
  }

  const [agentCmd, ...agentArgs] = rest;
  const exitCode = await runAgent(agentCmd, agentArgs);
  process.exit(exitCode);
}

main().catch((err) => {
  process.stderr.write(`agentshield: fatal: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
