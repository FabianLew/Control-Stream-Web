import type {
  SchemaBundleDto,
  SchemaBundleDetailsDto,
} from "@/types/schema-bundle";
import { toast } from "sonner";

export async function listSchemaBundles(): Promise<SchemaBundleDto[]> {
  const res = await fetch("/api/schema-bundles", { method: "GET" });
  if (!res.ok) throw new Error("Failed to load schema bundles");
  return res.json();
}

export async function getSchemaBundleDetails(
  bundleId: string
): Promise<SchemaBundleDetailsDto> {
  const res = await fetch(
    `/api/schema-bundles/${encodeURIComponent(bundleId)}`,
    { method: "GET" }
  );
  if (!res.ok) throw new Error("Failed to load bundle details");
  return res.json();
}

export async function uploadSchemaBundleZip(
  file: File
): Promise<SchemaBundleDto> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch("/api/schema-bundles", {
    method: "POST",
    body: form,
  });

  if (!res.ok) throw new Error("Failed to upload schema bundle");
  return res.json();
}

export async function deleteSchemaBundle(bundleId: string): Promise<void> {
  const res = await fetch(
    `/api/schema-bundles/${encodeURIComponent(bundleId)}`,
    {
      method: "DELETE",
    }
  );
  if (!res.ok) throw new Error("Failed to delete schema bundle");
}
