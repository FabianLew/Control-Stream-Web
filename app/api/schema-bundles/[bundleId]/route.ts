import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { demoSchemaBundleDetailsById } from "@/lib/demo/demoData";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ bundleId: string }> }
) {
  const { bundleId } = await context.params;
  const details = demoSchemaBundleDetailsById[bundleId];
  if (!details) return new NextResponse("Not found", { status: 404 });
  return NextResponse.json(details);
}

export async function DELETE() {
  return new NextResponse(null, { status: 204 });
}
