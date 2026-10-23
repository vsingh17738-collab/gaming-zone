import type { SafeUser } from "@/db/schema";
import { AppError } from "./errors";

export function assertOwnership(ownerId: string, user: SafeUser) {
  if (user.role !== "admin" && ownerId !== user.id) {
    throw new AppError("You do not have access to this record", 403, "FORBIDDEN");
  }
}
