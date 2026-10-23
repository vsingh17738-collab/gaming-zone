import type { Metadata } from "next";
import Image from "next/image";
import { HeartHandshake, Layers3, MapPinned } from "lucide-react";
import { PageHero } from "@/components/ui/page-hero";
import { SectionHeading } from "@/components/ui/section-heading";
import { BookingCta } from "@/components/public/booking-cta";
import { getBusinessSettings } from "@/lib/data";

export const metadata: Metadata = { title: "About Us", description: "Meet Shri Shaam Tent House, serving celebrations in Pithampur and nearby areas." };
export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const settings = await getBusinessSettings();
  return <><PageHero eyebrow="Our business" title="Celebrations feel better when every detail belongs." copy={`${settings.businessName} provides tent arrangements, wedding and event decoration, water supply and event setup across ${settings.serviceArea}.`} />
    <section className="container-shell grid items-center gap-12 py-20 sm:py-28 lg:grid-cols-2 lg:gap-20">
      <div><SectionHeading eyebrow="Rooted in Pithampur" title="A local team for your most meaningful gatherings." copy={`Led by contact person ${settings.contactPerson}, ${settings.businessName} works with families and event hosts to shape practical, beautiful venues.`} /><p className="section-copy mt-4">Every event begins with its location, guest count and purpose. Our booking experience keeps those details together, from your initial request through quotation, payment records and event completion.</p><p className="section-copy mt-4">Visit us at {settings.address}, or begin online by checking your event date.</p></div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl"><Image src="/images/reception-decor.jpg" alt="Warm reception decor and table arrangements" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" /></div>
    </section>
    <section className="bg-sand/50 py-20"><div className="container-shell"><SectionHeading eyebrow="How we work" title="Care in every layer." align="center" /><div className="mt-12 grid gap-6 md:grid-cols-3">{[
      { icon: HeartHandshake, title: "Personal attention", copy: "Your requirements stay at the centre of the plan, from decoration notes to water supply and guest comfort." },
      { icon: Layers3, title: "Coordinated setup", copy: "Tent, stage, seating, lighting and event essentials come together through one organised workflow." },
      { icon: MapPinned, title: "Local understanding", copy: "A Pithampur-based service area makes venue planning and on-ground coordination more direct." },
    ].map((item) => <article key={item.title} className="card p-8"><item.icon className="text-gold" size={30} strokeWidth={1.5} /><h3 className="mt-5 font-display text-3xl text-wine-dark">{item.title}</h3><p className="mt-3 text-sm leading-7 text-stone-600">{item.copy}</p></article>)}</div></div></section>
    <BookingCta title="Let’s make your venue feel like your celebration." />
  </>;
}
