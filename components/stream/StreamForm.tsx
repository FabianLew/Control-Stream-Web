// /components/stream/StreamForm.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  editStreamSchema,
  createStreamSchema,
  StreamFormValues,
  schemaSourceSchema,
  payloadFormatHintSchema,
} from "@/components/lib/schemas";

import type {
  StreamType,
  EditStreamCommand,
  CreateStreamCommand,
  UnifiedStreamDto,
  StreamVendorConfigDto,
  SchemaSource,
  PayloadFormatHint,
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
  vendorConfig: { vendor: "KAFKA" } as any,
  decoding: { schemaSource: "NONE", formatHint: "AUTO" } as any,
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

function safeEnum<T extends string>(
  schema: any,
  value: unknown,
  fallback: T
): T {
  const parsed = schema.safeParse(value);
  return parsed.success ? (parsed.data as T) : fallback;
}

/**
 * Normalizuje decoding do kształtu oczekiwanego przez Zod:
 * - zawsze poprawne enumy
 * - brak pustych stringów w obiektach
 * - NONE czyści sub-configi
 */
function normalizeDecoding(input: any) {
  const schemaSource = safeEnum<SchemaSource>(
    schemaSourceSchema,
    input?.schemaSource,
    "NONE"
  );

  const formatHint = safeEnum<PayloadFormatHint>(
    payloadFormatHintSchema,
    input?.formatHint,
    "AUTO"
  );

  if (schemaSource === "NONE") {
    return {
      schemaSource: "NONE",
      formatHint,
      schemaRegistry: undefined,
      protoFiles: undefined,
      avroFiles: undefined,
    };
  }

  if (schemaSource === "SCHEMA_REGISTRY") {
    const sr = input?.schemaRegistry;
    return {
      schemaSource: "SCHEMA_REGISTRY",
      formatHint,
      schemaRegistry:
        sr && typeof sr === "object"
          ? {
              url: String(sr.url ?? ""),
              authType: (sr.authType ?? "NONE") as any,
              username: sr.username ?? "",
              password: sr.password ?? "",
            }
          : { url: "", authType: "NONE" },
      protoFiles: undefined,
      avroFiles: undefined,
    };
  }

  // FILES
  const proto = input?.protoFiles;
  const avro = input?.avroFiles;

  return {
    schemaSource: "FILES",
    formatHint,
    schemaRegistry: undefined,
    protoFiles: proto && typeof proto === "object" ? proto : undefined,
    avroFiles: avro && typeof avro === "object" ? avro : undefined,
  };
}

function vendorDefaultsFor(
  type: StreamType,
  current?: StreamVendorConfigDto
): StreamVendorConfigDto {
  if (type === "KAFKA") {
    return current?.vendor === "KAFKA" ? current : { vendor: "KAFKA" };
  }
  if (type === "RABBIT") {
    return current?.vendor === "RABBIT"
      ? {
          ...current,
          shadowQueueEnabled: (current as any).shadowQueueEnabled ?? false,
        }
      : ({ vendor: "RABBIT", shadowQueueEnabled: false } as any);
  }
  return current?.vendor === "POSTGRES" ? current : { vendor: "POSTGRES" };
}

function toOptionalString(value: unknown): string | undefined {
  if (value == null) return undefined; // null lub undefined
  const s = String(value).trim();
  return s.length ? s : undefined;
}

/**
 * Kluczowe: Zod ma `optional()` a nie `nullable()`,
 * więc musimy czyścić null -> undefined + pusty string -> undefined.
 */
function normalizeVendorConfig(
  type: StreamType,
  vendorConfig: StreamVendorConfigDto | undefined,
  technicalName: string,
  correlationKeyName: string | undefined,
  pgSchema: string,
  rabbitShadowEnabled: boolean
): StreamVendorConfigDto {
  if (type === "KAFKA") {
    const current =
      vendorConfig?.vendor === "KAFKA"
        ? (vendorConfig as any)
        : ({ vendor: "KAFKA" } as any);

    return {
      vendor: "KAFKA",
      topic: toOptionalString(technicalName) ?? toOptionalString(current.topic),
      consumerGroupId: toOptionalString(current.consumerGroupId),
      correlationHeader: toOptionalString(current.correlationHeader),
    };
  }

  if (type === "RABBIT") {
    const current =
      vendorConfig?.vendor === "RABBIT"
        ? (vendorConfig as any)
        : ({ vendor: "RABBIT", shadowQueueEnabled: false } as any);

    return {
      vendor: "RABBIT",
      queue: toOptionalString(technicalName) ?? toOptionalString(current.queue),
      exchange: toOptionalString(current.exchange),
      routingKey: toOptionalString(current.routingKey),
      prefetchCount: current.prefetchCount ?? undefined,
      shadowQueueEnabled: !!rabbitShadowEnabled,
      shadowQueueName:
        current.shadowQueueName == null ? undefined : current.shadowQueueName,
      correlationHeader: toOptionalString(current.correlationHeader),
    } as any;
  }

  // POSTGRES
  const current =
    vendorConfig?.vendor === "POSTGRES"
      ? (vendorConfig as any)
      : ({ vendor: "POSTGRES" } as any);

  return {
    vendor: "POSTGRES",
    schema: toOptionalString(current.schema) ?? toOptionalString(pgSchema),
    table: toOptionalString(technicalName) ?? toOptionalString(current.table),
    correlationColumn:
      toOptionalString(correlationKeyName) ??
      toOptionalString(current.correlationColumn),
    timeColumn: toOptionalString(current.timeColumn),
  };
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

  const [pgSchema, setPgSchema] = useState("public");
  const [rabbitShadowEnabled, setRabbitShadowEnabled] = useState(false);
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
   * ✅ Single init/reset per mode + stream.id
   * Zero "walczących" useEffectów, zero resetów w pętli.
   */
  const lastKeyRef = useRef<string>("");

  useEffect(() => {
    const key = mode === "edit" ? `edit:${stream?.id ?? "none"}` : "create";
    if (lastKeyRef.current === key) return;

    if (mode === "edit") {
      if (!stream) return;

      const normalized: StreamFormValues = {
        ...DEFAULT_FORM_VALUES,
        name: stream.name ?? "",
        type: stream.type,
        connectionId: stream.connectionId ?? "",
        technicalName: stream.technicalName ?? "",
        correlationKeyType: stream.correlationKeyType,
        correlationKeyName: stream.correlationKeyName ?? "",
        vendorConfig: (stream.vendorConfig ??
          vendorDefaultsFor(stream.type)) as any,
        decoding: normalizeDecoding(stream.decoding) as any,
      };

      form.reset(normalized as any, { keepDirty: false, keepTouched: false });

      const vendor = normalized.vendorConfig as any;
      if (vendor?.vendor === "POSTGRES") setPgSchema(vendor.schema ?? "public");
      if (vendor?.vendor === "RABBIT")
        setRabbitShadowEnabled(!!vendor.shadowQueueEnabled);

      setDisplayNameTouched(true);
      lastKeyRef.current = key;
      return;
    }

    // create init
    form.reset(DEFAULT_FORM_VALUES as any, {
      keepDirty: false,
      keepTouched: false,
    });
    setPgSchema("public");
    setRabbitShadowEnabled(false);
    setDisplayNameTouched(false);
    lastKeyRef.current = key;
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
   * ✅ Create: when user chooses connection -> set type + vendor defaults + correlation defaults.
   * Uwaga: ustawiamy TYLKO to co zależy od connection/type.
   * Nie ruszamy decoding (user może ustawić).
   */
  useEffect(() => {
    if (mode !== "create") return;
    if (!activeConnection) return;

    // lock type to connection's type
    form.setValue("type", activeConnection.type, {
      shouldDirty: false,
      shouldValidate: true,
    });

    // vendor defaults by type (but keep existing fields if already correct vendor)
    const currentVendor = form.getValues("vendorConfig") as any;
    const nextVendor = vendorDefaultsFor(activeConnection.type, currentVendor);

    if (activeConnection.type === "POSTGRES") {
      form.setValue("correlationKeyType", "COLUMN", {
        shouldDirty: false,
        shouldValidate: true,
      });
      // only set if empty
      if (!form.getValues("correlationKeyName")) {
        form.setValue("correlationKeyName", "trace_id", {
          shouldDirty: false,
          shouldValidate: true,
        });
      }
      form.setValue(
        "vendorConfig",
        { ...nextVendor, vendor: "POSTGRES", schema: pgSchema } as any,
        { shouldDirty: false, shouldValidate: true }
      );
      return;
    }

    // KAFKA/RABBIT
    form.setValue("correlationKeyType", "HEADER", {
      shouldDirty: false,
      shouldValidate: true,
    });
    if (!form.getValues("correlationKeyName")) {
      form.setValue("correlationKeyName", "trace-id", {
        shouldDirty: false,
        shouldValidate: true,
      });
    }

    if (activeConnection.type === "RABBIT") {
      form.setValue(
        "vendorConfig",
        {
          ...nextVendor,
          vendor: "RABBIT",
          shadowQueueEnabled: rabbitShadowEnabled,
        } as any,
        { shouldDirty: false, shouldValidate: true }
      );
      return;
    }

    // KAFKA
    form.setValue("vendorConfig", { ...nextVendor, vendor: "KAFKA" } as any, {
      shouldDirty: false,
      shouldValidate: true,
    });
  }, [
    mode,
    activeConnection?.id,
    activeConnection?.type,
    pgSchema,
    rabbitShadowEnabled,
    form,
  ]);

  // create: auto-fill display name from technical name (only if user didn't touch display name)
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
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: true,
    });
  }, [mode, watchedTechnicalName, watchedName, displayNameTouched, form]);

  const connectionNameForEdit = useMemo(() => {
    if (mode !== "edit") return "";
    if (!stream) return "";
    return (stream as any).connectionName ?? "";
  }, [mode, stream]);

  const buildPayload = (
    data: StreamFormValues
  ): CreateStreamCommand | EditStreamCommand => {
    const technical = (data.technicalName ?? "").trim();

    const vendorConfig = normalizeVendorConfig(
      data.type,
      data.vendorConfig as any,
      technical,
      data.correlationKeyName ?? undefined,
      pgSchema,
      rabbitShadowEnabled
    );

    return {
      name: (data.name ?? "").trim(),
      type: data.type,
      connectionId: data.connectionId,
      technicalName: technical,
      correlationKeyType: data.correlationKeyType,
      correlationKeyName: (data.correlationKeyName ?? "").trim(),
      vendorConfig,
      decoding: normalizeDecoding(data.decoding) as any,
    } as any;
  };

  const submit = async (data: StreamFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(buildPayload(data));
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
    () => JSON.stringify(buildPayload(values), null, 2),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [values, pgSchema, rabbitShadowEnabled]
  );

  const showKafkaFields = watchedType === "KAFKA";
  const showRabbitFields = watchedType === "RABBIT";
  const showPostgresFields = watchedType === "POSTGRES";

  const currentVendorConfig = form.watch("vendorConfig") as any;

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
                    value={selectedConnectionId || undefined}
                    onValueChange={(v) => {
                      form.setValue("connectionId", v, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                      // allow re-autofill display name for new connection context
                      setDisplayNameTouched(false);
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
              {/* TYPE (locked - comes from connection/stream) */}
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
                      value={form.watch("correlationKeyType") as any}
                      onValueChange={(v) => {
                        form.setValue("correlationKeyType", v as any, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }}
                      disabled={watchedType === "POSTGRES"} // POSTGRES wants COLUMN
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

              {/* vendor-specific small extras */}
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
                        checked={rabbitShadowEnabled}
                        onCheckedChange={(checked) => {
                          setRabbitShadowEnabled(checked);
                          const current = (form.getValues(
                            "vendorConfig"
                          ) as any) ?? {
                            vendor: "RABBIT",
                          };
                          form.setValue(
                            "vendorConfig",
                            {
                              ...current,
                              vendor: "RABBIT",
                              shadowQueueEnabled: checked,
                            } as any,
                            { shouldDirty: true, shouldValidate: true }
                          );
                        }}
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
                        value={pgSchema}
                        onChange={(e) => {
                          const next = e.target.value;
                          setPgSchema(next);
                          // keep vendorConfig.schema in sync (so preview/payload matches)
                          const current = (form.getValues(
                            "vendorConfig"
                          ) as any) ?? {
                            vendor: "POSTGRES",
                          };
                          form.setValue(
                            "vendorConfig",
                            {
                              ...current,
                              vendor: "POSTGRES",
                              schema: next,
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
                        value={currentVendorConfig?.consumerGroupId ?? ""}
                        onChange={(e) => {
                          const current = (form.getValues(
                            "vendorConfig"
                          ) as any) ?? {
                            vendor: "KAFKA",
                          };
                          form.setValue(
                            "vendorConfig",
                            {
                              ...current,
                              vendor: "KAFKA",
                              consumerGroupId: e.target.value || undefined,
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
                        value={currentVendorConfig?.correlationHeader ?? ""}
                        onChange={(e) => {
                          const current = (form.getValues(
                            "vendorConfig"
                          ) as any) ?? {
                            vendor: "KAFKA",
                          };
                          form.setValue(
                            "vendorConfig",
                            {
                              ...current,
                              vendor: "KAFKA",
                              correlationHeader: e.target.value || undefined,
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
