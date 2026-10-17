import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env } from "./lib/env.js";
import { csrfOriginCheck } from "./middleware/csrf.js";
import { errorHandler } from "./middleware/error-handler.js";
import { loadAuthSession } from "./middleware/auth.js";
import { adminRouter } from "./routes/v1/admin.js";
import { authRouter } from "./routes/v1/auth.js";
import { healthRouter } from "./routes/v1/health.js";
import { meRouter } from "./routes/v1/me.js";
import { patientRouter } from "./routes/v1/patient.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);

  app.use(
    cors({
      origin: env.clientOrigin,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());
  app.use(csrfOriginCheck);
  app.use(loadAuthSession);

  app.use("/api/v1", healthRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/me", meRouter);
  app.use("/api/v1/admin", adminRouter);
  app.use("/api/v1/patient", patientRouter);

  app.use(errorHandler);

  return app;
}
