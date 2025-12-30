import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { demoSchemaBundleDetailsById } from "@/lib/demo/demoData";
import { isDemoModeEnabled, proxyToBackend } from "@/app/api/_proxy";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ bundleId: string }> }
) {
  const { bundleId } = await context.params;
  if (isDemoModeEnabled()) {
    const details = demoSchemaBundleDetailsById[bundleId];
    if (!details) return new NextResponse("Not found", { status: 404 });
    return NextResponse.json(details);
  }

  return proxyToBackend(req, `/schema-bundles/${bundleId}`);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ bundleId: string }> }
) {
  if (isDemoModeEnabled()) {
    return new NextResponse(null, { status: 204 });
  }

  const { bundleId } = await context.params;
  return proxyToBackend(req, `/schema-bundles/${bundleId}`);
}
