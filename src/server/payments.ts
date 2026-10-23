import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";
import { getDb, type Transaction } from "@/db";
import { bookings, invoices, payments, quotations, users, type Booking, type Payment, type SafeUser } from "@/db/schema";
import { AppError } from "@/lib/errors";
import { assertOwnership } from "@/lib/auth";
import { newInvoiceNumber, newPaymentNumber } from "@/lib/identifiers";
import { paymentSummary } from "@/lib/money";
import { getRazorpay } from "@/lib/razorpay";

type PaymentKind = "advance" | "balance";

async function paidTotal(tx: Transaction, bookingId: string) {
  const rows = await tx.select({ total: sql<number>`coalesce(sum(${payments.amountInPaise}), 0)::bigint` })
    .from(payments).where(and(eq(payments.bookingId, bookingId), eq(payments.status, "paid")));
  return Number(rows[0]?.total ?? 0);
}

function amountDue(booking: Booking, paidInPaise: number, kind: PaymentKind) {
  return kind === "advance" ? Math.max(0, booking.advanceInPaise - paidInPaise) : Math.max(0, booking.totalInPaise - paidInPaise);
}

async function validatePayable(tx: Transaction, bookingId: string, customer: SafeUser, kind: PaymentKind) {
  const rows = await tx.select({ booking: bookings, quotation: quotations }).from(bookings)
    .leftJoin(quotations, eq(quotations.bookingId, bookings.id)).where(eq(bookings.id, bookingId)).limit(1).for("update");
  const row = rows[0];
  if (!row) throw new AppError("Booking not found", 404, "NOT_FOUND");
  assertOwnership(row.booking.customerId, customer);
  if (row.booking.status !== "confirmed") throw new AppError("Payments open after the booking is confirmed", 409, "BOOKING_NOT_CONFIRMED");
  if (row.quotation?.status !== "accepted") throw new AppError("Accept the current quotation before making a payment", 409, "QUOTATION_NOT_ACCEPTED");
  const paid = await paidTotal(tx, bookingId);
  const amountInPaise = amountDue(row.booking, paid, kind);
  if (amountInPaise <= 0) throw new AppError(kind === "advance" ? "The advance is already paid" : "This booking is fully paid", 409, "NOTHING_DUE");
  return { booking: row.booking, paidInPaise: paid, amountInPaise };
}

export async function createRazorpayOrder(bookingId: string, kind: PaymentKind, customer: SafeUser) {
  const db = getDb();
  const validated = await db.transaction(async (tx) => {
    const result = await validatePayable(tx, bookingId, customer, kind);
    const existing = await tx.select().from(payments).where(and(
      eq(payments.bookingId, bookingId), eq(payments.kind, kind), eq(payments.method, "razorpay"), eq(payments.status, "created"),
    )).orderBy(desc(payments.createdAt)).limit(1);
    return { ...result, existing: existing[0] };
  });
  if (validated.existing?.providerOrderId) {
    return { orderId: validated.existing.providerOrderId, paymentRecordId: validated.existing.id, amount: validated.existing.amountInPaise, currency: "INR", keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID };
  }
  const razorpay = getRazorpay();
  const order = await razorpay.orders.create({
    amount: validated.amountInPaise,
    currency: "INR",
    receipt: validated.booking.bookingNumber,
    notes: { bookingId, bookingNumber: validated.booking.bookingNumber, kind },
  });
  const inserted = await db.insert(payments).values({
    paymentNumber: newPaymentNumber(), bookingId, customerId: validated.booking.customerId,
    method: "razorpay", kind, amountInPaise: validated.amountInPaise, providerOrderId: order.id,
  }).returning({ id: payments.id });
  if (!inserted[0]) throw new AppError("Unable to create payment record", 500);
  return { orderId: order.id, paymentRecordId: inserted[0].id, amount: validated.amountInPaise, currency: "INR", keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID };
}

async function updateBookingPaymentStatus(tx: Transaction, booking: Booking) {
  const paid = await paidTotal(tx, booking.id);
  const summary = paymentSummary(booking.totalInPaise, booking.advanceInPaise, paid);
  await tx.update(bookings).set({ paymentStatus: summary.status, updatedAt: new Date() }).where(eq(bookings.id, booking.id));
  return summary;
}

async function finalizeCapturedPayment(input: { orderId: string; providerPaymentId: string; amountInPaise: number }) {
  return getDb().transaction(async (tx) => {
    const paymentRows = await tx.select().from(payments).where(eq(payments.providerOrderId, input.orderId)).limit(1).for("update");
    const payment = paymentRows[0];
    if (!payment || payment.method !== "razorpay") throw new AppError("Payment order not found", 404, "PAYMENT_NOT_FOUND");
    if (payment.status === "paid") return { paymentId: payment.id, duplicate: true };
    if (payment.status !== "created" || payment.amountInPaise !== input.amountInPaise) {
      throw new AppError("Captured payment does not match the pending order", 409, "PAYMENT_MISMATCH");
    }
    const bookingRows = await tx.select().from(bookings).where(eq(bookings.id, payment.bookingId)).limit(1).for("update");
    const booking = bookingRows[0];
    if (!booking) throw new AppError("Booking not found", 404, "NOT_FOUND");
    const paid = await paidTotal(tx, booking.id);
    const due = amountDue(booking, paid, payment.kind);
    if (input.amountInPaise > due) throw new AppError("Payment exceeds the remaining amount due; manual review is required", 409, "PAYMENT_REVIEW_REQUIRED");
    const updated = await tx.update(payments).set({
      status: "paid", providerPaymentId: input.providerPaymentId, paidAt: new Date(), updatedAt: new Date(),
    }).where(and(eq(payments.id, payment.id), eq(payments.status, "created"))).returning({ id: payments.id });
    if (!updated[0]) throw new AppError("Payment was already processed", 409, "DUPLICATE_PAYMENT");
    await tx.insert(invoices).values({
      invoiceNumber: newInvoiceNumber(), bookingId: booking.id, paymentId: payment.id,
      customerId: payment.customerId, amountInPaise: payment.amountInPaise,
    });
    await updateBookingPaymentStatus(tx, booking);
    return { paymentId: payment.id, duplicate: false };
  });
}

interface RazorpayCapturedPayment {
  id: string;
  order_id: string;
  amount: number | string;
  currency: string;
  status: string;
}

export async function verifyRazorpayPayment(input: { orderId: string; paymentId: string }, customer: SafeUser) {
  const rows = await getDb().select({ bookingId: payments.bookingId, customerId: payments.customerId }).from(payments)
    .where(eq(payments.providerOrderId, input.orderId)).limit(1);
  if (!rows[0]) throw new AppError("Payment order not found", 404, "PAYMENT_NOT_FOUND");
  assertOwnership(rows[0].customerId, customer);
  const captured = await getRazorpay().payments.fetch(input.paymentId) as unknown as RazorpayCapturedPayment;
  if (captured.status !== "captured" || captured.order_id !== input.orderId || captured.currency !== "INR") {
    throw new AppError("Razorpay has not confirmed this payment as captured", 409, "PAYMENT_NOT_CAPTURED");
  }
  return finalizeCapturedPayment({ orderId: input.orderId, providerPaymentId: input.paymentId, amountInPaise: Number(captured.amount) });
}

export async function processRazorpayWebhook(payload: {
  event?: string;
  payload?: { payment?: { entity?: RazorpayCapturedPayment } };
}) {
  if (payload.event !== "payment.captured") return { ignored: true };
  const payment = payload.payload?.payment?.entity;
  if (!payment?.id || !payment.order_id || payment.currency !== "INR") throw new AppError("Invalid webhook payload", 422, "INVALID_WEBHOOK");
  const result = await finalizeCapturedPayment({ orderId: payment.order_id, providerPaymentId: payment.id, amountInPaise: Number(payment.amount) });
  return { ...result, ignored: false };
}

export async function recordManualProof(input: {
  bookingId: string;
  kind: PaymentKind;
  customer: SafeUser;
  proofUrl: string;
  proofPathname: string;
  proofContentType: string;
}) {
  return getDb().transaction(async (tx) => {
    const validated = await validatePayable(tx, input.bookingId, input.customer, input.kind);
    const existing = await tx.select({ id: payments.id }).from(payments).where(and(
      eq(payments.bookingId, input.bookingId), eq(payments.kind, input.kind), eq(payments.method, "manual"), eq(payments.status, "proof_submitted"),
    )).limit(1);
    if (existing.length) throw new AppError("A payment proof is already awaiting review", 409, "PROOF_ALREADY_PENDING");
    const inserted = await tx.insert(payments).values({
      paymentNumber: newPaymentNumber(), bookingId: input.bookingId, customerId: validated.booking.customerId,
      method: "manual", kind: input.kind, amountInPaise: validated.amountInPaise, status: "proof_submitted",
      proofUrl: input.proofUrl, proofPathname: input.proofPathname, proofContentType: input.proofContentType, proofUploadedAt: new Date(),
    }).returning({ id: payments.id, paymentNumber: payments.paymentNumber, status: payments.status });
    return inserted[0];
  });
}

export async function reviewManualPayment(paymentId: string, reviewer: SafeUser, decision: "approve" | "reject", note?: string) {
  return getDb().transaction(async (tx) => {
    const rows = await tx.select().from(payments).where(eq(payments.id, paymentId)).limit(1).for("update");
    const payment = rows[0];
    if (!payment || payment.method !== "manual") throw new AppError("Manual payment not found", 404, "PAYMENT_NOT_FOUND");
    if (payment.status !== "proof_submitted") throw new AppError("This payment proof has already been reviewed", 409, "ALREADY_REVIEWED");
    const common = { reviewedBy: reviewer.id, reviewedAt: new Date(), reviewNote: note, updatedAt: new Date() };
    if (decision === "reject") {
      const rejected = await tx.update(payments).set({ ...common, status: "rejected" }).where(eq(payments.id, payment.id)).returning();
      return rejected[0];
    }
    const bookingRows = await tx.select().from(bookings).where(eq(bookings.id, payment.bookingId)).limit(1).for("update");
    const booking = bookingRows[0];
    if (!booking) throw new AppError("Booking not found", 404, "NOT_FOUND");
    if (booking.status !== "confirmed") throw new AppError("Payment proof can be approved only for a confirmed booking", 409, "BOOKING_NOT_CONFIRMED");
    const paid = await paidTotal(tx, booking.id);
    if (payment.amountInPaise > amountDue(booking, paid, payment.kind)) throw new AppError("Payment exceeds the amount currently due", 409, "PAYMENT_MISMATCH");
    const approved = await tx.update(payments).set({ ...common, status: "paid", paidAt: new Date() }).where(eq(payments.id, payment.id)).returning();
    await tx.insert(invoices).values({ invoiceNumber: newInvoiceNumber(), bookingId: booking.id, paymentId: payment.id, customerId: payment.customerId, amountInPaise: payment.amountInPaise });
    await updateBookingPaymentStatus(tx, booking);
    return approved[0];
  });
}

export async function listAdminPayments(status?: string) {
  const conditions = status && ["created", "proof_submitted", "paid", "failed", "rejected", "refunded"].includes(status)
    ? eq(payments.status, status as Payment["status"]) : undefined;
  return getDb().select({ payment: payments, bookingNumber: bookings.bookingNumber, customerName: users.name, customerEmail: users.email })
    .from(payments).innerJoin(bookings, eq(bookings.id, payments.bookingId)).innerJoin(users, eq(users.id, payments.customerId))
    .where(conditions).orderBy(desc(payments.createdAt)).limit(250);
}
