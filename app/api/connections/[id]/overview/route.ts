import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { demoConnectionsOverview } from "@/lib/demo/demoData";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const item = demoConnectionsOverview.find((c) => c.id === id);
  if (!item) return new NextResponse("Not found", { status: 404 });
  return NextResponse.json(item);
}
