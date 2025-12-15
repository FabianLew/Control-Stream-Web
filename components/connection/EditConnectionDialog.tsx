"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ConnectionDto } from "@/types/connection";
import { ConnectionForm } from "@/components/connection/CreateConnectionForm";

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] bg-background border-border">
        <DialogHeader>
          <DialogTitle>Edit Connection</DialogTitle>
          <DialogDescription>
            Update connection configuration and save.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-64 w-full" />
          </div>
        )}

        {err && <div className="text-sm text-destructive">{err}</div>}

        {connection && (
          <ConnectionForm
            initialData={{
              id: connection.id,
              name: connection.name,
              type: connection.type,
              config: connection.config as any,
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
