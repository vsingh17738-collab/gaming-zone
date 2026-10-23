import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";
import { getOptionalUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Create Customer Account" };
export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [user, params] = await Promise.all([getOptionalUser(), searchParams]);
  if (user) redirect(params.next?.startsWith("/") && !params.next.startsWith("//") ? params.next : "/account");
  return <AuthShell eyebrow="Your customer account" title="Plan now. Come back to every detail." copy="Create a secure account to submit booking requests and keep quotations, invoices and payment history together."><AuthForm mode="register" next={params.next} /></AuthShell>;
}
