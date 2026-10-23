import { randomBytes } from "node:crypto";

function suffix() {
  return randomBytes(4).toString("hex").toUpperCase();
}

function datePart() {
  return new Date().toISOString().slice(0, 10).replaceAll("-", "");
}

export const newBookingNumber = () => `SSTH-B-${datePart()}-${suffix()}`;
export const newQuotationNumber = () => `SSTH-Q-${datePart()}-${suffix()}`;
export const newPaymentNumber = () => `SSTH-P-${datePart()}-${suffix()}`;
export const newInvoiceNumber = () => `SSTH-I-${datePart()}-${suffix()}`;
