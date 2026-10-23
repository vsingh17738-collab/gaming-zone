import "server-only";

import { and, asc, desc, eq, gte, ilike, inArray, lt, ne, notInArray, or, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb, type Transaction } from "@/db";
import {
  bookingItems,
  bookings,
  bookingSlots,
  businessSettings,
  invoices,
  packages,
  payments,
  quotations,
  services,
  users,
  type SafeUser,
} from "@/db/schema";
import { AppError } from "@/lib/errors";
import { addDays, monthRange, todayInIndia } from "@/lib/dates";
import { availabilityForDate, slotsForRequest, type RequestedSlot, type ReservedSlot } from "@/lib/availability";
import { newBookingNumber, newQuotationNumber } from "@/lib/identifiers";
import { calculateBookingPrice } from "@/lib/pricing";
import { assertOwnership } from "@/lib/auth";
import { defaultSettings } from "@/lib/content";
import type { bookingSchema } from "@/lib/validation";

type BookingInput = z.infer<typeof bookingSchema>;

async function calculateForBooking(tx: Transaction, input: Pick<BookingInput, "packageId" | "serviceItems" | "waterSupply">) {
  const [settingsRows, packageRows, serviceRows] = await Promise.all([
    tx.select().from(businessSettings).where(eq(businessSettings.id, 1)).limit(1),
    tx.select().from(packages).where(and(eq(packages.id, input.packageId), eq(packages.isActive, true))).limit(1),
    tx.select().from(services).where(eq(services.isActive, true)),
  ]);
  const settings = settingsRows[0] ?? defaultSettings;
  try {
    return {
      settings,
      price: calculateBookingPrice(input, packageRows[0], serviceRows, settings),
    };
  } catch (error) {
    throw new AppError(error instanceof Error ? error.message : "Unable to calculate this quotation", 422, "PRICING_ERROR");
  }
}

export async function previewQuotation(input: Pick<BookingInput, "packageId" | "serviceItems" | "waterSupply">) {
  const db = getDb();
  const { price, settings } = await calculateForBooking(db as unknown as Transaction, input);
  return {
    ...price,
    advancePercent: settings.advancePercent,
    taxBasisPoints: settings.taxBasisPoints,
    validUntil: addDays(todayInIndia(), 7),
    terms: settings.quotationTerms,
  };
}

export async function createBooking(customerId: string, input: BookingInput) {
  return getDb().transaction(async (tx) => {
    const requestedSlots = slotsForRequest(input.timeSlot);
    const conflicts = await tx.select({ slot: bookingSlots.slot }).from(bookingSlots)
      .where(and(eq(bookingSlots.eventDate, input.eventDate), inArray(bookingSlots.slot, requestedSlots)));
    if (conflicts.length) throw new AppError("The selected date and time slot are no longer available", 409, "SLOT_UNAVAILABLE");

    const { settings, price } = await calculateForBooking(tx, input);
    const inserted = await tx.insert(bookings).values({
      bookingNumber: newBookingNumber(),
      customerId,
      packageId: input.packageId,
      eventType: input.eventType,
      eventDate: input.eventDate,
      eventTime: input.eventTime,
      timeSlot: input.timeSlot,
      location: input.location,
      guestCount: input.guestCount,
      subtotalInPaise: price.subtotalInPaise,
      discountInPaise: price.discountInPaise,
      taxInPaise: price.taxInPaise,
      totalInPaise: price.totalInPaise,
      advanceInPaise: price.advanceInPaise,
      decorationRequirements: input.decorationRequirements,
      waterSupply: input.waterSupply,
      additionalNotes: input.additionalNotes,
    }).returning({ id: bookings.id, bookingNumber: bookings.bookingNumber });
    const booking = inserted[0];
    if (!booking) throw new AppError("Booking could not be created", 500);

    await tx.insert(bookingSlots).values(requestedSlots.map((slot) => ({
      bookingId: booking.id,
      eventDate: input.eventDate,
      slot,
    })));

    if (price.items.length) {
      await tx.insert(bookingItems).values(price.items.map((item) => ({ ...item, bookingId: booking.id })));
    }

    const quote = await tx.insert(quotations).values({
      quotationNumber: newQuotationNumber(),
      bookingId: booking.id,
      customerId,
      subtotalInPaise: price.subtotalInPaise,
      discountInPaise: price.discountInPaise,
      taxInPaise: price.taxInPaise,
      totalInPaise: price.totalInPaise,
      advanceInPaise: price.advanceInPaise,
      validUntil: addDays(todayInIndia(), 7),
      terms: settings.quotationTerms,
    }).returning({ quotationNumber: quotations.quotationNumber, validUntil: quotations.validUntil });

    return { id: booking.id, bookingNumber: booking.bookingNumber, quotation: quote[0], price };
  });
}

export async function getAvailability(month: string, requested?: RequestedSlot) {
  const { start, end } = monthRange(month);
  const rows = await getDb().select({ date: bookingSlots.eventDate, slot: bookingSlots.slot }).from(bookingSlots)
    .where(and(gte(bookingSlots.eventDate, start), lt(bookingSlots.eventDate, end)));
  const byDate = new Map<string, ReservedSlot[]>();
  for (const row of rows) byDate.set(row.date, [...(byDate.get(row.date) ?? []), row.slot]);
  const dates: Record<string, ReturnType<typeof availabilityForDate>> = {};
  const cursor = new Date(`${start}T00:00:00Z`);
  const endDate = new Date(`${end}T00:00:00Z`);
  while (cursor < endDate) {
    const date = cursor.toISOString().slice(0, 10);
    dates[date] = availabilityForDate(byDate.get(date) ?? [], requested);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return { month, dates };
}

export async function getBookingDetail(bookingId: string, user: SafeUser) {
  const db = getDb();
  const rows = await db.select({
    booking: bookings,
    customer: { id: users.id, name: users.name, email: users.email, phone: users.phone },
    package: { id: packages.id, name: packages.name, priceInPaise: packages.priceInPaise },
  }).from(bookings)
    .innerJoin(users, eq(users.id, bookings.customerId))
    .leftJoin(packages, eq(packages.id, bookings.packageId))
    .where(eq(bookings.id, bookingId)).limit(1);
  const row = rows[0];
  if (!row) throw new AppError("Booking not found", 404, "NOT_FOUND");
  assertOwnership(row.booking.customerId, user);
  const [items, quoteRows, paymentRows, invoiceRows] = await Promise.all([
    db.select().from(bookingItems).where(eq(bookingItems.bookingId, bookingId)).orderBy(asc(bookingItems.serviceName)),
    db.select().from(quotations).where(eq(quotations.bookingId, bookingId)).limit(1),
    db.select().from(payments).where(eq(payments.bookingId, bookingId)).orderBy(desc(payments.createdAt)),
    db.select().from(invoices).where(eq(invoices.bookingId, bookingId)).orderBy(desc(invoices.issuedAt)),
  ]);
  const paidInPaise = paymentRows.filter((payment) => payment.status === "paid").reduce((sum, payment) => sum + payment.amountInPaise, 0);
  return { ...row, items, quotation: quoteRows[0] ?? null, payments: paymentRows, invoices: invoiceRows, paidInPaise };
}

export type BookingDetail = Awaited<ReturnType<typeof getBookingDetail>>;

export async function getCustomerBookings(customerId: string) {
  return getDb().select({
    id: bookings.id,
    bookingNumber: bookings.bookingNumber,
    eventType: bookings.eventType,
    eventDate: bookings.eventDate,
    timeSlot: bookings.timeSlot,
    location: bookings.location,
    status: bookings.status,
    paymentStatus: bookings.paymentStatus,
    totalInPaise: bookings.totalInPaise,
    createdAt: bookings.createdAt,
    packageName: packages.name,
  }).from(bookings).leftJoin(packages, eq(packages.id, bookings.packageId))
    .where(eq(bookings.customerId, customerId)).orderBy(desc(bookings.createdAt));
}

const allowedTransitions: Record<string, string[]> = {
  pending: ["confirmed", "cancelled", "rejected"],
  confirmed: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
  rejected: [],
};

export async function updateBookingStatus(bookingId: string, status: string, reason?: string) {
  return getDb().transaction(async (tx) => {
    const rows = await tx.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1).for("update");
    const booking = rows[0];
    if (!booking) throw new AppError("Booking not found", 404, "NOT_FOUND");
    if (booking.status === status) return booking;
    if (!allowedTransitions[booking.status]?.includes(status)) {
      throw new AppError(`A ${booking.status} booking cannot be changed to ${status}`, 409, "INVALID_STATUS_TRANSITION");
    }
    if (status === "confirmed") {
      const requiredSlots = slotsForRequest(booking.timeSlot);
      const ownSlots = await tx.select({ slot: bookingSlots.slot }).from(bookingSlots).where(eq(bookingSlots.bookingId, booking.id));
      const missing = requiredSlots.filter((slot) => !ownSlots.some((own) => own.slot === slot));
      if (missing.length) {
        const conflicts = await tx.select({ id: bookingSlots.id }).from(bookingSlots).where(and(
          eq(bookingSlots.eventDate, booking.eventDate),
          inArray(bookingSlots.slot, missing),
          ne(bookingSlots.bookingId, booking.id),
        ));
        if (conflicts.length) throw new AppError("A conflicting event now occupies this slot", 409, "SLOT_UNAVAILABLE");
        await tx.insert(bookingSlots).values(missing.map((slot) => ({ bookingId: booking.id, eventDate: booking.eventDate, slot })));
      }
    }
    const updated = await tx.update(bookings).set({
      status: status as typeof booking.status,
      confirmedAt: status === "confirmed" ? new Date() : booking.confirmedAt,
      cancelledAt: status === "cancelled" || status === "rejected" ? new Date() : null,
      cancellationReason: status === "cancelled" || status === "rejected" ? reason : null,
      updatedAt: new Date(),
    }).where(eq(bookings.id, bookingId)).returning();
    if (status === "cancelled" || status === "rejected") await tx.delete(bookingSlots).where(eq(bookingSlots.bookingId, bookingId));
    return updated[0];
  });
}

export async function acceptQuotation(bookingId: string, user: SafeUser) {
  return getDb().transaction(async (tx) => {
    const rows = await tx.select({ quotation: quotations, booking: bookings }).from(quotations)
      .innerJoin(bookings, eq(bookings.id, quotations.bookingId))
      .where(eq(quotations.bookingId, bookingId)).limit(1).for("update");
    const row = rows[0];
    if (!row) throw new AppError("Quotation not found", 404, "NOT_FOUND");
    assertOwnership(row.quotation.customerId, user);
    if (row.quotation.status === "accepted") return row.quotation;
    if (row.quotation.status !== "sent" || row.quotation.validUntil < todayInIndia()) {
      throw new AppError("This quotation has expired or cannot be accepted", 409, "QUOTATION_UNAVAILABLE");
    }
    if (["cancelled", "rejected", "completed"].includes(row.booking.status)) {
      throw new AppError("The associated booking is not active", 409, "BOOKING_INACTIVE");
    }
    const amountsMatch = row.quotation.totalInPaise === row.booking.totalInPaise && row.quotation.advanceInPaise === row.booking.advanceInPaise;
    if (!amountsMatch) throw new AppError("The quotation needs to be regenerated", 409, "STALE_QUOTATION");
    const updated = await tx.update(quotations).set({ status: "accepted", acceptedAt: new Date() })
      .where(and(eq(quotations.id, row.quotation.id), eq(quotations.status, "sent"))).returning();
    return updated[0];
  });
}

export async function listAdminBookings(filters: { search?: string; status?: string }) {
  const conditions = [];
  if (filters.status && ["pending", "confirmed", "completed", "cancelled", "rejected"].includes(filters.status)) {
    conditions.push(eq(bookings.status, filters.status as typeof bookings.$inferSelect.status));
  }
  if (filters.search) {
    const term = `%${filters.search.replaceAll("%", "").slice(0, 100)}%`;
    conditions.push(or(ilike(bookings.bookingNumber, term), ilike(users.name, term), ilike(users.email, term)));
  }
  return getDb().select({ booking: bookings, customer: { name: users.name, email: users.email, phone: users.phone }, packageName: packages.name })
    .from(bookings).innerJoin(users, eq(users.id, bookings.customerId)).leftJoin(packages, eq(packages.id, bookings.packageId))
    .where(conditions.length ? and(...conditions) : undefined).orderBy(desc(bookings.createdAt)).limit(250);
}

export async function getDashboardStats() {
  const db = getDb();
  const [bookingRows, collectedRows, customerRows, upcoming, outstandingRows] = await Promise.all([
    db.select({ status: bookings.status, count: sql<number>`count(*)::int`, total: sql<number>`coalesce(sum(${bookings.totalInPaise}), 0)::bigint` }).from(bookings).groupBy(bookings.status),
    db.select({ total: sql<number>`coalesce(sum(${payments.amountInPaise}), 0)::bigint` }).from(payments).where(eq(payments.status, "paid")),
    db.select({ count: sql<number>`count(*)::int` }).from(users).where(eq(users.role, "customer")),
    db.select({ id: bookings.id, bookingNumber: bookings.bookingNumber, eventDate: bookings.eventDate, eventType: bookings.eventType, location: bookings.location, customerName: users.name, timeSlot: bookings.timeSlot })
      .from(bookings).innerJoin(users, eq(users.id, bookings.customerId))
      .where(and(eq(bookings.status, "confirmed"), gte(bookings.eventDate, todayInIndia()))).orderBy(asc(bookings.eventDate)).limit(8),
    db.select({ total: bookings.totalInPaise, paid: sql<number>`coalesce(sum(${payments.amountInPaise}) filter (where ${payments.status} = 'paid'), 0)::bigint` })
      .from(bookings).leftJoin(payments, eq(payments.bookingId, bookings.id)).where(notInArray(bookings.status, ["cancelled", "rejected"])).groupBy(bookings.id),
  ]);
  const statusCounts = Object.fromEntries(["pending", "confirmed", "completed", "cancelled", "rejected"].map((status) => [status, 0]));
  let totalBookings = 0;
  for (const row of bookingRows) {
    statusCounts[row.status] = row.count;
    totalBookings += row.count;
  }
  const collected = Number(collectedRows[0]?.total ?? 0);
  const pendingPaymentsInPaise = outstandingRows.reduce((sum, row) => sum + Math.max(0, row.total - Number(row.paid)), 0);
  return {
    totalBookings,
    statusCounts,
    customers: customerRows[0]?.count ?? 0,
    collectedInPaise: collected,
    pendingPaymentsInPaise,
    upcoming,
  };
}
