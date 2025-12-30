import { NextResponse } from "next/server";
import { demoStreams } from "@/lib/demo/demoData";
import { isDemoModeEnabled, proxyToBackend } from "@/app/api/_proxy";

export async function GET(req: Request) {
  if (isDemoModeEnabled()) {
    return NextResponse.json(demoStreams);
  }

  return proxyToBackend(req, "/streams");
}
