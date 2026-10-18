import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, repoRoot, "");
  const apiPort = process.env.API_PORT || env.API_PORT || "3001";
  const clientPort = Number(process.env.CLIENT_PORT || env.CLIENT_PORT || 5173);

  return {
    envDir: repoRoot,
    plugins: [react(), tailwindcss()],
    server: {
      port: clientPort,
      proxy: {
        "/api": {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
        },
      },
    },
  };
});
