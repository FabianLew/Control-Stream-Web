"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getStreamOverview } from "@/lib/api/streams";
import { sendReplayMessage } from "@/lib/api/replay";
import { useSchemaRegistrySchemas } from "@/components/viewer/SchemaRegistrySchemaSelect";
import { useAvroSupportedSchemas } from "@/components/viewer/AvroSchemaSelect";
import { useProtoSupportedMessageTypes } from "@/components/viewer/ProtoMessageTypeSelect";
import { filterProtoDependencyTypes } from "@/lib/proto/protoFilter";
import {
  SendSchemaSection,
  emptySchemaState,
  computeSchemaMissing,
  buildSchemaRequest,
  buildProtoHeaderInjection,
  type SchemaSelectionState,
} from "@/components/send/SendSchemaSection";

interface HeaderEntry {
  key: string;
  value: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  streamId: string;
  initialPayload: string;
  initialHeaders: Record<string, string>;
}

function headersToEntries(headers: Record<string, string>): HeaderEntry[] {
  const entries = Object.entries(headers).map(([key, value]) => ({ key, value }));
  return entries.length > 0 ? entries : [];
}

function entriesToRecord(entries: HeaderEntry[]): Record<string, string> {
  return Object.fromEntries(
    entries.filter((e) => e.key.trim() !== "").map((e) => [e.key.trim(), e.value])
  );
}

export function ReplayMessageDialog({
  isOpen,
  onClose,
  streamId,
  initialPayload,
  initialHeaders,
}: Props) {
  const [payloadJson, setPayloadJson] = useState(initialPayload);
  const [messageKey, setMessageKey] = useState("");
  const [headerEntries, setHeaderEntries] = useState<HeaderEntry[]>(() =>
    headersToEntries(initialHeaders)
  );
  const [schemaState, setSchemaState] = useState<SchemaSelectionState>(emptySchemaState);

  useEffect(() => {
    if (isOpen) {
      setPayloadJson(initialPayload);
      setMessageKey("");
      setHeaderEntries(headersToEntries(initialHeaders));
      setSchemaState(emptySchemaState);
    }
  }, [isOpen, initialPayload, initialHeaders]);

  const { data: stream, isLoading: streamLoading } = useQuery({
    queryKey: ["stream-overview", streamId],
    queryFn: () => getStreamOverview(streamId),
    enabled: isOpen && !!streamId,
    staleTime: 60_000,
  });

  const decoding = stream?.decoding;
  const schemaSource = decoding?.schemaSource ?? "NONE";
  const formatHint = decoding?.formatHint ?? "AUTO";
  const protoFiles = decoding?.protoFiles;

  const isSchemaRegistry = schemaSource === "SCHEMA_REGISTRY";
  const isAvroFiles = schemaSource === "FILES" && formatHint === "AVRO";
  const isProtoFiles = schemaSource === "FILES" && formatHint === "PROTO";

  // Hooks for auto-selection — React Query deduplicates fetches with the widgets
  const srQuery = useSchemaRegistrySchemas(isOpen && isSchemaRegistry ? streamId : undefined);
  const avroQuery = useAvroSupportedSchemas(isOpen && isAvroFiles ? streamId : undefined);
  const protoQuery = useProtoSupportedMessageTypes(
    isOpen && isProtoFiles ? streamId : undefined
  );

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

  // Auto-select Proto: first domain type (dependency-only types are excluded)
  useEffect(() => {
    const data = protoQuery.data;
    if (isProtoFiles && data?.length && schemaState.messageFullName == null) {
      const domainTypes = filterProtoDependencyTypes(data);
      if (domainTypes.length > 0) {
        setSchemaState((prev) => ({
          ...prev,
          messageFullName: domainTypes[0].messageFullName,
        }));
      }
    }
  }, [isProtoFiles, protoQuery.data, schemaState.messageFullName]);

  const sendMutation = useMutation({
    mutationFn: sendReplayMessage,
    onSuccess: () => {
      toast.success("Message sent successfully");
      onClose();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to send message");
    },
  });

  const handleSend = () => {
    const headersRecord = entriesToRecord(headerEntries);

    const protoHeader = buildProtoHeaderInjection(decoding, schemaState);
    if (protoHeader) headersRecord[protoHeader.name] = protoHeader.value;

    sendMutation.mutate({
      streamId,
      payloadJson,
      schema: buildSchemaRequest(decoding, schemaState),
      key: messageKey.trim() || undefined,
      headers: Object.keys(headersRecord).length > 0 ? headersRecord : undefined,
    });
  };

  const addHeaderRow = () => setHeaderEntries((prev) => [...prev, { key: "", value: "" }]);
  const removeHeaderRow = (i: number) =>
    setHeaderEntries((prev) => prev.filter((_, idx) => idx !== i));
  const updateHeaderKey = (i: number, key: string) =>
    setHeaderEntries((prev) => prev.map((e, idx) => (idx === i ? { ...e, key } : e)));
  const updateHeaderValue = (i: number, value: string) =>
    setHeaderEntries((prev) => prev.map((e, idx) => (idx === i ? { ...e, value } : e)));

  const isPending = sendMutation.isPending;
  const isSendDisabled = isPending || streamLoading || computeSchemaMissing(decoding, schemaState);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border flex-none">
          <DialogTitle className="flex items-center gap-2 text-base">
            Replay Message
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Edit and resend this message to stream{" "}
            <span className="font-mono text-foreground">{stream?.name ?? streamId}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 custom-scrollbar">
          {/* Payload */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Payload JSON
            </Label>
            <textarea
              value={payloadJson}
              onChange={(e) => setPayloadJson(e.target.value)}
              disabled={isPending}
              rows={12}
              spellCheck={false}
              className="w-full rounded-md border border-border bg-muted/30 px-3 py-2 font-mono text-xs text-green-400 resize-y focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 custom-scrollbar"
            />
          </div>

          {/* Message Key */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Message Key{" "}
              <span className="normal-case text-muted-foreground/60 font-normal">(optional)</span>
            </Label>
            <Input
              value={messageKey}
              onChange={(e) => setMessageKey(e.target.value)}
              disabled={isPending}
              placeholder="Leave empty to use no key"
              className="font-mono text-xs h-8"
            />
          </div>

          {/* Schema / type selection */}
          <SendSchemaSection
            streamId={streamId}
            decoding={decoding}
            value={schemaState}
            onChange={setSchemaState}
            disabled={isPending}
          />

          {/* Headers */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Headers
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addHeaderRow}
                disabled={isPending}
                className="h-6 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
              >
                <Plus size={12} />
                Add
              </Button>
            </div>

            {headerEntries.length === 0 ? (
              <p className="text-xs text-muted-foreground/60 py-1">
                No headers — click Add to include one.
              </p>
            ) : (
              <div className="space-y-1.5">
                {headerEntries.map((entry, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input
                      value={entry.key}
                      onChange={(e) => updateHeaderKey(i, e.target.value)}
                      disabled={isPending}
                      placeholder="Header name"
                      className="font-mono text-xs h-8 flex-1"
                    />
                    <Input
                      value={entry.value}
                      onChange={(e) => updateHeaderValue(i, e.target.value)}
                      disabled={isPending}
                      placeholder="Value"
                      className="font-mono text-xs h-8 flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeHeaderRow(i)}
                      disabled={isPending}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive flex-none"
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border flex-none">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isPending}
            className="text-sm"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={isSendDisabled}
            className="text-sm gap-2"
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
