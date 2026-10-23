import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getOptionalUser } from "@/lib/auth";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = { title: "Admin Dashboard", robots: { index: false, follow: false } };

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getOptionalUser();
  if (!user) redirect("/admin/login");
  if (user.role !== "admin") redirect("/account");
  return <div className="container-shell grid items-start gap-7 py-8 lg:grid-cols-[220px_1fr] lg:py-12"><aside className="card sticky top-4 z-20 p-3 lg:p-4"><div className="hidden border-b border-stone-200 px-3 pb-4 pt-2 lg:block"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-gold">Business console</p><p className="mt-1 truncate text-xs text-stone-500">{user.email}</p></div><div className="mt-1 lg:mt-4"><AdminNav /></div></aside><div className="min-w-0">{children}</div></div>;
}
