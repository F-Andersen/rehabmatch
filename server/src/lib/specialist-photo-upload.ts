import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { AppError } from "./http-errors.js";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const uploadsDir = path.join(repoRoot, "client/public/images/uploads");

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function saveSpecialistPhotoFromBase64(
  specialistId: string,
  mimeType: string,
  base64Payload: string,
): Promise<string> {
  if (!UUID_RE.test(specialistId)) {
    throw new AppError(400, "VALIDATION_ERROR", "Некоректний ідентифікатор спеціаліста");
  }

  if (!ALLOWED_MIME.has(mimeType)) {
    throw new AppError(400, "VALIDATION_ERROR", "Дозволені формати: JPEG, PNG, WebP");
  }

  const buffer = Buffer.from(base64Payload, "base64");
  if (buffer.length === 0 || buffer.length > MAX_BYTES) {
    throw new AppError(400, "VALIDATION_ERROR", "Зображення має бути від 1 байта до 2 МБ");
  }

  const meta = await sharp(buffer, { failOn: "error" }).rotate().metadata().catch(() => {
    throw new AppError(400, "VALIDATION_ERROR", "Не вдалося прочитати зображення");
  });
  if (!meta.width || !meta.height) {
    throw new AppError(400, "VALIDATION_ERROR", "Не вдалося прочитати зображення");
  }
  const detected = meta.format;
  if (!detected || !["jpeg", "png", "webp"].includes(detected)) {
    throw new AppError(400, "VALIDATION_ERROR", "Файл не є дозволеним зображенням");
  }

  await mkdir(uploadsDir, { recursive: true });
  const fileName = `specialist-${specialistId}.webp`;
  const outPath = path.join(uploadsDir, fileName);
  const resolvedUploads = path.resolve(uploadsDir);
  const resolvedOut = path.resolve(outPath);
  if (!resolvedOut.startsWith(resolvedUploads + path.sep) && resolvedOut !== resolvedUploads) {
    throw new AppError(400, "VALIDATION_ERROR", "Недопустимий шлях файлу");
  }

  const webp = await sharp(buffer).rotate().resize(768, 768, { fit: "cover" }).webp({ quality: 82 }).toBuffer().catch(() => {
    throw new AppError(400, "VALIDATION_ERROR", "Не вдалося обробити зображення");
  });

  await writeFile(resolvedOut, webp);

  return `/images/uploads/${fileName}`;
}
