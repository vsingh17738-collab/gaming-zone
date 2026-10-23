import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, CalendarCheck, ClipboardList, Sparkles } from "lucide-react";
import { getApprovedReviews, getBusinessSettings, getPublicGallery, getPublicPackages, getPublicServices } from "@/lib/data";
import { SectionHeading } from "@/components/ui/section-heading";
import { ServiceCard } from "@/components/public/service-card";
import { PackageCard } from "@/components/public/package-card";
import { GalleryGrid } from "@/components/public/gallery-grid";
import { ReviewsSection } from "@/components/public/reviews-section";
import { BookingCta } from "@/components/public/booking-cta";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, services, packages, gallery, reviews] = await Promise.all([getBusinessSettings(), getPublicServices(), getPublicPackages(), getPublicGallery(), getApprovedReviews()]);
  return (
    <>
      <section className="relative min-h-[760px] overflow-hidden bg-wine-dark text-white lg:min-h-[calc(100vh-117px)]">
        <Image src="/images/hero-wedding.jpg" alt="Elegant draped wedding venue with floral decor and warm lighting" fill priority loading="eager" sizes="100vw" className="animate-slow-zoom object-cover object-[62%_center]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1c1315]/95 via-[#24171a]/70 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />
        <div className="container-shell relative flex min-h-[760px] items-center py-20 lg:min-h-[calc(100vh-117px)]">
          <div className="max-w-3xl animate-fade-up">
            <p className="inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.24em] text-gold-light"><span className="h-px w-10 bg-gold" /> Weddings · Celebrations · Events</p>
            <h1 className="mt-6 font-display text-[4.2rem] font-medium leading-[.87] tracking-[-.035em] sm:text-[6rem] lg:text-[7.6rem]">Beautiful moments.<br /><em className="font-normal text-[#e6cda8]">Beautifully set.</em></h1>
            <p className="mt-7 max-w-xl text-sm leading-7 text-stone-200 sm:text-base">Elegant tents, thoughtful décor and complete event setup—planned around your celebration, your venue and your people.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/book" className="button-light">Plan your celebration <ArrowRight size={17} /></Link>
              <Link href="/gallery" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10">Explore our style <ArrowUpRight size={16} /></Link>
            </div>
            <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/20 pt-6 text-[10px] font-semibold uppercase tracking-[.15em] text-stone-300">
              <span>Pithampur based</span><span>End-to-end setup</span><span>Clear quotations</span>
            </div>
          </div>
        </div>
        <a href="#welcome" aria-label="Scroll to discover" className="absolute bottom-8 right-8 hidden h-12 w-12 place-items-center rounded-full border border-white/30 text-white transition hover:bg-white hover:text-wine lg:grid"><ArrowDown size={17} /></a>
      </section>

      <div className="overflow-hidden border-b border-gold/20 bg-sand py-4">
        <div className="flex w-max animate-marquee whitespace-nowrap">{[0, 1].map((group) => <div key={group} className="flex items-center">{["Tent arrangements", "Wedding decoration", "Event setup", "Water supply", "Personalised celebrations"].map((item) => <span key={`${group}-${item}`} className="flex items-center font-display text-xl italic text-wine-dark"><span className="mx-7 h-1.5 w-1.5 rotate-45 bg-gold" />{item}</span>)}</div>)}</div>
      </div>

      <section id="welcome" className="container-shell grid items-center gap-12 py-20 sm:py-28 lg:grid-cols-2 lg:gap-20">
        <div className="relative mx-auto w-full max-w-xl pb-10 pr-8">
          <div className="relative aspect-[4/5] overflow-hidden rounded-t-[10rem] rounded-b-3xl"><Image src="/images/wedding-stage.jpg" alt="Elegant ivory and blush wedding stage" fill sizes="(max-width: 1024px) 90vw, 45vw" className="object-cover" /></div>
          <div className="absolute bottom-0 right-0 max-w-[230px] rounded-2xl border border-gold/30 bg-cream p-6 shadow-soft"><Sparkles className="text-gold" size={23} /><p className="mt-3 font-display text-2xl leading-7 text-wine-dark">One team.<br />Every detail.</p></div>
        </div>
        <div>
          <SectionHeading eyebrow={`Welcome to ${settings.businessName}`} title="Your vision, thoughtfully brought to life." copy={`From the first drape to the final light, we create welcoming settings for weddings, family functions and special gatherings across ${settings.serviceArea}.`} />
          <p className="section-copy mt-4">Choose a curated package or personalise every detail. You’ll receive a server-calculated quotation with clear advance and balance amounts before confirming your booking.</p>
          <div className="mt-8 grid grid-cols-2 gap-5">
            <div className="border-l border-gold pl-5"><p className="font-display text-3xl text-wine">Tailored</p><p className="mt-1 text-xs leading-5 text-stone-500">Decor that reflects your occasion</p></div>
            <div className="border-l border-gold pl-5"><p className="font-display text-3xl text-wine">Dependable</p><p className="mt-1 text-xs leading-5 text-stone-500">Coordinated setup from start to finish</p></div>
          </div>
          <Link href="/about" className="mt-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.15em] text-wine">Meet Shri Shaam <ArrowUpRight size={16} /></Link>
        </div>
      </section>

      <section className="bg-[#f3ede4] py-20 sm:py-28">
        <div className="container-shell">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"><SectionHeading eyebrow="What we do" title="Everything your venue needs." copy="Practical planning meets refined design, with services that can be booked together or tailored to your requirements." /><Link href="/services" className="button-secondary shrink-0">All services <ArrowUpRight size={15} /></Link></div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">{services.slice(0, 4).map((service, index) => <ServiceCard key={service.id} service={service} index={index} />)}</div>
        </div>
      </section>

      <section className="container-shell py-20 sm:py-28">
        <SectionHeading eyebrow="Curated packages" title="A thoughtful place to begin." copy="Use our packages as a starting point, then add the services your celebration needs. Final pricing is always calculated on the server from current package and service rates." align="center" />
        <div className="mt-12 grid gap-6 lg:grid-cols-3">{packages.map((item) => <PackageCard key={item.id} item={item} />)}</div>
      </section>

      <section className="bg-wine-dark py-20 text-white sm:py-24">
        <div className="container-shell"><SectionHeading eyebrow="Simple by design" title="From your date to your big day." align="center" />
          <div className="mt-12 grid gap-8 md:grid-cols-3">{[
            { icon: CalendarCheck, step: "01", title: "Check your date", copy: "Choose your event slot and see live availability. The database rechecks it when you submit." },
            { icon: ClipboardList, step: "02", title: "Shape your quotation", copy: "Select a package and extras. See itemised pricing, tax and the configured advance clearly." },
            { icon: Sparkles, step: "03", title: "Confirm & celebrate", copy: "Track approval, accept your quotation and manage verified payments from your account." },
          ].map((item) => <div key={item.step} className="relative border-t border-gold/30 pt-7"><span className="absolute right-0 top-5 font-display text-5xl text-white/10">{item.step}</span><item.icon className="text-gold-light" size={27} strokeWidth={1.5} /><h3 className="mt-5 font-display text-3xl">{item.title}</h3><p className="mt-3 max-w-sm text-sm leading-7 text-stone-300">{item.copy}</p></div>)}</div>
        </div>
      </section>

      <section className="container-shell py-20 sm:py-28">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><SectionHeading eyebrow="Design inspiration" title="Settings with a sense of occasion." /><Link href="/gallery" className="button-secondary shrink-0">View gallery <ArrowUpRight size={15} /></Link></div>
        <div className="mt-12"><GalleryGrid items={gallery.slice(0, 5)} /></div>
      </section>
      <ReviewsSection reviews={reviews} />
      <BookingCta />
    </>
  );
}
