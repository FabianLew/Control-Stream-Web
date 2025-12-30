import { NextResponse } from "next/server";
import { demoStreams } from "@/lib/demo/demoData";

export async function GET() {
  return NextResponse.json(demoStreams);
}
