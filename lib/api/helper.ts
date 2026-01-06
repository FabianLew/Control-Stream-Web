import { clearAccessToken, getAccessToken } from "@/lib/auth/session";

export type JsonRequestInit = RequestInit & {
  json?: unknown;
};

function resolveAuthMode(): "jwt" | "none" {
  const raw = (process.env.NEXT_PUBLIC_AUTH_MODE ?? "jwt").toLowerCase();
  return raw === "none" ? "none" : "jwt";
}

function apiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) throw new Error("Missing NEXT_PUBLIC_API_URL");
  return url.replace(/\/$/, "");
}

async function parseError(res: Response): Promise<string> {
  try {
    const text = await res.text();
    return text.trim();
  } catch {
    return "";
  }
}

export async function requestJson<T>(
  url: string,
  init: JsonRequestInit = {}
): Promise<T> {
  const { json, ...rest } = init;

  const headers = new Headers(rest.headers);

  // JSON body
  if (json !== undefined) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    rest.body = JSON.stringify(json);
  }

  const authMode = resolveAuthMode();

  // AUTH (tylko w jwt)
  if (authMode === "jwt") {
    const token = getAccessToken();
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const fullUrl = url.startsWith("http")
    ? url
    : `${apiBaseUrl()}${url.startsWith("/") ? "" : "/"}${url}`;

  const res = await fetch(fullUrl, { ...rest, headers });

  // token invalid -> czyścimy TYLKO w jwt
  if (authMode === "jwt" && res.status === 401) {
    clearAccessToken();
  }

  if (!res.ok) {
    const message = (await parseError(res)) || `Request failed (${res.status})`;
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function requestVoid(
  url: string,
  init: JsonRequestInit = {}
): Promise<void> {
  await requestJson<void>(url, init);
}
