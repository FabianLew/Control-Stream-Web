import { NextResponse } from "next/server";
import { demoCreateLiveSession } from "@/lib/demo/demoData";
import type { CreateLiveSessionRequest } from "@/types/live";
import { isDemoModeEnabled, proxyToBackend } from "@/app/api/_proxy";

export async function POST(req: Request) {
  if (isDemoModeEnabled()) {
    const body = (await req.json()) as CreateLiveSessionRequest;
    return NextResponse.json(demoCreateLiveSession(body));
  }

  return proxyToBackend(req, "/live");
}
