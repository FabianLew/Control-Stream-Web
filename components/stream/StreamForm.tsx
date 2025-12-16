"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  createStreamSchema,
  CreateStreamFormValues,
} from "@/components/lib/schemas";

import type {
  StreamType,
  EditStreamCommand,
  CreateStreamCommand,
  UnifiedStreamDto,
  StreamVendorConfigDto,
  CorrelationKeyType,
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
  Info,
  Code,
  Link as LinkIcon,
  FileJson,
  Save,
} from "lucide-react";

type ConnectionSummary = {
  id: string;
  name: string;
  type: StreamType;
};

type StreamFormMode = "create" | "edit";

type Props = {
  mode: StreamFormMode;

  // edit: możesz podać stream (żeby np. pokazać ID, badge itd.)
  stream?: UnifiedStreamDto | null;

  // edit: defaulty formularza
  initialValues?: Partial<CreateStreamFormValues>;

  // create: jeśli true, po sukcesie router push(/streams)
  navigateAfterSubmit?: boolean;

  // create: onSubmit przyjmie CreateStreamCommand
  // edit: onSubmit przyjmie EditStreamCommand
  onSubmit: (payload: CreateStreamCommand | EditStreamCommand) => Promise<void>;
};

const VendorIcon = ({ type }: { type: string }) => {
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

function vendorDefaultsFor(
  type: StreamType,
  current?: StreamVendorConfigDto
): StreamVendorConfigDto {
  if (type === "KAFKA") {
    return current?.vendor === "KAFKA" ? current : { vendor: "KAFKA" };
  }
  if (type === "RABBIT") {
    return current?.vendor === "RABBIT"
      ? { ...current, shadowQueueEnabled: current.shadowQueueEnabled ?? false }
      : { vendor: "RABBIT", shadowQueueEnabled: false };
  }
  return current?.vendor === "POSTGRES" ? current : { vendor: "POSTGRES" };
}

export function StreamForm({
  mode,
  stream,
  initialValues,
  navigateAfterSubmit = mode === "create",
  onSubmit,
}: Props) {
  const router = useRouter();

  const [connections, setConnections] = useState<ConnectionSummary[]>([]);
  const [isLoadingConn, setIsLoadingConn] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI-only
  const [pgSchema, setPgSchema] = useState("public");
  const [rabbitShadow, setRabbitShadow] = useState(false);
  const [displayNameTouched, setDisplayNameTouched] = useState(false);

  const form = useForm<CreateStreamFormValues>({
    resolver: zodResolver(createStreamSchema),
    defaultValues: {
      name: "",
      type: "KAFKA",
      connectionId: "",
      technicalName: "",
      correlationKeyType: "HEADER",
      correlationKeyName: "trace-id",
      vendorConfig: { vendor: "KAFKA" },
      decoding: { schemaSource: "NONE", formatHint: "AUTO" },
      ...(initialValues ?? {}),
    },
    mode: "onChange",
  });

  const selectedConnectionId = form.watch("connectionId");
  const watchedType = form.watch("type") as StreamType;
  const watchedTechnical = form.watch("technicalName");
  const watchedName = form.watch("name");
  const formValues = form.watch();

  // fetch connections (dla label/wyboru w create; w edit możesz też pokazać listę)
  useEffect(() => {
    fetch("/api/connections/overview")
      .then((res) => res.json())
      .then((data) => setConnections(data))
      .catch(console.error)
      .finally(() => setIsLoadingConn(false));
  }, []);

  const activeConnection = useMemo(() => {
    if (!connections?.length) return undefined;
    return connections.find((c) => c.id === selectedConnectionId);
  }, [connections, selectedConnectionId]);

  // --- spójne defaulty zależne od typu (działa i w create i w edit)
  useEffect(() => {
    const currentVendor = form.getValues("vendorConfig") as
      | StreamVendorConfigDto
      | undefined;

    const nextVendor = vendorDefaultsFor(watchedType, currentVendor);
    if (!currentVendor || currentVendor.vendor !== nextVendor.vendor) {
      form.setValue("vendorConfig", nextVendor, { shouldDirty: true });
    }

    if (watchedType === "POSTGRES") {
      if (form.getValues("correlationKeyType") !== "COLUMN") {
        form.setValue("correlationKeyType", "COLUMN", { shouldDirty: true });
      }
      if (!form.getValues("correlationKeyName")) {
        form.setValue("correlationKeyName", "trace_id", { shouldDirty: true });
      }
    } else {
      if (form.getValues("correlationKeyType") !== "HEADER") {
        form.setValue("correlationKeyType", "HEADER", { shouldDirty: true });
      }
      if (!form.getValues("correlationKeyName")) {
        form.setValue("correlationKeyName", "trace-id", { shouldDirty: true });
      }
    }
  }, [watchedType, form]);

  // --- create-only: auto-ustaw type na podstawie connection + vendorConfig defaults
  useEffect(() => {
    if (mode !== "create") return;
    if (!activeConnection) return;

    form.setValue("type", activeConnection.type, { shouldDirty: false });

    if (activeConnection.type === "POSTGRES") {
      form.setValue("correlationKeyType", "COLUMN", { shouldDirty: false });
      form.setValue("correlationKeyName", "trace_id", { shouldDirty: false });
      form.setValue(
        "vendorConfig",
        { vendor: "POSTGRES", schema: pgSchema },
        { shouldDirty: false }
      );
    }

    if (activeConnection.type === "RABBIT") {
      form.setValue("correlationKeyType", "HEADER", { shouldDirty: false });
      form.setValue("correlationKeyName", "trace-id", { shouldDirty: false });
      form.setValue(
        "vendorConfig",
        { vendor: "RABBIT", shadowQueueEnabled: rabbitShadow },
        { shouldDirty: false }
      );
    }

    if (activeConnection.type === "KAFKA") {
      form.setValue("correlationKeyType", "HEADER", { shouldDirty: false });
      form.setValue("correlationKeyName", "trace-id", { shouldDirty: false });
      form.setValue(
        "vendorConfig",
        { vendor: "KAFKA" },
        { shouldDirty: false }
      );
    }

    // decoding default (UI jest poniżej)
    form.setValue(
      "decoding",
      { schemaSource: "NONE", formatHint: "AUTO" },
      { shouldDirty: false }
    );
  }, [
    mode,
    activeConnection?.id,
    activeConnection?.type,
    pgSchema,
    rabbitShadow,
  ]);

  // Display Name auto-fill z Technical Name (tylko dopóki user nie dotknął name)
  useEffect(() => {
    if (displayNameTouched) return;

    const technical = (watchedTechnical ?? "").trim();
    if (!technical) return;

    const currentName = (watchedName ?? "").trim();
    if (currentName) return;

    const suggested = titleFromTechnical(technical);
    if (!suggested) return;

    form.setValue("name", suggested, {
      shouldDirty: false,
      shouldTouch: false,
    });
  }, [watchedTechnical, watchedName, displayNameTouched, form]);

  useEffect(() => {
    if (mode !== "create") return;
    setDisplayNameTouched(false);
  }, [mode, selectedConnectionId]);

  const buildPayload = (data: CreateStreamFormValues): CreateStreamCommand => {
    const vendorType = data.type;
    const technical = data.technicalName?.trim();

    // Dociągamy brakujące pola (bez rozbijania UI):
    let vendorConfig: StreamVendorConfigDto = data.vendorConfig;

    if (vendorType === "KAFKA") {
      vendorConfig = {
        vendor: "KAFKA",
        topic: technical || undefined,
      };
    }

    if (vendorType === "RABBIT") {
      vendorConfig = {
        vendor: "RABBIT",
        queue: technical || undefined,
        shadowQueueEnabled: rabbitShadow,
      };
    }

    if (vendorType === "POSTGRES") {
      vendorConfig = {
        vendor: "POSTGRES",
        schema: pgSchema,
        table: technical || undefined,
        correlationColumn: data.correlationKeyName || undefined,
      };
    }

    return {
      name: data.name,
      type: data.type,
      connectionId: data.connectionId,
      technicalName: data.technicalName,
      correlationKeyType: data.correlationKeyType,
      correlationKeyName: data.correlationKeyName,
      vendorConfig,
      decoding: data.decoding,
    };
  };

  const submit = async (data: CreateStreamFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = buildPayload(data);
      await onSubmit(payload);

      if (payload.decoding?.schemaRegistry) {
        delete (payload.decoding.schemaRegistry as any).enabled;
      }

      if (navigateAfterSubmit) {
        router.push("/streams");
        router.refresh();
      }
    } catch (e) {
      setError("Failed to save stream. Please check configuration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPreviewJson = () =>
    JSON.stringify(buildPayload(formValues as CreateStreamFormValues), null, 2);

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit, (errors) =>
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
              {stream?.id && (
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">Stream ID</div>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {stream.id}
                  </Badge>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Connection
                </label>
                <Select
                  value={form.watch("connectionId")}
                  onValueChange={(val) =>
                    form.setValue("connectionId", val, { shouldDirty: true })
                  }
                  disabled={isLoadingConn || mode === "edit"} // edit: zwykle nie pozwalamy zmieniać connection
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select connection..." />
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
                {form.formState.errors.connectionId && (
                  <p className="text-destructive text-xs">
                    Connection is required
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Display Name
                </label>
                <Input
                  {...form.register("name", {
                    onChange: (e) => {
                      setDisplayNameTouched(true);
                      form.setValue("name", e.target.value, {
                        shouldDirty: true,
                      });
                    },
                  })}
                  placeholder="e.g. Orders Stream"
                  className="bg-background"
                />
                {form.formState.errors.name && (
                  <p className="text-destructive text-xs">
                    {form.formState.errors.name.message}
                  </p>
                )}
                {!displayNameTouched && (
                  <p className="text-[11px] text-muted-foreground">
                    Display Name can be auto-filled from Technical Name.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/10 border-dashed border-border/60">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-primary text-sm font-medium">
                <Info size={16} /> Information
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Streams map physical data sources (Topics, Queues, Tables) to
                ControlStream&apos;s internal logic.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/60 shadow-sm relative overflow-hidden">
            <div
              className={`absolute top-0 left-0 w-full h-1 transition-colors duration-300
                ${
                  watchedType === "KAFKA"
                    ? "bg-purple-500"
                    : watchedType === "RABBIT"
                    ? "bg-orange-500"
                    : watchedType === "POSTGRES"
                    ? "bg-blue-500"
                    : "bg-slate-500"
                }`}
            />

            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted/30 rounded-lg border border-border">
                  {watchedType ? (
                    <VendorIcon type={watchedType} />
                  ) : (
                    <LinkIcon className="text-slate-500 h-5 w-5" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {watchedType
                      ? `${watchedType} Configuration`
                      : "Configuration"}
                  </CardTitle>
                  <CardDescription>
                    Define technical details for{" "}
                    {activeConnection?.name || "the selected connection"}.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Type selector: w create sterowane connection, w edit możesz pozwolić zmienić (ja zostawiam w edit jako enabled) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Type
                  </label>
                  <Select
                    value={form.watch("type")}
                    onValueChange={(val) =>
                      form.setValue("type", val as StreamType, {
                        shouldDirty: true,
                      })
                    }
                    disabled={mode === "create"} // create: type wynika z connection
                  >
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
              </div>

              {/* POSTGRES: schema + table */}
              {watchedType === "POSTGRES" ? (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Table Schema
                    </label>
                    <Input
                      value={pgSchema}
                      onChange={(e) => setPgSchema(e.target.value)}
                      className="bg-background font-mono text-sm"
                      placeholder="public"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Will be sent as{" "}
                      <span className="font-mono">vendorConfig.schema</span>.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Table Name
                    </label>
                    <div className="relative">
                      <Code className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        {...form.register("technicalName")}
                        placeholder="cs_demo_events"
                        className="bg-background pl-9 font-mono text-sm border-primary/20 focus-visible:border-primary"
                      />
                    </div>
                    {form.formState.errors.technicalName && (
                      <p className="text-destructive text-xs">
                        {form.formState.errors.technicalName.message}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                // KAFKA/RABBIT: topic/queue name
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {watchedType === "RABBIT" ? "Queue Name" : "Topic Name"}
                  </label>
                  <div className="relative">
                    <Code className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      {...form.register("technicalName")}
                      placeholder={
                        watchedType === "RABBIT"
                          ? "cs.demo.rabbit"
                          : "cs.demo.json"
                      }
                      className="bg-background pl-9 font-mono text-sm border-primary/20 focus-visible:border-primary"
                    />
                  </div>
                  {form.formState.errors.technicalName && (
                    <p className="text-destructive text-xs">
                      {form.formState.errors.technicalName.message}
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    Technical Name is the source of truth.
                  </p>
                </div>
              )}

              {/* RABBIT: shadow toggle */}
              {watchedType === "RABBIT" && (
                <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/20 animate-in fade-in">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Shadow Queue</Label>
                    <p className="text-[10px] text-muted-foreground">
                      Enable shadow queue provisioning for this stream.
                    </p>
                  </div>
                  <Switch
                    checked={rabbitShadow}
                    onCheckedChange={setRabbitShadow}
                  />
                </div>
              )}

              <Separator />

              {/* CORRELATION */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Correlation Strategy
                  </label>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-normal text-muted-foreground"
                  >
                    Required
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">
                      Location
                    </label>
                    <Select
                      value={form.watch("correlationKeyType")}
                      onValueChange={(val) =>
                        form.setValue(
                          "correlationKeyType",
                          val as CorrelationKeyType,
                          { shouldDirty: true }
                        )
                      }
                    >
                      <SelectTrigger className="bg-background text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HEADER">Header</SelectItem>
                        <SelectItem value="COLUMN">Column</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2 space-y-2">
                    <label className="text-xs text-muted-foreground">
                      Key Name
                    </label>
                    <Input
                      {...form.register("correlationKeyName")}
                      placeholder={
                        watchedType === "POSTGRES" ? "trace_id" : "trace-id"
                      }
                      className="bg-background font-mono text-sm"
                    />
                    {form.formState.errors.correlationKeyName && (
                      <p className="text-destructive text-xs">
                        {form.formState.errors.correlationKeyName.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* DECODING (jedno miejsce, reuse!) */}
              <DecodingConfigCard form={form} />

              {/* PREVIEW */}
              <div className="mt-6 pt-6 border-t border-border space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  <FileJson size={12} /> Definition Preview
                </div>
                <div className="bg-slate-950 rounded-lg border border-border p-4 shadow-inner">
                  <pre className="text-xs font-mono text-blue-400 overflow-x-auto whitespace-pre-wrap">
                    {getPreviewJson()}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>

          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2 animate-in slide-in-from-top-2">
              <Activity size={16} /> {error}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={
                isSubmitting || (mode === "create" && !activeConnection)
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
