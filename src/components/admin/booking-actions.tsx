"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchJson } from "@/lib/client";

export function BookingActions({ id, status }: { id: string; status: string }) {
  const router = useRouter(); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  async function update(next: string) { if (["cancelled", "rejected"].includes(next) && !window.confirm(`Are you sure you want to mark this booking ${next}? This releases its reserved slot.`)) return; setLoading(true); setError(""); try { await fetchJson(`/api/admin/bookings/${id}`, { method: "PATCH", body: JSON.stringify({ status: next }) }); router.refresh(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to update"); } finally { setLoading(false); } }
  return <div><div className="flex flex-wrap gap-2">{status === "pending" && <><button disabled={loading} onClick={() => update("confirmed")} className="button-primary !min-h-9 !px-4 !py-2 !text-[11px]">Confirm</button><button disabled={loading} onClick={() => update("rejected")} className="button-secondary !min-h-9 !px-4 !py-2 !text-[11px]">Reject</button></>}{status === "confirmed" && <button disabled={loading} onClick={() => update("completed")} className="button-primary !min-h-9 !px-4 !py-2 !text-[11px]">Mark completed</button>}{["pending", "confirmed"].includes(status) && <button disabled={loading} onClick={() => update("cancelled")} className="button-secondary !min-h-9 !px-4 !py-2 !text-[11px]">Cancel</button>}</div>{error && <p className="mt-2 text-xs text-red-600">{error}</p>}</div>;
}
