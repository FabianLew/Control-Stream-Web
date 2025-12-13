"use client";

import {
  useForm,
  DefaultValues,
  Resolver,
  SubmitHandler,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createConnectionSchema,
  CreateConnectionFormValues,
} from "@/components/lib/schemas";
import { useState } from "react";
import {
  Loader2,
  Save,
  Activity,
  Layers,
  Database,
  Server,
  Info,
  Code,
  PenLine, // Dodano ikonę dla edycji
} from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { StreamTypeBadge } from "@/components/shared/StreamTypeBadge";
import { Label } from "@/components/ui/label";

const VendorIcon = ({ type }: { type: string }) => {
  if (type === "KAFKA") return <Activity className="text-purple-500 h-6 w-6" />;
  if (type === "RABBIT") return <Layers className="text-orange-500 h-6 w-6" />;
  if (type === "POSTGRES")
    return <Database className="text-blue-500 h-6 w-6" />;
  return <Server className="text-slate-500 h-6 w-6" />;
};

// Rozszerzamy typ o ID dla trybu edycji
type ConnectionFormProps = {
  initialData?: CreateConnectionFormValues & { id: string };
};

const defaultEmptyValues: DefaultValues<CreateConnectionFormValues> = {
  name: "",
  type: "KAFKA",
  host: "localhost",
  port: 9092,
  username: "",
  password: "",
  metadata: {
    databaseName: "",
    virtualHost: "/",
    sslEnabled: false,
    bootstrapServers: "",
  },
};

export function ConnectionForm({ initialData }: ConnectionFormProps) {
  const router = useRouter();
  // const { toast } = useToast(); // Opcjonalnie
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!initialData;

  const form = useForm<CreateConnectionFormValues>({
    resolver: zodResolver(
      createConnectionSchema
    ) as Resolver<CreateConnectionFormValues>,
    // Jeśli edytujemy, używamy initialData, w przeciwnym razie domyślnych
    defaultValues: initialData || defaultEmptyValues,
  });

  const selectedType = form.watch("type");
  const isSrEnabled = form.watch("schemaRegistryEnabled");
  const srAuthType = form.watch("schemaRegistryAuth");
  const formValues = form.watch();

  // UWAGA: Usunąłem useEffect resetujący port. To psułoby edycję (nadpisywałoby port z bazy).
  // Logikę zmiany portu przeniosłem do onValueChange w Select.

  const onSubmit: SubmitHandler<CreateConnectionFormValues> = async (data) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const payload: CreateConnectionFormValues = { ...data };

      // Logika specyficzna dla typów
      if (data.type === "KAFKA") {
        payload.metadata.bootstrapServers = `${data.host}:${data.port}`;
        if (!data.schemaRegistryEnabled) {
          payload.schemaRegistryUrl = undefined;
          payload.schemaRegistryUsername = undefined;
          payload.schemaRegistryPassword = undefined;
        }
      }

      // Dynamiczny URL i metoda w zależności od trybu
      const url = isEditMode
        ? `/api/connections/${initialData.id}`
        : "/api/connections";

      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok)
        throw new Error(isEditMode ? "Failed to update" : "Failed to create");

      router.push("/connections");
      router.refresh();

      // toast({ title: isEditMode ? "Updated!" : "Created!" });
    } catch (e) {
      setError("Something went wrong. Please check your inputs.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTypeChange = (val: "KAFKA" | "RABBIT" | "POSTGRES") => {
    form.setValue("type", val);

    // Ustawiamy domyślny port tylko przy ręcznej zmianie typu, nie przy ładowaniu
    if (val === "KAFKA") form.setValue("port", 9092);
    if (val === "RABBIT") form.setValue("port", 5672);
    if (val === "POSTGRES") form.setValue("port", 5432);
  };

  const getPreviewJson = () => {
    // ... (Logika bez zmian, kopiuję dla kompletności kontekstu zmiennych)
    const type = formValues.type || "KAFKA";
    const host = formValues.host;
    const port = formValues.port;
    const username = formValues.username;
    const metadata = formValues.metadata;

    const preview: any = { type };

    if (type === "KAFKA") {
      preview.bootstrapServers = `${host}:${port}`;
      if (metadata?.sslEnabled) preview.ssl = true;
      if (formValues.schemaRegistryEnabled) {
        preview.schemaRegistry = {
          url: formValues.schemaRegistryUrl,
          auth: formValues.schemaRegistryAuth,
        };
        if (formValues.schemaRegistryAuth === "BASIC") {
          preview.schemaRegistry.username = formValues.schemaRegistryUsername;
          preview.schemaRegistry.password = "********";
        }
      }
    } else if (type === "POSTGRES") {
      preview.url = `jdbc:postgresql://${host}:${port}/${
        metadata?.databaseName || "controlestream"
      }`;
      preview.username = username;
    } else if (type === "RABBIT") {
      preview.host = host;
      preview.port = port;
      preview.username = username;
      preview.virtualHost = metadata?.virtualHost || "/";
    }

    return JSON.stringify(preview, null, 2);
  };

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
                  // Opcjonalnie: zablokuj zmianę typu w trybie edycji, jeśli backend tego nie obsługuje
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

          {/* ... Info Card (bez zmian) ... */}
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
          {/* ... Card Header (Vendor specific logic) ... */}
          <Card className="border-border/60 shadow-sm relative overflow-hidden">
            {/* Górny pasek koloru */}
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
            {/* ... Reszta UI bez zmian merytorycznych, tylko podpięte form ... */}
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted/30 rounded-lg border border-border">
                  <VendorIcon type={selectedType} />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {selectedType === "POSTGRES"
                      ? "Database Configuration"
                      : selectedType === "KAFKA"
                      ? "Cluster Configuration"
                      : "Broker Configuration"}
                  </CardTitle>
                  <CardDescription>
                    {isEditMode ? "Update" : "Enter"} connection parameters for{" "}
                    {selectedType.toLowerCase()}.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* TUTAJ JEST CAŁA RESZTA PÓL (Host, Port, Auth, etc.) 
                   Kod pozostaje taki sam jak w Twoim oryginale, 
                   ponieważ `form.register` działa tak samo dla Create i Update 
                */}

              {/* HOST & PORT */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Host / Address
                  </label>
                  <Input
                    {...form.register("host")}
                    placeholder="localhost"
                    className="font-mono text-sm bg-background"
                  />
                  {form.formState.errors.host && (
                    <p className="text-destructive text-xs">
                      {form.formState.errors.host.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Port
                  </label>
                  <Input
                    {...form.register("port", { valueAsNumber: true })}
                    type="number"
                    className="font-mono text-sm bg-background"
                  />
                  {form.formState.errors.port && (
                    <p className="text-destructive text-xs">
                      {form.formState.errors.port.message}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* AUTH FOR NON-KAFKA */}
              {(selectedType === "RABBIT" || selectedType === "POSTGRES") && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Username
                    </label>
                    <Input
                      {...form.register("username")}
                      placeholder="user"
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Password
                    </label>
                    <Input
                      {...form.register("password")}
                      type="password"
                      placeholder={
                        isEditMode ? "•••••• (leave empty to keep)" : "••••••"
                      }
                      className="bg-background"
                    />
                  </div>
                </div>
              )}

              {/* KAFKA SPECIFIC */}
              {selectedType === "KAFKA" && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Security Protocol
                    </label>
                    <Select
                      value={
                        formValues.metadata?.sslEnabled ? "SSL" : "PLAINTEXT"
                      }
                      onValueChange={(v) =>
                        form.setValue("metadata.sslEnabled", v === "SSL")
                      }
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="PLAINTEXT" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PLAINTEXT">PLAINTEXT</SelectItem>
                        <SelectItem value="SSL">SSL / TLS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Schema Registry Block (Skrócony dla czytelności - użyj swojego oryginału) */}
                  <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-semibold">
                          Schema Registry
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Enable integration with Avro/Protobuf schemas.
                        </p>
                      </div>
                      <Switch
                        checked={isSrEnabled}
                        onCheckedChange={(checked) =>
                          form.setValue("schemaRegistryEnabled", checked)
                        }
                      />
                    </div>
                    {isSrEnabled && (
                      <div className="grid gap-4 animate-in slide-in-from-top-2 fade-in pt-2">
                        <div className="grid gap-2">
                          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            Schema Registry URL{" "}
                            <span className="text-destructive">*</span>
                          </label>
                          <Input
                            {...form.register("schemaRegistryUrl")}
                            className="bg-background"
                          />
                          {form.formState.errors.schemaRegistryUrl && (
                            <p className="text-destructive text-xs">
                              {form.formState.errors.schemaRegistryUrl.message}
                            </p>
                          )}
                        </div>

                        <div className="grid gap-2">
                          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            Authentication
                          </label>
                          <Select
                            value={srAuthType || "NONE"}
                            onValueChange={(val) =>
                              form.setValue("schemaRegistryAuth", val as any)
                            }
                          >
                            <SelectTrigger className="bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="NONE">None</SelectItem>
                              <SelectItem value="BASIC">Basic Auth</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {srAuthType === "BASIC" && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <label className="text-xs font-bold text-muted-foreground uppercase">
                                Username
                              </label>
                              <Input
                                {...form.register("schemaRegistryUsername")}
                                className="bg-background"
                              />
                            </div>
                            <div className="grid gap-2">
                              <label className="text-xs font-bold text-muted-foreground uppercase">
                                Password
                              </label>
                              <Input
                                type="password"
                                {...form.register("schemaRegistryPassword")}
                                className="bg-background"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Postgres Metadata */}
              {selectedType === "POSTGRES" && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Database Name
                    </label>
                    <Input
                      {...form.register("metadata.databaseName")}
                      className="bg-background"
                    />
                  </div>
                </div>
              )}

              {/* Rabbit Metadata */}
              {selectedType === "RABBIT" && (
                <div className="space-y-2 animate-in fade-in">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Virtual Host
                  </label>
                  <Input
                    {...form.register("metadata.virtualHost")}
                    placeholder="/"
                    className="bg-background"
                  />
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
