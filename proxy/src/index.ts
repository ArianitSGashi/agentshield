import "./env.js";
import { createProxy } from "./proxy.js";

const port = Number(process.env.PROXY_PORT) || 8080;

const server = await createProxy(port);

const shutdown = async () => {
  console.log("[agentshield] Shutting down proxy...");
  await server.stop();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
