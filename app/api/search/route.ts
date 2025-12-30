import { NextResponse } from "next/server";
import { demoSearch } from "@/lib/demo/demoData";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const result = demoSearch(url.searchParams);
  return NextResponse.json(result);
}
