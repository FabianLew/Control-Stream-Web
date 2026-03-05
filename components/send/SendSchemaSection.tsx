"use client";

import {
  SchemaRegistrySchemaSelect,
} from "@/components/viewer/SchemaRegistrySchemaSelect";
import { AvroSchemaSelect } from "@/components/viewer/AvroSchemaSelect";
import { ProtoMessageTypeSelect } from "@/components/viewer/ProtoMessageTypeSelect";
import type { PayloadDecodingConfigDto } from "@/types/decoding";
import type { SchemaSelectionDto } from "@/types/replay";

// ── Shared state type ────────────────────────────────────────────────────────

export interface SchemaSelectionState {
  schemaId: number | null;        // Schema Registry
  schemaPath: string | null;      // AVRO FILES
  messageFullName: string | null; // PROTO FILES
}

export const emptySchemaState: SchemaSelectionState = {
  schemaId: null,
  schemaPath: null,
  messageFullName: null,
};

// ── Helper: is required schema selection missing? ────────────────────────────

export function computeSchemaMissing(
  decoding: PayloadDecodingConfigDto | null | undefined,
  state: SchemaSelectionState
): boolean {
  if (!decoding) return false;
  const { schemaSource, formatHint, protoFiles } = decoding;
  if (schemaSource === "SCHEMA_REGISTRY") return state.schemaId == null;
  if (schemaSource === "FILES" && formatHint === "AVRO") return state.schemaPath == null;
  if (schemaSource === "FILES" && formatHint === "PROTO")
    return state.messageFullName == null;
  return false;
}

// ── Helper: build schema object for SendRequestDto ───────────────────────────

export function buildSchemaRequest(
  decoding: PayloadDecodingConfigDto | null | undefined,
  state: SchemaSelectionState
): SchemaSelectionDto | null {
  if (!decoding) return null;
  const { schemaSource, formatHint } = decoding;
  if (schemaSource === "SCHEMA_REGISTRY" && state.schemaId != null)
    return { schemaId: state.schemaId };
  if (schemaSource === "FILES" && formatHint === "AVRO" && state.schemaPath != null)
    return { schemaPath: state.schemaPath };
  if (schemaSource === "FILES" && formatHint === "PROTO" && state.messageFullName != null)
    return { messageFullName: state.messageFullName };
  return null;
}

// ── Helper: build proto type-routing header to inject at send time ────────────

export function buildProtoHeaderInjection(
  decoding: PayloadDecodingConfigDto | null | undefined,
  state: SchemaSelectionState
): { name: string; value: string } | null {
  if (!decoding) return null;
  const { schemaSource, formatHint, protoFiles } = decoding;
  if (
    schemaSource === "FILES" &&
    formatHint === "PROTO" &&
    protoFiles?.typeHeaderName &&
    state.messageFullName != null
  ) {
    const prefix = protoFiles.typeHeaderValuePrefix ?? "";
    return { name: protoFiles.typeHeaderName, value: prefix + state.messageFullName };
  }
  return null;
}

// ── Rendering component ───────────────────────────────────────────────────────

interface Props {
  streamId: string | null;
  decoding: PayloadDecodingConfigDto | null | undefined;
  value: SchemaSelectionState;
  onChange: (state: SchemaSelectionState) => void;
  disabled?: boolean;
}

export function SendSchemaSection({ streamId, decoding, value, onChange, disabled }: Props) {
  const schemaSource = decoding?.schemaSource ?? "NONE";
  const formatHint = decoding?.formatHint ?? "AUTO";
  const protoFiles = decoding?.protoFiles;

  const isSR = schemaSource === "SCHEMA_REGISTRY";
  const isAvroFiles = schemaSource === "FILES" && formatHint === "AVRO";
  const isProtoFiles = schemaSource === "FILES" && formatHint === "PROTO";

  if (!isSR && !isAvroFiles && !isProtoFiles) return null;
  if (!streamId) return null;

  return (
    <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-4">
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {isProtoFiles ? "Message Type" : "Schema"}{" "}
        <span className="text-destructive">*</span>
      </div>

      {isSR && (
        <SchemaRegistrySchemaSelect
          streamId={streamId}
          value={value.schemaId}
          onChange={(schemaId) => onChange({ ...value, schemaId })}
          disabled={disabled}
        />
      )}

      {isAvroFiles && (
        <AvroSchemaSelect
          streamId={streamId}
          value={value.schemaPath}
          onChange={(schemaPath) => onChange({ ...value, schemaPath })}
          disabled={disabled}
        />
      )}

      {isProtoFiles && (
        <>
          <ProtoMessageTypeSelect
            streamId={streamId}
            value={value.messageFullName}
            onChange={(messageFullName) => onChange({ ...value, messageFullName })}
            disabled={disabled}
          />
          {protoFiles?.typeHeaderName && (
            <p className="text-xs text-muted-foreground/70 pt-0.5">
              Sets header{" "}
              <code className="font-mono text-foreground/80">{protoFiles.typeHeaderName}</code>{" "}
              automatically.
            </p>
          )}
        </>
      )}
    </div>
  );
}
