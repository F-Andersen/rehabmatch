/**
 * Fills missing showcase portraits with synthetic SVG placeholders.
 * Existing portraits (including ImageGen artwork) and provenance are preserved.
 * See fixtures/showcase/IMAGE-ATTRIBUTION.md and portrait-manifest.json.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../..");
const outDir = path.join(repoRoot, "client/public/images/specialists");

function hueForIndex(index: number): number {
  return (index * 47 + 137) % 360;
}

function portraitSvg(index: number): string {
  const hue = hueForIndex(index);
  const hue2 = (hue + 35) % 360;
  const skin = 28 + (index % 12);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="768" height="768" viewBox="0 0 768 768">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hue} 42% 88%)"/>
      <stop offset="100%" stop-color="hsl(${hue2} 38% 72%)"/>
    </linearGradient>
    <radialGradient id="face" cx="50%" cy="42%" r="55%">
      <stop offset="0%" stop-color="hsl(${skin} 35% 82%)"/>
      <stop offset="100%" stop-color="hsl(${skin} 28% 68%)"/>
    </radialGradient>
  </defs>
  <rect width="768" height="768" fill="url(#bg)"/>
  <ellipse cx="384" cy="520" rx="220" ry="260" fill="hsl(${hue} 30% 28%)"/>
  <ellipse cx="384" cy="310" rx="168" ry="200" fill="url(#face)"/>
  <ellipse cx="320" cy="290" rx="22" ry="14" fill="hsl(${skin} 20% 35%)" opacity="0.35"/>
  <ellipse cx="448" cy="290" rx="22" ry="14" fill="hsl(${skin} 20% 35%)" opacity="0.35"/>
  <path d="M330 360 Q384 395 438 360" stroke="hsl(${skin} 22% 45%)" stroke-width="6" fill="none" stroke-linecap="round"/>
  <path d="M280 220 Q384 ${160 + (index % 5) * 8} 488 220" fill="hsl(${hue} 25% 22%)" opacity="0.9"/>
</svg>`;
}

async function main(): Promise<void> {
  await mkdir(outDir, { recursive: true });
  type Portrait = { file: string; slug: string; source?: string; prompt?: string };
  const manifestPath = path.join(repoRoot, "fixtures/showcase/portrait-manifest.json");
  const previous: { portraits: Portrait[] } = existsSync(manifestPath)
    ? JSON.parse(readFileSync(manifestPath, "utf8")) : { portraits: [] };
  const known = new Map(previous.portraits.map((portrait) => [portrait.slug, portrait]));
  const manifest: Portrait[] = [];
  let generated = 0;

  for (let i = 1; i <= 48; i += 1) {
    const slug = `sc-${String(i).padStart(3, "0")}`;
    const fileName = `${slug}.webp`;
    const filePath = path.join(outDir, fileName);
    const entry: Portrait = { ...known.get(slug), file: `/images/specialists/${fileName}`, slug };
    if (!existsSync(filePath)) {
      const svg = portraitSvg(i);
      const webp = await sharp(Buffer.from(svg)).resize(512, 512).webp({ quality: 82 }).toBuffer();
      await writeFile(filePath, webp);
      entry.source = "svg-placeholder";
      delete entry.prompt;
      generated += 1;
    }
    manifest.push(entry);
  }

  await writeFile(
    manifestPath,
    JSON.stringify({ generatedAt: new Date().toISOString(), portraits: manifest }, null, 2),
  );
  console.log(`Generated ${generated} missing placeholders; preserved ${manifest.length - generated} existing portraits in ${outDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
