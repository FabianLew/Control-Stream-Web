import { NextResponse } from "next/server";
import type { StreamOption } from "@/types/index";
import { demoStreams } from "@/lib/demo/demoData";

export async function GET() {
  const result: StreamOption[] = demoStreams.map((s) => ({
    id: s.id,
    name: s.name,
    type: s.type,
  }));

  return NextResponse.json(result);
}
