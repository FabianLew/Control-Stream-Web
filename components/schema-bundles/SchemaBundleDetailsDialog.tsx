// /components/schema-bundles/SchemaBundleDetailsDialog.tsx
"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Hash, Calendar, Boxes } from "lucide-react";

import { getSchemaBundleDetails } from "@/components/lib/api/schemaBundles";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export function SchemaBundleDetailsDialog({
  bundleId,
  open,
  onOpenChange,
}: {
  bundleId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const detailsQuery = useQuery({
    queryKey: ["schema-bundles", "details", bundleId],
    queryFn: () => getSchemaBundleDetails(bundleId!),
    enabled: open && !!bundleId,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] w-[calc(100vw-2rem)] max-h-[85vh] overflow-hidden p-0">
        <div className="p-6 pb-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Bundle Preview
              {bundleId && (
                <Badge variant="outline" className="font-mono text-[10px]">
                  {bundleId}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Files contained in the uploaded ZIP bundle.
            </DialogDescription>
          </DialogHeader>
        </div>

        <Separator />

        <div className="p-6 pt-4 space-y-4 overflow-auto max-h-[70vh]">
          {detailsQuery.isLoading && (
            <div className="text-sm text-muted-foreground">
              Loading details…
            </div>
          )}

          {detailsQuery.isError && (
            <div className="text-sm text-destructive">
              Failed to load: {(detailsQuery.error as any)?.message}
            </div>
          )}

          {detailsQuery.data && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Meta
                  icon={<Hash size={14} />}
                  label="sha256"
                  value={detailsQuery.data.sha256}
                  mono
                />
                <Meta
                  icon={<Boxes size={14} />}
                  label="fileCount"
                  value={String(detailsQuery.data.fileCount)}
                  mono
                />
                <Meta
                  icon={<Calendar size={14} />}
                  label="uploadedAt"
                  value={detailsQuery.data.uploadedAt}
                  mono
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <FileText size={12} /> Files
                </div>

                <div className="rounded-lg border border-border bg-muted/10 p-3">
                  <ul className="space-y-1">
                    {detailsQuery.data.files.map((f) => (
                      <li
                        key={f}
                        className="font-mono text-xs text-foreground/90 truncate"
                      >
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Meta({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/10 p-3">
      <div className="text-[11px] text-muted-foreground flex items-center gap-2">
        {icon}
        {label}
      </div>
      <div
        className={mono ? "font-mono text-xs mt-1 break-all" : "text-sm mt-1"}
      >
        {value}
      </div>
    </div>
  );
}
