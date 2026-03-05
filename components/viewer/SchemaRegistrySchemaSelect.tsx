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
import { getSchemaRegistrySchemas } from "@/lib/api/replay";

export function useSchemaRegistrySchemas(streamId: string | undefined) {
  return useQuery({
    queryKey: ["schema-registry-schemas", streamId],
    queryFn: () => getSchemaRegistrySchemas(streamId!),
    enabled: !!streamId,
    staleTime: 60_000,
  });
}

interface SchemaRegistrySchemaSelectProps {
  streamId: string;
  value: number | null;
  onChange: (schemaId: number | null) => void;
  disabled?: boolean;
}

export function SchemaRegistrySchemaSelect({
  streamId,
  value,
  onChange,
  disabled,
}: SchemaRegistrySchemaSelectProps) {
  const { data: schemas, isLoading, isError } = useSchemaRegistrySchemas(streamId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-1.5">
        <Loader2 size={12} className="animate-spin" />
        Loading schemas…
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-xs text-destructive py-1">
        Failed to load schemas from Schema Registry.
      </p>
    );
  }

  if (!schemas || schemas.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-1">
        No schemas found in Schema Registry.
      </p>
    );
  }

  return (
    <Select
      value={value != null ? String(value) : ""}
      onValueChange={(v) => onChange(v ? Number(v) : null)}
      disabled={disabled}
    >
      <SelectTrigger className="h-8 text-xs font-mono">
        <SelectValue placeholder="Select a schema…" />
      </SelectTrigger>
      <SelectContent>
        {schemas.map((schema) => (
          <SelectItem
            key={schema.schemaId}
            value={String(schema.schemaId)}
            className="text-xs font-mono"
          >
            {schema.displayName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
