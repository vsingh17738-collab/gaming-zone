import Image from "next/image";
import { Droplets, Sparkles, TentTree, Workflow } from "lucide-react";
import type { Service } from "@/db/schema";

function ServiceIcon({ category }: { category: string }) {
  const value = category.toLowerCase();
  if (value.includes("water")) return <Droplets size={26} />;
  if (value.includes("decor")) return <Sparkles size={26} />;
  if (value.includes("tent")) return <TentTree size={26} />;
  return <Workflow size={26} />;
}

export function ServiceCard({ service, index = 0 }: { service: Service; index?: number }) {
  return (
    <article className="card group overflow-hidden">
      <div className="relative h-56 bg-wine-dark">
        {service.imageUrl ? <Image src={service.imageUrl} alt={service.name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover transition duration-700 group-hover:scale-105" /> : <div className="grid h-full place-items-center bg-gradient-to-br from-wine-dark to-wine text-gold-light"><Droplets size={64} strokeWidth={1} /></div>}
        <span className="absolute bottom-4 left-4 grid h-12 w-12 place-items-center rounded-full bg-cream text-wine shadow-lg"><ServiceIcon category={service.category} /></span>
        <span className="absolute right-5 top-4 font-display text-4xl text-white/70">0{index + 1}</span>
      </div>
      <div className="p-6 sm:p-7"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-gold">{service.category}</p><h3 className="mt-2 font-display text-3xl font-semibold text-wine-dark">{service.name}</h3><p className="mt-3 text-sm leading-7 text-stone-600">{service.description}</p></div>
    </article>
  );
}
