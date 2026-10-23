export function SectionHeading({ eyebrow, title, copy, align = "left" }: { eyebrow: string; title: string; copy?: string; align?: "left" | "center" }) {
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-2xl"}>
      <span className={`eyebrow ${align === "center" ? "before:hidden" : ""}`}>{eyebrow}</span>
      <h2 className="mt-4 font-display text-4xl font-medium leading-[1.03] tracking-tight text-wine-dark sm:text-5xl lg:text-6xl">{title}</h2>
      {copy && <p className={`section-copy mt-5 ${align === "center" ? "mx-auto max-w-2xl" : ""}`}>{copy}</p>}
    </div>
  );
}
