import { listAdminPayments } from "@/server/payments";
import { AdminPageTitle } from "@/components/admin/page-title";
import { StatusPill } from "@/components/ui/status";
import { PaymentReview } from "@/components/admin/payment-review";
import { formatINR } from "@/lib/money";
import { formatEventDate } from "@/lib/dates";

export const dynamic = "force-dynamic";
export default async function AdminPaymentsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const params = await searchParams; const rows = await listAdminPayments(params.status);
  return <><AdminPageTitle eyebrow="Payment verification" title="Collected, pending, verified." copy="Manual proofs require review. Reviewer ID and timestamp are stored with every decision." />
    <form className="mb-5"><select name="status" defaultValue={params.status} className="admin-field !w-64"><option value="">All payment statuses</option>{["created", "proof_submitted", "paid", "rejected", "failed", "refunded"].map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select><button className="button-primary ml-2 !min-h-10 !py-2 !text-xs">Filter</button></form>
    <div className="table-wrap"><table className="data-table"><thead><tr><th>Payment / booking</th><th>Customer</th><th>Method & amount</th><th>Status</th><th>Proof / review</th></tr></thead><tbody>{rows.map(({ payment, bookingNumber, customerName, customerEmail }) => <tr key={payment.id}><td><p className="font-semibold text-wine">{payment.paymentNumber}</p><p className="mt-1 text-xs">{bookingNumber}</p><p className="text-[10px] text-stone-400">{formatEventDate(payment.createdAt)}</p></td><td><p>{customerName}</p><p className="text-[10px] text-stone-400">{customerEmail}</p></td><td><p className="capitalize">{payment.method} · {payment.kind}</p><p className="mt-1 font-semibold">{formatINR(payment.amountInPaise)}</p>{payment.providerPaymentId && <p className="mt-1 text-[9px] text-stone-400">{payment.providerPaymentId}</p>}</td><td><StatusPill status={payment.status} />{payment.reviewedAt && <p className="mt-2 text-[9px] text-stone-400">Reviewed {formatEventDate(payment.reviewedAt)}<br />by {payment.reviewedBy}</p>}</td><td>{payment.proofPathname && <a href={`/api/admin/payments/${payment.id}/proof`} target="_blank" className="mb-2 block text-xs font-semibold text-wine">View private proof</a>}{payment.status === "proof_submitted" && <PaymentReview id={payment.id} />}{payment.reviewNote && <p className="mt-2 max-w-44 text-[10px] text-stone-500">{payment.reviewNote}</p>}</td></tr>)}</tbody></table>{!rows.length && <p className="py-16 text-center text-sm text-stone-500">No payment records found.</p>}</div>
  </>;
}
