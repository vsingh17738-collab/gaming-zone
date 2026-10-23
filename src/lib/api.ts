import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { DatabaseNotConfiguredError } from "@/db";
import { AppError } from "./errors";

export function dataResponse(data: unknown, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function errorResponse(message: string, status: number, code: string) {
  return NextResponse.json({ error: { message, code } }, { status });
}

export async function readJson(request: Request): Promise<unknown> {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 64_000) throw new AppError("Request body is too large", 413, "PAYLOAD_TOO_LARGE");
  assertSameOrigin(request);
  try {
    return await request.json();
  } catch {
    throw new AppError("Invalid JSON request", 400, "INVALID_JSON");
  }
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const requestOrigin = new URL(request.url).origin;
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL;
  const allowed = new Set([requestOrigin]);
  if (configuredOrigin) {
    try { allowed.add(new URL(configuredOrigin).origin); } catch { /* ignore malformed public config */ }
  }
  if (!allowed.has(origin)) throw new AppError("Cross-origin request rejected", 403, "ORIGIN_REJECTED");
}

export function handleApiError(error: unknown) {
  if (error instanceof AppError) return errorResponse(error.message, error.status, error.code);
  if (error instanceof DatabaseNotConfiguredError) return errorResponse("The database is not configured. See the deployment setup guide.", 503, "DATABASE_NOT_CONFIGURED");
  if (error instanceof ZodError) {
    return errorResponse(error.issues[0]?.message ?? "Please check the submitted information", 422, "VALIDATION_ERROR");
  }
  if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
    return errorResponse("This record already exists or the requested slot was just booked", 409, "CONFLICT");
  }
  if (typeof error === "object" && error !== null && "code" in error && error.code === "23503") {
    return errorResponse("This record is in use and cannot be deleted. Consider deactivating it instead.", 409, "RECORD_IN_USE");
  }
  console.error("Unhandled API error", error instanceof Error ? error.name : "UnknownError");
  return errorResponse("Something went wrong. Please try again.", 500, "INTERNAL_ERROR");
}

export async function apiRoute(handler: () => Promise<Response>) {
  try {
    return await handler();
  } catch (error) {
    return handleApiError(error);
  }
}
