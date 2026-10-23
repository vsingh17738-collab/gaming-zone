const styles: Record<string, string> = {
  pending: "bg-amber-50 text-amber-800", confirmed: "bg-emerald-50 text-emerald-800", completed: "bg-blue-50 text-blue-800",
  cancelled: "bg-stone-100 text-stone-600", rejected: "bg-red-50 text-red-700", paid: "bg-emerald-50 text-emerald-800",
  unpaid: "bg-stone-100 text-stone-600", partially_paid: "bg-amber-50 text-amber-800", proof_submitted: "bg-purple-50 text-purple-700",
  sent: "bg-blue-50 text-blue-700", accepted: "bg-emerald-50 text-emerald-700", expired: "bg-red-50 text-red-700",
  AVAILABLE: "bg-emerald-50 text-emerald-700", PARTIAL: "bg-amber-50 text-amber-700", BOOKED: "bg-red-50 text-red-700",
};

export function StatusPill({ status }: { status: string }) {
  return <span className={`status-pill ${styles[status] ?? "bg-stone-100 text-stone-700"}`}>{status.replaceAll("_", " ")}</span>;
}
