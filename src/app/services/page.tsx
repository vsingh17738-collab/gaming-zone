import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/ui/page-hero";
import { ServiceCard } from "@/components/public/service-card";
import { BookingCta } from "@/components/public/booking-cta";
import { getPublicServices } from "@/lib/data";
import { formatINR } from "@/lib/money";

export const metadata: Metadata = { title: "Services", description: "Tent arrangements, wedding decoration, event setup and water supply in Pithampur." };
export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const services = await getPublicServices();
  return <><PageHero eyebrow="Our services" title="The foundation of a beautiful event." copy="Choose individual services or bring everything together in one coordinated setup. Every selection is itemised in your quotation." />
    <section className="container-shell py-20 sm:py-28">{services.length ? <div className="grid gap-7 md:grid-cols-2">{services.map((service, index) => <div key={service.id}><ServiceCard service={service} index={index} /><div className="mt-4 flex items-center justify-between px-2 text-xs text-stone-500"><span>Additional service rate / {service.unitLabel}</span><span className="font-display text-xl text-wine">{formatINR(service.priceInPaise)}</span></div></div>)}</div> : <div className="card py-20 text-center"><h2 className="font-display text-4xl text-wine-dark">Services are being updated.</h2><p className="mt-3 text-sm text-stone-600">Please check back soon or contact the business.</p></div>}
      <div className="mt-14 rounded-2xl border border-gold/30 bg-sand/50 p-6 text-center sm:p-8"><p className="font-display text-2xl text-wine-dark">Need a different combination?</p><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-stone-600">Select your package and additional services in the booking planner. Your final quotation uses the latest active rates.</p><Link href="/book" className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-wine">Build your quotation <ArrowUpRight size={15} /></Link></div>
    </section><BookingCta /></>;
}
