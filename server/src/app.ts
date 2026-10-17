import cors from "cors";
import express from "express";
import { env } from "./lib/env.js";
import { healthRouter } from "./routes/v1/health.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.clientOrigin,
      credentials: true,
    }),
  );
  app.use(express.json());

  app.use("/api/v1", healthRouter);

  return app;
}
