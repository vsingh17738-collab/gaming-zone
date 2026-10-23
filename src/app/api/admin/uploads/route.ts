import { z } from "zod";
import { apiRoute, assertSameOrigin, dataResponse } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { uploadPersistentImage } from "@/lib/uploads-server";
import { writeAuditLog } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return apiRoute(async () => {
    assertSameOrigin(request);
    const admin = await requireAdmin();
    if (Number(request.headers.get("content-length") ?? 0) > 6 * 1024 * 1024) throw new AppError("Upload is too large", 413, "PAYLOAD_TOO_LARGE");
    const form = await request.formData();
    const folder = z.enum(["gallery", "brand"]).parse(form.get("folder"));
    const file = form.get("file");
    if (!(file instanceof File)) throw new AppError("Choose an image", 422, "FILE_REQUIRED");
    const blob = await uploadPersistentImage(file, folder);
    await writeAuditLog({ actorId: admin.id, action: "upload.create", entityType: folder, entityId: blob.pathname, request });
    return dataResponse({ url: blob.url, pathname: blob.pathname }, 201);
  });
}
