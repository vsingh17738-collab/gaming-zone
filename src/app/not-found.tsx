import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return <section className="container-shell grid min-h-[65vh] place-items-center py-20 text-center"><div><p className="font-display text-8xl text-gold">404</p><h1 className="mt-3 font-display text-5xl text-wine-dark">This page has left the venue.</h1><p className="mx-auto mt-5 max-w-md text-sm leading-7 text-stone-600">The page you are looking for does not exist or may have moved.</p><Link href="/" className="button-primary mt-8"><ArrowLeft size={16} /> Back to home</Link></div></section>;
}
