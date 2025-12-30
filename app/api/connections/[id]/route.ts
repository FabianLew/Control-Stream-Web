import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { demoConnections } from "@/lib/demo/demoData";
import { isDemoModeEnabled, proxyToBackend } from "@/app/api/_proxy";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (isDemoModeEnabled()) {
    const item = demoConnections.find((c) => c.id === id);
    if (!item) return new NextResponse("Not found", { status: 404 });
    return NextResponse.json(item);
  }

  return proxyToBackend(req, `/connections/${id}`);
}
