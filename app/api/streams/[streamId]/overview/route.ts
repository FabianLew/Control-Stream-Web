import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { demoStreamOverviewById } from "@/lib/demo/demoData";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ streamId: string }> }
) {
  const { streamId } = await context.params;
  const overview = demoStreamOverviewById[streamId];
  if (!overview) return new NextResponse("Not found", { status: 404 });
  return NextResponse.json(overview);
}
