"use client";

import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { fetchJson } from "@/lib/client";
import type { Review } from "@/db/schema";

type Row = { review: Review; customerName: string; bookingNumber: string };
export function ReviewModeration({ rows }: { rows: Row[] }) {
  const router = useRouter();
  async function toggle(row: Row) { await fetchJson(`/api/admin/reviews/${row.review.id}`, { method: "PATCH", body: JSON.stringify({ isApproved: !row.review.isApproved }) }); router.refresh(); }
  return <div className="grid gap-4 md:grid-cols-2">{rows.map((row) => <article key={row.review.id} className="card p-6"><div className="flex text-gold">{Array.from({ length: row.review.rating }).map((_, index) => <Star key={index} size={15} fill="currentColor" />)}</div><p className="mt-4 text-sm leading-7 text-stone-700">“{row.review.comment}”</p><p className="mt-4 text-xs font-semibold">{row.customerName}</p><p className="text-[10px] text-stone-400">{row.bookingNumber}</p><div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-4"><span className={`status-pill ${row.review.isApproved ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{row.review.isApproved ? "Published" : "Awaiting moderation"}</span><button onClick={() => toggle(row)} className="button-secondary !min-h-9 !px-3 !py-2 !text-[10px]">{row.review.isApproved ? "Unpublish" : "Approve"}</button></div></article>)}{!rows.length && <p className="card col-span-full py-16 text-center text-sm text-stone-500">No customer reviews have been submitted.</p>}</div>;
}
