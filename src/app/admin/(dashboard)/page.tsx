import Link from "next/link";
import { ArrowUpRight, CalendarDays, CircleDollarSign, Clock3, UsersRound } from "lucide-react";
import { getDashboardStats } from "@/server/bookings";
import { integrationStatus } from "@/lib/data";
import { formatINR } from "@/lib/money";
import { formatEventDate, slotLabel } from "@/lib/dates";
import { AdminPageTitle } from "@/components/admin/page-title";

export const dynamic = "force-dynamic";
export default async function AdminDashboardPage() {
  const stats = await getDashboardStats(); const integrations = integrationStatus();
  const cards = [
    ["Total bookings", stats.totalBookings, CalendarDays], ["Pending requests", stats.statusCounts.pending, Clock3], ["Confirmed", stats.statusCounts.confirmed, CalendarDays], ["Customers", stats.customers, UsersRound],
  ] as const;
  return <><AdminPageTitle eyebrow="Overview" title="Good to see you." copy="Live business figures from your Neon database." />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, Icon]) => <div key={label} className="card p-5"><div className="flex items-center justify-between"><p className="text-xs font-semibold text-stone-500">{label}</p><Icon size={18} className="text-gold" /></div><p className="mt-4 font-display text-5xl text-wine-dark">{value}</p></div>)}</div>
    <div className="mt-4 grid gap-4 sm:grid-cols-3"><div className="card p-5"><p className="text-xs text-stone-500">Collected payments</p><p className="mt-2 font-display text-3xl text-emerald-700">{formatINR(stats.collectedInPaise)}</p></div><div className="card p-5"><p className="text-xs text-stone-500">Pending payments</p><p className="mt-2 font-display text-3xl text-amber-700">{formatINR(stats.pendingPaymentsInPaise)}</p></div><div className="card p-5"><p className="text-xs text-stone-500">Completed / cancelled</p><p className="mt-2 font-display text-3xl text-wine-dark">{stats.statusCounts.completed} / {stats.statusCounts.cancelled}</p></div></div>
    <div className="mt-7 grid items-start gap-6 xl:grid-cols-[1.35fr_.65fr]"><section className="card p-6"><div className="flex items-center justify-between"><h2 className="font-display text-3xl text-wine-dark">Upcoming confirmed events</h2><Link href="/admin/calendar" className="text-xs font-semibold text-wine">Calendar</Link></div>{stats.upcoming.length ? <div className="mt-5 space-y-3">{stats.upcoming.map((event) => <Link href={`/admin/bookings/${event.id}`} key={event.id} className="flex items-center gap-4 rounded-xl border border-stone-100 p-4 hover:border-gold"><span className="grid h-11 w-11 place-items-center rounded-full bg-wine-light text-wine"><CalendarDays size={18} /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{event.eventType} · {event.customerName}</p><p className="mt-1 text-xs text-stone-500">{formatEventDate(event.eventDate)} · {slotLabel(event.timeSlot)}</p></div><ArrowUpRight size={15} className="text-stone-400" /></Link>)}</div> : <p className="mt-6 rounded-xl bg-stone-50 p-5 text-sm text-stone-500">No upcoming confirmed events.</p>}</section>
      <section className="card p-6"><h2 className="flex items-center gap-2 font-display text-3xl text-wine-dark"><CircleDollarSign size={23} className="text-gold" /> Integrations</h2><div className="mt-5 space-y-3">{Object.entries(integrations).map(([name, configured]) => <div key={name} className="flex items-center justify-between text-xs"><span className="capitalize text-stone-600">{name}</span><span className={`status-pill ${configured ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"}`}>{configured ? "Configured" : "Not configured"}</span></div>)}</div><p className="mt-5 text-[10px] leading-5 text-stone-500">A configured flag only means required credentials are present. It does not claim a test message or payment was sent.</p></section></div>
  </>;
}
