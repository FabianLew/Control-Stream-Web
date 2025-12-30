// app/api/_proxy.ts
const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8080";

export function isDemoModeEnabled(): boolean {
  const value = (process.env.DEMO_MODE ?? "false").toLowerCase() === "true";
  console.log("[api] DEMO_MODE =", process.env.DEMO_MODE, "=>", value);
  return (process.env.DEMO_MODE ?? "false").toLowerCase() === "true";
}

export async function proxyToBackend(req: Request, backendApiPath: string) {
  // backendApiPath np. "/connections/overview"
  const url = new URL(req.url);
  const targetUrl = `${backendUrl}/api${backendApiPath}${url.search}`;

  const method = req.method.toUpperCase();
  const body =
    method === "GET" || method === "HEAD" ? undefined : await req.arrayBuffer();

  const res = await fetch(targetUrl, {
    method,
    headers: req.headers,
    body,
    redirect: "manual",
  });

  // Przepuszczamy status + headers + body 1:1 (ważne np. dla content-type)
  const headers = new Headers(res.headers);
  return new Response(res.body, { status: res.status, headers });
}
