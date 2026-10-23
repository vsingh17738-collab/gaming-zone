import type { Metadata } from "next";
import { PageHero } from "@/components/ui/page-hero";
import { GalleryGrid } from "@/components/public/gallery-grid";
import { BookingCta } from "@/components/public/booking-cta";
import { getPublicGallery } from "@/lib/data";

export const metadata: Metadata = { title: "Gallery & Inspiration", description: "Wedding, tent and event decoration inspiration from Shri Shaam Tent House." };
export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const items = await getPublicGallery();
  const isInspiration = items.some((item) => item.id.startsWith("inspiration-"));
  return <><PageHero eyebrow="Gallery" title="A glimpse of what your venue can become." copy="Explore elegant tent, wedding and reception styling. Business-uploaded event photographs appear here as the portfolio grows." />
    <section className="container-shell py-20 sm:py-28">{isInspiration && <div className="mb-8 rounded-xl border border-gold/30 bg-sand/50 px-5 py-4 text-xs leading-6 text-stone-600"><strong className="text-wine">Design inspiration:</strong> these illustrative images show styling possibilities and are not presented as photographs of past Shri Shaam events. The admin can publish verified business event photos at any time.</div>}<GalleryGrid items={items} /></section><BookingCta title="Inspired? Let’s create a setting around your vision." /></>;
}
