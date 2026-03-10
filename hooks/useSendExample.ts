// hooks/useSendExample.ts
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { getSendExample } from "@/lib/api/replay";
import type { ExamplePayloadDto, GetExampleParams } from "@/types/replay";
import type { PayloadDecodingConfigDto } from "@/types/decoding";
import type { SchemaSelectionState } from "@/components/send/SendSchemaSection";

// ─── Result type ─────────────────────────────────────────────────────────────

export type BuildParamsResult =
  | { ok: true; params: GetExampleParams }
  | { ok: false; error: string };

// ─── Param builder ────────────────────────────────────────────────────────────

/**
 * Validates the current stream / schema context and returns either the correct
 * query params for GET /api/send/streams/{id}/example, or an error message
 * explaining what the user still needs to select.
 *
 * Rules by decoding mode:
 *   SCHEMA_REGISTRY  → schemaId required
 *   FILES + AVRO     → schemaPath required
 *   FILES + PROTO    → messageFullName (user-selected or from fixedMessageFullName)
 *   everything else  → no extra params needed
 */
export function buildExampleRequestParams(
  streamId: string | null,
  decoding: PayloadDecodingConfigDto | null | undefined,
  schemaState: SchemaSelectionState
): BuildParamsResult {
  if (!streamId) {
    return { ok: false, error: "Select a stream first." };
  }

  const schemaSource = decoding?.schemaSource ?? "NONE";
  const formatHint = decoding?.formatHint ?? "AUTO";

  if (schemaSource === "SCHEMA_REGISTRY") {
    if (schemaState.schemaId == null) {
      return { ok: false, error: "Select a schema to generate an example." };
    }
    return { ok: true, params: { streamId, schemaId: schemaState.schemaId } };
  }

  if (schemaSource === "FILES" && formatHint === "AVRO") {
    if (schemaState.schemaPath == null) {
      return {
        ok: false,
        error: "Select an Avro schema to generate an example.",
      };
    }
    return { ok: true, params: { streamId, schemaPath: schemaState.schemaPath } };
  }

  if (schemaSource === "FILES" && formatHint === "PROTO") {
    // Fixed single-type stream — backend infers from stream config, but we pass
    // the name explicitly so backend doesn't need to re-resolve the bundle.
    const fixedName = decoding?.protoFiles?.fixedMessageFullName;
    if (fixedName) {
      return { ok: true, params: { streamId, messageFullName: fixedName } };
    }
    // Multi-type stream — user must pick from the message type selector.
    if (schemaState.messageFullName == null) {
      return {
        ok: false,
        error: "Select a message type to generate an example.",
      };
    }
    return {
      ok: true,
      params: { streamId, messageFullName: schemaState.messageFullName },
    };
  }

  // NONE / AUTO / JSON / TEXT / BINARY — no schema params required.
  return { ok: true, params: { streamId } };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * React Query mutation that fetches a schema-aware example payload from the
 * backend.  Error toasts are handled internally so callers only need to react
 * to success.
 *
 * Reusable in both the Send page and the Replay modal.
 *
 * @example
 * const exampleMutation = useSendExample((result) => {
 *   setPayloadJson(result.payloadJson);
 *   setNotes(result.notes);
 * });
 * exampleMutation.mutate(params);
 */
export function useSendExample(
  onSuccess: (result: ExamplePayloadDto) => void
) {
  return useMutation({
    mutationFn: (params: GetExampleParams) => getSendExample(params),
    onSuccess,
    onError: (err: Error) => {
      toast.error("Failed to generate example", {
        description: err.message ?? "Please try again.",
      });
    },
  });
}
