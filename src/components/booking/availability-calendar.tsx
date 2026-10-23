"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, LoaderCircle } from "lucide-react";
import { fetchJson } from "@/lib/client";
import { todayInIndia } from "@/lib/dates";
import type { AvailabilityLabel } from "@/lib/availability";

type DayStatus = { label: AvailabilityLabel; availableSlots: string[]; requestedAvailable?: boolean };
type AvailabilityResponse = { month: string; dates: Record<string, DayStatus> };

export function AvailabilityCalendar({ value, slot, onChange, configured }: { value: string; slot: "morning" | "evening" | "full_day"; onChange: (date: string) => void; configured: boolean }) {
  const [month, setMonth] = useState((value || todayInIndia()).slice(0, 7));
  const [data, setData] = useState<AvailabilityResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!configured) { setError("Live availability is NOT CONFIGURED until the Neon database is connected."); return; }
    setLoading(true); setError("");
    try { setData(await fetchJson<AvailabilityResponse>(`/api/availability?month=${month}&slot=${slot}`)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Availability could not be loaded"); }
    finally { setLoading(false); }
  }, [configured, month, slot]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const cells = useMemo(() => {
    const [year, monthNumber] = month.split("-").map(Number);
    const first = new Date(Date.UTC(year ?? 2026, (monthNumber ?? 1) - 1, 1));
    const days = new Date(Date.UTC(year ?? 2026, monthNumber ?? 1, 0)).getUTCDate();
    return [...Array.from({ length: first.getUTCDay() }, () => ""), ...Array.from({ length: days }, (_, index) => `${month}-${String(index + 1).padStart(2, "0")}`)];
  }, [month]);

  function move(offset: number) {
    const date = new Date(`${month}-01T00:00:00Z`);
    date.setUTCMonth(date.getUTCMonth() + offset);
    setMonth(date.toISOString().slice(0, 7));
  }

  const monthLabel = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${month}-01T00:00:00Z`));
  return <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
    <div className="flex items-center justify-between"><button type="button" onClick={() => move(-1)} className="grid h-9 w-9 place-items-center rounded-full border border-stone-200 hover:border-gold" aria-label="Previous month"><ChevronLeft size={17} /></button><p className="font-display text-2xl font-semibold text-wine-dark">{monthLabel}</p><button type="button" onClick={() => move(1)} className="grid h-9 w-9 place-items-center rounded-full border border-stone-200 hover:border-gold" aria-label="Next month"><ChevronRight size={17} /></button></div>
    <div className="mt-5 grid grid-cols-7 gap-1 text-center text-[9px] font-bold uppercase tracking-wider text-stone-400">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day} className="pb-2">{day}</span>)}</div>
    <div className="grid grid-cols-7 gap-1">{cells.map((date, index) => {
      if (!date) return <span key={`empty-${index}`} />;
      const status = data?.dates[date];
      const disabled = !configured || date < todayInIndia() || status?.label === "BOOKED" || status?.requestedAvailable === false;
      return <button key={date} type="button" disabled={disabled} onClick={() => onChange(date)} className={`relative aspect-square rounded-lg text-xs font-semibold transition ${value === date ? "bg-wine text-white" : status?.label === "BOOKED" ? "bg-red-50 text-red-300" : status?.label === "PARTIAL" ? "bg-amber-50 text-amber-800 hover:bg-amber-100" : "text-stone-700 hover:bg-sand"} disabled:cursor-not-allowed disabled:opacity-45`} title={status ? `${status.label}${status.requestedAvailable === false ? " for selected slot" : ""}` : "Availability loading"}>{Number(date.slice(-2))}{status && <span className={`absolute bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${status.label === "AVAILABLE" ? "bg-emerald-500" : status.label === "PARTIAL" ? "bg-amber-500" : "bg-red-400"}`} />}</button>;
    })}</div>
    {loading && <p className="mt-4 flex items-center justify-center gap-2 text-xs text-stone-500"><LoaderCircle size={14} className="animate-spin" /> Checking live availability</p>}
    {error && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800">{error}</p>}
    <div className="mt-4 flex flex-wrap justify-center gap-4 border-t border-stone-100 pt-4 text-[9px] font-bold uppercase tracking-wider text-stone-500"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-emerald-500" /> Available</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-amber-500" /> Partial</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-red-400" /> Booked</span></div>
  </div>;
}
