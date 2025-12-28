// /components/stream/DecodingConfigCard.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import type { UseFormReturn } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  schemaSourceSchema,
  payloadFormatHintSchema,
  schemaRegistryAuthTypeSchema,
  StreamFormValues,
} from "@/components/lib/schemas";

import type {
  SchemaSource,
  PayloadFormatHint,
  SchemaRegistryAuthType,
} from "@/types/stream";

import type { SchemaBundleDto } from "@/types/schema-bundle";
import {
  listSchemaBundles as getSchemaBundles,
  uploadSchemaBundleZip,
} from "@/lib/api/schemaBundles";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";
import {
  Info,
  KeyRound,
  Folder,
  Globe,
  Upload,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

type Props = {
  form: UseFormReturn<StreamFormValues>;
};

const NONE_OPTION = "__NONE__";

function ensureSchemaRegistryDefaults(current: any) {
  return {
    url: current?.url ?? "",
    authType: (current?.authType ?? "NONE") as SchemaRegistryAuthType,
    username: current?.username ?? "",
    password: current?.password ?? "",
  };
}

function ensureProtoDefaults(current: any) {
  return {
    bundleId: current?.bundleId ?? "",
    fileGlob: current?.fileGlob ?? "**/*.proto",
    fixedMessageFullName: current?.fixedMessageFullName ?? "",
    typeHeaderName: current?.typeHeaderName ?? "",
    typeHeaderValuePrefix: current?.typeHeaderValuePrefix ?? "",
  };
}

function ensureAvroDefaults(current: any) {
  return {
    bundleId: current?.bundleId ?? "",
    fileGlob: current?.fileGlob ?? "**/*.avsc",
  };
}

function bundleLabel(b: SchemaBundleDto) {
  const shortSha = b.sha256?.slice(0, 10) ?? "";
  return `${b.bundleId} · ${b.fileCount} files · ${shortSha}`;
}

function safeEnum<T extends string>(
  schema: any,
  value: unknown,
  fallback: T
): T {
  const parsed = schema.safeParse(value);
  return parsed.success ? (parsed.data as T) : fallback;
}

export function DecodingConfigCard({ form }: Props) {
  const queryClient = useQueryClient();

  // IMPORTANT:
  // - watch może być przez chwilę undefined przy reset/render
  // - NIE zapisujemy fallbacków do form state "automatycznie"
  const schemaSourceRaw = form.watch("decoding.schemaSource");
  const formatHintRaw = form.watch("decoding.formatHint");

  const schemaSourceValue = safeEnum<SchemaSource>(
    schemaSourceSchema,
    schemaSourceRaw,
    "NONE"
  );

  const formatHintValue = safeEnum<PayloadFormatHint>(
    payloadFormatHintSchema,
    formatHintRaw,
    "AUTO"
  );

  // nested objects (mogą być undefined)
  const schemaRegistry = form.watch("decoding.schemaRegistry");
  const protoFiles = form.watch("decoding.protoFiles");
  const avroFiles = form.watch("decoding.avroFiles");

  const decodingEnabled = schemaSourceValue !== "NONE";

  // remember last enabled source (so toggle ON doesn't force SCHEMA_REGISTRY always)
  const lastEnabledSourceRef = React.useRef<SchemaSource>("SCHEMA_REGISTRY");
  // ✅ keep RHF values valid, but DO NOT override transient undefined during reset
  React.useEffect(() => {
    if (schemaSourceRaw === undefined) return; // do not fight StreamForm.reset()
    const parsed = schemaSourceSchema.safeParse(schemaSourceRaw);
    if (!parsed.success) {
      form.setValue("decoding.schemaSource", "NONE", {
        shouldDirty: false,
        shouldValidate: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schemaSourceRaw]);

  React.useEffect(() => {
    if (formatHintRaw === undefined) return; // do not fight StreamForm.reset()
    const parsed = payloadFormatHintSchema.safeParse(formatHintRaw);
    if (!parsed.success) {
      form.setValue("decoding.formatHint", "AUTO", {
        shouldDirty: false,
        shouldValidate: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formatHintRaw]);

  const bundlesQuery = useQuery({
    queryKey: ["schema-bundles"],
    queryFn: getSchemaBundles,
  });

  const uploadMutation = useMutation({
    mutationFn: uploadSchemaBundleZip,
    onSuccess: (created) => {
      toast.success(
        `Uploaded bundle ${created.bundleId} (${created.fileCount} files)`
      );
      queryClient.invalidateQueries({ queryKey: ["schema-bundles"] });

      const src = safeEnum<SchemaSource>(
        schemaSourceSchema,
        form.getValues("decoding.schemaSource"),
        "NONE"
      );
      if (src !== "FILES") return;

      const fh = safeEnum<PayloadFormatHint>(
        payloadFormatHintSchema,
        form.getValues("decoding.formatHint"),
        "AUTO"
      );

      if (fh === "PROTO") {
        form.setValue(
          "decoding.protoFiles",
          {
            ...ensureProtoDefaults(form.getValues("decoding.protoFiles")),
            bundleId: created.bundleId,
          },
          { shouldDirty: true, shouldValidate: true }
        );
        form.setValue("decoding.avroFiles", undefined, {
          shouldDirty: true,
          shouldValidate: true,
        });
        return;
      }

      if (fh === "AVRO") {
        form.setValue(
          "decoding.avroFiles",
          {
            ...ensureAvroDefaults(form.getValues("decoding.avroFiles")),
            bundleId: created.bundleId,
          },
          { shouldDirty: true, shouldValidate: true }
        );
        form.setValue("decoding.protoFiles", undefined, {
          shouldDirty: true,
          shouldValidate: true,
        });
        return;
      }

      // AUTO: fill first empty slot
      const proto = form.getValues("decoding.protoFiles");
      const avro = form.getValues("decoding.avroFiles");
      if (!proto?.bundleId) {
        form.setValue(
          "decoding.protoFiles",
          { ...ensureProtoDefaults(proto), bundleId: created.bundleId },
          { shouldDirty: true, shouldValidate: true }
        );
      } else if (!avro?.bundleId) {
        form.setValue(
          "decoding.avroFiles",
          { ...ensureAvroDefaults(avro), bundleId: created.bundleId },
          { shouldDirty: true, shouldValidate: true }
        );
      }
    },
    onError: (e: any) => toast.error(e?.message ?? "Upload failed"),
  });

  const pickZip = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".zip,application/zip";
    input.onchange = () => {
      const f = input.files?.[0];
      if (!f) return;
      if (!f.name.toLowerCase().endsWith(".zip")) {
        toast.error("Please upload a .zip file");
        return;
      }
      uploadMutation.mutate(f);
    };
    input.click();
  };

  const setSchemaSource = (value: SchemaSource) => {
    form.setValue("decoding.schemaSource", value, {
      shouldDirty: true,
      shouldValidate: true,
    });

    if (value === "NONE") {
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
      return;
    }

    if (value === "SCHEMA_REGISTRY") {
      form.setValue(
        "decoding.schemaRegistry",
        ensureSchemaRegistryDefaults(form.getValues("decoding.schemaRegistry")),
        { shouldDirty: true, shouldValidate: true }
      );
      form.setValue("decoding.protoFiles", undefined, {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue("decoding.avroFiles", undefined, {
        shouldDirty: true,
        shouldValidate: true,
      });
      return;
    }

    // FILES
    form.setValue("decoding.schemaRegistry", undefined, {
      shouldDirty: true,
      shouldValidate: true,
    });

    const fh = safeEnum<PayloadFormatHint>(
      payloadFormatHintSchema,
      form.getValues("decoding.formatHint"),
      "AUTO"
    );

    if (fh === "PROTO") {
      form.setValue(
        "decoding.protoFiles",
        ensureProtoDefaults(form.getValues("decoding.protoFiles")),
        { shouldDirty: true, shouldValidate: true }
      );
      form.setValue("decoding.avroFiles", undefined, {
        shouldDirty: true,
        shouldValidate: true,
      });
      return;
    }

    if (fh === "AVRO") {
      form.setValue(
        "decoding.avroFiles",
        ensureAvroDefaults(form.getValues("decoding.avroFiles")),
        { shouldDirty: true, shouldValidate: true }
      );
      form.setValue("decoding.protoFiles", undefined, {
        shouldDirty: true,
        shouldValidate: true,
      });
      return;
    }

    // AUTO: keep optional, do not force-create empty objects
  };

  const setFormatHint = (value: PayloadFormatHint) => {
    form.setValue("decoding.formatHint", value, {
      shouldDirty: true,
      shouldValidate: true,
    });

    if (schemaSourceValue !== "FILES") return;

    if (value === "PROTO") {
      form.setValue(
        "decoding.protoFiles",
        ensureProtoDefaults(form.getValues("decoding.protoFiles")),
        { shouldDirty: true, shouldValidate: true }
      );
      form.setValue("decoding.avroFiles", undefined, {
        shouldDirty: true,
        shouldValidate: true,
      });
      return;
    }

    if (value === "AVRO") {
      form.setValue(
        "decoding.avroFiles",
        ensureAvroDefaults(form.getValues("decoding.avroFiles")),
        { shouldDirty: true, shouldValidate: true }
      );
      form.setValue("decoding.protoFiles", undefined, {
        shouldDirty: true,
        shouldValidate: true,
      });
      return;
    }

    // AUTO: keep optional
  };

  const schemaSourceOptions = schemaSourceSchema.options;
  const formatHintOptions = payloadFormatHintSchema.options;
  const authOptions = schemaRegistryAuthTypeSchema.options;

  const errors = form.formState.errors;
  const schemaRegistryAuthType =
    (schemaRegistry?.authType as SchemaRegistryAuthType | undefined) ?? "NONE";

  const bundles = bundlesQuery.data ?? [];

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <KeyRound size={16} />
              Payload Decoding
            </CardTitle>
            <CardDescription>
              Configure schema source and format hint for decoding payloads.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-[10px] text-muted-foreground"
            >
              optional
            </Badge>
            <Switch
              checked={decodingEnabled}
              onCheckedChange={(checked) => {
                if (checked) {
                  // restore previous value if existed, do not force SCHEMA_REGISTRY
                  setSchemaSource(
                    lastEnabledSourceRef.current ?? "SCHEMA_REGISTRY"
                  );
                } else {
                  setSchemaSource("NONE");
                }
              }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* schema source + format hint */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Schema Source
            </Label>
            <Select
              value={schemaSourceValue}
              onValueChange={(v) => setSchemaSource(v as SchemaSource)}
              disabled={!decodingEnabled}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select schema source..." />
              </SelectTrigger>
              <SelectContent>
                {schemaSourceOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    <div className="flex items-center gap-2">
                      {opt === "SCHEMA_REGISTRY" ? (
                        <Globe size={14} />
                      ) : opt === "FILES" ? (
                        <Folder size={14} />
                      ) : (
                        <Info size={14} />
                      )}
                      <span>{opt}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {errors.decoding?.schemaSource && (
              <p className="text-destructive text-xs">
                {(errors.decoding as any)?.schemaSource?.message as string}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Format Hint
            </Label>
            <Select
              value={formatHintValue}
              onValueChange={(v) => setFormatHint(v as PayloadFormatHint)}
              disabled={!decodingEnabled}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select format..." />
              </SelectTrigger>
              <SelectContent>
                {formatHintOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {errors.decoding?.formatHint && (
              <p className="text-destructive text-xs">
                {(errors.decoding as any)?.formatHint?.message as string}
              </p>
            )}
          </div>
        </div>

        <Separator />

        {/* SCHEMA REGISTRY */}
        {schemaSourceValue === "SCHEMA_REGISTRY" && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Globe size={16} className="text-muted-foreground" />
              Schema Registry
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label className="text-xs text-muted-foreground">URL</Label>
                <Input
                  value={schemaRegistry?.url ?? ""}
                  onChange={(e) =>
                    form.setValue(
                      "decoding.schemaRegistry",
                      {
                        ...ensureSchemaRegistryDefaults(schemaRegistry),
                        url: e.target.value,
                      },
                      { shouldDirty: true, shouldValidate: true }
                    )
                  }
                  placeholder="http://schema-registry:8081"
                  className="bg-background font-mono text-sm"
                />
                {(errors.decoding as any)?.schemaRegistry?.url && (
                  <p className="text-destructive text-xs">
                    {
                      (errors.decoding as any).schemaRegistry.url
                        .message as string
                    }
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Auth Type
                </Label>
                <Select
                  value={schemaRegistryAuthType}
                  onValueChange={(v) =>
                    form.setValue(
                      "decoding.schemaRegistry",
                      {
                        ...ensureSchemaRegistryDefaults(schemaRegistry),
                        authType: v as SchemaRegistryAuthType,
                      },
                      { shouldDirty: true, shouldValidate: true }
                    )
                  }
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {authOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {schemaRegistryAuthType === "BASIC" && (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Username
                    </Label>
                    <Input
                      value={schemaRegistry?.username ?? ""}
                      onChange={(e) =>
                        form.setValue(
                          "decoding.schemaRegistry",
                          {
                            ...ensureSchemaRegistryDefaults(schemaRegistry),
                            username: e.target.value,
                          },
                          { shouldDirty: true, shouldValidate: true }
                        )
                      }
                      className="bg-background"
                    />
                    {(errors.decoding as any)?.schemaRegistry?.username && (
                      <p className="text-destructive text-xs">
                        {
                          (errors.decoding as any).schemaRegistry.username
                            .message as string
                        }
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Password
                    </Label>
                    <Input
                      type="password"
                      value={schemaRegistry?.password ?? ""}
                      onChange={(e) =>
                        form.setValue(
                          "decoding.schemaRegistry",
                          {
                            ...ensureSchemaRegistryDefaults(schemaRegistry),
                            password: e.target.value,
                          },
                          { shouldDirty: true, shouldValidate: true }
                        )
                      }
                      className="bg-background"
                    />
                    {(errors.decoding as any)?.schemaRegistry?.password && (
                      <p className="text-destructive text-xs">
                        {
                          (errors.decoding as any).schemaRegistry.password
                            .message as string
                        }
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* FILES */}
        {schemaSourceValue === "FILES" && (
          <div className="space-y-4 animate-in fade-in">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Folder size={16} className="text-muted-foreground" />
                  Schema Bundles (ZIP)
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={pickZip}
                    disabled={uploadMutation.isPending}
                  >
                    <Upload size={14} />
                    Upload ZIP
                  </Button>

                  <Button
                    asChild
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                  >
                    <Link href="/schema-bundles">
                      Manage bundles
                      <ExternalLink size={14} />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* PROTO */}
            {formatHintValue === "PROTO" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Proto bundle
                  </Label>
                  <Select
                    value={protoFiles?.bundleId ?? ""}
                    onValueChange={(v) =>
                      form.setValue(
                        "decoding.protoFiles",
                        { ...ensureProtoDefaults(protoFiles), bundleId: v },
                        { shouldDirty: true, shouldValidate: true }
                      )
                    }
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue
                        placeholder={
                          bundlesQuery.isLoading
                            ? "Loading bundles..."
                            : "Select bundle..."
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {bundles.map((b) => (
                        <SelectItem key={b.bundleId} value={b.bundleId}>
                          <span className="font-mono text-xs">
                            {bundleLabel(b)}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(errors.decoding as any)?.protoFiles?.bundleId && (
                    <p className="text-destructive text-xs">
                      {
                        (errors.decoding as any).protoFiles.bundleId
                          .message as string
                      }
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    fileGlob
                  </Label>
                  <Input
                    value={protoFiles?.fileGlob ?? "**/*.proto"}
                    onChange={(e) =>
                      form.setValue(
                        "decoding.protoFiles",
                        {
                          ...ensureProtoDefaults(protoFiles),
                          fileGlob: e.target.value,
                        },
                        { shouldDirty: true, shouldValidate: true }
                      )
                    }
                    className="bg-background font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    typeHeaderName
                  </Label>
                  <Input
                    value={protoFiles?.typeHeaderName ?? ""}
                    onChange={(e) =>
                      form.setValue(
                        "decoding.protoFiles",
                        {
                          ...ensureProtoDefaults(protoFiles),
                          typeHeaderName: e.target.value,
                        },
                        { shouldDirty: true, shouldValidate: true }
                      )
                    }
                    placeholder="X-Message-Type"
                    className="bg-background font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    fixedMessageFullName
                  </Label>
                  <Input
                    value={protoFiles?.fixedMessageFullName ?? ""}
                    onChange={(e) =>
                      form.setValue(
                        "decoding.protoFiles",
                        {
                          ...ensureProtoDefaults(protoFiles),
                          fixedMessageFullName: e.target.value,
                        },
                        { shouldDirty: true, shouldValidate: true }
                      )
                    }
                    placeholder="com.acme.events.OrderCreated"
                    className="bg-background font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    typeHeaderValuePrefix
                  </Label>
                  <Input
                    value={protoFiles?.typeHeaderValuePrefix ?? ""}
                    onChange={(e) =>
                      form.setValue(
                        "decoding.protoFiles",
                        {
                          ...ensureProtoDefaults(protoFiles),
                          typeHeaderValuePrefix: e.target.value,
                        },
                        { shouldDirty: true, shouldValidate: true }
                      )
                    }
                    placeholder="com.acme."
                    className="bg-background font-mono text-sm"
                  />
                </div>
              </div>
            )}

            {/* AVRO */}
            {formatHintValue === "AVRO" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Avro bundle
                  </Label>
                  <Select
                    value={avroFiles?.bundleId ?? ""}
                    onValueChange={(v) =>
                      form.setValue(
                        "decoding.avroFiles",
                        { ...ensureAvroDefaults(avroFiles), bundleId: v },
                        { shouldDirty: true, shouldValidate: true }
                      )
                    }
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue
                        placeholder={
                          bundlesQuery.isLoading
                            ? "Loading bundles..."
                            : "Select bundle..."
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {bundles.map((b) => (
                        <SelectItem key={b.bundleId} value={b.bundleId}>
                          <span className="font-mono text-xs">
                            {bundleLabel(b)}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(errors.decoding as any)?.avroFiles?.bundleId && (
                    <p className="text-destructive text-xs">
                      {
                        (errors.decoding as any).avroFiles.bundleId
                          .message as string
                      }
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    fileGlob
                  </Label>
                  <Input
                    value={avroFiles?.fileGlob ?? "**/*.avsc"}
                    onChange={(e) =>
                      form.setValue(
                        "decoding.avroFiles",
                        {
                          ...ensureAvroDefaults(avroFiles),
                          fileGlob: e.target.value,
                        },
                        { shouldDirty: true, shouldValidate: true }
                      )
                    }
                    className="bg-background font-mono text-sm"
                  />
                </div>
              </div>
            )}

            {/* AUTO */}
            {formatHintValue === "AUTO" && (
              <div className="space-y-4">
                <div className="text-xs text-muted-foreground flex items-start gap-2">
                  <Info size={14} className="mt-0.5" />
                  AUTO will try PROTO first and then AVRO (if provided). You can
                  set one or both bundles.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Proto bundle (optional)
                    </Label>
                    <Select
                      value={
                        protoFiles?.bundleId ? protoFiles.bundleId : NONE_OPTION
                      }
                      onValueChange={(v) => {
                        if (v === NONE_OPTION) {
                          form.setValue("decoding.protoFiles", undefined, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                          return;
                        }
                        form.setValue(
                          "decoding.protoFiles",
                          { ...ensureProtoDefaults(protoFiles), bundleId: v },
                          { shouldDirty: true, shouldValidate: true }
                        );
                      }}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select bundle..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE_OPTION}>(none)</SelectItem>
                        {bundles.map((b) => (
                          <SelectItem key={b.bundleId} value={b.bundleId}>
                            <span className="font-mono text-xs">
                              {bundleLabel(b)}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Avro bundle (optional)
                    </Label>
                    <Select
                      value={
                        avroFiles?.bundleId ? avroFiles.bundleId : NONE_OPTION
                      }
                      onValueChange={(v) => {
                        if (v === NONE_OPTION) {
                          form.setValue("decoding.avroFiles", undefined, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                          return;
                        }
                        form.setValue(
                          "decoding.avroFiles",
                          { ...ensureAvroDefaults(avroFiles), bundleId: v },
                          { shouldDirty: true, shouldValidate: true }
                        );
                      }}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select bundle..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE_OPTION}>(none)</SelectItem>
                        {bundles.map((b) => (
                          <SelectItem key={b.bundleId} value={b.bundleId}>
                            <span className="font-mono text-xs">
                              {bundleLabel(b)}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {formatHintValue !== "PROTO" &&
              formatHintValue !== "AVRO" &&
              formatHintValue !== "AUTO" && (
                <div className="text-xs text-muted-foreground flex items-start gap-2">
                  <Info size={14} className="mt-0.5" />
                  For file-based schemas choose{" "}
                  <span className="font-mono">PROTO</span>,{" "}
                  <span className="font-mono">AVRO</span> or{" "}
                  <span className="font-mono">AUTO</span>.
                </div>
              )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
