import type {
  SchemaBundleDto,
  SchemaBundleDetailsDto,
} from "@/types/schema-bundle";
import { requestJson, requestVoid } from "./helper";

export async function listSchemaBundles(): Promise<SchemaBundleDto[]> {
  return requestJson("/api/schema-bundles", { method: "GET" });
}

export async function getSchemaBundleDetails(
  bundleId: string
): Promise<SchemaBundleDetailsDto> {
  return requestJson(
    `/api/schema-bundles/${encodeURIComponent(bundleId)}`,
    { method: "GET" }
  );
}

export async function uploadSchemaBundleZip(
  file: File
): Promise<SchemaBundleDto> {
  const form = new FormData();
  form.append("file", file);

  return requestJson("/api/schema-bundles", {
    method: "POST",
    body: form,
  });
}

export async function deleteSchemaBundle(bundleId: string): Promise<void> {
  return requestVoid(`/api/schema-bundles/${encodeURIComponent(bundleId)}`, {
    method: "DELETE",
  });
}
