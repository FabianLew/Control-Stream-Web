"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Settings2 } from "lucide-react";
import { toast } from "sonner";

import { getConnection, updateConnectionById } from "@/lib/api/connections";
import type { ConnectionUpsertPayload } from "@/types/connection";
import { StreamTypeBadge } from "@/components/shared/StreamTypeBadge";
import { ConnectionForm } from "@/components/connection/ConnectionForm";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  connectionId: string;
}

export function ConfigureConnectionPage({ connectionId }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: connection,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["connection-detail", connectionId],
    queryFn: () => getConnection(connectionId),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: ConnectionUpsertPayload) =>
      updateConnectionById(connectionId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["connections"] });
      await queryClient.invalidateQueries({
        queryKey: ["connection-detail", connectionId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["connection", connectionId],
      });

      toast.success("Connection updated", {
        description: "Configuration changes have been saved.",
      });

      router.push(`/connections/${connectionId}`);
    },
    onError: () => {
      toast.error("Failed to update connection", {
        description: "Please check the configuration and try again.",
      });
    },
  });

  const handleSubmit = async (payload: ConnectionUpsertPayload) => {
    await updateMutation.mutateAsync(payload);
  };

  const handleCancel = () => {
    router.push(`/connections/${connectionId}`);
  };

  if (isLoading) {
    return <ConfigureSkeleton />;
  }

  if (isError || !connection) {
    return (
      <div className="p-8 text-destructive">
        Failed to load connection data.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-8 space-y-6 fade-in">
      {/* Header */}
      <div className="space-y-4">
        <Link
          href={`/connections/${connectionId}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft
            size={16}
            className="mr-1 group-hover:-translate-x-1 transition-transform"
          />
          Back to Connection
        </Link>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border pb-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <Settings2 size={20} className="text-muted-foreground" />
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                Configure Connection
              </h1>
              <StreamTypeBadge
                type={connection.type as any}
                className="text-sm px-2.5 py-0.5 border-2"
              />
            </div>
            <p className="text-muted-foreground text-sm">
              Editing{" "}
              <span className="font-medium text-foreground">
                {connection.name}
              </span>
              {" · "}
              <span className="font-mono text-xs text-muted-foreground">
                {String(connection.id)}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Form — mounts only after data arrives, so useMemo gets the correct initial values */}
      <ConnectionForm
        mode="edit"
        initialData={connection}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}

function ConfigureSkeleton() {
  return (
    <div className="p-8 space-y-6 min-h-screen">
      <Skeleton className="h-4 w-32" />
      <div className="space-y-2 border-b pb-5">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <Skeleton className="h-[260px] rounded-xl" />
          <Skeleton className="h-[100px] rounded-xl" />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-[440px] rounded-xl" />
        </div>
      </div>
    </div>
  );
}
