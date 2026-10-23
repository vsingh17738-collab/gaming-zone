import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, Download, MapPin } from "lucide-react";
import { getOptionalUser } from "@/lib/auth";
import { getBookingDetail } from "@/server/bookings";
import { getBusinessSettings } from "@/lib/data";
import { formatEventDate, slotLabel } from "@/lib/dates";
import { formatINR } from "@/lib/money";
import { StatusPill } from "@/components/ui/status";
import { PaymentPanel } from "@/components/account/payment-panel";
import { ReviewForm } from "@/components/account/review-form";

export const metadata: Metadata = { title: "Booking Details", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function BookingDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const user = await getOptionalUser(); if (!user) redirect("/login?next=/account");
  const { id } = await params; const query = await searchParams;
  const [detail, settings] = await Promise.all([getBookingDetail(id, user), getBusinessSettings()]);
  return <section className="container-shell py-10 sm:py-16"><Link href="/account" className="inline-flex items-center gap-2 text-xs font-semibold text-stone-500 hover:text-wine"><ArrowLeft size={15} /> Back to all bookings</Link>
    {query.created && <div className="mt-6 flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800"><CheckCircle2 className="shrink-0" /><div><p className="font-semibold">Your booking request is saved.</p><p className="mt-1 text-xs leading-5">Booking number {detail.booking.bookingNumber} is pending business review. It is not yet confirmed or paid.</p></div></div>}
    <div className="mt-7 flex flex-col gap-4 border-b border-stone-200 pb-8 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-gold">{detail.booking.bookingNumber}</p><h1 className="mt-2 font-display text-5xl text-wine-dark">{detail.booking.eventType}</h1><p className="mt-3 text-sm text-stone-600">{formatEventDate(detail.booking.eventDate)} · {slotLabel(detail.booking.timeSlot)}</p></div><div className="flex gap-2"><StatusPill status={detail.booking.status} /><StatusPill status={detail.booking.paymentStatus} /></div></div>
    <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_.8fr]"><div><div className="card p-6 sm:p-7"><h2 className="font-display text-3xl text-wine-dark">Event & quotation</h2><p className="mt-4 flex gap-2 text-sm leading-6 text-stone-600"><MapPin size={17} className="mt-1 shrink-0 text-gold" />{detail.booking.location}</p><div className="mt-6 space-y-3">{detail.package && <div className="flex justify-between gap-4 text-sm"><span>{detail.package.name}</span><span>{formatINR(detail.package.priceInPaise)}</span></div>}{detail.items.map((item) => <div key={item.id} className="flex justify-between gap-4 border-t border-stone-100 pt-3 text-xs text-stone-600"><span>{item.serviceName} × {item.quantity}</span><span>{formatINR(item.totalInPaise)}</span></div>)}</div><dl className="mt-6 space-y-3 border-t border-stone-200 pt-5 text-sm"><div className="flex justify-between text-stone-600"><dt>Subtotal</dt><dd>{formatINR(detail.booking.subtotalInPaise)}</dd></div><div className="flex justify-between text-stone-600"><dt>Tax</dt><dd>{formatINR(detail.booking.taxInPaise)}</dd></div><div className="flex justify-between text-lg font-bold text-wine-dark"><dt>Total</dt><dd>{formatINR(detail.booking.totalInPaise)}</dd></div><div className="flex justify-between text-wine"><dt>Advance ({settings.advancePercent}%)</dt><dd>{formatINR(detail.booking.advanceInPaise)}</dd></div><div className="flex justify-between text-stone-600"><dt>Verified paid</dt><dd>{formatINR(detail.paidInPaise)}</dd></div><div className="flex justify-between font-semibold"><dt>Balance</dt><dd>{formatINR(Math.max(0, detail.booking.totalInPaise - detail.paidInPaise))}</dd></div></dl>{detail.booking.decorationRequirements && <div className="mt-6 rounded-xl bg-sand/50 p-4 text-xs leading-6 text-stone-600"><strong className="block text-wine">Decoration requirements</strong>{detail.booking.decorationRequirements}</div>}{detail.quotation && <a href={`/api/bookings/${detail.booking.id}/quotation`} target="_blank" className="button-secondary mt-6 !min-h-10 !py-2 !text-xs"><Download size={15} /> Download quotation {detail.quotation.quotationNumber}</a>}</div>{detail.booking.status === "completed" && <ReviewForm bookingId={detail.booking.id} />}</div>
      <PaymentPanel detail={detail} settings={settings} />
    </div></section>;
}
