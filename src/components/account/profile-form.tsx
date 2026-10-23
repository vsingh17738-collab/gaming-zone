"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchJson } from "@/lib/client";
import type { SafeUser } from "@/db/schema";

export function ProfileForm({ user }: { user: SafeUser }) {
  const router = useRouter(); const [message, setMessage] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); setLoading(true); setMessage(""); const data = Object.fromEntries(new FormData(event.currentTarget).entries()); try { await fetchJson("/api/auth/profile", { method: "PATCH", body: JSON.stringify(data) }); setMessage("Profile saved."); router.refresh(); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save"); } finally { setLoading(false); } }
  return <form onSubmit={submit} className="card p-6"><h2 className="font-display text-3xl text-wine-dark">Profile details</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><div><label className="label">Full name</label><input name="name" defaultValue={user.name} className="field" required minLength={2} /></div><div><label className="label">Phone / WhatsApp</label><input name="phone" defaultValue={user.phone ?? ""} className="field" required /></div><div className="sm:col-span-2"><label className="label">Email</label><input value={user.email} className="field" disabled /></div></div>{message && <p className="mt-4 text-xs text-stone-600">{message}</p>}<button disabled={loading} className="button-primary mt-5 !min-h-10 !py-2 !text-xs">Save profile</button></form>;
}
