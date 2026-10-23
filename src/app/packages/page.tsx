import type { Metadata } from "next";
import { PageHero } from "@/components/ui/page-hero";
import { PackageCard } from "@/components/public/package-card";
import { BookingCta } from "@/components/public/booking-cta";
import { getBusinessSettings, getPublicPackages } from "@/lib/data";

export const metadata: Metadata = { title: "Event Packages", description: "Configurable wedding and event packages from Shri Shaam Tent House." };
export const dynamic = "force-dynamic";

export default async function PackagesPage() {
  const [packages, settings] = await Promise.all([getPublicPackages(), getBusinessSettings()]);
  return <><PageHero eyebrow="Event packages" title="Start with a package. Make it yours." copy={`Transparent starting points for celebrations of different sizes. A ${settings.advancePercent}% advance is calculated clearly in every quotation.`} />
    <section className="container-shell py-20 sm:py-28">{packages.length ? <div className="grid gap-6 lg:grid-cols-3">{packages.map((item) => <PackageCard key={item.id} item={item} />)}</div> : <div className="card py-20 text-center"><h2 className="font-display text-4xl text-wine-dark">Packages are being updated.</h2></div>}<p className="mx-auto mt-10 max-w-3xl text-center text-xs leading-6 text-stone-500">Package rates are starting prices managed by the business. Venue conditions, transport outside the service area and additional requirements may change the final quotation. Any change is itemised before acceptance.</p></section><BookingCta /></>;
}
