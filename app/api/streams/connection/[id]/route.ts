import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { demoConnectionStreamsByConnectionId } from "@/lib/demo/demoData";
import { isDemoModeEnabled, proxyToBackend } from "@/app/api/_proxy";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (isDemoModeEnabled()) {
    return NextResponse.json(demoConnectionStreamsByConnectionId[id] ?? []);
  }

  return proxyToBackend(req, `/streams/connection/${id}`);
}
