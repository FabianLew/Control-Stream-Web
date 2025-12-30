import { NextResponse } from "next/server";
import type { SchemaBundleDto } from "@/types/schema-bundle";
import { demoSchemaBundles } from "@/lib/demo/demoData";
import { isDemoModeEnabled, proxyToBackend } from "@/app/api/_proxy";

function nowIso() {
  return new Date().toISOString();
}

export async function GET(req: Request) {
  if (isDemoModeEnabled()) {
    return NextResponse.json(demoSchemaBundles);
  }

  return proxyToBackend(req, "/schema-bundles");
}

export async function POST(req: Request) {
  if (!isDemoModeEnabled()) {
    return proxyToBackend(req, "/schema-bundles");
  }

  const form = await req.formData();
  const file = form.get("file");

  if (!file || !(file instanceof File)) {
    return new NextResponse("Missing multipart field 'file'", { status: 400 });
  }

  // Demo: mapujemy upload na istniejący seed, żeby details zawsze działało
  const fileName = file.name.toLowerCase();
  const preferAvro =
    fileName.includes("avro") ||
    fileName.endsWith(".avsc") ||
    fileName.includes("schema");

  const chosen =
    demoSchemaBundles.find((b) =>
      preferAvro ? b.bundleId.includes("avro") : b.bundleId.includes("proto")
    ) ?? demoSchemaBundles[0];

  const response: SchemaBundleDto = {
    ...chosen,
    // żeby wyglądało "realnie" po uploadzie, odświeżamy timestamp i size
    uploadedAt: nowIso(),
    sizeBytes: file.size,
    // fileCount zostawiamy seedowy (albo możesz dać np. 12)
  };

  return NextResponse.json(response, { status: 200 });
}
