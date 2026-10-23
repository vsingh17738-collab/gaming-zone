import "server-only";

import PDFDocument from "pdfkit";
import type { BookingDetail } from "@/server/bookings";
import type { BusinessSettings } from "@/db/schema";
import { formatEventDate, slotLabel } from "./dates";
import { formatPdfMoney } from "./money";

function renderPdf(render: (doc: PDFKit.PDFDocument) => void) {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48, bufferPages: true, info: { Author: "Shri Shaam Tent House" } });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    render(doc);
    doc.end();
  });
}

function header(doc: PDFKit.PDFDocument, settings: BusinessSettings, title: string, number: string) {
  doc.fillColor("#722f37").font("Helvetica-Bold").fontSize(22).text(settings.businessName);
  doc.fillColor("#25221f").font("Helvetica").fontSize(9).text(settings.address).text(`Contact: ${settings.contactPerson}${settings.phone ? ` | ${settings.phone}` : ""}`);
  doc.moveDown(1.2).strokeColor("#b38a4a").lineWidth(1).moveTo(48, doc.y).lineTo(547, doc.y).stroke();
  doc.moveDown(1.2).fillColor("#25221f").font("Helvetica-Bold").fontSize(18).text(title);
  doc.font("Helvetica").fontSize(10).text(`Reference: ${number}`).text(`Issued: ${formatEventDate(new Date())}`);
}

function moneyRow(doc: PDFKit.PDFDocument, label: string, value: number, bold = false) {
  doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(bold ? 11 : 10).fillColor("#25221f")
    .text(label, 330, doc.y, { width: 110, align: "left" })
    .text(formatPdfMoney(value), 440, doc.y - (bold ? 13 : 12), { width: 107, align: "right" });
}

export async function quotationPdf(detail: BookingDetail, settings: BusinessSettings) {
  const quote = detail.quotation;
  if (!quote) throw new Error("Quotation not found");
  return renderPdf((doc) => {
    header(doc, settings, "EVENT QUOTATION", quote.quotationNumber);
    doc.moveDown(1.5).font("Helvetica-Bold").fontSize(11).text("Prepared for");
    doc.font("Helvetica").fontSize(10).text(detail.customer.name).text(detail.customer.email).text(detail.customer.phone ?? "");
    doc.moveDown().font("Helvetica-Bold").text("Event details");
    doc.font("Helvetica").text(`Booking: ${detail.booking.bookingNumber}`).text(`${detail.booking.eventType} | ${formatEventDate(detail.booking.eventDate)} | ${slotLabel(detail.booking.timeSlot)}`).text(detail.booking.location).text(`Guests: ${detail.booking.guestCount}`);
    doc.moveDown(1.4);
    const startY = doc.y;
    doc.font("Helvetica-Bold").text("Service", 48, startY, { width: 250 }).text("Qty", 310, startY, { width: 45 }).text("Unit price", 365, startY, { width: 85, align: "right" }).text("Amount", 465, startY, { width: 82, align: "right" });
    doc.moveDown(.5).strokeColor("#dddddd").moveTo(48, doc.y).lineTo(547, doc.y).stroke().moveDown(.4);
    if (detail.package) {
      const y = doc.y;
      doc.font("Helvetica").text(detail.package.name, 48, y, { width: 250 }).text("1", 310, y).text(formatPdfMoney(detail.package.priceInPaise), 365, y, { width: 85, align: "right" }).text(formatPdfMoney(detail.package.priceInPaise), 465, y, { width: 82, align: "right" });
      doc.moveDown(1.1);
    }
    for (const item of detail.items) {
      const y = doc.y;
      doc.text(item.serviceName, 48, y, { width: 250 }).text(String(item.quantity), 310, y).text(formatPdfMoney(item.unitPriceInPaise), 365, y, { width: 85, align: "right" }).text(formatPdfMoney(item.totalInPaise), 465, y, { width: 82, align: "right" });
      doc.moveDown(1.1);
    }
    doc.moveDown().moveTo(320, doc.y).lineTo(547, doc.y).stroke().moveDown(.5);
    moneyRow(doc, "Subtotal", quote.subtotalInPaise);
    if (quote.discountInPaise) moneyRow(doc, "Discount", -quote.discountInPaise);
    moneyRow(doc, "Tax", quote.taxInPaise);
    moneyRow(doc, "Total", quote.totalInPaise, true);
    moneyRow(doc, "Advance due", quote.advanceInPaise);
    moneyRow(doc, "Amount paid", detail.paidInPaise);
    moneyRow(doc, "Balance due", Math.max(0, quote.totalInPaise - detail.paidInPaise), true);
    doc.moveDown(1.2).font("Helvetica-Bold").fontSize(10).text(`Valid until: ${formatEventDate(quote.validUntil)}`);
    doc.font("Helvetica-Bold").text("Terms").font("Helvetica").fontSize(9).text(quote.terms, { lineGap: 3 });
    doc.moveDown().fillColor("#722f37").text("This is a quotation, not proof of payment. Online payments are verified with Razorpay; manual payments are credited only after business review.", { lineGap: 3 });
  });
}

export async function invoicePdf(detail: BookingDetail, settings: BusinessSettings, invoiceId: string) {
  const invoice = detail.invoices.find((item) => item.id === invoiceId);
  const payment = detail.payments.find((item) => item.id === invoice?.paymentId);
  if (!invoice || !payment || payment.status !== "paid") throw new Error("Invoice not found");
  return renderPdf((doc) => {
    header(doc, settings, "PAYMENT INVOICE / RECEIPT", invoice.invoiceNumber);
    doc.moveDown(1.5).font("Helvetica-Bold").fontSize(11).text("Billed to");
    doc.font("Helvetica").fontSize(10).text(detail.customer.name).text(detail.customer.email);
    doc.moveDown().font("Helvetica-Bold").text("Payment details");
    doc.font("Helvetica").text(`Booking: ${detail.booking.bookingNumber}`).text(`Payment reference: ${payment.paymentNumber}`).text(`Method: ${payment.method === "razorpay" ? "Razorpay" : "Manual / UPI"}`).text(`Provider payment ID: ${payment.providerPaymentId ?? "Not applicable"}`).text(`Paid at: ${payment.paidAt ? formatEventDate(payment.paidAt) : formatEventDate(invoice.issuedAt)}`);
    doc.moveDown(2).font("Helvetica-Bold").fontSize(12).text(`Verified payment received: ${formatPdfMoney(invoice.amountInPaise)}`);
    doc.moveDown(1.5).font("Helvetica").fontSize(10);
    moneyRow(doc, "Booking total", detail.booking.totalInPaise);
    moneyRow(doc, "Total paid", detail.paidInPaise);
    moneyRow(doc, "Remaining balance", Math.max(0, detail.booking.totalInPaise - detail.paidInPaise), true);
    doc.moveDown(2).font("Helvetica").fontSize(9).fillColor("#666666").text("This receipt is generated only for a verified payment recorded by Shri Shaam Tent House. Booking payment status is independent of event booking status.");
    if (settings.taxDetails) doc.moveDown().text(settings.taxDetails);
  });
}
