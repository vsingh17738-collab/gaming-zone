import { get } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { payments } from "@/db/schema";
import { apiRoute } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { AppError, ConfigurationError } from "@/lib/errors";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return apiRoute(async () => {
    await requireAdmin();
    if (!process.env.BLOB_READ_WRITE_TOKEN) throw new ConfigurationError("Payment proof storage");
    const { id } = await params;
    const rows = await getDb().select({ pathname: payments.proofPathname }).from(payments).where(eq(payments.id, id)).limit(1);
    if (!rows[0]?.pathname) throw new AppError("Payment proof not found", 404, "NOT_FOUND");
    const result = await get(rows[0].pathname, { access: "private", token: process.env.BLOB_READ_WRITE_TOKEN });
    if (!result) throw new AppError("Payment proof not found", 404, "NOT_FOUND");
    if (result.statusCode === 304) return new Response(null, { status: 304 });
    return new Response(result.stream, { headers: { "Content-Type": result.blob.contentType, "Content-Disposition": "inline", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  });
}
