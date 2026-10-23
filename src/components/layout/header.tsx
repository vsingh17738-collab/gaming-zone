"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight, Menu, UserRound, X } from "lucide-react";
import { InstagramIcon } from "@/components/ui/instagram-icon";
import { Logo } from "@/components/ui/logo";
import type { BusinessSettings, SafeUser } from "@/db/schema";

const links = [
  ["Home", "/"], ["Services", "/services"], ["Packages", "/packages"], ["Gallery", "/gallery"], ["About", "/about"], ["Contact", "/contact"],
] as const;

export function Header({ settings, user }: { settings: BusinessSettings; user: SafeUser | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <header className="relative z-50 bg-cream">
      <div className="bg-wine-dark text-stone-200">
        <div className="container-shell flex h-9 items-center justify-between text-[10px] font-medium tracking-wide">
          <p className="truncate">Serving {settings.serviceArea}</p>
          <div className="flex items-center gap-5">
            {settings.phone && <a href={`tel:${settings.phone}`} className="hidden hover:text-white sm:block">Call {settings.phone}</a>}
            {settings.instagramUrl && <a href={settings.instagramUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-white"><InstagramIcon size={12} /> Instagram</a>}
          </div>
        </div>
      </div>
      <div className="border-b border-stone-200/80 bg-cream/95 backdrop-blur-xl">
        <div className="container-shell flex h-[78px] items-center justify-between gap-5">
          <Logo imageUrl={settings.logoUrl} />
          <nav className="hidden items-center gap-6 lg:flex xl:gap-8" aria-label="Main navigation">
            {links.map(([label, href]) => <Link key={href} href={href} className={`relative py-3 text-xs font-semibold transition hover:text-wine ${pathname === href ? "text-wine after:absolute after:inset-x-0 after:bottom-0 after:mx-auto after:h-px after:w-5 after:bg-gold" : "text-stone-600"}`}>{label}</Link>)}
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            {user ? <Link href={user.role === "admin" ? "/admin" : "/account"} className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-wine"><UserRound size={16} /> {user.role === "admin" ? "Dashboard" : "My account"}</Link> : <Link href="/login" className="text-xs font-semibold text-stone-600 hover:text-wine">Log in</Link>}
            <Link href="/book" className="button-primary !min-h-10 !px-5 !py-2 !text-xs">Plan your event <ArrowUpRight size={15} /></Link>
          </div>
          <button className="grid h-11 w-11 place-items-center rounded-full border border-stone-300 text-wine lg:hidden" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Toggle navigation">{open ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
        {open && <div className="border-t border-stone-200 bg-cream px-5 py-5 lg:hidden">
          <nav className="flex flex-col" aria-label="Mobile navigation">
            {links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)} className={`border-b border-stone-200/70 py-3.5 font-display text-2xl ${pathname === href ? "text-wine" : "text-stone-700"}`}>{label}</Link>)}
          </nav>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {user ? <button onClick={logout} className="button-secondary">Log out</button> : <Link href="/login" className="button-secondary">Log in</Link>}
            <Link href="/book" className="button-primary">Book now</Link>
          </div>
        </div>}
      </div>
    </header>
  );
}
