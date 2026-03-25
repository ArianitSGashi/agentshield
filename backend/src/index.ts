import "./env.js";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { scanRoutes } from "./routes/scans.js";
import { statsRoutes } from "./routes/stats.js";

const port = Number(process.env.BACKEND_PORT) || 3000;

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });

app.get("/health", async () => ({ status: "ok" }));

await app.register(scanRoutes);
await app.register(statsRoutes);

const shutdown = async () => {
  await app.close();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

await app.listen({ port, host: "localhost" });
