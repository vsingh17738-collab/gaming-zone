"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Droplets, LoaderCircle, LockKeyhole, Sparkles } from "lucide-react";
import type { BusinessSettings, Package, SafeUser, Service } from "@/db/schema";
import { addDays, todayInIndia } from "@/lib/dates";
import { formatINR } from "@/lib/money";
import { fetchJson } from "@/lib/client";
import { AvailabilityCalendar } from "./availability-calendar";

type Slot = "morning" | "evening" | "full_day";
type FormState = {
  eventType: string; eventDate: string; eventTime: string; timeSlot: Slot; location: string; guestCount: number;
  packageId: string; waterSupply: boolean; decorationRequirements: string; additionalNotes: string;
};
type Quote = {
  packageName: string; packagePriceInPaise: number; items: { serviceId: string; serviceName: string; quantity: number; unitPriceInPaise: number; totalInPaise: number }[];
  subtotalInPaise: number; taxInPaise: number; totalInPaise: number; advanceInPaise: number; balanceInPaise: number;
  advancePercent: number; validUntil: string; terms: string;
};

const steps = ["Event details", "Package & extras", "Review & request"];

export function BookingWizard({ packages, services, settings, user, databaseConfigured, initialPackageId }: { packages: Package[]; services: Service[]; settings: BusinessSettings; user: SafeUser | null; databaseConfigured: boolean; initialPackageId?: string }) {
  const router = useRouter();
  const initialPackage = packages.some((item) => item.id === initialPackageId) ? initialPackageId! : packages.find((item) => item.isFeatured)?.id ?? packages[0]?.id ?? "";
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>({ eventType: "Wedding", eventDate: addDays(todayInIndia(), 1), eventTime: "18:00", timeSlot: "evening", location: "", guestCount: 100, packageId: initialPackage, waterSupply: false, decorationRequirements: "", additionalNotes: "" });
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = sessionStorage.getItem("ssth-booking-draft");
        if (saved) {
          const parsed = JSON.parse(saved) as { form?: Partial<FormState>; quantities?: Record<string, number> };
          if (parsed.form) setForm((current) => ({ ...current, ...parsed.form }));
          if (parsed.quantities) setQuantities(parsed.quantities);
        }
      } catch { /* ignore an invalid local draft */ }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (hydrated) sessionStorage.setItem("ssth-booking-draft", JSON.stringify({ form, quantities }));
  }, [form, quantities, hydrated]);

  const selectedPackage = packages.find((item) => item.id === form.packageId);
  const serviceItems = useMemo(() => Object.entries(quantities).filter(([, quantity]) => quantity > 0).map(([serviceId, quantity]) => ({ serviceId, quantity })), [quantities]);
  const additionalServices = services.filter((service) => !service.category.toLowerCase().includes("water"));

  function update<K extends keyof FormState>(key: K, value: FormState[K]) { setForm((current) => ({ ...current, [key]: value })); setQuote(null); }
  function next() {
    if (step === 1 && (!form.eventDate || !form.eventTime || form.location.trim().length < 5 || form.guestCount < 1)) { setError("Complete the event date, time, venue and guest count to continue."); return; }
    if (step === 2 && !form.packageId) { setError("Choose a package to continue."); return; }
    setError(""); setStep((current) => Math.min(3, current + 1));
    if (step === 2) void loadQuote();
  }

  async function loadQuote() {
    if (!databaseConfigured) { setError("Server quotations are NOT CONFIGURED until the database is connected."); return; }
    setLoading(true); setError("");
    try { setQuote(await fetchJson<Quote>("/api/quote-preview", { method: "POST", body: JSON.stringify({ packageId: form.packageId, serviceItems, waterSupply: form.waterSupply }) })); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Quotation could not be calculated"); }
    finally { setLoading(false); }
  }

  async function submit() {
    if (!user) { setError("Please log in or create an account before sending your booking request. Your draft is saved in this tab."); return; }
    setLoading(true); setError("");
    try {
      const result = await fetchJson<{ id: string }>("/api/bookings", { method: "POST", body: JSON.stringify({ ...form, serviceItems }) });
      sessionStorage.removeItem("ssth-booking-draft");
      router.push(`/account/bookings/${result.id}?created=1`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Your booking request could not be submitted"); setLoading(false); }
  }

  return <div className="mx-auto max-w-6xl">
    <div className="grid grid-cols-3 gap-2">{steps.map((label, index) => <button key={label} type="button" onClick={() => { if (index + 1 < step) { setStep(index + 1); setError(""); } }} className={`border-t-2 pt-4 text-left ${step >= index + 1 ? "border-wine" : "border-stone-200"}`}><span className={`text-[10px] font-bold uppercase tracking-wider ${step >= index + 1 ? "text-wine" : "text-stone-400"}`}>0{index + 1}</span><span className={`mt-1 hidden text-xs font-semibold sm:block ${step >= index + 1 ? "text-stone-800" : "text-stone-400"}`}>{label}</span></button>)}</div>
    <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1.45fr_.75fr]">
      <div className="card p-5 sm:p-8">
        {step === 1 && <div className="animate-fade-up"><span className="eyebrow">Tell us about the occasion</span><h2 className="mt-3 font-display text-4xl text-wine-dark">When and where?</h2>
          <div className="mt-7 grid gap-5 sm:grid-cols-2"><div><label className="label" htmlFor="eventType">Event type</label><select id="eventType" className="field" value={form.eventType} onChange={(event) => update("eventType", event.target.value)}>{["Wedding", "Reception", "Engagement", "Birthday", "Anniversary", "Corporate event", "Other celebration"].map((type) => <option key={type}>{type}</option>)}</select></div><div><label className="label" htmlFor="guestCount">Expected guests</label><input id="guestCount" className="field" type="number" min={1} max={10000} value={form.guestCount} onChange={(event) => update("guestCount", Number(event.target.value))} /></div></div>
          <div className="mt-5"><label className="label">Preferred time slot</label><div className="grid grid-cols-3 gap-2">{(["morning", "evening", "full_day"] as Slot[]).map((slot) => <button key={slot} type="button" onClick={() => update("timeSlot", slot)} className={`rounded-xl border px-2 py-3 text-xs font-semibold capitalize transition ${form.timeSlot === slot ? "border-wine bg-wine text-white" : "border-stone-200 hover:border-gold"}`}>{slot.replace("_", " ")}</button>)}</div></div>
          <div className="mt-6"><label className="label">Choose an available date</label><AvailabilityCalendar value={form.eventDate} slot={form.timeSlot} onChange={(date) => update("eventDate", date)} configured={databaseConfigured} /></div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2"><div><label className="label" htmlFor="eventDate">Selected date</label><input id="eventDate" className="field" type="date" min={todayInIndia()} value={form.eventDate} onChange={(event) => update("eventDate", event.target.value)} /></div><div><label className="label" htmlFor="eventTime">Event start time</label><input id="eventTime" className="field" type="time" value={form.eventTime} onChange={(event) => update("eventTime", event.target.value)} /></div></div>
          <div className="mt-5"><label className="label" htmlFor="location">Venue / event address</label><textarea id="location" className="field min-h-24 resize-y" placeholder="Venue name, street, city" value={form.location} onChange={(event) => update("location", event.target.value)} /></div>
        </div>}
        {step === 2 && <div className="animate-fade-up"><span className="eyebrow">Make it yours</span><h2 className="mt-3 font-display text-4xl text-wine-dark">Choose your setting.</h2>
          <div className="mt-7 grid gap-3">{packages.map((item) => <button key={item.id} type="button" onClick={() => update("packageId", item.id)} className={`rounded-2xl border p-5 text-left transition ${form.packageId === item.id ? "border-wine bg-wine-light/60" : "border-stone-200 hover:border-gold"}`}><div className="flex items-start justify-between gap-4"><div><p className="font-display text-2xl font-semibold text-wine-dark">{item.name}</p><p className="mt-1 text-xs leading-5 text-stone-500">{item.description}</p></div><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${form.packageId === item.id ? "border-wine bg-wine text-white" : "border-stone-300"}`}>{form.packageId === item.id && <Check size={14} />}</span></div><p className="mt-3 text-sm font-semibold text-wine">From {formatINR(item.priceInPaise)}</p></button>)}</div>
          <h3 className="mt-8 font-display text-2xl text-wine-dark">Additional services</h3><div className="mt-4 space-y-3">{additionalServices.map((service) => <div key={service.id} className={`flex items-center gap-4 rounded-xl border p-4 ${quantities[service.id] ? "border-gold bg-sand/30" : "border-stone-200"}`}><button type="button" aria-label={`Toggle ${service.name}`} onClick={() => setQuantities((current) => ({ ...current, [service.id]: current[service.id] ? 0 : 1 }))} className={`grid h-6 w-6 shrink-0 place-items-center rounded border ${quantities[service.id] ? "border-wine bg-wine text-white" : "border-stone-300"}`}>{Boolean(quantities[service.id]) && <Check size={14} />}</button><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-stone-800">{service.name}</p><p className="text-xs text-stone-500">{formatINR(service.priceInPaise)} / {service.unitLabel}</p></div>{Boolean(quantities[service.id]) && <input aria-label={`${service.name} quantity`} type="number" min={1} max={100} className="admin-field !w-20" value={quantities[service.id]} onChange={(event) => setQuantities((current) => ({ ...current, [service.id]: Math.max(1, Number(event.target.value)) }))} />}</div>)}</div>
          <button type="button" onClick={() => update("waterSupply", !form.waterSupply)} className={`mt-4 flex w-full items-center gap-4 rounded-xl border p-4 text-left ${form.waterSupply ? "border-gold bg-sand/30" : "border-stone-200"}`}><span className={`grid h-11 w-11 place-items-center rounded-full ${form.waterSupply ? "bg-wine text-white" : "bg-sand text-wine"}`}><Droplets size={20} /></span><span className="flex-1"><span className="block text-sm font-semibold">Include event water supply</span><span className="mt-1 block text-xs text-stone-500">Planned around your guest count and venue</span></span><span className={`relative h-6 w-11 rounded-full transition ${form.waterSupply ? "bg-wine" : "bg-stone-300"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${form.waterSupply ? "left-6" : "left-1"}`} /></span></button>
          <div className="mt-5"><label className="label" htmlFor="decor">Decoration requirements</label><textarea id="decor" className="field min-h-24" placeholder="Colours, stage preferences, floral or lighting ideas…" value={form.decorationRequirements} onChange={(event) => update("decorationRequirements", event.target.value)} /></div>
          <div className="mt-5"><label className="label" htmlFor="notes">Additional notes <span className="font-normal normal-case tracking-normal">(optional)</span></label><textarea id="notes" className="field min-h-20" value={form.additionalNotes} onChange={(event) => update("additionalNotes", event.target.value)} /></div>
        </div>}
        {step === 3 && <div className="animate-fade-up"><span className="eyebrow">Clear before you commit</span><h2 className="mt-3 font-display text-4xl text-wine-dark">Review your quotation.</h2>
          {loading && <div className="grid min-h-64 place-items-center"><LoaderCircle className="animate-spin text-wine" size={30} /></div>}
          {!loading && quote && <div className="mt-7"><div className="rounded-2xl bg-sand/60 p-5"><div className="flex justify-between gap-4 text-sm"><span className="font-semibold">{quote.packageName}</span><span>{formatINR(quote.packagePriceInPaise)}</span></div>{quote.items.map((item) => <div key={item.serviceId} className="mt-3 flex justify-between gap-4 border-t border-stone-200/70 pt-3 text-xs text-stone-600"><span>{item.serviceName} × {item.quantity}</span><span>{formatINR(item.totalInPaise)}</span></div>)}</div><dl className="mt-6 space-y-3 text-sm"><div className="flex justify-between text-stone-600"><dt>Subtotal</dt><dd>{formatINR(quote.subtotalInPaise)}</dd></div><div className="flex justify-between text-stone-600"><dt>Tax</dt><dd>{formatINR(quote.taxInPaise)}</dd></div><div className="flex justify-between border-t border-stone-200 pt-4 text-lg font-bold text-wine-dark"><dt>Total</dt><dd>{formatINR(quote.totalInPaise)}</dd></div><div className="flex justify-between rounded-xl bg-wine-light p-4 font-semibold text-wine"><dt>{quote.advancePercent}% advance</dt><dd>{formatINR(quote.advanceInPaise)}</dd></div><div className="flex justify-between text-stone-600"><dt>Remaining after advance</dt><dd>{formatINR(quote.balanceInPaise)}</dd></div></dl><p className="mt-5 text-xs leading-5 text-stone-500">Quotation valid until {quote.validUntil}. Availability is checked again during submission. Sending a request does not mark it confirmed or paid.</p></div>}
          {!loading && !quote && <button type="button" onClick={loadQuote} className="button-secondary mt-6">Calculate server quotation</button>}
          {!user && <div className="mt-6 rounded-xl border border-gold/40 bg-sand/50 p-5"><p className="flex items-center gap-2 text-sm font-semibold text-wine-dark"><LockKeyhole size={17} /> One last step: your customer account</p><p className="mt-2 text-xs leading-5 text-stone-600">Log in or register to save this request and access your documents. This tab will keep your draft.</p><div className="mt-4 flex gap-3"><Link href="/login?next=/book" className="button-primary !min-h-10 !py-2 !text-xs">Log in</Link><Link href="/register?next=/book" className="button-secondary !min-h-10 !py-2 !text-xs">Register</Link></div></div>}
        </div>}
        {error && <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">{error}</div>}
        <div className="mt-8 flex items-center justify-between border-t border-stone-200 pt-6">{step > 1 ? <button type="button" onClick={() => { setStep(step - 1); setError(""); }} className="button-secondary"><ArrowLeft size={16} /> Back</button> : <span />}{step < 3 ? <button type="button" onClick={next} className="button-primary">Continue <ArrowRight size={16} /></button> : <button type="button" onClick={submit} disabled={loading || !quote || !databaseConfigured} className="button-primary">{loading ? <LoaderCircle size={17} className="animate-spin" /> : <CheckCircle2 size={17} />} Send booking request</button>}</div>
      </div>
      <aside className="card sticky top-5 bg-wine-dark p-6 text-white sm:p-7"><Sparkles className="text-gold-light" size={25} /><h3 className="mt-4 font-display text-3xl">Your event at a glance</h3><dl className="mt-6 space-y-4 text-xs"><div className="flex justify-between gap-4 border-b border-white/10 pb-4"><dt className="text-stone-400">Occasion</dt><dd className="text-right">{form.eventType}</dd></div><div className="flex justify-between gap-4 border-b border-white/10 pb-4"><dt className="text-stone-400">Date</dt><dd>{form.eventDate}</dd></div><div className="flex justify-between gap-4 border-b border-white/10 pb-4"><dt className="text-stone-400">Slot</dt><dd className="capitalize">{form.timeSlot.replace("_", " ")}</dd></div><div className="flex justify-between gap-4 border-b border-white/10 pb-4"><dt className="text-stone-400">Guests</dt><dd>{form.guestCount}</dd></div><div className="flex justify-between gap-4"><dt className="text-stone-400">Package</dt><dd className="text-right">{selectedPackage?.name ?? "Not selected"}</dd></div></dl><div className="mt-7 rounded-xl bg-white/5 p-4 text-xs leading-6 text-stone-300"><strong className="text-gold-light">{settings.advancePercent}% advance.</strong><br />Payment opens after booking confirmation and quotation acceptance. QR uploads are reviewed manually.</div></aside>
    </div>
  </div>;
}
