import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyRazorpayCheckoutSignature, verifyRazorpayWebhookSignature } from "@/lib/payment-security";

const secret = "test-only-webhook-secret";
describe("Razorpay signature verification", () => {
  it("accepts a valid checkout signature", () => {
    const signature = createHmac("sha256", secret).update("order_123|pay_123").digest("hex");
    expect(verifyRazorpayCheckoutSignature("order_123", "pay_123", signature, secret)).toBe(true);
  });
  it("rejects altered order/payment IDs and malformed signatures", () => {
    const signature = createHmac("sha256", secret).update("order_123|pay_123").digest("hex");
    expect(verifyRazorpayCheckoutSignature("order_124", "pay_123", signature, secret)).toBe(false);
    expect(verifyRazorpayCheckoutSignature("order_123", "pay_123", "not-a-signature", secret)).toBe(false);
    expect(verifyRazorpayCheckoutSignature("order_123", "pay_123", signature.slice(0, -1), secret)).toBe(false);
  });
  it("verifies the exact raw webhook body", () => {
    const body = JSON.stringify({ event: "payment.captured", amount: 100 });
    const signature = createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyRazorpayWebhookSignature(body, signature, secret)).toBe(true);
    expect(verifyRazorpayWebhookSignature(`${body} `, signature, secret)).toBe(false);
  });
});
