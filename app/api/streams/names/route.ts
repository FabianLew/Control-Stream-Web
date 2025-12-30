import { NextResponse } from "next/server";
import type { StreamOption } from "@/types/index";
import { demoStreams } from "@/lib/demo/demoData";
import { isDemoModeEnabled, proxyToBackend } from "@/app/api/_proxy";

export async function GET(req: Request) {
  if (isDemoModeEnabled()) {
    const result: StreamOption[] = demoStreams.map((s) => ({
      id: s.id,
      name: s.name,
      type: s.type,
    }));

    return NextResponse.json(result);
  }

  return proxyToBackend(req, "/streams/names");
}
