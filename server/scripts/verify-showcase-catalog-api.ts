import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
config({ path: path.join(repoRoot, ".env.showcase") });

const apiPort = process.env.API_PORT ?? "3021";
const origin = process.env.CLIENT_ORIGIN ?? `http://localhost:${apiPort}`;
const base = `http://localhost:${apiPort}/api/v1`;

const banned = [/демо\s+(марія|олександр|сергій)/i, /тестовий/i, /placeholder/i, /mvp\s+bootstrap/i, /lorem\s+ipsum/i];

async function main() {
  const health = await fetch(`${base}/health`);
  if (!health.ok) throw new Error(`Health failed: ${health.status}`);

  const listRes = await fetch(`${base}/specialists?page=1&pageSize=50`, {
    headers: { Origin: origin },
  });
  if (!listRes.ok) throw new Error(`Catalog failed: ${listRes.status}`);
  const listBody = await listRes.json();
  const cards = listBody.data as Array<{ id: string; fullName: string; photoUrl: string | null }>;
  const total = listBody.meta?.total ?? cards.length;

  if (total < 40) throw new Error(`Expected >=40 public specialists, got ${total}`);

  const names = new Set<string>();
  for (const card of cards) {
    if (names.has(card.fullName)) throw new Error(`Duplicate name in page: ${card.fullName}`);
    names.add(card.fullName);
    const blob = JSON.stringify(card);
    for (const pattern of banned) {
      if (pattern.test(blob) || pattern.test(card.fullName)) {
        throw new Error(`Banned pattern in card ${card.fullName}`);
      }
    }
    if (!card.photoUrl?.startsWith("/images/specialists/")) {
      throw new Error(`Missing photo for ${card.fullName}`);
    }
    const file = path.join(repoRoot, "client/public", card.photoUrl);
    if (!existsSync(file)) throw new Error(`Missing file ${file}`);
  }

  const sampleIds = cards.slice(0, 10).map((c) => c.id);
  for (const id of sampleIds) {
    const detailRes = await fetch(`${base}/specialists/${id}`, { headers: { Origin: origin } });
    if (!detailRes.ok) throw new Error(`Profile ${id} failed`);
    const detail = (await detailRes.json()).data;
    if (!detail.description || detail.description.length < 40) {
      throw new Error(`Short description for ${detail.fullName}`);
    }
    if (!Array.isArray(detail.services) || detail.services.length === 0) {
      throw new Error(`No services for ${detail.fullName}`);
    }
    const reviewsRes = await fetch(`${base}/specialists/${id}/reviews?page=1`, {
      headers: { Origin: origin },
    });
    if (!reviewsRes.ok) throw new Error(`Reviews fetch failed for ${id}`);
  }

  for (let i = 1; i <= 48; i += 1) {
    const file = path.join(
      repoRoot,
      `client/public/images/specialists/sc-${String(i).padStart(3, "0")}.webp`,
    );
    if (!existsSync(file)) throw new Error(`Missing portrait ${file}`);
  }

  console.log("Showcase catalog API OK:", {
    publicTotal: total,
    sampledProfiles: sampleIds.length,
    portraitsOnDisk: 48,
    databaseHint: (process.env.DATABASE_URL ?? "").includes("rehabmatch_showcase") ? "showcase" : "check-url",
  });
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
