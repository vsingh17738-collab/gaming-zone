import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";
import { getOptionalUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Administrator Login", robots: { index: false, follow: false } };
export default async function AdminLoginPage() {
  const user = await getOptionalUser();
  if (user?.role === "admin") redirect("/admin");
  return <AuthShell eyebrow="Restricted access" title="Business dashboard." copy="Authorised administrators can manage bookings, payments, services and business settings. All protected APIs verify the admin role on the server."><AuthForm mode="login" adminOnly /></AuthShell>;
}
