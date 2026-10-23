"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchJson } from "@/lib/client";

export function PaymentReview({ id }: { id: string }) {
  const router = useRouter(); const [message, setMessage] = useState(""); const [loading, setLoading] = useState(false);
  async function review(decision: "approve" | "reject") { const note = window.prompt(decision === "approve" ? "Optional verification note" : "Reason for rejection") ?? ""; if (decision === "reject" && !note) return; setLoading(true); try { await fetchJson(`/api/admin/payments/${id}`, { method: "PATCH", body: JSON.stringify({ decision, note }) }); router.refresh(); } catch (error) { setMessage(error instanceof Error ? error.message : "Review failed"); } finally { setLoading(false); } }
  return <div><div className="flex gap-2"><button disabled={loading} onClick={() => review("approve")} className="button-primary !min-h-9 !px-3 !py-2 !text-[10px]">Approve</button><button disabled={loading} onClick={() => review("reject")} className="button-secondary !min-h-9 !px-3 !py-2 !text-[10px]">Reject</button></div>{message && <p className="mt-2 text-xs text-red-600">{message}</p>}</div>;
}
