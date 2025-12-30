import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { demoStreamOverviewById } from "@/lib/demo/demoData";
import { isDemoModeEnabled, proxyToBackend } from "@/app/api/_proxy";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ streamId: string }> }
) {
  const { streamId } = await context.params;
  if (isDemoModeEnabled()) {
    const overview = demoStreamOverviewById[streamId];
    if (!overview) return new NextResponse("Not found", { status: 404 });
    return NextResponse.json(overview);
  }

  return proxyToBackend(req, `/streams/${streamId}/overview`);
}
