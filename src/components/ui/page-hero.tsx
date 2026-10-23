import type { ReactNode } from "react";

export function PageHero({ eyebrow, title, copy, children }: { eyebrow: string; title: string; copy: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-wine-dark py-20 text-white sm:py-28">
      <div className="absolute -right-24 -top-32 h-96 w-96 rounded-full border border-gold/20" />
      <div className="absolute -right-10 -top-20 h-72 w-72 rounded-full border border-gold/10" />
      <div className="container-shell relative">
        <span className="eyebrow !text-gold-light">{eyebrow}</span>
        <h1 className="mt-5 max-w-4xl font-display text-5xl font-medium leading-[.98] tracking-tight sm:text-7xl">{title}</h1>
        <p className="mt-6 max-w-2xl text-sm leading-7 text-stone-300 sm:text-base">{copy}</p>
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}
