import { NextResponse } from "next/server";
import { demoSearch } from "@/lib/demo/demoData";
import { isDemoModeEnabled, proxyToBackend } from "@/app/api/_proxy";

export async function GET(req: Request) {
  if (isDemoModeEnabled()) {
    const url = new URL(req.url);
    const result = demoSearch(url.searchParams);
    return NextResponse.json(result);
  }

  return proxyToBackend(req, "/search");
}
