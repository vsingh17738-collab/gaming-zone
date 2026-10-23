import { MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/whatsapp";

export function WhatsAppButton({ number }: { number: string | null }) {
  const href = whatsappLink(number, "Hello Shri Shaam Tent House, I would like to discuss my event.");
  if (!href) return null;
  return <a href={href} target="_blank" rel="noreferrer" aria-label="Chat with Shri Shaam Tent House on WhatsApp" className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#246b4b] text-white shadow-xl transition hover:-translate-y-1 hover:bg-[#1d583e]"><MessageCircle size={25} /></a>;
}
