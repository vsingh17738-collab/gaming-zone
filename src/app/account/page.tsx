import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarDays, Plus } from "lucide-react";
import { getOptionalUser } from "@/lib/auth";
import { getCustomerBookings } from "@/server/bookings";
import { formatEventDate } from "@/lib/dates";
import { formatINR } from "@/lib/money";
import { StatusPill } from "@/components/ui/status";
import { ProfileForm } from "@/components/account/profile-form";

export const metadata: Metadata = { title: "My Account", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getOptionalUser(); if (!user) redirect("/login?next=/account");
  const bookings = await getCustomerBookings(user.id);
  return <section className="container-shell py-12 sm:py-20"><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><span className="eyebrow">Customer account</span><h1 className="mt-4 font-display text-5xl text-wine-dark sm:text-6xl">Namaste, {user.name.split(" ")[0]}.</h1><p className="mt-3 text-sm text-stone-600">Your bookings, quotations and verified payments in one place.</p></div><Link href="/book" className="button-primary"><Plus size={16} /> New event request</Link></div>
    <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1.4fr_.6fr]"><div><h2 className="font-display text-3xl text-wine-dark">Booking history</h2>{bookings.length ? <div className="mt-5 space-y-4">{bookings.map((booking) => <Link href={`/account/bookings/${booking.id}`} key={booking.id} className="card group flex flex-col gap-4 p-5 transition hover:-translate-y-0.5 hover:border-gold sm:flex-row sm:items-center"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-wine-light text-wine"><CalendarDays size={21} /></span><div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">{booking.bookingNumber}</p><h3 className="mt-1 font-display text-2xl text-wine-dark">{booking.eventType} · {booking.packageName}</h3><p className="mt-1 text-xs text-stone-500">{formatEventDate(booking.eventDate)} · {booking.location}</p></div><div className="flex items-center gap-3"><div className="text-right"><StatusPill status={booking.status} /><p className="mt-2 text-xs font-semibold text-wine">{formatINR(booking.totalInPaise)}</p></div><ArrowRight size={17} className="text-stone-400 transition group-hover:translate-x-1 group-hover:text-wine" /></div></Link>)}</div> : <div className="card mt-5 py-16 text-center"><CalendarDays className="mx-auto text-gold" size={35} /><h3 className="mt-4 font-display text-3xl text-wine-dark">No events requested yet.</h3><p className="mt-2 text-sm text-stone-500">Your next beautiful celebration can start here.</p><Link href="/book" className="button-primary mt-6">Plan an event</Link></div>}</div><ProfileForm user={user} /></div>
  </section>;
}
