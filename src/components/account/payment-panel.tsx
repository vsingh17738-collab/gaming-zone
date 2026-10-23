"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, Download, LoaderCircle, MessageCircle, ShieldCheck, Upload } from "lucide-react";
import type { BookingDetail } from "@/server/bookings";
import type { BusinessSettings } from "@/db/schema";
import { fetchJson } from "@/lib/client";
import { formatINR } from "@/lib/money";
import { whatsappLink } from "@/lib/whatsapp";

declare global { interface Window { Razorpay?: new (options: Record<string, unknown>) => { open: () => void } } }
function loadCheckout() { return new Promise<boolean>((resolve) => { if (window.Razorpay) return resolve(true); const script = document.createElement("script"); script.src = "https://checkout.razorpay.com/v1/checkout.js"; script.onload = () => resolve(true); script.onerror = () => resolve(false); document.body.appendChild(script); }); }

export function PaymentPanel({ detail, settings }: { detail: BookingDetail; settings: BusinessSettings }) {
  const router = useRouter(); const [method, setMethod] = useState<"razorpay" | "manual">("manual"); const [loading, setLoading] = useState(false); const [message, setMessage] = useState("");
  const kind = detail.paidInPaise >= detail.booking.advanceInPaise ? "balance" : "advance";
  const due = kind === "advance" ? Math.max(0, detail.booking.advanceInPaise - detail.paidInPaise) : Math.max(0, detail.booking.totalInPaise - detail.paidInPaise);
  const whatsapp = whatsappLink(settings.whatsappNumber, `Hello Shri Shaam Tent House, I need help with booking ${detail.booking.bookingNumber}.`);
  const manualConfigured = Boolean(settings.paymentQrUrl || settings.upiId || settings.bankDetails);

  async function acceptQuote() { setLoading(true); setMessage(""); try { await fetchJson(`/api/bookings/${detail.booking.id}/accept-quotation`, { method: "POST" }); setMessage("Quotation accepted."); router.refresh(); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to accept quotation"); } finally { setLoading(false); } }
  async function payOnline() {
    setLoading(true); setMessage("");
    try {
      const order = await fetchJson<{ orderId: string; amount: number; currency: string; keyId: string }>("/api/payments/razorpay/order", { method: "POST", body: JSON.stringify({ bookingId: detail.booking.id, kind }) });
      if (!await loadCheckout() || !window.Razorpay) throw new Error("Razorpay Checkout could not load. Please try again or use manual payment.");
      const checkout = new window.Razorpay({ key: order.keyId, amount: order.amount, currency: order.currency, name: settings.businessName, description: `${kind} for ${detail.booking.bookingNumber}`, order_id: order.orderId, prefill: { name: detail.customer.name, email: detail.customer.email, contact: detail.customer.phone ?? "" }, theme: { color: "#722f37" }, handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        try { await fetchJson("/api/payments/razorpay/verify", { method: "POST", body: JSON.stringify({ orderId: response.razorpay_order_id, paymentId: response.razorpay_payment_id, signature: response.razorpay_signature }) }); setMessage("Payment verified and receipt generated."); router.refresh(); } catch (error) { setMessage(error instanceof Error ? error.message : "Verification failed. Contact the business before retrying."); } finally { setLoading(false); }
      }, modal: { ondismiss: () => setLoading(false) } });
      checkout.open();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Online payment is not available"); setLoading(false); }
  }
  async function uploadProof(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage("");
    try { const form = new FormData(event.currentTarget); form.set("bookingId", detail.booking.id); form.set("kind", kind); const result = await fetchJson<{ message: string }>("/api/payments/manual", { method: "POST", body: form }); setMessage(result.message); router.refresh(); } catch (error) { setMessage(error instanceof Error ? error.message : "Proof could not be uploaded"); } finally { setLoading(false); }
  }

  return <aside className="space-y-5"><div className="card p-6 sm:p-7"><div className="flex items-center gap-3"><ShieldCheck className="text-gold" /><h2 className="font-display text-3xl text-wine-dark">Quotation & payment</h2></div>
    {detail.quotation && <div className="mt-4 flex items-center justify-between rounded-xl bg-sand/50 p-4 text-xs"><span>Quotation {detail.quotation.quotationNumber}</span><span className="font-bold uppercase text-wine">{detail.quotation.status}</span></div>}
    {detail.quotation?.status === "sent" && <button onClick={acceptQuote} disabled={loading} className="button-primary mt-5 w-full"><Check size={16} /> Accept quotation</button>}
    {detail.booking.status !== "confirmed" && <p className="mt-5 rounded-xl bg-amber-50 p-4 text-xs leading-6 text-amber-800">Payment opens after the business confirms this booking and you accept the quotation.</p>}
    {detail.booking.status === "confirmed" && detail.quotation?.status === "accepted" && due > 0 && <div className="mt-6"><div className="rounded-xl bg-wine-light p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-wine">{kind === "advance" ? "Advance now due" : "Remaining balance due"}</p><p className="mt-1 font-display text-4xl text-wine-dark">{formatINR(due)}</p></div><div className="mt-5 grid grid-cols-2 gap-2"><button onClick={() => setMethod("manual")} className={`rounded-xl border px-3 py-3 text-xs font-semibold ${method === "manual" ? "border-wine bg-wine text-white" : "border-stone-200"}`}>QR / manual</button><button onClick={() => setMethod("razorpay")} className={`rounded-xl border px-3 py-3 text-xs font-semibold ${method === "razorpay" ? "border-wine bg-wine text-white" : "border-stone-200"}`}>Razorpay</button></div>
      {method === "razorpay" ? <button onClick={payOnline} disabled={loading} className="button-primary mt-5 w-full">{loading && <LoaderCircle size={16} className="animate-spin" />} Pay {formatINR(due)} securely</button> : <div className="mt-5">{manualConfigured ? <>{settings.paymentQrUrl && <div className="relative mx-auto aspect-square max-w-64 overflow-hidden rounded-xl border border-stone-200 bg-white p-3"><Image src={settings.paymentQrUrl} alt="Business payment QR code" fill sizes="256px" className="object-contain p-3" /></div>}<div className="mt-4 text-center text-xs leading-6 text-stone-600">{settings.upiId && <p><strong className="text-wine">UPI:</strong> {settings.upiId}</p>}{settings.bankDetails && <p className="whitespace-pre-wrap">{settings.bankDetails}</p>}{settings.paymentInstructions && <p className="mt-2">{settings.paymentInstructions}</p>}</div><form onSubmit={uploadProof} className="mt-5"><label className="label">Upload payment screenshot</label><input name="proof" type="file" required accept="image/png,image/jpeg,image/webp" className="field !py-2 text-xs" /><p className="mt-2 text-[10px] leading-4 text-stone-500">PNG, JPG or WEBP up to 5 MB. Uploading proof does not mark the payment as paid.</p><button disabled={loading} className="button-secondary mt-4 w-full !min-h-10 !py-2 !text-xs"><Upload size={15} /> Submit for verification</button></form></> : <p className="rounded-xl bg-stone-100 p-4 text-xs leading-6 text-stone-600">Manual payment is <strong>NOT CONFIGURED</strong>. The business must add its real QR code or UPI/bank instructions in admin settings.</p>}</div>}
    </div>}
    {due === 0 && detail.paidInPaise > 0 && <p className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">All booking payments are recorded as paid.</p>}
    {message && <p role="status" className="mt-4 rounded-xl bg-stone-100 p-3 text-xs leading-5 text-stone-700">{message}</p>}
  </div>
  {detail.invoices.length > 0 && <div className="card p-6"><h3 className="font-display text-2xl text-wine-dark">Verified receipts</h3>{detail.invoices.map((invoice) => <a key={invoice.id} href={`/api/bookings/${detail.booking.id}/invoices/${invoice.id}`} target="_blank" className="mt-3 flex items-center justify-between rounded-xl border border-stone-200 p-3 text-xs hover:border-gold"><span>{invoice.invoiceNumber}<strong className="ml-2 text-wine">{formatINR(invoice.amountInPaise)}</strong></span><Download size={15} /></a>)}</div>}
  {whatsapp && <a href={whatsapp} target="_blank" rel="noreferrer" className="button-secondary w-full"><MessageCircle size={16} /> Ask about this booking</a>}
  </aside>;
}
