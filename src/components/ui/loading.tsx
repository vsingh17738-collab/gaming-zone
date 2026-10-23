export function LoadingScreen({ label = "Preparing your celebration" }: { label?: string }) {
  return <div className="grid min-h-[50vh] place-items-center"><div className="text-center"><div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-gold/25 border-t-wine" /><p className="mt-4 text-xs font-semibold uppercase tracking-[.18em] text-stone-500">{label}</p></div></div>;
}
