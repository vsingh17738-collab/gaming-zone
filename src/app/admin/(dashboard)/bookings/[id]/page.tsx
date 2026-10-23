import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, Mail, Phone } from "lucide-react";
import { getBookingDetail } from "@/server/bookings";
import { getOptionalUser } from "@/lib/auth";
import { AdminPageTitle } from "@/components/admin/page-title";
import { BookingActions } from "@/components/admin/booking-actions";
import { StatusPill } from "@/components/ui/status";
import { formatEventDate, slotLabel } from "@/lib/dates";
import { formatINR } from "@/lib/money";
import { AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";
export default async function AdminBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await getOptionalUser(); if (!admin) notFound(); const { id } = await params;
  let detail; try { detail = await getBookingDetail(id, admin); } catch (error) { if (error instanceof AppError && error.status === 404) notFound(); throw error; }
  return <><Link href="/admin/bookings" className="mb-5 inline-flex items-center gap-2 text-xs text-stone-500"><ArrowLeft size={14} /> All bookings</Link><AdminPageTitle eyebrow={detail.booking.bookingNumber} title={detail.booking.eventType} copy={`${formatEventDate(detail.booking.eventDate)} · ${slotLabel(detail.booking.timeSlot)} · ${detail.booking.eventTime}`} actions={<BookingActions id={detail.booking.id} status={detail.booking.status} />} />
    <div className="grid items-start gap-6 xl:grid-cols-2"><section className="card p-6"><div className="flex items-center justify-between"><h2 className="font-display text-3xl text-wine-dark">Customer & event</h2><StatusPill status={detail.booking.status} /></div><div className="mt-5 space-y-3 text-sm"><p className="font-semibold">{detail.customer.name}</p><p className="flex items-center gap-2 text-stone-600"><Mail size={15} />{detail.customer.email}</p><p className="flex items-center gap-2 text-stone-600"><Phone size={15} />{detail.customer.phone ?? "No phone"}</p><p className="rounded-xl bg-stone-50 p-4 leading-6 text-stone-600">{detail.booking.location}<br />{detail.booking.guestCount} guests · {detail.package?.name}</p>{detail.booking.decorationRequirements && <p className="rounded-xl bg-sand/50 p-4 text-xs leading-6"><strong>Decoration:</strong><br />{detail.booking.decorationRequirements}</p>}{detail.booking.additionalNotes && <p className="text-xs leading-6 text-stone-500"><strong>Notes:</strong> {detail.booking.additionalNotes}</p>}<p className="text-xs text-stone-500">Water supply: <strong>{detail.booking.waterSupply ? "Required" : "Not selected"}</strong></p></div>{detail.quotation && <a href={`/api/bookings/${detail.booking.id}/quotation`} target="_blank" className="button-secondary mt-5 !min-h-10 !py-2 !text-xs"><Download size={14} /> View quotation</a>}</section>
      <section className="card p-6"><div className="flex items-center justify-between"><h2 className="font-display text-3xl text-wine-dark">Price & payments</h2><StatusPill status={detail.booking.paymentStatus} /></div><dl className="mt-5 space-y-3 text-sm"><div className="flex justify-between"><dt>Total</dt><dd className="font-bold">{formatINR(detail.booking.totalInPaise)}</dd></div><div className="flex justify-between"><dt>Advance</dt><dd>{formatINR(detail.booking.advanceInPaise)}</dd></div><div className="flex justify-between"><dt>Verified paid</dt><dd className="text-emerald-700">{formatINR(detail.paidInPaise)}</dd></div><div className="flex justify-between"><dt>Balance</dt><dd>{formatINR(detail.booking.totalInPaise - detail.paidInPaise)}</dd></div></dl><div className="mt-6 space-y-3">{detail.payments.map((payment) => <div key={payment.id} className="rounded-xl border border-stone-100 p-4 text-xs"><div className="flex items-center justify-between"><span className="font-semibold">{payment.paymentNumber}</span><StatusPill status={payment.status} /></div><p className="mt-2 text-stone-500">{payment.method} · {payment.kind} · {formatINR(payment.amountInPaise)}</p>{payment.reviewedAt && <p className="mt-1 text-[10px] text-stone-400">Reviewed {formatEventDate(payment.reviewedAt)} by {payment.reviewedBy}</p>}</div>)}</div></section></div>
  </>;
}
