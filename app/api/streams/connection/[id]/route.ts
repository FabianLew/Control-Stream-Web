import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { demoConnectionStreamsByConnectionId } from "@/lib/demo/demoData";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return NextResponse.json(demoConnectionStreamsByConnectionId[id] ?? []);
}
