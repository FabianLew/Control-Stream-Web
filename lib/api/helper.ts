export type JsonRequestInit = RequestInit & {
  json?: unknown;
};

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

  if (json !== undefined) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    rest.body = JSON.stringify(json);
  }

  const res = await fetch(url, { ...rest, headers });
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
