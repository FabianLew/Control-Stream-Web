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
import { getAvroSupportedSchemas } from "@/lib/api/replay";

export function useAvroSupportedSchemas(streamId: string | undefined) {
  return useQuery({
    queryKey: ["avro-schemas", streamId],
    queryFn: () => getAvroSupportedSchemas(streamId!),
    enabled: !!streamId,
    staleTime: 60_000,
  });
}

interface AvroSchemaSelectProps {
  streamId: string;
  value: string | null;
  onChange: (schemaPath: string | null) => void;
  disabled?: boolean;
}

export function AvroSchemaSelect({
  streamId,
  value,
  onChange,
  disabled,
}: AvroSchemaSelectProps) {
  const { data: schemas, isLoading, isError } = useAvroSupportedSchemas(streamId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-1.5">
        <Loader2 size={12} className="animate-spin" />
        Loading Avro schemas…
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-xs text-destructive py-1">
        Failed to load Avro schemas.
      </p>
    );
  }

  if (!schemas || schemas.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-1">
        No Avro schemas found for this stream.
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
        <SelectValue placeholder="Select an Avro schema…" />
      </SelectTrigger>
      <SelectContent>
        {schemas.map((s) => (
          <SelectItem
            key={s.schemaPath}
            value={s.schemaPath}
            className="text-xs font-mono"
          >
            {s.displayName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
