"use client";

import * as React from "react";
import type { UnifiedStreamDto, EditStreamCommand } from "@/types/stream";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { StreamTypeBadge } from "@/components/shared/StreamTypeBadge";
import { StreamForm } from "@/components/stream/StreamForm";

type Props = {
  stream: UnifiedStreamDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, command: EditStreamCommand) => Promise<void>;
};

export function EditStreamDialog({
  stream,
  open,
  onOpenChange,
  onSave,
}: Props) {
  if (!stream) return null;

  const initialValues: Partial<any> = {
    name: stream.name ?? "",
    type: stream.type,
    connectionId: stream.connectionId,
    technicalName: stream.technicalName ?? "",
    correlationKeyType: stream.correlationKeyType,
    correlationKeyName: stream.correlationKeyName ?? "",
    vendorConfig: stream.vendorConfig,
    decoding: stream.decoding ?? { schemaSource: "NONE", formatHint: "AUTO" },
  };

  const submit = async (payload: EditStreamCommand) => {
    await onSave(stream.id, payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          w-[calc(100vw-2rem)]
          max-w-[860px]
          h-[90vh]
          p-0
          overflow-y-auto
        "
      >
        {/* Sticky header */}
        <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur px-6 py-4">
          <DialogHeader className="space-y-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  Edit Stream <StreamTypeBadge type={stream.type} />
                </DialogTitle>
                <DialogDescription>
                  Update stream configuration. Technical fields are the source
                  of truth.
                </DialogDescription>
              </div>

              <Badge variant="outline" className="font-mono text-[10px]">
                {stream.id}
              </Badge>
            </div>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <StreamForm
            mode="edit"
            stream={stream}
            initialValues={initialValues}
            navigateAfterSubmit={false}
            onSubmit={submit}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
