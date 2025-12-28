"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  editStreamSchema,
  createStreamSchema,
  StreamFormValues,
} from "@/components/lib/schemas";

import type {
  StreamType,
  EditStreamCommand,
  CreateStreamCommand,
  UnifiedStreamDto,
  StreamVendorConfigDto,
  SchemaSource,
  PayloadFormatHint,
  SchemaRegistryAuthType,
} from "@/types/stream";

import { useRouter } from "next/navigation";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import { DecodingConfigCard } from "@/components/stream/DecodingConfigCard";
import { handleInvalidSubmit } from "@/components/lib/formError";

import {
  Loader2,
  Sparkles,
  Activity,
  Layers,
  Database,
  Server,
  FileJson,
  Save,
  Link as LinkIcon,
} from "lucide-react";

type ConnectionSummary = {
  id: string;
  name: string;
  type: StreamType;
};

type StreamFormMode = "create" | "edit";

type Props = {
  mode: StreamFormMode;
  stream?: UnifiedStreamDto | null;
  navigateAfterSubmit?: boolean;
  onSubmit: (payload: CreateStreamCommand | EditStreamCommand) => Promise<void>;
};

const DEFAULT_FORM_VALUES: StreamFormValues = {
  name: "",
  type: "KAFKA",
  connectionId: "",
  technicalName: "",
  correlationKeyType: "HEADER",
  correlationKeyName: "trace-id",
  vendorConfig: { vendor: "KAFKA" },
  decoding: { schemaSource: "NONE", formatHint: "AUTO" },
};

const VendorIcon = ({ type }: { type: StreamType }) => {
  if (type === "KAFKA") return <Activity className="text-purple-500 h-5 w-5" />;
  if (type === "RABBIT") return <Layers className="text-orange-500 h-5 w-5" />;
  if (type === "POSTGRES")
    return <Database className="text-blue-500 h-5 w-5" />;
  return <Server className="text-slate-500 h-5 w-5" />;
};

function titleFromTechnical(technicalName: string) {
  const raw = (technicalName ?? "").trim();
  if (!raw) return "";
  const normalized = raw.replace(/[._-]+/g, " ").trim();
  return normalized
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function toOptionalString(value: unknown): string | undefined {
  if (value == null) return undefined;
  const s = String(value).trim();
  return s.length ? s : undefined;
}

function toOptionalNumber(value: unknown): number | undefined {
  if (value == null) return undefined;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  const s = String(value).trim();
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function normalizeCorrelationKeyType(
  streamType: StreamType,
  raw: unknown
): "HEADER" | "COLUMN" {
  if (raw === "HEADER" || raw === "COLUMN") return raw;
  return streamType === "POSTGRES" ? "COLUMN" : "HEADER";
}

function normalizeCorrelationKeyName(
  streamType: StreamType,
  raw: unknown
): string {
  const value = toOptionalString(raw);
  if (value) return value;
  return streamType === "POSTGRES" ? "trace_id" : "trace-id";
}

function normalizeDecoding(input: any) {
  const schemaSource = (input?.schemaSource ?? "NONE") as SchemaSource;
  const formatHint = (input?.formatHint ?? "AUTO") as PayloadFormatHint;

  if (schemaSource === "NONE") {
    return {
      schemaSource: "NONE" as const,
      formatHint,
      schemaRegistry: undefined,
      protoFiles: undefined,
      avroFiles: undefined,
    };
  }

  if (schemaSource === "SCHEMA_REGISTRY") {
    const sr = input?.schemaRegistry ?? undefined;
    const authType = (sr?.authType ?? "NONE") as SchemaRegistryAuthType;

    return {
      schemaSource: "SCHEMA_REGISTRY" as const,
      formatHint,
      schemaRegistry: sr
        ? {
            url: String(sr.url ?? "").trim(),
            authType,
            username:
              authType === "BASIC" ? toOptionalString(sr.username) : undefined,
            password:
              authType === "BASIC" ? toOptionalString(sr.password) : undefined,
          }
        : undefined,
      protoFiles: undefined,
      avroFiles: undefined,
    };
  }

  // FILES
  const proto = input?.protoFiles;
  const avro = input?.avroFiles;

  return {
    schemaSource: "FILES" as const,
    formatHint,
    schemaRegistry: undefined,
    protoFiles:
      proto && typeof proto === "object"
        ? {
            bundleId: String(proto.bundleId ?? "").trim(),
            fileGlob: toOptionalString(proto.fileGlob),
            fixedMessageFullName: toOptionalString(proto.fixedMessageFullName),
            typeHeaderName: toOptionalString(proto.typeHeaderName),
            typeHeaderValuePrefix: toOptionalString(
              proto.typeHeaderValuePrefix
            ),
          }
        : undefined,
    avroFiles:
      avro && typeof avro === "object"
        ? {
            bundleId: String(avro.bundleId ?? "").trim(),
            fileGlob: toOptionalString(avro.fileGlob),
          }
        : undefined,
  };
}

function ensureVendorConfigForType(
  type: StreamType,
  current?: StreamVendorConfigDto
): StreamVendorConfigDto {
  if (type === "KAFKA") {
    if (current?.vendor === "KAFKA") return current;
    return { vendor: "KAFKA" };
  }
  if (type === "RABBIT") {
    if (current?.vendor === "RABBIT") {
      return {
        ...current,
        shadowQueueEnabled: Boolean((current as any).shadowQueueEnabled),
        shadowQueueName:
          (current as any).shadowQueueName == null
            ? undefined
            : (current as any).shadowQueueName,
      } as any;
    }
    return { vendor: "RABBIT", shadowQueueEnabled: false } as any;
  }
  // POSTGRES
  if (current?.vendor === "POSTGRES") return current;
  return { vendor: "POSTGRES", schema: "public" };
}

function normalizeVendorConfig(
  type: StreamType,
  vendorConfig: StreamVendorConfigDto | undefined,
  technicalName: string,
  correlationKeyName: string
): StreamVendorConfigDto {
  const current = vendorConfig ?? ({} as any);

  if (type === "KAFKA") {
    const v = current.vendor === "KAFKA" ? current : { vendor: "KAFKA" };
    return {
      vendor: "KAFKA",
      topic: toOptionalString(v.topic) ?? toOptionalString(technicalName),
      consumerGroupId: toOptionalString(v.consumerGroupId),
      correlationHeader: toOptionalString(v.correlationHeader),
    };
  }

  if (type === "RABBIT") {
    const v =
      current.vendor === "RABBIT"
        ? current
        : ({ vendor: "RABBIT", shadowQueueEnabled: false } as any);

    return {
      vendor: "RABBIT",
      queue: toOptionalString(v.queue) ?? toOptionalString(technicalName),
      exchange: toOptionalString(v.exchange),
      routingKey: toOptionalString(v.routingKey),
      prefetchCount: toOptionalNumber(v.prefetchCount),
      shadowQueueEnabled: Boolean(v.shadowQueueEnabled),
      shadowQueueName:
        v.shadowQueueName == null
          ? undefined
          : toOptionalString(v.shadowQueueName),
      correlationHeader: toOptionalString(v.correlationHeader),
    } as any;
  }

  // POSTGRES
  const v =
    current.vendor === "POSTGRES" ? current : ({ vendor: "POSTGRES" } as any);
  return {
    vendor: "POSTGRES",
    schema: toOptionalString(v.schema) ?? "public",
    table: toOptionalString(v.table) ?? toOptionalString(technicalName),
    correlationColumn:
      toOptionalString(v.correlationColumn) ?? correlationKeyName,
    timeColumn: toOptionalString(v.timeColumn),
  };
}

function normalizeFormPayload(
  data: StreamFormValues
): CreateStreamCommand | EditStreamCommand {
  const name = (data.name ?? "").trim();
  const technical = (data.technicalName ?? "").trim();

  const correlationKeyType = normalizeCorrelationKeyType(
    data.type,
    (data as any).correlationKeyType
  );

  const correlationKeyName = normalizeCorrelationKeyName(
    data.type,
    (data as any).correlationKeyName
  );

  const normalizedVendor = normalizeVendorConfig(
    data.type,
    data.vendorConfig as any,
    technical,
    correlationKeyName
  );

  const normalizedDecoding = normalizeDecoding(data.decoding);

  return {
    name,
    type: data.type,
    connectionId: data.connectionId,
    technicalName: technical,
    correlationKeyType,
    correlationKeyName,
    vendorConfig: normalizedVendor,
    decoding: normalizedDecoding as any,
  } as any;
}

export function StreamForm({
  mode,
  stream,
  navigateAfterSubmit = mode === "create",
  onSubmit,
}: Props) {
  const router = useRouter();

  const [connections, setConnections] = useState<ConnectionSummary[]>([]);
  const [isLoadingConn, setIsLoadingConn] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [displayNameTouched, setDisplayNameTouched] = useState(false);

  const schema = useMemo(
    () => (mode === "edit" ? editStreamSchema : createStreamSchema),
    [mode]
  );

  const form = useForm<StreamFormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_FORM_VALUES,
    mode: "onChange",
  });

  // load connections once
  useEffect(() => {
    fetch("/api/connections/overview")
      .then((res) => res.json())
      .then((data) => setConnections(data))
      .catch(console.error)
      .finally(() => setIsLoadingConn(false));
  }, []);

  /**
   * Single init/reset per mode + stream.id (no fighting effects).
   */
  const lastInitKeyRef = useRef<string>("");

  useEffect(() => {
    const key = mode === "edit" ? `edit:${stream?.id ?? "none"}` : "create";
    if (lastInitKeyRef.current === key) return;

    if (mode === "edit") {
      if (!stream) return;

      const initial: StreamFormValues = {
        ...DEFAULT_FORM_VALUES,
        name: stream.name ?? "",
        type: stream.type,
        connectionId: stream.connectionId ?? "",
        technicalName: stream.technicalName ?? "",
        correlationKeyType: normalizeCorrelationKeyType(
          stream.type,
          (stream as any).correlationKeyType
        ),
        correlationKeyName: normalizeCorrelationKeyName(
          stream.type,
          (stream as any).correlationKeyName
        ),
        vendorConfig: ensureVendorConfigForType(
          stream.type,
          stream.vendorConfig
        ) as any,
        decoding: normalizeDecoding(stream.decoding) as any,
      };

      const normalized = normalizeFormPayload(initial as any) as any;

      form.reset(normalized as any, { keepDirty: false, keepTouched: false });

      setDisplayNameTouched(true);
      lastInitKeyRef.current = key;
      return;
    }

    // create init
    form.reset(DEFAULT_FORM_VALUES as any, {
      keepDirty: false,
      keepTouched: false,
    });
    setDisplayNameTouched(false);
    lastInitKeyRef.current = key;
  }, [mode, stream?.id, stream, form]);

  const selectedConnectionId = form.watch("connectionId");
  const watchedType = form.watch("type") as StreamType;
  const watchedTechnicalName = form.watch("technicalName");
  const watchedName = form.watch("name");

  const activeConnection = useMemo(() => {
    if (!connections.length) return undefined;
    if (!selectedConnectionId) return undefined;
    return connections.find((c) => c.id === selectedConnectionId);
  }, [connections, selectedConnectionId]);

  /**
   * Create: apply defaults once per selected connectionId.
   */
  const lastAppliedConnectionIdRef = useRef<string>("");

  useEffect(() => {
    if (mode !== "create") return;
    if (!activeConnection) return;
    if (lastAppliedConnectionIdRef.current === activeConnection.id) return;

    lastAppliedConnectionIdRef.current = activeConnection.id;

    form.setValue("type", activeConnection.type, {
      shouldDirty: true,
      shouldValidate: true,
    });

    if (activeConnection.type === "POSTGRES") {
      form.setValue("correlationKeyType", "COLUMN", {
        shouldDirty: true,
        shouldValidate: true,
      });
      if (!toOptionalString(form.getValues("correlationKeyName"))) {
        form.setValue("correlationKeyName", "trace_id", {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
      form.setValue(
        "vendorConfig",
        { vendor: "POSTGRES", schema: "public" } as any,
        { shouldDirty: true, shouldValidate: true }
      );
    } else {
      form.setValue("correlationKeyType", "HEADER", {
        shouldDirty: true,
        shouldValidate: true,
      });
      if (!toOptionalString(form.getValues("correlationKeyName"))) {
        form.setValue("correlationKeyName", "trace-id", {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
      if (activeConnection.type === "RABBIT") {
        form.setValue(
          "vendorConfig",
          { vendor: "RABBIT", shadowQueueEnabled: false } as any,
          { shouldDirty: true, shouldValidate: true }
        );
      } else {
        form.setValue("vendorConfig", { vendor: "KAFKA" } as any, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    }

    setDisplayNameTouched(false);
  }, [
    mode,
    activeConnection?.id,
    activeConnection?.type,
    activeConnection,
    form,
  ]);

  /**
   * Guardrail: POSTGRES must always be COLUMN.
   * Prevents UI dead state if value ever becomes ""/null.
   */
  useEffect(() => {
    if (watchedType !== "POSTGRES") return;

    const current = form.getValues("correlationKeyType");
    if (current === "COLUMN") return;

    form.setValue("correlationKeyType", "COLUMN", {
      shouldDirty: false,
      shouldValidate: true,
    });
  }, [watchedType, form]);

  /**
   * Critical: keep decoding schema-valid when user turns it off (NONE).
   */
  const decodingSchemaSource = form.watch(
    "decoding.schemaSource"
  ) as SchemaSource;
  const lastDecodingSchemaSourceRef = useRef<SchemaSource | null>(null);

  useEffect(() => {
    if (!decodingSchemaSource) return;
    if (lastDecodingSchemaSourceRef.current === decodingSchemaSource) return;

    lastDecodingSchemaSourceRef.current = decodingSchemaSource;

    if (decodingSchemaSource === "NONE") {
      form.setValue("decoding.schemaRegistry", undefined, {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue("decoding.protoFiles", undefined, {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue("decoding.avroFiles", undefined, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [decodingSchemaSource, form]);

  // create: auto-fill display name from technical name only if user didn't touch display name
  useEffect(() => {
    if (mode !== "create") return;
    if (displayNameTouched) return;

    const technical = (watchedTechnicalName ?? "").trim();
    if (!technical) return;

    const currentName = (watchedName ?? "").trim();
    if (currentName) return;

    const suggested = titleFromTechnical(technical);
    if (!suggested) return;

    form.setValue("name", suggested, {
      shouldDirty: true,
      shouldTouch: false,
      shouldValidate: true,
    });
  }, [mode, watchedTechnicalName, watchedName, displayNameTouched, form]);

  const connectionNameForEdit = useMemo(() => {
    if (mode !== "edit") return "";
    return stream?.connectionName ?? "";
  }, [mode, stream?.connectionName]);

  const submit = async (data: StreamFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // normalize once, then parse with schema -> guarantee correctness
      const normalizedPayload = normalizeFormPayload(data);

      const parsed = schema.safeParse(normalizedPayload);
      if (!parsed.success) {
        // Push normalized into form and trigger errors
        form.reset(normalizedPayload as any, {
          keepDirty: true,
          keepTouched: true,
          keepErrors: false,
        });
        await form.trigger();
        setIsSubmitting(false);
        return;
      }

      await onSubmit(parsed.data as any);

      if (navigateAfterSubmit) {
        router.push("/streams");
        router.refresh();
      }
    } catch {
      setError("Failed to save stream. Please check configuration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const values = form.watch();
  const previewJson = useMemo(
    () => JSON.stringify(normalizeFormPayload(values), null, 2),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [values]
  );

  const showKafkaFields = watchedType === "KAFKA";
  const showRabbitFields = watchedType === "RABBIT";
  const showPostgresFields = watchedType === "POSTGRES";

  const currentVendor = (form.watch("vendorConfig") as any) ?? {};

  const correlationKeyTypeValue = normalizeCorrelationKeyType(
    watchedType,
    form.watch("correlationKeyType")
  );

  return (
    <form
      onSubmit={form.handleSubmit(submit, (errors) =>
        handleInvalidSubmit(errors, {
          title: mode === "edit" ? "Stream not updated" : "Stream not created",
          description: "Please correct the highlighted fields and try again.",
        })
      )}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* LEFT */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">
                {mode === "create" ? "Stream Context" : "Edit Context"}
              </CardTitle>
              <CardDescription>
                {mode === "create"
                  ? "Select the source/sink connection."
                  : "Update stream configuration."}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {mode === "edit" && stream?.id && (
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">Stream ID</div>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {stream.id}
                  </Badge>
                </div>
              )}

              {/* CONNECTION */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Connection
                </Label>

                {mode === "edit" ? (
                  <Input
                    value={connectionNameForEdit || "(connection)"}
                    readOnly
                    className="bg-background"
                  />
                ) : (
                  <Select
                    value={selectedConnectionId ?? ""}
                    onValueChange={(v) => {
                      form.setValue("connectionId", v, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                    disabled={isLoadingConn}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue
                        placeholder={
                          isLoadingConn ? "Loading..." : "Select connection..."
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {connections.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          <div className="flex items-center gap-2">
                            <VendorIcon type={c.type} />
                            <span>{c.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {form.formState.errors.connectionId && (
                  <p className="text-destructive text-xs">
                    Connection is required
                  </p>
                )}
              </div>

              {/* DISPLAY NAME */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Display Name
                </Label>
                <Input
                  value={form.watch("name") ?? ""}
                  onChange={(e) => {
                    setDisplayNameTouched(true);
                    form.setValue("name", e.target.value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                  placeholder="e.g. Orders Stream"
                  className="bg-background"
                />
                {form.formState.errors.name && (
                  <p className="text-destructive text-xs">Name is required</p>
                )}
              </div>

              <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
                Streams map physical data sources (Topics, Queues, Tables) to
                ControlStream's internal logic.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <LinkIcon size={16} />
                    {watchedType} Configuration
                  </CardTitle>
                  <CardDescription>
                    Define technical details for the selected connection.
                  </CardDescription>
                </div>

                <Badge
                  variant="outline"
                  className="text-[10px] text-muted-foreground"
                >
                  {mode === "edit" ? "edit" : "create"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* TYPE (locked) */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Type
                </Label>
                <Select value={watchedType} disabled>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KAFKA">KAFKA</SelectItem>
                    <SelectItem value="RABBIT">RABBIT</SelectItem>
                    <SelectItem value="POSTGRES">POSTGRES</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* TECHNICAL NAME */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {watchedType === "KAFKA"
                    ? "Topic Name"
                    : watchedType === "RABBIT"
                    ? "Queue Name"
                    : "Table Name"}
                </Label>
                <Input
                  value={form.watch("technicalName") ?? ""}
                  onChange={(e) =>
                    form.setValue("technicalName", e.target.value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  placeholder={
                    watchedType === "KAFKA"
                      ? "e.g. orders.v1"
                      : watchedType === "RABBIT"
                      ? "e.g. orders.queue"
                      : "e.g. orders"
                  }
                  className="bg-background font-mono text-sm"
                />
                {form.formState.errors.technicalName && (
                  <p className="text-destructive text-xs">
                    Technical name is required
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Technical Name is the source of truth.
                </p>
              </div>

              <Separator />

              {/* CORRELATION */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Correlation Strategy
                  </Label>
                  <Badge variant="secondary" className="text-[10px]">
                    Required
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Location
                    </Label>
                    <Select
                      value={correlationKeyTypeValue}
                      onValueChange={(v) => {
                        form.setValue("correlationKeyType", v as any, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }}
                      disabled={watchedType === "POSTGRES"}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HEADER">Header</SelectItem>
                        <SelectItem value="COLUMN">Column</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Key Name
                    </Label>
                    <Input
                      value={form.watch("correlationKeyName") ?? ""}
                      onChange={(e) =>
                        form.setValue("correlationKeyName", e.target.value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      className="bg-background font-mono text-sm"
                      placeholder={
                        watchedType === "POSTGRES" ? "trace_id" : "trace-id"
                      }
                    />
                    {form.formState.errors.correlationKeyName && (
                      <p className="text-destructive text-xs">
                        Correlation key is required
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Vendor-specific */}
              {showRabbitFields && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Rabbit Options
                    </Label>

                    <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                      <div>
                        <div className="text-sm font-medium">Shadow Queue</div>
                        <div className="text-xs text-muted-foreground">
                          Enables storing a copy of messages for safe
                          replay/debug.
                        </div>
                      </div>
                      <Switch
                        checked={Boolean(currentVendor.shadowQueueEnabled)}
                        onCheckedChange={(checked) => {
                          const base = ensureVendorConfigForType(
                            "RABBIT",
                            form.getValues("vendorConfig") as any
                          ) as any;

                          form.setValue(
                            "vendorConfig",
                            {
                              ...base,
                              vendor: "RABBIT",
                              shadowQueueEnabled: checked,
                            } as any,
                            { shouldDirty: true, shouldValidate: true }
                          );
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Shadow queue name (optional)
                      </Label>
                      <Input
                        value={
                          toOptionalString(currentVendor.shadowQueueName) ?? ""
                        }
                        onChange={(e) => {
                          const base = ensureVendorConfigForType(
                            "RABBIT",
                            form.getValues("vendorConfig") as any
                          ) as any;

                          form.setValue(
                            "vendorConfig",
                            {
                              ...base,
                              vendor: "RABBIT",
                              shadowQueueName: toOptionalString(e.target.value),
                            } as any,
                            { shouldDirty: true, shouldValidate: true }
                          );
                        }}
                        className="bg-background font-mono text-sm"
                        placeholder="orders.shadow.queue"
                      />
                    </div>
                  </div>
                </>
              )}

              {showPostgresFields && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Postgres Options
                    </Label>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Schema
                      </Label>
                      <Input
                        value={toOptionalString(currentVendor.schema) ?? ""}
                        onChange={(e) => {
                          const base = ensureVendorConfigForType(
                            "POSTGRES",
                            form.getValues("vendorConfig") as any
                          ) as any;

                          form.setValue(
                            "vendorConfig",
                            {
                              ...base,
                              vendor: "POSTGRES",
                              schema: e.target.value,
                            } as any,
                            { shouldDirty: true, shouldValidate: true }
                          );
                        }}
                        className="bg-background font-mono text-sm"
                        placeholder="public"
                      />
                    </div>
                  </div>
                </>
              )}

              {showKafkaFields && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Kafka Options
                    </Label>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Consumer Group (optional)
                      </Label>
                      <Input
                        value={
                          toOptionalString(currentVendor.consumerGroupId) ?? ""
                        }
                        onChange={(e) => {
                          const base = ensureVendorConfigForType(
                            "KAFKA",
                            form.getValues("vendorConfig") as any
                          ) as any;

                          form.setValue(
                            "vendorConfig",
                            {
                              ...base,
                              vendor: "KAFKA",
                              consumerGroupId: toOptionalString(e.target.value),
                            } as any,
                            { shouldDirty: true, shouldValidate: true }
                          );
                        }}
                        className="bg-background font-mono text-sm"
                        placeholder="e.g. controlstream-consumer"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Correlation Header (optional)
                      </Label>
                      <Input
                        value={
                          toOptionalString(currentVendor.correlationHeader) ??
                          ""
                        }
                        onChange={(e) => {
                          const base = ensureVendorConfigForType(
                            "KAFKA",
                            form.getValues("vendorConfig") as any
                          ) as any;

                          form.setValue(
                            "vendorConfig",
                            {
                              ...base,
                              vendor: "KAFKA",
                              correlationHeader: toOptionalString(
                                e.target.value
                              ),
                            } as any,
                            { shouldDirty: true, shouldValidate: true }
                          );
                        }}
                        className="bg-background font-mono text-sm"
                        placeholder="e.g. trace-id"
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* DECODING */}
          <DecodingConfigCard form={form} />

          {/* PREVIEW */}
          <div className="mt-6 pt-6 border-t border-border space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <FileJson size={12} /> Definition Preview
            </div>
            <div className="bg-slate-950 rounded-lg border border-border p-4 shadow-inner">
              <pre className="text-xs font-mono text-blue-400 overflow-x-auto whitespace-pre-wrap">
                {previewJson}
              </pre>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2 animate-in slide-in-from-top-2">
              <Activity size={16} /> {error}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                (mode === "create" &&
                  (!activeConnection || !selectedConnectionId))
              }
              className="w-full sm:w-auto px-8 py-6 text-base font-medium shadow-lg shadow-primary/20"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin mr-2" />
              ) : mode === "create" ? (
                <Sparkles className="mr-2" size={18} />
              ) : (
                <Save className="mr-2" size={18} />
              )}
              {mode === "create" ? "Create Stream" : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
