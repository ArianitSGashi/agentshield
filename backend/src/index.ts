import "./env.js";
import Fastify from "fastify";

const port = Number(process.env.BACKEND_PORT) || 3000;

const app = Fastify({ logger: true });

app.get("/health", async () => ({ status: "ok" }));

const shutdown = async () => {
  await app.close();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

await app.listen({ port, host: "0.0.0.0" });
