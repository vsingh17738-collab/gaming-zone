"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="container-shell grid min-h-[60vh] place-items-center py-20 text-center"><div><span className="eyebrow">Something went wrong</span><h1 className="mt-4 font-display text-5xl text-wine-dark">Let’s try that once more.</h1><p className="mx-auto mt-5 max-w-md text-sm leading-7 text-stone-600">We could not load this page. Your booking or payment has not been submitted again.</p><button onClick={reset} className="button-primary mt-8">Try again</button></div></section>;
}
