import { NextResponse } from "next/server";
import { demoCreateLiveSession } from "@/lib/demo/demoData";
import type { CreateLiveSessionRequest } from "@/types/live";

export async function POST(req: Request) {
  const body = (await req.json()) as CreateLiveSessionRequest;
  return NextResponse.json(demoCreateLiveSession(body));
}
