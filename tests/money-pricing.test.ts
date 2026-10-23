import { describe, expect, it } from "vitest";
import { calculateAdvance, calculateTax, paymentSummary } from "@/lib/money";
import { calculateBookingPrice } from "@/lib/pricing";

const pkg = { id: "00000000-0000-4000-8000-000000000101", name: "Wedding", priceInPaise: 5_000_000 };
const decor = { id: "00000000-0000-4000-8000-000000000002", name: "Decor", category: "Decoration", priceInPaise: 500_000 };
const water = { id: "00000000-0000-4000-8000-000000000004", name: "Water", category: "Water supply", priceInPaise: 200_000 };

describe("money calculations", () => {
  it("calculates the required 30% advance example exactly", () => {
    expect(calculateAdvance(5_000_000, 30)).toBe(1_500_000);
    expect(5_000_000 - calculateAdvance(5_000_000, 30)).toBe(3_500_000);
  });
  it("uses integer paise and configurable tax", () => {
    expect(calculateTax(1_000_000, 1800)).toBe(180_000);
    expect(calculateAdvance(101, 30)).toBe(30);
  });
  it("rejects invalid percentages", () => {
    expect(() => calculateAdvance(100, 101)).toThrow();
    expect(() => calculateTax(100, -1)).toThrow();
  });
  it("keeps unpaid, partial and fully paid statuses separate", () => {
    expect(paymentSummary(1000, 300, 0).status).toBe("unpaid");
    expect(paymentSummary(1000, 300, 300).status).toBe("partially_paid");
    expect(paymentSummary(1000, 300, 1000).status).toBe("paid");
    expect(paymentSummary(1000, 300, 300).balanceInPaise).toBe(700);
  });
});

describe("server-authoritative quotation pricing", () => {
  it("uses trusted package/service records rather than client prices", () => {
    const quote = calculateBookingPrice({ packageId: pkg.id, serviceItems: [{ serviceId: decor.id, quantity: 2 }], waterSupply: false }, pkg, [decor, water], { advancePercent: 30, taxBasisPoints: 0 });
    expect(quote.subtotalInPaise).toBe(6_000_000);
    expect(quote.totalInPaise).toBe(6_000_000);
    expect(quote.items[0]?.unitPriceInPaise).toBe(500_000);
    expect(quote.advanceInPaise).toBe(1_800_000);
  });
  it("adds water supply once from the active server catalogue", () => {
    const quote = calculateBookingPrice({ packageId: pkg.id, serviceItems: [], waterSupply: true }, pkg, [decor, water], { advancePercent: 30, taxBasisPoints: 0 });
    expect(quote.items).toHaveLength(1);
    expect(quote.totalInPaise).toBe(5_200_000);
  });
  it("rejects unavailable packages and inactive services", () => {
    expect(() => calculateBookingPrice({ packageId: "missing", serviceItems: [], waterSupply: false }, undefined, [], { advancePercent: 30, taxBasisPoints: 0 })).toThrow("package");
    expect(() => calculateBookingPrice({ packageId: pkg.id, serviceItems: [{ serviceId: "missing", quantity: 1 }], waterSupply: false }, pkg, [], { advancePercent: 30, taxBasisPoints: 0 })).toThrow("service");
  });
});
