import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { demoTestConnection } from "@/lib/demo/demoData";
import { isDemoModeEnabled, proxyToBackend } from "@/app/api/_proxy";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (isDemoModeEnabled()) {
    return NextResponse.json(demoTestConnection(id));
  }

  return proxyToBackend(req, `/connections/${id}/test`);
}
