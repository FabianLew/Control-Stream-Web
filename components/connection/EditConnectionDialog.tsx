"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { ConnectionDto } from "@/types/connection";

import { ConnectionForm } from "@/components/connection/ConnectionForm";

export interface EditConnectionDialogProps {
  connectionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

async function fetchConnection(id: string): Promise<ConnectionDto> {
  const res = await fetch(`/api/connections/${id}`);
  if (!res.ok) throw new Error("Failed to fetch connection");
  return res.json();
}

export function EditConnectionDialog({
  connectionId,
  open,
  onOpenChange,
}: EditConnectionDialogProps) {
  const [connection, setConnection] = useState<ConnectionDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !connectionId) return;

    setLoading(true);
    setErr(null);
    setConnection(null);

    fetchConnection(connectionId)
      .then(setConnection)
      .catch((e) => setErr(e instanceof Error ? e.message : "Unknown error"))
      .finally(() => setLoading(false));
  }, [open, connectionId]);

  const initialData = useMemo(() => {
    if (!connection) return null;
    return {
      id: connection.id,
      name: connection.name,
      type: connection.type as any,
      config: connection.config as any,
    };
  }, [connection]);

  const submit = async (payload: any) => {
    if (!connectionId) return;

    const res = await fetch(`/api/connections/${connectionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error("Failed to update connection");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-[900px] h-[90vh] p-0 overflow-y-auto">
        <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur px-6 py-4">
          <DialogHeader className="space-y-1">
            <DialogTitle>Edit Connection</DialogTitle>
            <DialogDescription>
              Update connection configuration and save.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-6">
          {loading && (
            <div className="space-y-3">
              <Skeleton className="h-10 w-1/2" />
              <Skeleton className="h-64 w-full" />
            </div>
          )}

          {err && <div className="text-sm text-destructive">{err}</div>}

          {initialData && (
            <ConnectionForm
              mode="edit"
              initialData={initialData}
              navigateAfterSubmit={false}
              onSubmit={submit}
              onSubmittedSuccessfully={() => onOpenChange(false)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
