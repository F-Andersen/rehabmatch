import { createApp } from "./app.js";
import { env } from "./lib/env.js";

const app = createApp();

app.listen(env.apiPort, () => {
  console.log(`RehabMatch API listening on http://localhost:${env.apiPort}`);
});
