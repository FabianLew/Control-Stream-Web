import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isDemoModeEnabled, proxyToBackend } from "@/app/api/_proxy";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  if (isDemoModeEnabled()) {
    // demo: akceptujemy, nic nie robimy
    return new NextResponse(null, { status: 204 });
  }

  const { sessionId } = await context.params;
  return proxyToBackend(req, `/live/${sessionId}`);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  if (isDemoModeEnabled()) {
    // demo: akceptujemy, nic nie robimy
    return new NextResponse(null, { status: 204 });
  }

  const { sessionId } = await context.params;
  return proxyToBackend(req, `/live/${sessionId}`);
}
