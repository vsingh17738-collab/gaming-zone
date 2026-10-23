export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...options, headers: { ...(options?.body && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}), ...options?.headers } });
  const body = await response.json() as { data?: T; error?: { message?: string; code?: string } };
  if (!response.ok) throw new Error(body.error?.message ?? "The request could not be completed");
  return body.data as T;
}

export function rupeesToPaise(value: string | number) {
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
}

export function paiseToRupees(paise: number) {
  return String(paise / 100);
}
