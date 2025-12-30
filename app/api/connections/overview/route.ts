import { NextResponse } from "next/server";
import { demoConnectionsOverview } from "@/lib/demo/demoData";

export async function GET() {
  return NextResponse.json(demoConnectionsOverview);
}
