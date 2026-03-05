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
import { Label } from "@/components/ui/label";

import { DecodingConfigCard } from "@/components/stream/DecodingConfigCard";
import { handleInvalidSubmit } from "@/components/lib/formError";
import { RabbitProvisioningConfirmDialog } from "@/components/stream/RabbitProvisioningConfirmDialog";

import {
  Loader2,
  Sparkles,
  Activity,
  FileJson,
  Save,
  Link as LinkIcon,
  X,
} from "lucide-react";
import {
  getVendorMeta,
  VENDOR_OPTIONS,
  isVendor,
  VENDOR_META,
} from "@/components/lib/vendors";
import { getConnectionsOverview } from "@/lib/api/connections";

import {
  DEFAULT_STREAM_FORM_VALUES,
  mapStreamDtoToFormValues,
  mapFormValuesToCommand,
  ensureVendorConfigForType,
  normalizeCorrelationKeyType,
  toOptionalString,
  toOptionalNumber,
} from "@/lib/streams/form-mappers";

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
  /** Optional cancel handler (shown on configure page). */
  onCancel?: () => void;
  onSubmit: (payload: CreateStreamCommand | EditStreamCommand) => Promise<void>;
};

const VendorIcon = ({ type }: { type: StreamType }) => {
  const vendor = getVendorMeta(type);
  const Icon = vendor.icon;
  return <Icon className={`${vendor.iconClass} h-5 w-5`} />;
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

export function StreamForm({
  mode,
  stream,
  navigateAfterSubmit = mode === "create",
  onCancel,
  onSubmit,
}: Props) {
  const router = useRouter();

  const [connections, setConnections] = useState<ConnectionSummary[]>([]);
  const [isLoadingConn, setIsLoadingConn] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Compute initial form values SYNCHRONOUSLY at mount time ─────────────
  // useMemo with empty deps captures stream/mode at mount — the form's very
  // first render already has the correct values.  This eliminates the "NONE
  // on first render" race condition where child-component effects (e.g.
  // DecodingConfigCard) fire before any useEffect can call form.reset.
  const initialFormValues = useMemo((): StreamFormValues => {
    if (mode === "edit" && stream) {
      return mapStreamDtoToFormValues(stream);
    }
    return DEFAULT_STREAM_FORM_VALUES;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — captured once at mount

  // In edit mode the display name is already filled — don't auto-derive it.
  const [displayNameTouched, setDisplayNameTouched] = useState(
    mode === "edit"
  );

  const [rabbitConfirmOpen, setRabbitConfirmOpen] = useState(false);
  const pendingPayloadRef = useRef<
    CreateStreamCommand | EditStreamCommand | null
  >(null);
  const rabbitConfirmAcknowledgedRef = useRef(false);

  const schema = useMemo(
    () => (mode === "edit" ? editStreamSchema : createStreamSchema),
    [mode]
  );

  const form = useForm<StreamFormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialFormValues,
    mode: "onChange",
  });

  // ── Secondary reset: stream prop changes after mount ─────────────────────
  // Pre-populate ref with the id already covered by initialFormValues so
  // the effect does NOT duplicate the reset on the initial effect cycle.
  // This handles future navigation between streams on the configure page
  // without a full component unmount/remount.
  const lastInitStreamIdRef = useRef<string | null>(
    mode === "edit" && stream ? stream.id : null
  );

  useEffect(() => {
    if (mode !== "edit" || !stream) return;
    if (lastInitStreamIdRef.current === stream.id) return;
    lastInitStreamIdRef.current = stream.id;
    setDisplayNameTouched(true);
    form.reset(mapStreamDtoToFormValues(stream));
  }, [mode, stream, form]);

  // ── Load connections once ─────────────────────────────────────────────────
  useEffect(() => {
    getConnectionsOverview()
      .then(setConnections)
      .catch(console.error)
      .finally(() => setIsLoadingConn(false));
  }, []);

  const selectedConnectionId = form.watch("connectionId");
  const watchedType = form.watch("type") as StreamType;
  const watchedTechnicalName = form.watch("technicalName");
  const watchedName = form.watch("name");

  const activeConnection = useMemo(() => {
    if (!connections.length) return undefined;
    if (!selectedConnectionId) return undefined;
    return connections.find((c) => c.id === selectedConnectionId);
  }, [connections, selectedConnectionId]);

  // ── Create mode: apply vendor defaults once per selected connection ───────
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

    if (isVendor(activeConnection.type, VENDOR_META.POSTGRES)) {
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
      if (isVendor(activeConnection.type, VENDOR_META.RABBIT)) {
        form.setValue(
          "vendorConfig",
          {
            vendor: "RABBIT",
            exchange: "",
            routingKey: "",
            prefetchCount: undefined,
            searchShadowTtlMs: undefined,
            searchShadowMaxLength: undefined,
            shadowQueueName: undefined,
          } as any,
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

  // ── Guardrail: POSTGRES must always use COLUMN ────────────────────────────
  useEffect(() => {
    if (!isVendor(watchedType, VENDOR_META.POSTGRES)) return;
    const current = form.getValues("correlationKeyType");
    if (current === "COLUMN") return;
    form.setValue("correlationKeyType", "COLUMN", {
      shouldDirty: false,
      shouldValidate: true,
    });
  }, [watchedType, form]);

  // ── Create mode: auto-fill display name from technical name ──────────────
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

  // ── Submit ────────────────────────────────────────────────────────────────
  const submit = async (data: StreamFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const normalizedPayload = mapFormValuesToCommand(data);

      const parsed = schema.safeParse(normalizedPayload);
      if (!parsed.success) {
        form.reset(normalizedPayload as any, {
          keepDirty: true,
          keepTouched: true,
          keepErrors: false,
        });
        await form.trigger();
        setIsSubmitting(false);
        return;
      }

      const payload = parsed.data as any;
      const isRabbitCreate = mode === "create" && payload.type === "RABBIT";

      if (isRabbitCreate && !rabbitConfirmAcknowledgedRef.current) {
        pendingPayloadRef.current = payload;
        setRabbitConfirmOpen(true);
        setIsSubmitting(false);
        return;
      }

      await onSubmit(payload);

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

  const confirmRabbitProvisioning = async () => {
    const pending = pendingPayloadRef.current;
    if (!pending) return;

    rabbitConfirmAcknowledgedRef.current = true;
    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(pending as any);
      if (navigateAfterSubmit) {
        router.push("/streams");
        router.refresh();
      }
    } catch {
      setError("Failed to save stream. Please check configuration.");
    } finally {
      pendingPayloadRef.current = null;
      setIsSubmitting(false);
    }
  };

  const values = form.watch();
  const previewJson = useMemo(
    () => JSON.stringify(mapFormValuesToCommand(values), null, 2),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [values]
  );

  const showKafkaFields = isVendor(watchedType, VENDOR_META.KAFKA);
  const showRabbitFields = isVendor(watchedType, VENDOR_META.RABBIT);
  const showPostgresFields = isVendor(watchedType, VENDOR_META.POSTGRES);

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
        {/* ── LEFT: basics ── */}
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
                ControlStream&apos;s internal logic.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── RIGHT: vendor + decoding ── */}
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
                    {VENDOR_OPTIONS.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* TECHNICAL NAME */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {isVendor(watchedType, VENDOR_META.KAFKA)
                    ? "Topic Name"
                    : isVendor(watchedType, VENDOR_META.RABBIT)
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
                    isVendor(watchedType, VENDOR_META.KAFKA)
                      ? "e.g. orders.v1"
                      : isVendor(watchedType, VENDOR_META.RABBIT)
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

              {/* CORRELATION STRATEGY */}
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
                      disabled={isVendor(watchedType, VENDOR_META.POSTGRES)}
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
                        isVendor(watchedType, VENDOR_META.POSTGRES)
                          ? "trace_id"
                          : "trace-id"
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

              {/* ── RABBIT FIELDS ── */}
              {showRabbitFields && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Rabbit Options
                    </Label>

                    <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
                      <div className="font-medium text-foreground text-sm mb-1">
                        RabbitMQ provisioning
                      </div>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>
                          ControlStream may create <b>two shadow queues</b> for
                          this stream: one for <b>Search</b> and one for{" "}
                          <b>Live</b>.
                        </li>
                        <li>
                          <b>Live</b> shadow queue uses fixed agent defaults and{" "}
                          <b>never replays backlog</b> on connect.
                        </li>
                        <li>
                          You can tune retention{" "}
                          <b>only for Search shadow queue</b> below.
                        </li>
                      </ul>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          Exchange *
                        </Label>
                        <Input
                          value={toOptionalString(currentVendor.exchange) ?? ""}
                          onChange={(e) => {
                            const base = ensureVendorConfigForType(
                              "RABBIT",
                              form.getValues("vendorConfig") as any
                            ) as any;
                            form.setValue(
                              "vendorConfig",
                              { ...base, vendor: "RABBIT", exchange: e.target.value } as any,
                              { shouldDirty: true, shouldValidate: true }
                            );
                          }}
                          className="bg-background font-mono text-sm"
                          placeholder="e.g. orders.exchange"
                        />
                        {form.getFieldState("vendorConfig.exchange").error && (
                          <p className="text-destructive text-xs">
                            {form.getFieldState("vendorConfig.exchange").error
                              ?.message ?? "Exchange is required"}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          Routing Key *
                        </Label>
                        <Input
                          value={
                            toOptionalString(currentVendor.routingKey) ?? ""
                          }
                          onChange={(e) => {
                            const base = ensureVendorConfigForType(
                              "RABBIT",
                              form.getValues("vendorConfig") as any
                            ) as any;
                            form.setValue(
                              "vendorConfig",
                              { ...base, vendor: "RABBIT", routingKey: e.target.value } as any,
                              { shouldDirty: true, shouldValidate: true }
                            );
                          }}
                          className="bg-background font-mono text-sm"
                          placeholder="e.g. orders.*"
                        />
                        {form.getFieldState("vendorConfig.routingKey")
                          .error && (
                          <p className="text-destructive text-xs">
                            {form.getFieldState("vendorConfig.routingKey").error
                              ?.message ?? "Routing key is required"}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                      <div>
                        <div className="text-sm font-medium">
                          Search Shadow Queue
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Stores a copy of messages for search/debug. Live uses
                          a separate short-lived queue.
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border/60 p-3 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium">
                            Search retention
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Applies only to <b>Search shadow queue</b>. Leave
                            empty to use agent defaults.
                          </div>
                        </div>

                        <Select
                          value={
                            currentVendor.searchShadowTtlMs == null
                              ? "DEFAULT"
                              : String(currentVendor.searchShadowTtlMs)
                          }
                          onValueChange={(v) => {
                            const base = ensureVendorConfigForType(
                              "RABBIT",
                              form.getValues("vendorConfig") as any
                            ) as any;
                            const ttl =
                              v === "DEFAULT"
                                ? undefined
                                : Number(String(v).trim());
                            form.setValue(
                              "vendorConfig",
                              {
                                ...base,
                                vendor: "RABBIT",
                                searchShadowTtlMs: Number.isFinite(ttl as any)
                                  ? ttl
                                  : undefined,
                              } as any,
                              { shouldDirty: true, shouldValidate: true }
                            );
                          }}
                        >
                          <SelectTrigger className="bg-background w-[180px]">
                            <SelectValue placeholder="TTL preset" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DEFAULT">Default</SelectItem>
                            <SelectItem value={String(60 * 60 * 1000)}>
                              1 hour
                            </SelectItem>
                            <SelectItem value={String(24 * 60 * 60 * 1000)}>
                              24 hours
                            </SelectItem>
                            <SelectItem
                              value={String(7 * 24 * 60 * 60 * 1000)}
                            >
                              7 days
                            </SelectItem>
                            <SelectItem
                              value={String(30 * 24 * 60 * 60 * 1000)}
                            >
                              30 days
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">
                            TTL (milliseconds)
                          </Label>
                          <Input
                            value={
                              currentVendor.searchShadowTtlMs == null
                                ? ""
                                : String(currentVendor.searchShadowTtlMs)
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
                                  searchShadowTtlMs: toOptionalNumber(
                                    e.target.value
                                  ),
                                } as any,
                                { shouldDirty: true, shouldValidate: true }
                              );
                            }}
                            className="bg-background font-mono text-sm"
                            placeholder="leave empty for default (e.g. 86400000)"
                          />
                          <p className="text-[11px] text-muted-foreground">
                            Tip: use preset above for common values.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">
                            Max messages
                          </Label>
                          <Input
                            value={
                              currentVendor.searchShadowMaxLength == null
                                ? ""
                                : String(currentVendor.searchShadowMaxLength)
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
                                  searchShadowMaxLength: toOptionalNumber(
                                    e.target.value
                                  ),
                                } as any,
                                { shouldDirty: true, shouldValidate: true }
                              );
                            }}
                            className="bg-background font-mono text-sm"
                            placeholder="leave empty for default (e.g. 100000)"
                          />
                          <p className="text-[11px] text-muted-foreground">
                            Tip: keep it bounded to avoid unbounded storage.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Search shadow queue name (optional)
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
                        placeholder="leave empty for auto (e.g. cs-audit-orders.queue)"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* ── POSTGRES FIELDS ── */}
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
                            { ...base, vendor: "POSTGRES", schema: e.target.value } as any,
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

              {/* ── KAFKA FIELDS ── */}
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

          <div className="flex items-center justify-end gap-3">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="gap-2"
              >
                <X size={16} /> Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                (mode === "create" &&
                  (!activeConnection || !selectedConnectionId))
              }
              className="px-8 py-6 text-base font-medium shadow-lg shadow-primary/20"
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

      <RabbitProvisioningConfirmDialog
        open={rabbitConfirmOpen}
        onOpenChange={(open) => {
          setRabbitConfirmOpen(open);
          if (!open) pendingPayloadRef.current = null;
        }}
        originalQueueName={
          String(form.getValues("technicalName") ?? "").trim() || "(not set)"
        }
        searchShadowQueueName={"auto (cs-audit-<queue>)"}
        liveShadowQueueName={"auto (cs-live-<queue>)"}
        onConfirm={confirmRabbitProvisioning}
      />
    </form>
  );
}
