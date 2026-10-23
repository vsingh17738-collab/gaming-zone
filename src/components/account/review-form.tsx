"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { fetchJson } from "@/lib/client";

export function ReviewForm({ bookingId }: { bookingId: string }) {
  const [rating, setRating] = useState(5); const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); setMessage(""); try { const result = await fetchJson<{ message: string }>("/api/reviews", { method: "POST", body: JSON.stringify({ bookingId, rating, comment: form.get("comment") }) }); setMessage(result.message); event.currentTarget.reset(); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to submit review"); } }
  return <form onSubmit={submit} className="card mt-6 p-6"><h3 className="font-display text-2xl text-wine-dark">Share your experience</h3><p className="mt-1 text-xs text-stone-500">Only completed-event customers can review. Feedback is moderated before publication.</p><div className="mt-4 flex gap-1">{[1, 2, 3, 4, 5].map((value) => <button type="button" key={value} onClick={() => setRating(value)} aria-label={`${value} stars`} className={value <= rating ? "text-gold" : "text-stone-300"}><Star fill="currentColor" /></button>)}</div><textarea name="comment" required minLength={10} maxLength={1500} className="field mt-4 min-h-24" placeholder="What did you appreciate about your event setup?" />{message && <p className="mt-3 text-xs text-stone-600">{message}</p>}<button className="button-secondary mt-4 !min-h-10 !py-2 !text-xs">Submit for moderation</button></form>;
}
