// /components/schema-bundles/SchemaBundlesPage.tsx
"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, FileUp, Trash2, Eye, RefreshCw } from "lucide-react";

import type { SchemaBundleDto } from "@/types/schema-bundle";
import {
  listSchemaBundles as getSchemaBundles,
  uploadSchemaBundleZip,
  deleteSchemaBundle,
} from "@/lib/api/schemaBundles";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SchemaBundleDetailsDialog } from "@/components/schema-bundles/SchemaBundleDetailsDialog";
import { toast } from "sonner";

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes)) return "-";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function SchemaBundlesPage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = React.useState("");
  const [previewBundleId, setPreviewBundleId] = React.useState<string | null>(
    null
  );

  const bundlesQuery = useQuery({
    queryKey: ["schema-bundles"],
    queryFn: getSchemaBundles,
  });

  const uploadMutation = useMutation({
    mutationFn: uploadSchemaBundleZip,
    onSuccess: (created) => {
      toast.success(
        `Uploaded bundle ${created.bundleId} (${created.fileCount} files)`
      );
      queryClient.invalidateQueries({ queryKey: ["schema-bundles"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Upload failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSchemaBundle,
    onSuccess: () => {
      toast.success("Bundle deleted");
      queryClient.invalidateQueries({ queryKey: ["schema-bundles"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Delete failed"),
  });

  const onPickZip = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".zip")) {
      toast.error("Please upload a .zip file");
      return;
    }
    await uploadMutation.mutateAsync(file);
  };

  const filtered: SchemaBundleDto[] = React.useMemo(() => {
    const all = bundlesQuery.data ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter((b) => {
      return (
        b.bundleId.toLowerCase().includes(q) ||
        b.sha256.toLowerCase().includes(q)
      );
    });
  }, [bundlesQuery.data, query]);

  return (
    <main className="p-6 md:p-8 min-h-screen space-y-6 fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Schema Bundles
          </h1>
          <p className="text-muted-foreground">
            Upload ZIP bundles with .proto / .avsc files and reuse them in
            decoding configs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["schema-bundles"] })
            }
            disabled={bundlesQuery.isFetching}
            className="gap-2"
          >
            <RefreshCw
              size={16}
              className={bundlesQuery.isFetching ? "animate-spin" : ""}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Upload + Search */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <Card className="border-border/60 shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileUp size={16} />
              Upload ZIP
            </CardTitle>
            <CardDescription>
              Drag & drop a ZIP file or click to upload.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <ZipDropzone
              isUploading={uploadMutation.isPending}
              onFile={onPickZip}
            />

            <Separator />

            <div className="space-y-2">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Search
              </div>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by bundleId or sha256..."
                className="bg-background"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Archive size={16} />
              Bundles
              <Badge variant="outline" className="text-[10px] ml-2">
                {filtered.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              Select a bundle to preview contents. Delete is optional (careful:
              streams may reference it).
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {bundlesQuery.isLoading && (
              <div className="text-sm text-muted-foreground">
                Loading bundles...
              </div>
            )}

            {bundlesQuery.isError && (
              <div className="text-sm text-destructive">
                Failed to load bundles: {(bundlesQuery.error as any)?.message}
              </div>
            )}

            {!bundlesQuery.isLoading && filtered.length === 0 && (
              <div className="text-sm text-muted-foreground">
                No bundles found.
              </div>
            )}

            <div className="space-y-2">
              {filtered.map((b) => (
                <div
                  key={b.bundleId}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-muted/10"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs truncate">
                        {b.bundleId}
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        {b.fileCount} files
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {formatBytes(b.sizeBytes)}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono truncate">
                      sha256: {b.sha256}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => setPreviewBundleId(b.bundleId)}
                    >
                      <Eye size={14} />
                      Preview
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      className="gap-2"
                      onClick={() => deleteMutation.mutate(b.bundleId)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 size={14} />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <SchemaBundleDetailsDialog
        bundleId={previewBundleId}
        open={!!previewBundleId}
        onOpenChange={(o: boolean) => !o && setPreviewBundleId(null)}
      />
    </main>
  );
}

function ZipDropzone({
  isUploading,
  onFile,
}: {
  isUploading: boolean;
  onFile: (file: File) => void | Promise<void>;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [isOver, setIsOver] = React.useState(false);

  const onPick = () => inputRef.current?.click();

  const handleFile = (file: File | null | undefined) => {
    if (!file) return;
    void onFile(file);
  };

  return (
    <div
      className={[
        "rounded-xl border border-dashed p-4 transition-colors",
        isOver ? "border-primary bg-primary/5" : "border-border bg-muted/10",
      ].join(" ")}
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOver(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOver(false);
        const f = e.dataTransfer.files?.[0];
        handleFile(f);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".zip,application/zip"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <FileUp size={18} className={isUploading ? "animate-pulse" : ""} />
        </div>
        <div className="space-y-1">
          <div className="text-sm font-medium">Drag & drop ZIP here</div>
          <div className="text-xs text-muted-foreground">
            or{" "}
            <button
              type="button"
              onClick={onPick}
              className="underline underline-offset-4 text-primary"
              disabled={isUploading}
            >
              click to upload
            </button>
          </div>
          {isUploading && (
            <div className="text-xs text-muted-foreground">Uploading…</div>
          )}
        </div>
      </div>
    </div>
  );
}
