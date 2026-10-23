import { describe, expect, it } from "vitest";
import { addDays, todayInIndia } from "@/lib/dates";
import { bookingSchema, registerSchema, settingsSchema } from "@/lib/validation";
import { validateImageSignature } from "@/lib/uploads";
import { normalizePhoneForWhatsApp, whatsappLink } from "@/lib/whatsapp";

const validBooking = {
  eventType: "Wedding", eventDate: addDays(todayInIndia(), 2), eventTime: "18:00", timeSlot: "evening",
  location: "Pithampur, Madhya Pradesh", guestCount: 100, packageId: "00000000-0000-4000-8000-000000000101",
  serviceItems: [], waterSupply: false,
};

describe("request validation", () => {
  it("accepts a valid future booking and rejects past events", () => {
    expect(bookingSchema.safeParse(validBooking).success).toBe(true);
    expect(bookingSchema.safeParse({ ...validBooking, eventDate: "2020-01-01" }).success).toBe(false);
  });
  it("rejects client-side extra fields from influencing calculated prices", () => {
    const parsed = bookingSchema.parse({ ...validBooking, totalInPaise: 1, status: "confirmed", paymentStatus: "paid" });
    expect(parsed).not.toHaveProperty("totalInPaise");
    expect(parsed).not.toHaveProperty("status");
    expect(parsed).not.toHaveProperty("paymentStatus");
  });
  it("requires strong registration passwords and normalises email", () => {
    expect(registerSchema.safeParse({ name: "Test User", email: "TEST@EXAMPLE.COM", phone: "+919876543210", password: "short" }).success).toBe(false);
    const parsed = registerSchema.parse({ name: "Test User", email: "TEST@EXAMPLE.COM", phone: "+919876543210", password: "longpassword123" });
    expect(parsed.email).toBe("test@example.com");
  });
  it("accepts local/default images but rejects unsafe or unoptimised image URLs", () => {
    const base = { businessName: "Business", contactPerson: "Owner", address: "Valid address", serviceArea: "Pithampur", quotationTerms: "These are valid quotation terms.", advancePercent: 30, taxBasisPoints: 0 };
    expect(settingsSchema.safeParse({ ...base, logoUrl: "/images/hero-wedding.jpg" }).success).toBe(true);
    expect(settingsSchema.safeParse({ ...base, logoUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(settingsSchema.safeParse({ ...base, paymentQrUrl: "https://example.com/qr.png" }).success).toBe(false);
  });
  it("constrains advance and tax settings server-side", () => {
    const base = { businessName: "Business", contactPerson: "Owner", address: "Valid address", serviceArea: "Pithampur", quotationTerms: "These are valid quotation terms.", advancePercent: 30, taxBasisPoints: 0 };
    expect(settingsSchema.safeParse(base).success).toBe(true);
    expect(settingsSchema.safeParse({ ...base, advancePercent: 101 }).success).toBe(false);
  });
});

describe("upload content verification", () => {
  it("accepts a PNG signature and rejects a renamed text file", async () => {
    const png = new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0])], "proof.png", { type: "image/png" });
    await expect(validateImageSignature(png)).resolves.toBeUndefined();
    const spoof = new File(["not an image"], "proof.png", { type: "image/png" });
    await expect(validateImageSignature(spoof)).rejects.toThrow("contents");
  });
  it("rejects unsupported file types", async () => {
    const svg = new File(["<svg/>"], "proof.svg", { type: "image/svg+xml" });
    await expect(validateImageSignature(svg)).rejects.toThrow("Only PNG");
  });
});

describe("WhatsApp links", () => {
  it("uses configured numbers only and normalises Indian numbers", () => {
    expect(normalizePhoneForWhatsApp("98765 43210")).toBe("919876543210");
    expect(whatsappLink(null, "hello")).toBeNull();
    expect(whatsappLink("+91 98765 43210", "Hello there")).toBe("https://wa.me/919876543210?text=Hello%20there");
  });
});
