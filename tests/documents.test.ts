import { describe, expect, it, vi } from "vitest";
import type { BookingDetail } from "@/server/bookings";
import { defaultSettings } from "@/lib/content";

vi.mock("server-only", () => ({}));

const booking = {
  id: "00000000-0000-4000-8000-000000000201", bookingNumber: "SSTH-B-20261023-TEST", customerId: "customer",
  packageId: "package", eventType: "Wedding", eventDate: "2026-12-12", eventTime: "18:00", timeSlot: "evening",
  location: "Pithampur", guestCount: 100, status: "confirmed", paymentStatus: "unpaid", subtotalInPaise: 5_000_000,
  discountInPaise: 0, taxInPaise: 0, totalInPaise: 5_000_000, advanceInPaise: 1_500_000,
  decorationRequirements: null, waterSupply: false, additionalNotes: null, confirmedAt: new Date(), cancelledAt: null,
  cancellationReason: null, createdAt: new Date(), updatedAt: new Date(),
};
const quotation = {
  id: "quote", quotationNumber: "SSTH-Q-20261023-TEST", bookingId: booking.id, customerId: "customer", status: "accepted",
  subtotalInPaise: 5_000_000, discountInPaise: 0, taxInPaise: 0, totalInPaise: 5_000_000, advanceInPaise: 1_500_000,
  validUntil: "2026-10-30", terms: "Test quotation terms for document generation.", acceptedAt: new Date(), createdAt: new Date(),
};
const baseDetail = {
  booking, quotation,
  customer: { id: "customer", name: "Test Customer", email: "customer@example.com", phone: "+919876543210" },
  package: { id: "package", name: "Signature Wedding", priceInPaise: 5_000_000 }, items: [], payments: [], invoices: [], paidInPaise: 0,
} as unknown as BookingDetail;

 describe("PDF document generation", () => {
  it("generates a non-empty itemised quotation PDF with advance and balance", async () => {
    const { quotationPdf } = await import("@/lib/documents");
    const pdf = await quotationPdf(baseDetail, defaultSettings);
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.byteLength).toBeGreaterThan(1500);
  });
  it("generates an invoice PDF only for a verified recorded payment", async () => {
    const { invoicePdf } = await import("@/lib/documents");
    const payment = { id: "payment", paymentNumber: "SSTH-P-TEST", bookingId: booking.id, customerId: "customer", method: "manual", kind: "advance", amountInPaise: 1_500_000, status: "paid", providerOrderId: null, providerPaymentId: null, proofUrl: null, proofPathname: null, proofContentType: null, proofUploadedAt: null, reviewedBy: "admin", reviewedAt: new Date(), reviewNote: null, paidAt: new Date(), createdAt: new Date(), updatedAt: new Date() };
    const invoice = { id: "invoice", invoiceNumber: "SSTH-I-TEST", bookingId: booking.id, paymentId: "payment", customerId: "customer", amountInPaise: 1_500_000, issuedAt: new Date(), createdAt: new Date() };
    const detail = { ...baseDetail, payments: [payment], invoices: [invoice], paidInPaise: 1_500_000 } as unknown as BookingDetail;
    const pdf = await invoicePdf(detail, defaultSettings, "invoice");
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    await expect(invoicePdf(baseDetail, defaultSettings, "missing")).rejects.toThrow("Invoice not found");
  });
});
