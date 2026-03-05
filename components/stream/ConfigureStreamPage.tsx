"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Settings2 } from "lucide-react";
import { toast } from "sonner";

import { getStreamOverview, updateStream } from "@/lib/api/streams";
import type { EditStreamCommand } from "@/types/stream";
import { StreamForm } from "@/components/stream/StreamForm";
import { Skeleton } from "@/components/ui/skeleton";
import { StreamTypeBadge } from "@/components/shared/StreamTypeBadge";

interface Props {
  streamId: string;
}

export function ConfigureStreamPage({ streamId }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: stream,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["stream-overview", streamId],
    queryFn: () => getStreamOverview(streamId),
  });

  const updateMutation = useMutation({
    mutationFn: (command: EditStreamCommand) =>
      updateStream({ id: streamId, command }),
    onSuccess: async () => {
      // Invalidate both the list and the overview cache
      await queryClient.invalidateQueries({ queryKey: ["streams"] });
      await queryClient.invalidateQueries({
        queryKey: ["stream-overview", streamId],
      });

      toast.success("Stream updated", {
        description: "Configuration changes have been saved.",
      });

      router.push(`/streams/${streamId}`);
    },
    onError: () => {
      toast.error("Failed to update stream", {
        description: "Please check the configuration and try again.",
      });
    },
  });

  const handleSubmit = async (command: EditStreamCommand) => {
    await updateMutation.mutateAsync(command);
  };

  const handleCancel = () => {
    router.push(`/streams/${streamId}`);
  };

  if (isLoading) {
    return <ConfigureSkeleton />;
  }

  if (isError || !stream) {
    return (
      <div className="p-8 text-destructive">Failed to load stream data.</div>
    );
  }

  // StreamOverviewDto is compatible with mapStreamDtoToFormValues —
  // correlationKeyType is inferred from stream.type when missing.
  const streamAsDto = stream as any;

  return (
    <div className="min-h-screen bg-background p-6 md:p-8 space-y-6 fade-in">
      {/* Header */}
      <div className="space-y-4">
        <Link
          href={`/streams/${streamId}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft
            size={16}
            className="mr-1 group-hover:-translate-x-1 transition-transform"
          />
          Back to Stream
        </Link>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border pb-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <Settings2 size={20} className="text-muted-foreground" />
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                Configure Stream
              </h1>
              <StreamTypeBadge
                type={stream.type}
                className="text-sm px-2.5 py-0.5 border-2"
              />
            </div>
            <p className="text-muted-foreground text-sm">
              Editing{" "}
              <span className="font-medium text-foreground">{stream.name}</span>
              {" · "}
              <span className="font-mono text-xs">{stream.technicalName}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <StreamForm
        mode="edit"
        stream={streamAsDto}
        navigateAfterSubmit={false}
        onCancel={handleCancel}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

function ConfigureSkeleton() {
  return (
    <div className="p-8 space-y-6 min-h-screen">
      <Skeleton className="h-4 w-32" />
      <div className="space-y-2 border-b pb-5">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Skeleton className="h-[320px] rounded-xl" />
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-[440px] rounded-xl" />
          <Skeleton className="h-[260px] rounded-xl" />
        </div>
      </div>
    </div>
  );
}
