import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function BookingCta({ title = "Your celebration deserves a setting of its own.", copy = "Tell us your date, venue and vision. We’ll prepare a clear, personalised quotation for your event." }: { title?: string; copy?: string }) {
  return <section className="container-shell py-20 sm:py-24"><div className="relative overflow-hidden rounded-[2rem] bg-wine-dark px-7 py-14 text-center text-white sm:px-12 sm:py-20"><div className="absolute -left-20 -top-24 h-72 w-72 rounded-full border border-gold/20" /><div className="absolute -bottom-32 -right-20 h-96 w-96 rounded-full border border-gold/20" /><div className="relative mx-auto max-w-3xl"><span className="text-[10px] font-bold uppercase tracking-[.22em] text-gold-light">Let’s plan something beautiful</span><h2 className="mt-4 font-display text-4xl font-medium leading-tight sm:text-6xl">{title}</h2><p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-stone-300">{copy}</p><Link href="/book" className="button-light mt-8">Check your event date <ArrowRight size={16} /></Link></div></div></section>;
}
