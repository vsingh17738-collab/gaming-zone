export function formatINR(paise: number, includePaise = false) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: includePaise ? 2 : 0,
    maximumFractionDigits: includePaise ? 2 : 0,
  }).format(paise / 100);
}

export function formatPdfMoney(paise: number) {
  return `INR ${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function calculateAdvance(totalInPaise: number, advancePercent: number) {
  if (!Number.isInteger(totalInPaise) || totalInPaise < 0) throw new Error("Invalid total");
  if (!Number.isInteger(advancePercent) || advancePercent < 0 || advancePercent > 100) throw new Error("Invalid advance percentage");
  return Math.round((totalInPaise * advancePercent) / 100);
}

export function calculateTax(taxableInPaise: number, taxBasisPoints: number) {
  if (!Number.isInteger(taxableInPaise) || taxableInPaise < 0) throw new Error("Invalid taxable amount");
  if (!Number.isInteger(taxBasisPoints) || taxBasisPoints < 0 || taxBasisPoints > 10_000) throw new Error("Invalid tax rate");
  return Math.round((taxableInPaise * taxBasisPoints) / 10_000);
}

export function paymentSummary(totalInPaise: number, advanceInPaise: number, paidInPaise: number) {
  const boundedPaid = Math.max(0, paidInPaise);
  return {
    paidInPaise: boundedPaid,
    advanceDueInPaise: Math.max(0, advanceInPaise - boundedPaid),
    balanceInPaise: Math.max(0, totalInPaise - boundedPaid),
    status: boundedPaid <= 0 ? "unpaid" as const : boundedPaid >= totalInPaise ? "paid" as const : "partially_paid" as const,
  };
}
