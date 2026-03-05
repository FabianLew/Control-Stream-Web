"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getConnection, updateConnectionById } from "@/lib/api/connections";
import type { ConnectionUpsertPayload } from "@/types/connection";
import { handleValidSubmit } from "@/components/lib/formError";

import { ConnectionForm } from "@/components/connection/ConnectionForm";

export interface EditConnectionDialogProps {
  connectionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditConnectionDialog({
  connectionId,
  open,
  onOpenChange,
}: EditConnectionDialogProps) {
  const queryClient = useQueryClient();

  const { data: connection, isLoading, isError } = useQuery({
    queryKey: ["connection-detail", connectionId],
    queryFn: () => getConnection(connectionId!),
    enabled: !!connectionId && open,
    staleTime: 0,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: ConnectionUpsertPayload) =>
      updateConnectionById(connectionId!, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["connections"] });
      await queryClient.invalidateQueries({
        queryKey: ["connection-detail", connectionId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["connection", connectionId],
      });

      // Close dialog first, then show toast (next frame)
      onOpenChange(false);
      requestAnimationFrame(() => {
        handleValidSubmit({
          title: "Connection Updated Successfully",
          description: "Your changes have been saved.",
        });
      });
    },
    onError: () => {
      toast.error("Connection not saved", {
        description: "Something went wrong. Please check inputs and try again.",
      });
    },
  });

  const submit = async (payload: ConnectionUpsertPayload) => {
    await updateMutation.mutateAsync(payload);
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
          {isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-10 w-1/2" />
              <Skeleton className="h-64 w-full" />
            </div>
          )}

          {isError && (
            <div className="text-sm text-destructive">
              Failed to load connection data. Please try again.
            </div>
          )}

          {connection && (
            <ConnectionForm
              key={open ? connectionId! : undefined}
              mode="edit"
              initialData={connection}
              onSubmit={submit}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
