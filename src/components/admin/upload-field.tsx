"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { fetchJson } from "@/lib/client";

export function UploadField({ folder, onUploaded, label = "Upload image" }: { folder: "brand" | "gallery"; onUploaded: (url: string) => void; label?: string }) {
  const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  async function upload(file?: File) { if (!file) return; setLoading(true); setError(""); try { const form = new FormData(); form.set("folder", folder); form.set("file", file); const result = await fetchJson<{ url: string }>("/api/admin/uploads", { method: "POST", body: form }); onUploaded(result.url); } catch (cause) { setError(cause instanceof Error ? cause.message : "Upload failed"); } finally { setLoading(false); } }
  return <div className="mt-2"><label className="button-secondary !min-h-9 !px-3 !py-2 !text-[10px]"><Upload size={13} />{loading ? "Uploading…" : label}<input type="file" className="hidden" accept="image/png,image/jpeg,image/webp" disabled={loading} onChange={(event) => void upload(event.target.files?.[0])} /></label>{error && <p className="mt-2 text-xs text-red-600">{error}</p>}</div>;
}
