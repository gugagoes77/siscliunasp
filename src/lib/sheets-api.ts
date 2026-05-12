const URL_KEY = "unasp.appsScriptUrl";

export function getApiUrl(): string {
  if (typeof window === "undefined") return "";
  return (
    (import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined) ||
    localStorage.getItem(URL_KEY) ||
    ""
  );
}

export function setApiUrl(url: string) {
  localStorage.setItem(URL_KEY, url.trim());
}

export async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export type ApiResponse<T = any> = { ok: true; data: T } | { ok: false; error: string };

export async function apiCall<T = any>(
  action: string,
  payload: Record<string, any> = {},
): Promise<T> {
  const url = getApiUrl();
  if (!url) {
    throw new Error(
      "URL do Apps Script não configurada. Vá em Configurações para definir.",
    );
  }
  const res = await fetch(url, {
    method: "POST",
    // text/plain evita preflight CORS no Apps Script
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, ...payload }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = (await res.json()) as ApiResponse<T>;
  if (!json.ok) throw new Error(json.error || "Erro desconhecido");
  return json.data;
}