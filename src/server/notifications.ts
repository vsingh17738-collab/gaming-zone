import "server-only";

import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { bookings, notifications, payments, users } from "@/db/schema";
import { normalizePhoneForWhatsApp } from "@/lib/whatsapp";

type Channel = "email" | "whatsapp" | "sms";
interface Recipient { name: string; email: string; phone: string | null }

async function persist(result: {
  bookingId?: string;
  userId?: string;
  channel: Channel;
  recipient: string;
  template: string;
  configured: boolean;
  response: Response;
  providerId?: string;
  error?: string;
}) {
  await getDb().insert(notifications).values({
    bookingId: result.bookingId,
    userId: result.userId,
    channel: result.channel,
    recipient: result.recipient,
    template: result.template,
    status: result.response.ok ? "sent" : "failed",
    providerMessageId: result.providerId,
    error: result.response.ok ? undefined : result.error?.slice(0, 500) ?? "Provider rejected the request",
    sentAt: result.response.ok ? new Date() : undefined,
  });
}

async function deliver(channel: Channel, recipient: Recipient, text: string, template: string, bookingId?: string, userId?: string) {
  let url: string | undefined;
  let headers: Record<string, string> = {};
  let body: BodyInit | undefined;
  let to: string | null = null;

  if (channel === "email" && process.env.RESEND_API_KEY && process.env.EMAIL_FROM) {
    to = recipient.email;
    url = "https://api.resend.com/emails";
    headers = { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" };
    body = JSON.stringify({ from: process.env.EMAIL_FROM, to: [to], subject: "Shri Shaam Tent House", text });
  } else if (channel === "whatsapp" && process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID && recipient.phone) {
    to = normalizePhoneForWhatsApp(recipient.phone);
    url = `https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    headers = { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`, "Content-Type": "application/json" };
    body = process.env.WHATSAPP_TEMPLATE_NAME
      ? JSON.stringify({ messaging_product: "whatsapp", to, type: "template", template: { name: process.env.WHATSAPP_TEMPLATE_NAME, language: { code: process.env.WHATSAPP_TEMPLATE_LANGUAGE ?? "en_US" }, components: [{ type: "body", parameters: [{ type: "text", text }] }] } })
      : JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: text } });
  } else if (channel === "sms" && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER && recipient.phone) {
    const normalizedSms = normalizePhoneForWhatsApp(recipient.phone);
    if (!normalizedSms) return;
    to = `+${normalizedSms}`;
    url = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
    headers = { Authorization: `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" };
    body = new URLSearchParams({ To: to, From: process.env.TWILIO_FROM_NUMBER, Body: text });
  }
  if (!url || !to || !body) return;

  try {
    const response = await fetch(url, { method: "POST", headers, body, signal: AbortSignal.timeout(10_000) });
    const result = await response.json() as { id?: string; sid?: string; messages?: { id?: string }[]; message?: string; error?: { message?: string } };
    await persist({ bookingId, userId, channel, recipient: to, template, configured: true, response, providerId: result.id ?? result.sid ?? result.messages?.[0]?.id, error: result.message ?? result.error?.message });
  } catch {
    await getDb().insert(notifications).values({ bookingId, userId, channel, recipient: to, template, status: "failed", error: "Provider request failed" });
  }
}

async function notifyAll(recipient: Recipient, text: string, template: string, bookingId?: string, userId?: string) {
  // Await each provider so results persist before a serverless invocation finishes.
  await deliver("email", recipient, text, template, bookingId, userId);
  await deliver("whatsapp", recipient, text, template, bookingId, userId);
  await deliver("sms", recipient, text, template, bookingId, userId);
}

export async function sendBookingNotifications(bookingId: string) {
  const rows = await getDb().select({ booking: bookings, customer: { name: users.name, email: users.email, phone: users.phone } })
    .from(bookings).innerJoin(users, eq(users.id, bookings.customerId)).where(eq(bookings.id, bookingId)).limit(1);
  const row = rows[0];
  if (!row) return;
  const isNewRequest = row.booking.status === "pending";
  const text = isNewRequest
    ? `Booking request ${row.booking.bookingNumber} was received for ${row.booking.eventDate}. Your itemised quotation is ready in your customer account; the event is pending business confirmation.`
    : `Booking ${row.booking.bookingNumber} is ${row.booking.status}. Event date: ${row.booking.eventDate}. Log in to your account for quotation and payment details.`;
  await notifyAll(row.customer, text, isNewRequest ? "booking_request_and_quotation" : "booking_update", bookingId, row.booking.customerId);
}

export async function sendPaymentReceipt(paymentId: string) {
  const rows = await getDb().select({ payment: payments, booking: bookings, customer: { name: users.name, email: users.email, phone: users.phone } })
    .from(payments).innerJoin(bookings, eq(bookings.id, payments.bookingId)).innerJoin(users, eq(users.id, payments.customerId)).where(eq(payments.id, paymentId)).limit(1);
  const row = rows[0];
  if (!row || row.payment.status !== "paid") return;
  const text = `Payment ${row.payment.paymentNumber} for booking ${row.booking.bookingNumber} has been verified. Your receipt is available in your customer account.`;
  await notifyAll(row.customer, text, "payment_receipt", row.booking.id, row.booking.customerId);
}

export async function sendRegistrationNotification(userId: string) {
  const rows = await getDb().select({ name: users.name, email: users.email, phone: users.phone }).from(users).where(eq(users.id, userId)).limit(1);
  if (rows[0]) await notifyAll(rows[0], "Welcome to Shri Shaam Tent House. Your customer account is ready for bookings and quotations.", "registration", undefined, userId);
}
