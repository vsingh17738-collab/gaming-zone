import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";
import { getOptionalUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Customer Login" };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [user, params] = await Promise.all([getOptionalUser(), searchParams]);
  if (user) redirect(params.next?.startsWith("/") && !params.next.startsWith("//") ? params.next : "/account");
  return <AuthShell eyebrow="Welcome back" title="Your celebrations, all in one place." copy="Log in to track bookings, accept quotations, manage payments and download your documents."><AuthForm mode="login" next={params.next} /></AuthShell>;
}
