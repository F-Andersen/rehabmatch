import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { AppError } from "./http-errors.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const uploadsDir = path.join(repoRoot, "client/public/images/uploads");

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function saveSpecialistPhotoFromBase64(
  specialistId: string,
  mimeType: string,
  base64Payload: string,
): Promise<string> {
  if (!ALLOWED_MIME.has(mimeType)) {
    throw new AppError(400, "VALIDATION_ERROR", "Дозволені формати: JPEG, PNG, WebP");
  }

  const buffer = Buffer.from(base64Payload, "base64");
  if (buffer.length === 0 || buffer.length > MAX_BYTES) {
    throw new AppError(400, "VALIDATION_ERROR", "Зображення має бути від 1 байта до 2 МБ");
  }

  let pipeline = sharp(buffer, { failOn: "none" }).rotate();
  const meta = await pipeline.metadata();
  if (!meta.width || !meta.height) {
    throw new AppError(400, "VALIDATION_ERROR", "Не вдалося прочитати зображення");
  }

  await mkdir(uploadsDir, { recursive: true });
  const fileName = `specialist-${specialistId}.webp`;
  const outPath = path.join(uploadsDir, fileName);

  const webp = await sharp(buffer).rotate().resize(768, 768, { fit: "cover" }).webp({ quality: 82 }).toBuffer();

  await writeFile(outPath, webp);

  return `/images/uploads/${fileName}`;
}
