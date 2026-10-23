import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";
import { assertOwnership } from "@/lib/authorization";
import type { SafeUser } from "@/db/schema";

const customer: SafeUser = { id: "customer-a", email: "a@example.com", name: "Customer A", phone: null, role: "customer" };
const admin: SafeUser = { ...customer, id: "admin", role: "admin" };

describe("authentication and ownership controls", () => {
  it("hashes passwords with bcrypt cost 12 and never stores plaintext", async () => {
    const password = "longpassword123";
    const hash = await bcrypt.hash(password, 12);
    expect(hash).not.toContain(password);
    expect(hash.startsWith("$2")).toBe(true);
    expect(await bcrypt.compare(password, hash)).toBe(true);
    expect(await bcrypt.compare("wrong-password", hash)).toBe(false);
  });
  it("allows owners and admins but blocks cross-customer IDOR", () => {
    expect(() => assertOwnership("customer-a", customer)).not.toThrow();
    expect(() => assertOwnership("customer-a", admin)).not.toThrow();
    expect(() => assertOwnership("customer-b", customer)).toThrowError(expect.objectContaining({ status: 403, code: "FORBIDDEN" }));
  });
});
