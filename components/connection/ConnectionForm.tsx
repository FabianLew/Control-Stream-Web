"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { createConnectionSchema } from "@/components/lib/schemas";
import type { ConnectionDto, ConnectionUpsertPayload } from "@/types/connection";

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
import { StreamTypeBadge } from "@/components/shared/StreamTypeBadge";
import { handleInvalidSubmit } from "@/components/lib/formError";

import { Loader2, Save, Info, Code, PenLine, X } from "lucide-react";
import {
  getVendorMeta,
  VENDOR_OPTIONS,
  type KnownVendor,
  isVendor,
  VENDOR_META,
} from "@/components/lib/vendors";

import {
  type ConnectionFormValues,
  DEFAULT_KAFKA_CONNECTION_VALUES,
  defaultValuesForType,
  mapConnectionDtoToFormValues,
  mapFormValuesToCreateCommand,
  mapFormValuesToUpdateCommand,
  parsePostgresDatabaseName,
  buildKafkaBootstrapServers,
  buildPostgresJdbcUrl,
  toRequiredString,
  toRequiredNumber,
} from "@/lib/connections/form-mappers";

type ConnectionType = KnownVendor;

type VendorIconProps = { type: ConnectionType };
const VendorIcon = ({ type }: VendorIconProps) => {
  const vendor = getVendorMeta(type);
  const Icon = vendor.icon;
  return <Icon className={`${vendor.iconClass} h-6 w-6`} />;
};

type Mode = "create" | "edit";

type Props = {
  mode: Mode;
  initialData?: ConnectionDto | null;
  onSubmit: (payload: ConnectionUpsertPayload) => Promise<void>;
  onSubmittedSuccessfully?: () => void;
  onCancel?: () => void;
};

export function ConnectionForm({
  mode,
  initialData,
  onSubmit,
  onSubmittedSuccessfully,
  onCancel,
}: Props) {
  const isEditMode = mode === "edit";
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Synchronous init (useMemo, empty deps — runs once at mount) ──────────
  const initialFormValues = useMemo((): ConnectionFormValues => {
    if (mode === "edit" && initialData) {
      return mapConnectionDtoToFormValues(initialData);
    }
    return DEFAULT_KAFKA_CONNECTION_VALUES;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — captured once at mount

  // postgresDatabaseName is a UI-only field derived from jdbcUrl
  const [postgresDatabaseName, setPostgresDatabaseName] = useState<string>(
    () => {
      if (mode === "edit" && initialData?.type === "POSTGRES") {
        return parsePostgresDatabaseName(
          (initialData.config as any).jdbcUrl
        );
      }
      return "postgres";
    }
  );

  const schema = useMemo(() => createConnectionSchema, []);

  const form = useForm<ConnectionFormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialFormValues,
    mode: "onChange",
  });

  // Guard ref — pre-populated so the first useEffect cycle is a no-op
  // (useMemo already handled the initial connection at mount)
  const lastInitConnectionIdRef = useRef<string | null>(
    mode === "edit" && initialData ? initialData.id : null
  );

  // Secondary reset — fires only when a different connection is loaded after mount
  useEffect(() => {
    if (mode !== "edit" || !initialData) return;
    if (lastInitConnectionIdRef.current === initialData.id) return;
    lastInitConnectionIdRef.current = initialData.id;

    if (initialData.type === "POSTGRES") {
      setPostgresDatabaseName(
        parsePostgresDatabaseName((initialData.config as any).jdbcUrl)
      );
    } else {
      setPostgresDatabaseName("postgres");
    }

    form.reset(mapConnectionDtoToFormValues(initialData));
  }, [mode, initialData, form]);

  // ─── Derived watched values ───────────────────────────────────────────────
  const selectedType = form.watch("type") as ConnectionType;
  const configHost = form.watch("config.host");
  const configPort = form.watch("config.port");

  // Sync Kafka bootstrapServers (derived read-only field)
  useEffect(() => {
    if (!isVendor(selectedType, VENDOR_META.KAFKA)) return;
    const host = toRequiredString(configHost, "localhost");
    const port = toRequiredNumber(configPort, 9092);
    form.setValue(
      "config.bootstrapServers",
      buildKafkaBootstrapServers(host, port),
      { shouldDirty: true, shouldValidate: true }
    );
  }, [selectedType, configHost, configPort, form]);

  // Sync Postgres jdbcUrl (derived read-only field)
  useEffect(() => {
    if (!isVendor(selectedType, VENDOR_META.POSTGRES)) return;
    const host = toRequiredString(configHost, "localhost");
    const port = toRequiredNumber(configPort, 5432);
    const jdbcUrl = buildPostgresJdbcUrl(host, port, postgresDatabaseName);
    form.setValue("config.jdbcUrl", jdbcUrl, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [selectedType, configHost, configPort, postgresDatabaseName, form]);

  const vendorMeta = useMemo(
    () => getVendorMeta(selectedType),
    [selectedType]
  );
  const vendorTitle = vendorMeta.connectionTitle;

  // ─── Type switch ──────────────────────────────────────────────────────────
  const handleTypeChange = (val: ConnectionType) => {
    const currentName = form.getValues("name");
    const nextDefaults = defaultValuesForType(val);
    form.reset({ ...nextDefaults, name: currentName } as any, {
      keepDirty: false,
      keepTouched: false,
    });
    if (isVendor(val, VENDOR_META.POSTGRES)) {
      setPostgresDatabaseName("postgres");
    }
  };

  const configErrors = form.formState.errors?.config as any;

  // ─── Submit ───────────────────────────────────────────────────────────────
  const submit: SubmitHandler<ConnectionFormValues> = async (data) => {
    setIsSubmitting(true);
    try {
      const command =
        mode === "create"
          ? mapFormValuesToCreateCommand(data, postgresDatabaseName)
          : mapFormValuesToUpdateCommand(data, postgresDatabaseName);

      await onSubmit(command);
      onSubmittedSuccessfully?.();
    } catch (e) {
      console.error(e);
      toast.error("Connection not saved", {
        description: "Something went wrong. Please check inputs and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── JSON Preview ─────────────────────────────────────────────────────────
  const values = form.watch();
  const preview = useMemo(() => {
    const normalized =
      mode === "create"
        ? mapFormValuesToCreateCommand(values, postgresDatabaseName)
        : mapFormValuesToUpdateCommand(values, postgresDatabaseName);
    const masked: any = structuredClone(normalized);
    if (masked?.config?.password) masked.config.password = "********";
    return JSON.stringify(masked, null, 2);
  }, [values, postgresDatabaseName, mode]);

  return (
    <form
      onSubmit={form.handleSubmit(submit, (errors) =>
        handleInvalidSubmit(errors, {
          title: "Connection not saved",
          description: "Please correct the highlighted fields and try again.",
        })
      )}
      className="space-y-8 animate-in slide-in-from-bottom-4 duration-500"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* LEFT */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">
                {isEditMode ? "Edit Connection" : "Connection Details"}
              </CardTitle>
              <CardDescription>
                {isEditMode
                  ? "Modify existing resource settings."
                  : "Basic identification for this resource."}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Name
                </label>
                <Input
                  {...form.register("name")}
                  placeholder="e.g. Production Kafka Cluster"
                  className="bg-background"
                />
                {form.formState.errors.name && (
                  <p className="text-destructive text-xs">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              {/* Type */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Vendor Type
                </label>
                <Select
                  value={selectedType}
                  onValueChange={(val) =>
                    handleTypeChange(val as ConnectionType)
                  }
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {VENDOR_OPTIONS.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="pt-2 flex justify-end">
                  <StreamTypeBadge type={selectedType} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/10 border-dashed border-border/60">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-primary text-sm font-medium">
                <Info size={16} /> Configuration Tips
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ensure the host is reachable from the ControlStream agent
                network.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/60 shadow-sm relative overflow-hidden">
            <div
              className={`absolute top-0 left-0 w-full h-1 ${vendorMeta.headerBar}`}
            />

            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted/30 rounded-lg border border-border">
                  <VendorIcon type={selectedType} />
                </div>
                <div>
                  <CardTitle className="text-lg">{vendorTitle}</CardTitle>
                  <CardDescription>
                    {isEditMode ? "Update" : "Enter"} connection parameters for{" "}
                    {vendorMeta.displayName}.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* HOST & PORT — shared across all vendor types */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Host / Address
                  </label>
                  <Input
                    {...form.register("config.host")}
                    placeholder="localhost"
                    className="font-mono text-sm bg-background"
                  />
                  {configErrors?.host && (
                    <p className="text-destructive text-xs">
                      {configErrors.host.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Port
                  </label>
                  <Input
                    {...form.register("config.port", { valueAsNumber: true })}
                    type="number"
                    className="font-mono text-sm bg-background"
                  />
                  {configErrors?.port && (
                    <p className="text-destructive text-xs">
                      {configErrors.port.message}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Vendor-specific sections */}
              {isVendor(selectedType, VENDOR_META.KAFKA) && (
                <KafkaConnectionSection
                  register={form.register}
                  errors={configErrors}
                />
              )}

              {isVendor(selectedType, VENDOR_META.POSTGRES) && (
                <PostgresConnectionSection
                  register={form.register}
                  errors={configErrors}
                  isEditMode={isEditMode}
                  postgresDatabaseName={postgresDatabaseName}
                  onDatabaseNameChange={setPostgresDatabaseName}
                />
              )}

              {isVendor(selectedType, VENDOR_META.RABBIT) && (
                <RabbitConnectionSection
                  register={form.register}
                  errors={configErrors}
                  isEditMode={isEditMode}
                />
              )}

              {/* Configuration Preview */}
              <div className="mt-6 pt-6 border-t border-border space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  <Code size={12} /> Configuration Preview
                </div>
                <div className="bg-slate-950 rounded-lg border border-border p-4 shadow-inner">
                  <pre className="text-xs font-mono text-green-400 overflow-x-auto">
                    {preview}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
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
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-6 text-base font-medium shadow-lg shadow-primary/20"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin mr-2" />
              ) : isEditMode ? (
                <PenLine className="mr-2" size={18} />
              ) : (
                <Save className="mr-2" size={18} />
              )}
              {isEditMode ? "Update Connection" : "Save Connection"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

// ─── Vendor subcomponents ─────────────────────────────────────────────────────

function KafkaConnectionSection({
  register,
  errors,
}: {
  register: any;
  errors: any;
}) {
  return (
    <div className="space-y-4 animate-in fade-in">
      <div className="space-y-2">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Bootstrap Servers
        </label>
        <Input
          {...register("config.bootstrapServers")}
          readOnly
          className="bg-muted/20 font-mono text-sm"
        />
        {errors?.bootstrapServers && (
          <p className="text-destructive text-xs">
            {errors.bootstrapServers.message}
          </p>
        )}
        <p className="text-[11px] text-muted-foreground">
          Auto-generated from Host and Port.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Security Protocol
        </label>
        <Input
          {...register("config.securityProtocol")}
          placeholder="PLAINTEXT / SSL / SASL_SSL ..."
          className="bg-background font-mono text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            SASL Mechanism
          </label>
          <Input
            {...register("config.saslMechanism")}
            placeholder="e.g. PLAIN / SCRAM-SHA-512"
            className="bg-background font-mono text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            SASL JAAS Config
          </label>
          <Input
            {...register("config.saslJaasConfig")}
            placeholder="e.g. org.apache.kafka.common.security..."
            className="bg-background font-mono text-sm"
          />
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        Advanced Kafka client properties (key/value) will be supported here
        soon.
      </div>
    </div>
  );
}

function PostgresConnectionSection({
  register,
  errors,
  isEditMode,
  postgresDatabaseName,
  onDatabaseNameChange,
}: {
  register: any;
  errors: any;
  isEditMode: boolean;
  postgresDatabaseName: string;
  onDatabaseNameChange: (val: string) => void;
}) {
  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Database Name
          </label>
          <Input
            value={postgresDatabaseName}
            onChange={(e) => onDatabaseNameChange(e.target.value)}
            placeholder="postgres"
            className="bg-background font-mono text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            JDBC URL
          </label>
          <Input
            {...register("config.jdbcUrl")}
            readOnly
            className="bg-muted/20 font-mono text-sm"
          />
          {errors?.jdbcUrl && (
            <p className="text-destructive text-xs">
              {errors.jdbcUrl.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Username
          </label>
          <Input
            {...register("config.username")}
            className="bg-background"
          />
          {errors?.username && (
            <p className="text-destructive text-xs">
              {errors.username.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Password
          </label>
          <Input
            {...register("config.password")}
            type="password"
            placeholder={
              isEditMode ? "•••••• (leave empty to keep)" : "••••••"
            }
            className="bg-background"
          />
        </div>
      </div>
    </div>
  );
}

function RabbitConnectionSection({
  register,
  errors,
  isEditMode,
}: {
  register: any;
  errors: any;
  isEditMode: boolean;
}) {
  return (
    <div className="space-y-4 animate-in fade-in">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Username
          </label>
          <Input
            {...register("config.username")}
            placeholder="guest"
            className="bg-background"
          />
          {errors?.username && (
            <p className="text-destructive text-xs">
              {errors.username.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Password
          </label>
          <Input
            {...register("config.password")}
            type="password"
            placeholder={
              isEditMode ? "•••••• (leave empty to keep)" : "••••••"
            }
            className="bg-background"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Virtual Host
        </label>
        <Input
          {...register("config.virtualHost")}
          placeholder="/"
          className="bg-background font-mono text-sm"
        />
        {errors?.virtualHost && (
          <p className="text-destructive text-xs">
            {errors.virtualHost.message}
          </p>
        )}
      </div>
    </div>
  );
}
