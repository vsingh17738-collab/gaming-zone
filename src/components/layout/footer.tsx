import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { InstagramIcon } from "@/components/ui/instagram-icon";
import { Logo } from "@/components/ui/logo";
import type { BusinessSettings } from "@/db/schema";

export function Footer({ settings }: { settings: BusinessSettings }) {
  return (
    <footer className="bg-[#241d1c] text-stone-300">
      <div className="container-shell grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-4 lg:py-20">
        <div className="lg:col-span-2">
          <Logo light imageUrl={settings.logoUrl} />
          <p className="mt-6 max-w-md text-sm leading-7 text-stone-400">Elegant tent arrangements, thoughtful decoration and dependable event setup for celebrations across {settings.serviceArea}.</p>
          <Link href="/book" className="mt-7 inline-flex items-center gap-2 border-b border-gold pb-1 text-xs font-bold uppercase tracking-[.16em] text-gold-light">Start planning <ArrowUpRight size={15} /></Link>
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-[.18em] text-white">Explore</h3>
          <ul className="mt-5 space-y-3 text-sm text-stone-400">
            {([["Our services", "/services"], ["Event packages", "/packages"], ["Gallery", "/gallery"], ["Our story", "/about"], ["Customer account", "/account"]] as const).map(([label, href]) => <li key={href}><Link href={href} className="transition hover:text-gold-light">{label}</Link></li>)}
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-[.18em] text-white">Find us</h3>
          <p className="mt-5 flex gap-3 text-sm leading-6 text-stone-400"><MapPin className="mt-1 shrink-0 text-gold" size={16} />{settings.address}</p>
          <p className="mt-4 text-sm text-stone-400">Contact person<br /><span className="text-white">{settings.contactPerson}</span></p>
          {settings.phone && <a href={`tel:${settings.phone}`} className="mt-3 block text-sm hover:text-gold-light">{settings.phone}</a>}
          {settings.instagramUrl && <a href={settings.instagramUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm hover:text-gold-light"><InstagramIcon size={15} /> Follow our work</a>}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-shell flex flex-col gap-2 py-5 text-[10px] uppercase tracking-wider text-stone-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {settings.businessName}. All rights reserved.</p>
          <p>Weddings · Celebrations · Events</p>
        </div>
      </div>
    </footer>
  );
}
