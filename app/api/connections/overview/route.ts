import { NextResponse } from "next/server";
import { demoConnectionsOverview } from "@/lib/demo/demoData";
import { isDemoModeEnabled, proxyToBackend } from "@/app/api/_proxy";

export async function GET(req: Request) {
  if (isDemoModeEnabled()) {
    return NextResponse.json(demoConnectionsOverview);
  }

  return proxyToBackend(req, "/connections/overview");
}
