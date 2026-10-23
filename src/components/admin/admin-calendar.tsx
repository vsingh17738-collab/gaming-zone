"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { fetchJson } from "@/lib/client";
import { formatEventDate, slotLabel } from "@/lib/dates";
import { StatusPill } from "@/components/ui/status";
import type { Booking } from "@/db/schema";

type EventRow = { booking: Booking; customer: { name: string; phone: string | null; email: string } };
export function AdminCalendar({ initialMonth }: { initialMonth: string }) {
  const [month, setMonth] = useState(initialMonth); const [events, setEvents] = useState<EventRow[]>([]); const [error, setError] = useState("");
  const load = useCallback(async () => { try { const result = await fetchJson<{ events: EventRow[] }>(`/api/admin/calendar?month=${month}`); setEvents(result.events); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load"); } }, [month]);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  function move(offset: number) { const date = new Date(`${month}-01T00:00:00Z`); date.setUTCMonth(date.getUTCMonth() + offset); setMonth(date.toISOString().slice(0, 7)); }
  return <div className="card p-5 sm:p-7"><div className="flex items-center justify-between"><button onClick={() => move(-1)} className="button-secondary !min-h-9 !p-2" aria-label="Previous month"><ChevronLeft size={16} /></button><h2 className="font-display text-3xl text-wine-dark">{new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${month}-01T00:00:00Z`))}</h2><button onClick={() => move(1)} className="button-secondary !min-h-9 !p-2" aria-label="Next month"><ChevronRight size={16} /></button></div>{error && <p className="mt-4 text-xs text-red-600">{error}</p>}<div className="mt-6 space-y-3">{events.map(({ booking, customer }) => <Link href={`/admin/bookings/${booking.id}`} key={booking.id} className="flex flex-col gap-3 rounded-xl border border-stone-100 p-4 hover:border-gold sm:flex-row sm:items-center"><div className="w-32 shrink-0"><p className="font-display text-xl text-wine">{formatEventDate(booking.eventDate, { day: "numeric", month: "short", timeZone: "UTC" })}</p><p className="text-[10px] text-stone-400">{slotLabel(booking.timeSlot)}</p></div><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{booking.eventType} · {customer.name}</p><p className="mt-1 truncate text-xs text-stone-500">{booking.location}</p><p className="mt-1 text-[10px] text-stone-400">{customer.phone} · {customer.email}</p></div><StatusPill status={booking.status} /></Link>)}{!events.length && <p className="py-16 text-center text-sm text-stone-500">No pending or confirmed events this month.</p>}</div></div>;
}
