// The shared local .env uses development for the API. Never ship React's dev build.
process.env.NODE_ENV = "production";
const { build } = await import("vite");
await build();
