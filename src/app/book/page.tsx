import type { Metadata } from "next";
import { PageHero } from "@/components/ui/page-hero";
import { getBookingOptions, integrationStatus } from "@/lib/data";
import { getOptionalUser } from "@/lib/auth";
import { BookingWizard } from "@/components/booking/booking-wizard";

export const metadata: Metadata = { title: "Plan & Book Your Event", description: "Check availability and request a personalised event quotation." };
export const dynamic = "force-dynamic";

export default async function BookPage({ searchParams }: { searchParams: Promise<{ package?: string }> }) {
  const [options, user, params] = await Promise.all([getBookingOptions(), getOptionalUser(), searchParams]);
  return <><PageHero eyebrow="Event planner" title="Your celebration starts with a date." copy="Check availability, tailor your package and receive a clear server-calculated quotation before sending your booking request." /><section className="container-shell py-12 sm:py-20"><BookingWizard packages={options.packages} services={options.services} settings={options.settings} user={user} databaseConfigured={integrationStatus().database} initialPackageId={params.package} /></section></>;
}
