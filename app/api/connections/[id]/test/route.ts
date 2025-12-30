import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { demoTestConnection } from "@/lib/demo/demoData";

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return NextResponse.json(demoTestConnection(id));
}
