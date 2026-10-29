import http from "node:http";
import { gzipSync, deflateSync } from "node:zlib";
import { createApp } from "../app.js";
import { env } from "../lib/env.js";

const variant = process.argv[2];
const compressed = (variant === "deflate" ? deflateSync : gzipSync)(JSON.stringify({ a: 1 }));
const body = variant === "valid" ? compressed : Buffer.concat([compressed, Buffer.from([0]), Buffer.alloc(100 * 1024, 0x58)]);
const server = createApp().listen(0, "127.0.0.1", () => {
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Missing port");
  const req = http.request({
    host: "127.0.0.1", port: address.port, path: "/no-such-route", method: "POST", agent: false,
    headers: { "Content-Type": "application/json", "Content-Encoding": variant === "deflate" ? "deflate" : "gzip", "Content-Length": body.length, Origin: env.clientOrigin },
  }, (res) => {
    res.resume();
    res.on("end", () => setTimeout(() => {
      http.get({ host: "127.0.0.1", port: address.port, path: "/api/v1/health", agent: false }, (health) => {
        health.resume();
        health.on("end", () => {
          console.log(JSON.stringify({ status: res.statusCode, health: health.statusCode }));
          server.close();
        });
      }).on("error", (error) => { throw error; });
    }, 200));
  });
  req.on("error", (error) => { throw error; });
  req.end(body);
});
