import Image from "next/image";
import type { GalleryItem } from "@/db/schema";

export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  if (!items.length) return <div className="card py-20 text-center"><h3 className="font-display text-3xl text-wine-dark">Our portfolio is being curated.</h3><p className="mt-3 text-sm text-stone-600">Real event photographs uploaded by the business will appear here.</p></div>;
  return <div className="grid auto-rows-[250px] gap-4 sm:grid-cols-2 lg:grid-cols-4">{items.map((item, index) => <figure key={item.id} className={`image-shine group relative overflow-hidden rounded-2xl bg-sand ${index % 5 === 0 ? "sm:col-span-2 sm:row-span-2" : ""}`}><Image src={item.imageUrl} alt={item.altText} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover transition duration-700 group-hover:scale-105" /><figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-5 pb-5 pt-16 text-white"><span className="text-[9px] font-bold uppercase tracking-[.18em] text-gold-light">{item.category}</span><p className="mt-1 font-display text-2xl">{item.title}</p></figcaption></figure>)}</div>;
}
