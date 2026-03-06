"use client";

import { useEffect } from "react";
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
import {
  filterProtoDependencyTypes,
  isProtoDependencyType,
} from "@/lib/proto/protoFilter";

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
  const { data: types, isLoading, isError } =
    useProtoSupportedMessageTypes(streamId);

  // Filter out technical dependency types — only show domain business events.
  const domainTypes = filterProtoDependencyTypes(types ?? []);

  // Safe selection reset: if a previously-selected value is a dependency type
  // (e.g. from stale state or a backend that used to expose them), clear it so
  // the user is not stuck with a hidden/invalid option.
  useEffect(() => {
    if (value != null && isProtoDependencyType(value)) {
      onChange(null);
    }
    // We only need to react to `value` changing; onChange identity is irrelevant.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

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

  if (domainTypes.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-1">
        {types && types.length > 0
          ? // Backend returned types but all were filtered as dependency-only.
            "No domain message types available for this stream."
          : // Backend returned an empty list.
            "No message types found."}
      </p>
    );
  }

  // True when the backend returned types that were filtered away from the list.
  const hadFiltered = (types?.length ?? 0) > domainTypes.length;

  return (
    <div className="space-y-1">
      <Select
        value={value ?? ""}
        onValueChange={(v) => onChange(v || null)}
        disabled={disabled}
      >
        <SelectTrigger className="h-8 text-xs font-mono">
          <SelectValue placeholder="Select a message type…" />
        </SelectTrigger>
        <SelectContent>
          {domainTypes.map((t) => (
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

      {hadFiltered && (
        <p className="text-[11px] text-muted-foreground/60">
          Only domain event types are shown.
        </p>
      )}
    </div>
  );
}
