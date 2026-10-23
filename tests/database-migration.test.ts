import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migrationDirectory = `${process.cwd()}/drizzle`;
const migrationFiles = readdirSync(migrationDirectory).filter((file) => file.endsWith(".sql"));
const sql = migrationFiles.map((file) => readFileSync(`${migrationDirectory}/${file}`, "utf8")).join("\n");

describe("PostgreSQL migration safety", () => {
  it("contains all core business tables", () => {
    for (const table of ["users", "sessions", "services", "packages", "bookings", "booking_items", "booking_slots", "quotations", "payments", "invoices", "reviews", "gallery", "business_settings", "notifications", "audit_logs"]) {
      expect(sql).toContain(`CREATE TABLE "${table}"`);
    }
  });
  it("has a database-level unique reservation per date and half-day slot", () => {
    expect(sql).toContain('CREATE UNIQUE INDEX "booking_slots_date_slot_unique" ON "booking_slots"');
    expect(sql).toMatch(/"booking_slots" USING btree \("event_date",\s*"slot"\)/);
  });
  it("uses foreign keys and payment provider idempotency constraints", () => {
    expect(sql).toContain("FOREIGN KEY");
    expect(sql).toContain("payments_provider_order_unique");
    expect(sql).toContain("payments_provider_payment_unique");
    expect(sql).toContain('"invoices_payment_id_unique"');
    expect(sql).toContain("payments_active_razorpay_order_unique");
    expect(sql).toContain("payments_pending_manual_proof_unique");
  });
  it("preserves the default 30% advance setting", () => {
    expect(sql).toContain('"advance_percent" integer DEFAULT 30 NOT NULL');
  });
});
