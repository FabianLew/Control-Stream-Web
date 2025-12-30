import { NextResponse } from "next/server";

export async function PATCH() {
  // demo: akceptujemy, nic nie robimy
  return new NextResponse(null, { status: 204 });
}

export async function DELETE() {
  // demo: akceptujemy, nic nie robimy
  return new NextResponse(null, { status: 204 });
}
