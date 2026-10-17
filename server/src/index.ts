import { createApp } from "./app.js";
import { env } from "./lib/env.js";
import { disconnectPrisma } from "./lib/prisma.js";

const app = createApp();
const server = app.listen(env.apiPort, () => {
  console.log(`RehabMatch API listening on http://localhost:${env.apiPort}`);
});

async function shutdown(signal: string): Promise<void> {
  console.log(`Received ${signal}, shutting down...`);
  server.close(() => {
    void disconnectPrisma().finally(() => process.exit(0));
  });
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
