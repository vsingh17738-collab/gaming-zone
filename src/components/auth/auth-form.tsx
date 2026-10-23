"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { fetchJson } from "@/lib/client";
import type { SafeUser } from "@/db/schema";

export function AuthForm({ mode, next = "/account", adminOnly = false }: { mode: "login" | "register"; next?: string; adminOnly?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const result = await fetchJson<{ user: SafeUser }>(`/api/auth/${mode}`, { method: "POST", body: JSON.stringify(payload) });
      if (adminOnly && result.user.role !== "admin") throw new Error("This account does not have administrator access.");
      const destination = adminOnly ? "/admin" : next.startsWith("/") && !next.startsWith("//") ? next : "/account";
      router.push(destination); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to continue"); setLoading(false); }
  }

  return <form onSubmit={submit} className="mt-8 space-y-5">
    {mode === "register" && <div><label className="label" htmlFor="name">Full name</label><input id="name" name="name" autoComplete="name" required minLength={2} maxLength={120} className="field" placeholder="Your name" /></div>}
    <div><label className="label" htmlFor="email">Email address</label><input id="email" name="email" type="email" autoComplete="email" required className="field" placeholder="you@example.com" /></div>
    {mode === "register" && <div><label className="label" htmlFor="phone">Phone / WhatsApp</label><input id="phone" name="phone" type="tel" autoComplete="tel" required pattern="\+?[0-9][0-9\s-]{7,17}" className="field" placeholder="+91 98765 43210" /></div>}
    <div><div className="flex items-center justify-between"><label className="label" htmlFor="password">Password</label>{mode === "login" && <span className="mb-2 text-[10px] text-stone-400">Secure session login</span>}</div><input id="password" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={mode === "register" ? 12 : 1} maxLength={72} className="field" placeholder={mode === "register" ? "At least 12 characters" : "Your password"} />{mode === "register" && <p className="mt-2 text-[11px] leading-5 text-stone-500">Use 12–72 characters with at least one letter and one number.</p>}</div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs leading-5 text-red-700">{error}</p>}
    <button className="button-primary w-full" disabled={loading}>{loading ? <LoaderCircle size={17} className="animate-spin" /> : <ArrowRight size={17} />}{mode === "login" ? adminOnly ? "Log in to dashboard" : "Log in" : "Create my account"}</button>
    <p className="text-center text-xs text-stone-500">{mode === "login" ? <>New to Shri Shaam? <Link href={`/register?next=${encodeURIComponent(next)}`} className="font-semibold text-wine">Create an account</Link></> : <>Already have an account? <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-wine">Log in</Link></>}</p>
  </form>;
}
