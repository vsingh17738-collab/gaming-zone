import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import type { Package } from "@/db/schema";
import { formatINR } from "@/lib/money";

export function PackageCard({ item }: { item: Package }) {
  return (
    <article className={`card group relative flex h-full flex-col overflow-hidden ${item.isFeatured ? "border-gold/70" : ""}`}>
      {item.isFeatured && <span className="absolute left-5 top-5 z-10 rounded-full bg-wine px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.16em] text-white">Most comprehensive</span>}
      <div className="image-shine relative h-64 overflow-hidden bg-sand">
        {item.imageUrl && <Image src={item.imageUrl} alt={item.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-700 group-hover:scale-105" />}
      </div>
      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-gold">Starting from</p>
        <div className="mt-2 flex items-end justify-between gap-3"><h3 className="font-display text-3xl font-semibold text-wine-dark">{item.name}</h3><p className="whitespace-nowrap font-display text-2xl text-wine">{formatINR(item.priceInPaise)}</p></div>
        <p className="mt-3 text-sm leading-6 text-stone-600">{item.description}</p>
        <ul className="mt-5 flex-1 space-y-2.5">{item.inclusions.map((inclusion) => <li key={inclusion} className="flex gap-2.5 text-xs leading-5 text-stone-600"><Check size={15} className="mt-0.5 shrink-0 text-gold" />{inclusion}</li>)}</ul>
        <Link href={`/book?package=${item.id}`} className="mt-7 inline-flex items-center justify-between border-t border-stone-200 pt-5 text-xs font-bold uppercase tracking-[.13em] text-wine hover:text-gold">Personalise this package <ArrowUpRight size={16} /></Link>
      </div>
    </article>
  );
}
