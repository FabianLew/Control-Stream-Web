"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  createConnectionSchema,
  type CreateConnectionFormValues,
} from "@/components/lib/schemas";

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

import { Loader2, Save, Info, Code, PenLine } from "lucide-react";
import {
  getVendorMeta,
  VENDOR_OPTIONS,
  type KnownVendor,
  isVendor,
  VENDOR_META,
} from "@/components/lib/vendors";

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
  initialData?: (CreateConnectionFormValues & { id: string }) | null;
  navigateAfterSubmit?: boolean;
  onSubmit: (payload: CreateConnectionFormValues) => Promise<void>;
  onSubmittedSuccessfully?: () => void; // e.g. close dialog in edit
};

const defaultKafkaValues: CreateConnectionFormValues = {
  name: "",
  type: "KAFKA",
  config: {
    vendor: "KAFKA",
    host: "localhost",
    port: 9092,
    bootstrapServers: "localhost:9092",
    securityProtocol: "PLAINTEXT",
    saslMechanism: undefined,
    saslJaasConfig: undefined,
    extra: {},
  },
};

const defaultRabbitValues: CreateConnectionFormValues = {
  name: "",
  type: "RABBIT",
  config: {
    vendor: "RABBIT",
    host: "localhost",
    port: 5672,
    username: "guest",
    password: "",
    virtualHost: "/",
  },
};

const defaultPostgresValues: CreateConnectionFormValues = {
  name: "",
  type: "POSTGRES",
  config: {
    vendor: "POSTGRES",
    host: "localhost",
    port: 5432,
    jdbcUrl: "",
    username: "postgres",
    password: "",
  },
};

function defaultsForType(type: ConnectionType): CreateConnectionFormValues {
  if (isVendor(type, VENDOR_META.KAFKA)) return defaultKafkaValues;
  if (isVendor(type, VENDOR_META.RABBIT)) return defaultRabbitValues;
  return defaultPostgresValues;
}

function toOptionalString(value: unknown): string | undefined {
  if (value == null) return undefined;
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : undefined;
}

function toRequiredString(value: unknown, fallback: string): string {
  return toOptionalString(value) ?? fallback;
}

function toRequiredNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value) && value > 0)
    return value;
  const parsed = Number(String(value ?? "").trim());
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return fallback;
}

function buildKafkaBootstrapServers(host: string, port: number): string {
  return `${host}:${port}`;
}

function buildPostgresJdbcUrl(host: string, port: number, dbName: string) {
  const safeDb = toRequiredString(dbName, "postgres");
  return `jdbc:postgresql://${host}:${port}/${safeDb}`;
}

/**
 * Normalizacja payloadu:
 * - trim stringów
 * - "" -> undefined dla optional
 * - edit: jeżeli password puste => usuwamy (żeby nie nadpisać)
 * - Kafka: bootstrapServers zawsze spójne z host/port
 * - Postgres: jdbcUrl zawsze spójne z host/port + dbName (użytkownik edytuje dbName, nie jdbcUrl)
 */
function normalizeConnectionPayload(
  mode: Mode,
  raw: CreateConnectionFormValues,
  postgresDatabaseName: string
): CreateConnectionFormValues {
  const type = raw.type as ConnectionType;
  const name = toRequiredString(raw.name, "");

  if (isVendor(type, VENDOR_META.KAFKA)) {
    const host = toRequiredString((raw.config as any).host, "localhost");
    const port = toRequiredNumber((raw.config as any).port, 9092);

    const securityProtocol =
      toOptionalString((raw.config as any).securityProtocol) ?? "PLAINTEXT";
    const saslMechanism = toOptionalString((raw.config as any).saslMechanism);
    const saslJaasConfig = toOptionalString((raw.config as any).saslJaasConfig);

    const bootstrapServers = buildKafkaBootstrapServers(host, port);

    const extra =
      (raw.config as any).extra && typeof (raw.config as any).extra === "object"
        ? (raw.config as any).extra
        : undefined;

    return {
      name,
      type: "KAFKA",
      config: {
        vendor: "KAFKA",
        host,
        port,
        bootstrapServers,
        securityProtocol,
        saslMechanism,
        saslJaasConfig,
        extra,
      } as any,
    };
  }

  if (isVendor(type, VENDOR_META.RABBIT)) {
    const host = toRequiredString((raw.config as any).host, "localhost");
    const port = toRequiredNumber((raw.config as any).port, 5672);
    const username = toRequiredString((raw.config as any).username, "guest");

    const passwordRaw = toOptionalString((raw.config as any).password);
    const virtualHost = toRequiredString((raw.config as any).virtualHost, "/");

    const config: any = {
      vendor: "RABBIT",
      host,
      port,
      username,
      virtualHost,
    };

    // edit: password pusty => nie wysyłamy
    if (mode === "create") {
      config.password = passwordRaw ?? "";
    } else {
      if (passwordRaw) config.password = passwordRaw;
    }

    return { name, type: "RABBIT", config };
  }

  // POSTGRES
  const host = toRequiredString((raw.config as any).host, "localhost");
  const port = toRequiredNumber((raw.config as any).port, 5432);
  const username = toRequiredString((raw.config as any).username, "postgres");

  const jdbcUrl = buildPostgresJdbcUrl(host, port, postgresDatabaseName);

  const passwordRaw = toOptionalString((raw.config as any).password);

  const config: any = {
    vendor: "POSTGRES",
    host,
    port,
    jdbcUrl,
    username,
  };

  if (mode === "create") {
    config.password = passwordRaw ?? "";
  } else {
    if (passwordRaw) config.password = passwordRaw;
  }

  return { name, type: "POSTGRES", config };
}

function previewJson(
  values: CreateConnectionFormValues,
  postgresDatabaseName: string
) {
  const normalized = normalizeConnectionPayload(
    "create",
    values,
    postgresDatabaseName
  );

  // mask passwords
  const masked: any = structuredClone(normalized);
  if (masked?.config?.password) masked.config.password = "********";

  return JSON.stringify(masked, null, 2);
}

export function ConnectionForm({
  mode,
  initialData,
  navigateAfterSubmit = mode === "create",
  onSubmit,
  onSubmittedSuccessfully,
}: Props) {
  const isEditMode = mode === "edit";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postgresDatabaseName, setPostgresDatabaseName] = useState("postgres");

  const schema = useMemo(() => createConnectionSchema, []);

  const form = useForm<CreateConnectionFormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialData ?? defaultKafkaValues,
    mode: "onChange",
  });

  const selectedType = form.watch("type") as ConnectionType;
  const configHost = form.watch("config.host");
  const configPort = form.watch("config.port");

  // init postgres db name from jdbcUrl once (edit case)
  const didInitPostgresDbRef = useRef(false);
  useEffect(() => {
    if (!isVendor(selectedType, VENDOR_META.POSTGRES)) return;
    if (didInitPostgresDbRef.current) return;

    const current = String(form.getValues("config.jdbcUrl") ?? "").trim();
    if (!current) {
      didInitPostgresDbRef.current = true;
      return;
    }

    const match = /jdbc:postgresql:\/\/[^/]+\/([^?]+).*/.exec(current);
    if (match?.[1]) setPostgresDatabaseName(match[1]);

    didInitPostgresDbRef.current = true;
  }, [selectedType, form]);

  // derived config: Kafka bootstrapServers (read-only field)
  useEffect(() => {
    if (!isVendor(selectedType, VENDOR_META.KAFKA)) return;

    const host = toRequiredString(configHost, "localhost");
    const port = toRequiredNumber(configPort, 9092);

    form.setValue(
      "config.bootstrapServers",
      buildKafkaBootstrapServers(host, port),
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    );
  }, [selectedType, configHost, configPort, form]);

  // derived config: Postgres jdbcUrl (read-only field)
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

  const handleTypeChange = (val: ConnectionType) => {
    const currentName = form.getValues("name");
    const nextDefaults = defaultsForType(val);

    // reset everything except name
    form.reset({ ...nextDefaults, name: currentName } as any, {
      keepDirty: false,
      keepTouched: false,
    });

    // reset postgres db helper when switching vendors
    didInitPostgresDbRef.current = false;
    if (isVendor(val, VENDOR_META.POSTGRES)) setPostgresDatabaseName("postgres");
  };

  const configErrors = form.formState.errors?.config as any;

  const submit: SubmitHandler<CreateConnectionFormValues> = async (data) => {
    setIsSubmitting(true);

    try {
      const normalized = normalizeConnectionPayload(
        mode,
        data,
        postgresDatabaseName
      );

      // validate normalized against schema (prevents "preview ok but submit blocked")
      const parsed = schema.safeParse(normalized);
      if (!parsed.success) {
        form.reset(normalized as any, { keepDirty: true, keepTouched: true });
        await form.trigger();
        setIsSubmitting(false);
        return;
      }

      await onSubmit(parsed.data);

      // success toast (green)
      toast.success(
        isEditMode
          ? "Connection updated successfully"
          : "Connection created successfully",
        {
          description: isEditMode
            ? "Your changes were saved."
            : "The new connection is ready to use.",
        }
      );

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

  const values = form.watch();
  const preview = useMemo(
    () => previewJson(values, postgresDatabaseName),
    [values, postgresDatabaseName]
  );

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
                  // Jeśli chcesz zablokować vendor w edit:
                  // disabled={isEditMode}
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
              {/* HOST & PORT */}
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

              {/* KAFKA */}
              {isVendor(selectedType, VENDOR_META.KAFKA) && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Bootstrap Servers
                    </label>
                    <Input
                      {...form.register("config.bootstrapServers")}
                      readOnly
                      className="bg-muted/20 font-mono text-sm"
                    />
                    {configErrors?.bootstrapServers && (
                      <p className="text-destructive text-xs">
                        {configErrors.bootstrapServers.message}
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
                      {...form.register("config.securityProtocol")}
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
                        {...form.register("config.saslMechanism")}
                        placeholder="e.g. PLAIN / SCRAM-SHA-512"
                        className="bg-background font-mono text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        SASL JAAS Config
                      </label>
                      <Input
                        {...form.register("config.saslJaasConfig")}
                        placeholder="e.g. org.apache.kafka.common.security..."
                        className="bg-background font-mono text-sm"
                      />
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Advanced Kafka client properties (key/value) will be
                    supported here soon.
                  </div>
                </div>
              )}

              {/* POSTGRES */}
              {isVendor(selectedType, VENDOR_META.POSTGRES) && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Database Name
                      </label>
                      <Input
                        value={postgresDatabaseName}
                        onChange={(e) =>
                          setPostgresDatabaseName(e.target.value)
                        }
                        placeholder="postgres"
                        className="bg-background font-mono text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        JDBC URL
                      </label>
                      <Input
                        {...form.register("config.jdbcUrl")}
                        readOnly
                        className="bg-muted/20 font-mono text-sm"
                      />
                      {configErrors?.jdbcUrl && (
                        <p className="text-destructive text-xs">
                          {configErrors.jdbcUrl.message}
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
                        {...form.register("config.username")}
                        className="bg-background"
                      />
                      {configErrors?.username && (
                        <p className="text-destructive text-xs">
                          {configErrors.username.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Password
                      </label>
                      <Input
                        {...form.register("config.password")}
                        type="password"
                        placeholder={
                          isEditMode ? "•••••• (leave empty to keep)" : "••••••"
                        }
                        className="bg-background"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* RABBIT */}
              {isVendor(selectedType, VENDOR_META.RABBIT) && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Username
                      </label>
                      <Input
                        {...form.register("config.username")}
                        placeholder="guest"
                        className="bg-background"
                      />
                      {configErrors?.username && (
                        <p className="text-destructive text-xs">
                          {configErrors.username.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Password
                      </label>
                      <Input
                        {...form.register("config.password")}
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
                      {...form.register("config.virtualHost")}
                      placeholder="/"
                      className="bg-background font-mono text-sm"
                    />
                    {configErrors?.virtualHost && (
                      <p className="text-destructive text-xs">
                        {configErrors.virtualHost.message}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* PREVIEW */}
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

          <div className="flex justify-end">
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
