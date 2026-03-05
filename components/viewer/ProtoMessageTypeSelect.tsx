"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getProtoSupportedMessageTypes } from "@/lib/api/replay";

export function useProtoSupportedMessageTypes(streamId: string | undefined) {
  return useQuery({
    queryKey: ["proto-message-types", streamId],
    queryFn: () => getProtoSupportedMessageTypes(streamId!),
    enabled: !!streamId,
    staleTime: 60_000,
  });
}

interface ProtoMessageTypeSelectProps {
  streamId: string;
  value: string | null;
  onChange: (messageFullName: string | null) => void;
  disabled?: boolean;
}

export function ProtoMessageTypeSelect({
  streamId,
  value,
  onChange,
  disabled,
}: ProtoMessageTypeSelectProps) {
  const { data: types, isLoading, isError } = useProtoSupportedMessageTypes(streamId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-1.5">
        <Loader2 size={12} className="animate-spin" />
        Loading message types…
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-xs text-destructive py-1">
        Failed to load supported message types.
      </p>
    );
  }

  if (!types || types.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-1">
        No message types found.
      </p>
    );
  }

  return (
    <Select
      value={value ?? ""}
      onValueChange={(v) => onChange(v || null)}
      disabled={disabled}
    >
      <SelectTrigger className="h-8 text-xs font-mono">
        <SelectValue placeholder="Select a message type…" />
      </SelectTrigger>
      <SelectContent>
        {types.map((t) => (
          <SelectItem
            key={t.messageFullName}
            value={t.messageFullName}
            className="text-xs font-mono"
          >
            {t.displayName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
