"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertCircle, Loader2, Wand2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getStreams } from "@/lib/api/streams";
import { sendReplayMessage } from "@/lib/api/replay";
import { useSchemaRegistrySchemas } from "@/components/viewer/SchemaRegistrySchemaSelect";
import { useAvroSupportedSchemas } from "@/components/viewer/AvroSchemaSelect";
import { useProtoSupportedMessageTypes } from "@/components/viewer/ProtoMessageTypeSelect";
import { StreamTypeBadge } from "@/components/shared/StreamTypeBadge";
import {
  HeaderKeyValueEditor,
  type HeaderEntry,
} from "@/components/shared/HeaderKeyValueEditor";
import {
  SendSchemaSection,
  emptySchemaState,
  computeSchemaMissing,
  buildSchemaRequest,
  buildProtoHeaderInjection,
  type SchemaSelectionState,
} from "@/components/send/SendSchemaSection";

function entriesToRecord(entries: HeaderEntry[]): Record<string, string> {
  return Object.fromEntries(
    entries.filter((e) => e.key.trim() !== "").map((e) => [e.key.trim(), e.value])
  );
}

const INITIAL_PAYLOAD = "{}";

// ── Example payload helpers ───────────────────────────────────────────────────

function isPayloadMeaningful(payload: string): boolean {
  const t = payload.trim();
  return t !== "" && t !== "{}";
}

function buildExamplePayload(
  schemaSource: string,
  formatHint: string,
  messageFullName: string | null
): Record<string, unknown> {
  const createdAt = "2026-01-01T00:00:00Z";

  if (schemaSource === "FILES" && formatHint === "PROTO") {
    const name = messageFullName ?? "";
    const base: Record<string, unknown> = { id: "example-1", count: 1, createdAt };
    if (name.includes("Order")) return { ...base, orderId: "order-1", amount: 99.99 };
    if (name.includes("Payment")) return { ...base, amount: 99.99, currency: "USD" };
    return base;
  }

  if (schemaSource === "FILES" && formatHint === "AVRO") {
    return { id: "example-1", amount: 12.34, createdAt };
  }

  if (schemaSource === "SCHEMA_REGISTRY") {
    return { id: "example-1", amount: 12.34, createdAt };
  }

  // JSON / NONE / default
  return { type: "EXAMPLE_EVENT", id: "example-1", createdAt };
}

export default function SendPage() {
  const [selectedStreamId, setSelectedStreamId] = useState<string | null>(null);
  const [payloadJson, setPayloadJson] = useState(INITIAL_PAYLOAD);
  const [messageKey, setMessageKey] = useState("");
  const [correlationId, setCorrelationId] = useState("");
  const [headerEntries, setHeaderEntries] = useState<HeaderEntry[]>([]);
  const [schemaState, setSchemaState] = useState<SchemaSelectionState>(emptySchemaState);

  // --- Streams list ---
  const { data: streams, isLoading: streamsLoading } = useQuery({
    queryKey: ["streams"],
    queryFn: getStreams,
    staleTime: 60_000,
  });

  const selectedStream = useMemo(
    () => streams?.find((s) => s.id === selectedStreamId) ?? null,
    [streams, selectedStreamId]
  );

  const decoding = selectedStream?.decoding;
  const schemaSource = decoding?.schemaSource ?? "NONE";
  const formatHint = decoding?.formatHint ?? "AUTO";
  const protoFiles = decoding?.protoFiles;

  const isSchemaRegistry = schemaSource === "SCHEMA_REGISTRY";
  const isAvroFiles = schemaSource === "FILES" && formatHint === "AVRO";
  const isProtoFiles = schemaSource === "FILES" && formatHint === "PROTO";

  const isKafka = selectedStream?.type === "KAFKA";
  const showCorrelationInput =
    selectedStream?.correlationKeyType === "HEADER" && !!selectedStream.correlationKeyName;
  const correlationHeaderName = selectedStream?.correlationKeyName ?? "";

  // --- Dependent schema/type queries for auto-selection ---
  const srQuery = useSchemaRegistrySchemas(
    isSchemaRegistry ? (selectedStreamId ?? undefined) : undefined
  );
  const avroQuery = useAvroSupportedSchemas(
    isAvroFiles ? (selectedStreamId ?? undefined) : undefined
  );
  const protoQuery = useProtoSupportedMessageTypes(
    isProtoFiles ? (selectedStreamId ?? undefined) : undefined
  );

  // Reset schema state when stream changes
  useEffect(() => {
    setSchemaState(emptySchemaState);
  }, [selectedStreamId]);

  // Auto-select SR: highest version first
  useEffect(() => {
    const data = srQuery.data;
    if (isSchemaRegistry && data?.length && schemaState.schemaId == null) {
      const sorted = [...data].sort((a, b) => b.version - a.version);
      setSchemaState((prev) => ({ ...prev, schemaId: sorted[0].schemaId }));
    }
  }, [isSchemaRegistry, srQuery.data, schemaState.schemaId]);

  // Auto-select AVRO: first option (trust backend ordering)
  useEffect(() => {
    const data = avroQuery.data;
    if (isAvroFiles && data?.length && schemaState.schemaPath == null) {
      setSchemaState((prev) => ({ ...prev, schemaPath: data[0].schemaPath }));
    }
  }, [isAvroFiles, avroQuery.data, schemaState.schemaPath]);

  // Auto-select Proto: first option
  useEffect(() => {
    const data = protoQuery.data;
    if (isProtoFiles && data?.length && schemaState.messageFullName == null) {
      setSchemaState((prev) => ({ ...prev, messageFullName: data[0].messageFullName }));
    }
  }, [isProtoFiles, protoQuery.data, schemaState.messageFullName]);

  // --- JSON validation ---
  const jsonError = useMemo(() => {
    if (!payloadJson.trim()) return null;
    try {
      JSON.parse(payloadJson);
      return null;
    } catch (e) {
      return (e as Error).message;
    }
  }, [payloadJson]);

  const isJsonValid = payloadJson.trim() !== "" && jsonError === null;

  // --- Mutation ---
  const sendMutation = useMutation({ mutationFn: sendReplayMessage });
  const isPending = sendMutation.isPending;

  // --- Disabled state ---
  const isSendDisabled =
    !selectedStreamId ||
    !isJsonValid ||
    computeSchemaMissing(decoding, schemaState) ||
    isPending;

  // --- Actions ---
  const handleLoadExample = () => {
    if (
      isPayloadMeaningful(payloadJson) &&
      !window.confirm("Replace current payload with an example?")
    ) {
      return;
    }
    const example = buildExamplePayload(schemaSource, formatHint, schemaState.messageFullName);
    setPayloadJson(JSON.stringify(example, null, 2));
    // Pre-fill correlation ID from the example's id field if the input is empty
    if (showCorrelationInput && !correlationId.trim() && "id" in example) {
      setCorrelationId(String(example.id));
    }
  };

  const handleFormatJson = () => {
    try {
      setPayloadJson(JSON.stringify(JSON.parse(payloadJson), null, 2));
    } catch {
      // invalid JSON — leave as-is
    }
  };

  const clearForm = () => {
    setPayloadJson(INITIAL_PAYLOAD);
    setMessageKey("");
    setCorrelationId("");
    setHeaderEntries([]);
    setSchemaState(emptySchemaState);
  };

  const handleSend = (clearAfter = false) => {
    if (!selectedStreamId) return;

    const headersRecord = entriesToRecord(headerEntries);

    if (showCorrelationInput && correlationId.trim() && correlationHeaderName) {
      headersRecord[correlationHeaderName] = correlationId.trim();
    }

    const protoHeader = buildProtoHeaderInjection(decoding, schemaState);
    if (protoHeader) headersRecord[protoHeader.name] = protoHeader.value;

    sendMutation.mutate(
      {
        streamId: selectedStreamId,
        payloadJson,
        schema: buildSchemaRequest(decoding, schemaState),
        key: messageKey.trim() || undefined,
        headers: Object.keys(headersRecord).length > 0 ? headersRecord : undefined,
      },
      {
        onSuccess: (result) => {
          toast.success(result.message || "Message sent successfully");
          if (clearAfter) clearForm();
        },
        onError: (err: Error) => {
          toast.error(err.message || "Failed to send message");
        },
      }
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Send Message</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Compose and publish a message to a stream
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6 items-start">
        {/* ── LEFT: Target card ── */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Target
          </p>

          {/* Stream selector */}
          <div className="space-y-1.5">
            <Label className="text-xs">Stream</Label>
            {streamsLoading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                <Loader2 size={12} className="animate-spin" />
                Loading streams…
              </div>
            ) : (
              <Select
                value={selectedStreamId ?? ""}
                onValueChange={(v) => setSelectedStreamId(v || null)}
                disabled={isPending}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select a stream…" />
                </SelectTrigger>
                <SelectContent>
                  {streams?.map((stream) => (
                    <SelectItem key={stream.id} value={stream.id}>
                      <span className="flex items-center gap-2">
                        <StreamTypeBadge
                          type={stream.type}
                          className="text-[9px] px-1.5 py-0"
                        />
                        {stream.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Schema / type selection */}
          <SendSchemaSection
            streamId={selectedStreamId}
            decoding={decoding}
            value={schemaState}
            onChange={setSchemaState}
            disabled={isPending}
          />

          {/* Message Key — Kafka only */}
          {isKafka && (
            <div className="space-y-1.5">
              <Label className="text-xs">
                Message Key{" "}
                <span className="font-normal text-muted-foreground/60">(optional)</span>
              </Label>
              <Input
                value={messageKey}
                onChange={(e) => setMessageKey(e.target.value)}
                disabled={isPending}
                placeholder="Partition key"
                className="font-mono text-xs h-8"
              />
            </div>
          )}

          {/* Correlation ID — HEADER-based streams only */}
          {showCorrelationInput && (
            <div className="space-y-1.5">
              <Label className="text-xs">
                Correlation ID{" "}
                <span className="font-normal text-muted-foreground/60">(optional)</span>
              </Label>
              <Input
                value={correlationId}
                onChange={(e) => setCorrelationId(e.target.value)}
                disabled={isPending}
                placeholder={correlationHeaderName}
                className="font-mono text-xs h-8"
              />
              <p className="text-xs text-muted-foreground/60">
                Injected as header{" "}
                <code className="font-mono">{correlationHeaderName}</code>
              </p>
            </div>
          )}

          {/* Send buttons */}
          <div className="flex gap-2 pt-1">
            <Button
              onClick={() => handleSend(false)}
              disabled={isSendDisabled}
              className="flex-1 gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Sending…
                </>
              ) : (
                "Send"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSend(true)}
              disabled={isSendDisabled}
            >
              Send & Clear
            </Button>
          </div>
        </div>

        {/* ── RIGHT: Payload + Headers ── */}
        <div className="space-y-4">
          {/* Payload card */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Payload
              </p>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleLoadExample}
                  disabled={isPending}
                  className="h-7 px-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <BookOpen size={12} />
                  Example
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleFormatJson}
                  disabled={isPending || !isJsonValid}
                  className="h-7 px-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <Wand2 size={12} />
                  Format
                </Button>
              </div>
            </div>

            <textarea
              value={payloadJson}
              onChange={(e) => setPayloadJson(e.target.value)}
              disabled={isPending}
              rows={20}
              spellCheck={false}
              className="w-full rounded-md border border-border bg-muted/30 px-3 py-2 font-mono text-xs text-green-400 resize-y focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 custom-scrollbar"
            />

            {jsonError && (
              <p className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle size={12} className="flex-none" />
                {jsonError}
              </p>
            )}
          </div>

          {/* Headers card */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Headers
            </p>
            <HeaderKeyValueEditor
              entries={headerEntries}
              onChange={setHeaderEntries}
              disabled={isPending}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
