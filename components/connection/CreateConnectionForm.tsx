"use client";

import {
  useForm,
  DefaultValues,
  Resolver,
  SubmitHandler,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Save,
  Activity,
  Layers,
  Database,
  Server,
  Info,
  Code,
  PenLine,
} from "lucide-react";

import {
  createConnectionSchema,
  CreateConnectionFormValues,
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

const VendorIcon = ({ type }: { type: string }) => {
  if (type === "KAFKA") return <Activity className="text-purple-500 h-6 w-6" />;
  if (type === "RABBIT") return <Layers className="text-orange-500 h-6 w-6" />;
  if (type === "POSTGRES")
    return <Database className="text-blue-500 h-6 w-6" />;
  return <Server className="text-slate-500 h-6 w-6" />;
};

type ConnectionFormProps = {
  initialData?: CreateConnectionFormValues & { id: string };
};

const defaultKafkaValues: DefaultValues<CreateConnectionFormValues> = {
  name: "",
  type: "KAFKA",
  config: {
    vendor: "KAFKA",
    host: "localhost",
    port: 9092,
    securityProtocol: "PLAINTEXT",
    saslMechanism: "",
    saslJaasConfig: "",
    extra: {},
  },
};

const defaultRabbitValues: DefaultValues<CreateConnectionFormValues> = {
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

const defaultPostgresValues: DefaultValues<CreateConnectionFormValues> = {
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

function defaultsForType(
  type: "KAFKA" | "RABBIT" | "POSTGRES"
): DefaultValues<CreateConnectionFormValues> {
  if (type === "KAFKA") return defaultKafkaValues;
  if (type === "RABBIT") return defaultRabbitValues;
  return defaultPostgresValues;
}

export function ConnectionForm({ initialData }: ConnectionFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [postgresDatabaseName, setPostgresDatabaseName] = useState("postgres");

  const isEditMode = !!initialData;

  const form = useForm<CreateConnectionFormValues>({
    resolver: zodResolver(
      createConnectionSchema
    ) as Resolver<CreateConnectionFormValues>,
    defaultValues: initialData ?? defaultKafkaValues,
    mode: "onSubmit",
  });

  const selectedType = form.watch("type"); // ok - istnieje w nowym schema
  const config = form.watch("config"); // typed object
  const configHost = form.watch("config.host");
  const configPort = form.watch("config.port");

  useEffect(() => {
    if (selectedType !== "POSTGRES") return;

    const host = (configHost || "localhost").trim();
    const port =
      typeof configPort === "number" && configPort > 0 ? configPort : 5432;
    const db = (postgresDatabaseName || "postgres").trim();

    form.setValue("config.jdbcUrl", `jdbc:postgresql://${host}:${port}/${db}`, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [selectedType, configHost, configPort, postgresDatabaseName, form]);

  useEffect(() => {
    if (selectedType !== "POSTGRES") return;

    const current = form.getValues("config.jdbcUrl");
    if (!current) return;

    // próbujemy wyciągnąć nazwę bazy z końcówki jdbcUrl
    const match = /jdbc:postgresql:\/\/[^/]+\/([^?]+).*/.exec(current);
    if (match?.[1]) {
      setPostgresDatabaseName(match[1]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType]);

  const vendorTitle = useMemo(() => {
    if (selectedType === "POSTGRES") return "Database Configuration";
    if (selectedType === "KAFKA") return "Cluster Configuration";
    return "Broker Configuration";
  }, [selectedType]);

  const handleTypeChange = (val: "KAFKA" | "RABBIT" | "POSTGRES") => {
    const currentName = form.getValues("name");
    const nextDefaults = defaultsForType(val);
    // zachowaj name przy przełączaniu, reszta reset do defaultów
    form.reset({ ...(nextDefaults as any), name: currentName } as any);
  };

  const onSubmit: SubmitHandler<CreateConnectionFormValues> = async (data) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const payload: any = structuredClone(data);

      // Backend: KafkaConnectionConfigDto ma bootstrapServers. Ustawiamy spójnie.
      if (payload.type === "KAFKA") {
        payload.config.bootstrapServers = `${payload.config.host}:${payload.config.port}`;
        // sensowne defaulty jeśli user nie ustawił:
        if (!payload.config.securityProtocol)
          payload.config.securityProtocol = "PLAINTEXT";
        if (payload.config.saslMechanism === "")
          payload.config.saslMechanism = null;
        if (payload.config.saslJaasConfig === "")
          payload.config.saslJaasConfig = null;
      }

      // Backend: Postgres ma jdbcUrl + username + password
      if (payload.type === "POSTGRES") {
        // jeśli jdbcUrl puste, zbuduj z host/port (opcjonalnie)
        if (!payload.config.jdbcUrl || payload.config.jdbcUrl.trim() === "") {
          payload.config.jdbcUrl = `jdbc:postgresql://${payload.config.host}:${payload.config.port}/postgres`;
        }

        if (payload.type === "RABBIT") {
          // edit: jeśli hasło puste -> nie wysyłamy (żeby nie nadpisać)
          if (
            isEditMode &&
            (!payload.config.password || payload.config.password.trim() === "")
          ) {
            delete payload.config.password;
          }
          // virtualHost fallback
          if (
            !payload.config.virtualHost ||
            payload.config.virtualHost.trim() === ""
          ) {
            payload.config.virtualHost = "/";
          }
        }

        // edit: jeśli hasło puste -> nie wysyłamy (żeby nie nadpisać)
        if (
          isEditMode &&
          (!payload.config.password || payload.config.password.trim() === "")
        ) {
          delete payload.config.password;
        }
      }

      const url = isEditMode
        ? `/api/connections/${(initialData as any).id}`
        : "/api/connections";

      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(isEditMode ? "Failed to update" : "Failed to create");
      }

      router.push("/connections");
      router.refresh();
    } catch (e) {
      console.error(e);
      setError("Something went wrong. Please check your inputs.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPreviewJson = () => {
    // preview oparty o NOWY kontrakt: type + config
    const preview: any = { type: selectedType, config };

    // lekki “sanity preview” dla Kafka i Postgres
    if (selectedType === "KAFKA") {
      preview.config = {
        ...config,
        bootstrapServers: `${(config as any)?.host}:${(config as any)?.port}`,
      };
    }

    if (selectedType === "POSTGRES") {
      const host = (config as any)?.host;
      const port = (config as any)?.port;
      const jdbcUrl =
        (config as any)?.jdbcUrl ||
        `jdbc:postgresql://${host}:${port}/postgres`;
      preview.config = { ...config, jdbcUrl, password: "********" };
    }

    return JSON.stringify(preview, null, 2);
  };

  // helpers do errors w nested config
  const configErrors = form.formState.errors?.config as any;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-8 animate-in slide-in-from-bottom-4 duration-500"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* LEFT COLUMN */}
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
                  onValueChange={(val) => handleTypeChange(val as any)}
                  // opcjonalnie blokada w edit:
                  // disabled={isEditMode}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KAFKA">Apache Kafka</SelectItem>
                    <SelectItem value="RABBIT">RabbitMQ</SelectItem>
                    <SelectItem value="POSTGRES">PostgreSQL</SelectItem>
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
                Ensure the host is reachable from the ControlStream container
                network.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/60 shadow-sm relative overflow-hidden">
            <div
              className={`absolute top-0 left-0 w-full h-1 
                ${
                  selectedType === "KAFKA"
                    ? "bg-purple-500"
                    : selectedType === "RABBIT"
                    ? "bg-orange-500"
                    : selectedType === "POSTGRES"
                    ? "bg-blue-500"
                    : "bg-slate-500"
                }`}
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
                    {selectedType.toLowerCase()}.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* HOST & PORT (wspólne - teraz w config.*) */}
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
              {selectedType === "KAFKA" && (
                <div className="space-y-4 animate-in fade-in">
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

                  {/* Extra config (opcjonalnie – na start tylko informacyjnie) */}
                  <div className="text-xs text-muted-foreground">
                    Advanced Kafka client properties (key/value) will be
                    supported here soon.
                  </div>
                </div>
              )}

              {/* POSTGRES */}
              {selectedType === "POSTGRES" && (
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
              {selectedType === "RABBIT" && (
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

              {/* JSON PREVIEW */}
              <div className="mt-6 pt-6 border-t border-border space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  <Code size={12} /> Configuration Preview
                </div>
                <div className="bg-slate-950 rounded-lg border border-border p-4 shadow-inner">
                  <pre className="text-xs font-mono text-green-400 overflow-x-auto">
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
