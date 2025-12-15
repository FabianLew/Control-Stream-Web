"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getSchemaBundleDetails } from "@/components/lib/api/schemaBundles";

type Props = {
  bundleId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SchemaBundlePreviewDialog({
  bundleId,
  open,
  onOpenChange,
}: Props) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["schema-bundle-details", bundleId],
    queryFn: () => getSchemaBundleDetails(bundleId as string),
    enabled: open && !!bundleId,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[760px] w-[calc(100vw-2rem)] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm">{bundleId}</DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="text-sm text-muted-foreground">Loading...</div>
        )}
        {error && (
          <div className="text-sm text-destructive">
            Failed to load bundle details.
          </div>
        )}

        {data && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground">sha256:</span>{" "}
                <span className="font-mono">{data.sha256}</span>
              </div>
              <div>
                <span className="text-muted-foreground">files:</span>{" "}
                {data.fileCount}
              </div>
              <div>
                <span className="text-muted-foreground">size:</span>{" "}
                {data.sizeBytes} bytes
              </div>
              <div>
                <span className="text-muted-foreground">uploadedAt:</span>{" "}
                <span className="font-mono">{data.uploadedAt}</span>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <div className="text-xs font-semibold mb-2">Files</div>
              <ul className="space-y-1 text-xs font-mono">
                {data.files.map((f) => (
                  <li key={f} className="truncate">
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
