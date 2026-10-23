import { AppError } from "./errors";

export const IMAGE_TYPES = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
} as const;

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function validateImageFile(file: File) {
  if (!Object.hasOwn(IMAGE_TYPES, file.type)) throw new AppError("Only PNG, JPG, or WEBP images are accepted", 415, "INVALID_FILE_TYPE");
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) throw new AppError("Image must be smaller than 5 MB", 413, "FILE_TOO_LARGE");
}

export async function validateImageSignature(file: File) {
  validateImageFile(file);
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const isPng = bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value);
  const isJpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isWebp = bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  const valid = file.type === "image/png" ? isPng : file.type === "image/jpeg" ? isJpeg : isWebp;
  if (!valid) throw new AppError("The file contents do not match its image type", 415, "INVALID_FILE_CONTENT");
}
