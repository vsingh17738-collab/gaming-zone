import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Clock3, Mail, MapPin, MessageCircle, Phone, UserRound } from "lucide-react";
import { InstagramIcon } from "@/components/ui/instagram-icon";
import { PageHero } from "@/components/ui/page-hero";
import { getBusinessSettings } from "@/lib/data";
import { whatsappLink } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Contact", description: "Contact Shri Shaam Tent House in Pithampur for weddings and events." };
export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const settings = await getBusinessSettings();
  const whatsapp = whatsappLink(settings.whatsappNumber, "Hello Shri Shaam Tent House, I have an event enquiry.");
  const mapEmbed = `https://www.google.com/maps?q=${encodeURIComponent(settings.address)}&output=embed`;
  return <><PageHero eyebrow="Contact us" title="Let’s talk about your celebration." copy="For the clearest quotation, use our online event planner. For a direct conversation, use any verified contact channel configured by the business below." />
    <section className="container-shell grid gap-10 py-20 sm:py-24 lg:grid-cols-[.85fr_1.15fr] lg:gap-16">
      <div><span className="eyebrow">Business details</span><h2 className="mt-4 font-display text-4xl text-wine-dark sm:text-5xl">We’re here in Pithampur.</h2><div className="mt-8 space-y-5">
        <div className="flex gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-wine-light text-wine"><MapPin size={19} /></span><div><p className="text-xs font-bold uppercase tracking-wider text-stone-500">Address</p><p className="mt-1 text-sm leading-6 text-stone-700">{settings.address}</p>{settings.mapUrl && <a href={settings.mapUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-wine">Get directions <ArrowUpRight size={13} /></a>}</div></div>
        <div className="flex gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-wine-light text-wine"><UserRound size={19} /></span><div><p className="text-xs font-bold uppercase tracking-wider text-stone-500">Contact person</p><p className="mt-1 text-sm text-stone-700">{settings.contactPerson}</p></div></div>
        {settings.phone ? <a href={`tel:${settings.phone}`} className="flex gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-wine-light text-wine"><Phone size={19} /></span><div><p className="text-xs font-bold uppercase tracking-wider text-stone-500">Phone</p><p className="mt-1 text-sm text-stone-700">{settings.phone}</p></div></a> : <div className="rounded-xl bg-sand/60 p-4 text-xs leading-5 text-stone-600">The verified business phone number has not been published yet. Please use the booking planner or Instagram.</div>}
        {settings.email && <a href={`mailto:${settings.email}`} className="flex gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-wine-light text-wine"><Mail size={19} /></span><div><p className="text-xs font-bold uppercase tracking-wider text-stone-500">Email</p><p className="mt-1 text-sm text-stone-700">{settings.email}</p></div></a>}
        {settings.instagramUrl && <a href={settings.instagramUrl} target="_blank" rel="noreferrer" className="flex gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-wine-light text-wine"><InstagramIcon size={19} /></span><div><p className="text-xs font-bold uppercase tracking-wider text-stone-500">Instagram</p><p className="mt-1 text-sm text-wine">@shree._.shyam._.tent._.house</p></div></a>}
        <div className="flex gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-wine-light text-wine"><Clock3 size={19} /></span><div><p className="text-xs font-bold uppercase tracking-wider text-stone-500">Service area</p><p className="mt-1 text-sm text-stone-700">{settings.serviceArea}</p></div></div>
      </div><div className="mt-8 flex flex-wrap gap-3">{whatsapp && <a href={whatsapp} target="_blank" rel="noreferrer" className="button-primary"><MessageCircle size={16} /> WhatsApp</a>}<Link href="/book" className="button-secondary">Plan your event <ArrowUpRight size={15} /></Link></div></div>
      <div className="min-h-[480px] overflow-hidden rounded-3xl border border-stone-200 bg-sand shadow-card"><iframe src={mapEmbed} title="Map showing Shri Shaam Tent House location in Pithampur" className="h-full min-h-[480px] w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen /></div>
    </section></>;
}
