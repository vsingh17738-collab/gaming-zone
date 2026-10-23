import Link from "next/link";
import { Search } from "lucide-react";
import { listAdminBookings } from "@/server/bookings";
import { AdminPageTitle } from "@/components/admin/page-title";
import { StatusPill } from "@/components/ui/status";
import { BookingActions } from "@/components/admin/booking-actions";
import { formatEventDate } from "@/lib/dates";
import { formatINR } from "@/lib/money";

export const dynamic = "force-dynamic";
export default async function AdminBookingsPage({ searchParams }: { searchParams: Promise<{ search?: string; status?: string }> }) {
  const params = await searchParams; const rows = await listAdminBookings(params);
  return <><AdminPageTitle eyebrow="Booking management" title="Every celebration, organised." copy="Search customer details, verify event data and apply validated status transitions." />
    <form className="card mb-5 flex flex-col gap-3 p-4 sm:flex-row"><div className="relative flex-1"><Search size={16} className="absolute left-3 top-3 text-stone-400" /><input name="search" defaultValue={params.search} className="admin-field !pl-9" placeholder="Booking number, customer or email" /></div><select name="status" defaultValue={params.status} className="admin-field sm:!w-44"><option value="">All statuses</option>{["pending", "confirmed", "completed", "cancelled", "rejected"].map((status) => <option key={status} value={status}>{status}</option>)}</select><button className="button-primary !min-h-10 !py-2 !text-xs">Apply filters</button></form>
    <div className="table-wrap"><table className="data-table"><thead><tr><th>Booking / customer</th><th>Event</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map(({ booking, customer, packageName }) => <tr key={booking.id}><td><Link href={`/admin/bookings/${booking.id}`} className="font-semibold text-wine hover:underline">{booking.bookingNumber}</Link><p className="mt-1 text-xs">{customer.name}</p><p className="text-[10px] text-stone-400">{customer.email}</p></td><td><p className="font-medium">{booking.eventType}</p><p className="mt-1 text-xs text-stone-500">{formatEventDate(booking.eventDate)}</p><p className="text-[10px] text-stone-400">{packageName}</p></td><td><p className="font-semibold">{formatINR(booking.totalInPaise)}</p><div className="mt-1"><StatusPill status={booking.paymentStatus} /></div></td><td><StatusPill status={booking.status} /></td><td><BookingActions id={booking.id} status={booking.status} /></td></tr>)}</tbody></table>{!rows.length && <p className="py-16 text-center text-sm text-stone-500">No bookings match these filters.</p>}</div>
  </>;
}
