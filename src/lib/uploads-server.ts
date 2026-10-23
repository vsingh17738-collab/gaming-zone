import "server-only";

import { put } from "@vercel/blob";
import { ConfigurationError } from "./errors";
import { IMAGE_TYPES, validateImageSignature } from "./uploads";

export async function uploadPersistentImage(file: File, folder: "gallery" | "brand" | "payments", isPrivate = false) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new ConfigurationError("Persistent image uploads");
  await validateImageSignature(file);
  const extension = IMAGE_TYPES[file.type as keyof typeof IMAGE_TYPES];
  return put(`${folder}/${crypto.randomUUID()}.${extension}`, file, {
    access: isPrivate ? "private" : "public",
    addRandomSuffix: false,
    contentType: file.type,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
}
