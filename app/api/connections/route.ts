import { NextResponse } from "next/server";
import { demoConnections } from "@/lib/demo/demoData";

export async function GET() {
  return NextResponse.json(demoConnections);
}
