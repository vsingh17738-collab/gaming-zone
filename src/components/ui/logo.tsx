import Link from "next/link";
import Image from "next/image";

export function Logo({ light = false, href = "/", imageUrl }: { light?: boolean; href?: string; imageUrl?: string | null }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-3" aria-label="Shri Shaam Tent House home">
      {imageUrl ? <Image src={imageUrl} alt="" width={44} height={44} className="h-11 w-11 rounded-full border border-gold/50 bg-white object-contain p-1" /> : <span className={`grid h-11 w-11 place-items-center rounded-full border font-display text-xl font-semibold transition group-hover:rotate-3 ${light ? "border-gold-light/70 text-gold-light" : "border-gold text-wine"}`}>SS</span>}
      <span className="leading-none">
        <span className={`block font-display text-[23px] font-semibold tracking-wide ${light ? "text-white" : "text-wine-dark"}`}>Shri Shaam</span>
        <span className={`mt-1 block text-[8px] font-bold uppercase tracking-[0.35em] ${light ? "text-stone-300" : "text-stone-500"}`}>Tent House · Pithampur</span>
      </span>
    </Link>
  );
}
