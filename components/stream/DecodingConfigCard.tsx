// /components/stream/DecodingConfigCard.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { UseFormReturn } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  CreateStreamFormValues,
  schemaSourceSchema,
  payloadFormatHintSchema,
  schemaRegistryAuthTypeSchema,
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
} from "@/components/lib/api/schemaBundles";

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
  form: UseFormReturn<CreateStreamFormValues>;
};

function ensureSchemaRegistryDefaults(
  current: CreateStreamFormValues["decoding"]["schemaRegistry"]
) {
  return {
    url: current?.url ?? "",
    authType: (current?.authType ?? "NONE") as SchemaRegistryAuthType,
    username: current?.username ?? "",
    password: current?.password ?? "",
  };
}

function ensureProtoDefaults(
  current: CreateStreamFormValues["decoding"]["protoFiles"]
) {
  return {
    bundleId: current?.bundleId ?? "",
    fileGlob: current?.fileGlob ?? "**/*.proto",
    fixedMessageFullName: current?.fixedMessageFullName ?? "",
    typeHeaderName: current?.typeHeaderName ?? "",
    typeHeaderValuePrefix: current?.typeHeaderValuePrefix ?? "",
  };
}

function ensureAvroDefaults(
  current: CreateStreamFormValues["decoding"]["avroFiles"]
) {
  return {
    bundleId: current?.bundleId ?? "",
    fileGlob: current?.fileGlob ?? "**/*.avsc",
  };
}

function bundleLabel(b: SchemaBundleDto) {
  const shortSha = b.sha256?.slice(0, 10) ?? "";
  return `${b.bundleId} · ${b.fileCount} files · ${shortSha}`;
}

export function DecodingConfigCard({ form }: Props) {
  const queryClient = useQueryClient();
  const decoding = form.watch("decoding");
  const schemaSource = decoding?.schemaSource as SchemaSource | undefined;
  const formatHint = decoding?.formatHint as PayloadFormatHint | undefined;

  const decodingEnabled = (schemaSource ?? "NONE") !== "NONE";

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

      // UX: po uploadzie automatycznie ustaw bundleId w zależności od trybu
      const fh = (form.getValues("decoding.formatHint") ??
        "AUTO") as PayloadFormatHint;

      if ((form.getValues("decoding.schemaSource") ?? "NONE") !== "FILES")
        return;

      if (fh === "PROTO") {
        form.setValue(
          "decoding.protoFiles",
          {
            ...ensureProtoDefaults(form.getValues("decoding.protoFiles")),
            bundleId: created.bundleId,
          },
          { shouldDirty: true }
        );
      } else if (fh === "AVRO") {
        form.setValue(
          "decoding.avroFiles",
          {
            ...ensureAvroDefaults(form.getValues("decoding.avroFiles")),
            bundleId: created.bundleId,
          },
          { shouldDirty: true }
        );
      } else {
        // AUTO: ustaw PROTO jeśli puste; w przeciwnym razie AVRO
        const proto = form.getValues("decoding.protoFiles");
        const avro = form.getValues("decoding.avroFiles");
        if (!proto?.bundleId) {
          form.setValue(
            "decoding.protoFiles",
            { ...ensureProtoDefaults(proto), bundleId: created.bundleId },
            { shouldDirty: true }
          );
        } else if (!avro?.bundleId) {
          form.setValue(
            "decoding.avroFiles",
            { ...ensureAvroDefaults(avro), bundleId: created.bundleId },
            { shouldDirty: true }
          );
        }
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
    form.setValue("decoding.schemaSource", value, { shouldDirty: true });

    if (value === "NONE") {
      form.setValue("decoding.schemaRegistry", undefined, {
        shouldDirty: true,
      });
      form.setValue("decoding.protoFiles", undefined, { shouldDirty: true });
      form.setValue("decoding.avroFiles", undefined, { shouldDirty: true });
      return;
    }

    if (value === "SCHEMA_REGISTRY") {
      form.setValue(
        "decoding.schemaRegistry",
        ensureSchemaRegistryDefaults(decoding?.schemaRegistry),
        { shouldDirty: true }
      );
      form.setValue("decoding.protoFiles", undefined, { shouldDirty: true });
      form.setValue("decoding.avroFiles", undefined, { shouldDirty: true });
      return;
    }

    // FILES
    form.setValue("decoding.schemaRegistry", undefined, { shouldDirty: true });

    const fh = (formatHint ?? "AUTO") as PayloadFormatHint;
    if (fh === "PROTO") {
      form.setValue(
        "decoding.protoFiles",
        ensureProtoDefaults(decoding?.protoFiles),
        { shouldDirty: true }
      );
      form.setValue("decoding.avroFiles", undefined, { shouldDirty: true });
    } else if (fh === "AVRO") {
      form.setValue(
        "decoding.avroFiles",
        ensureAvroDefaults(decoding?.avroFiles),
        { shouldDirty: true }
      );
      form.setValue("decoding.protoFiles", undefined, { shouldDirty: true });
    } else {
      // AUTO: pozwalamy na oba (opcjonalnie)
      form.setValue(
        "decoding.protoFiles",
        ensureProtoDefaults(decoding?.protoFiles),
        { shouldDirty: true }
      );
      form.setValue(
        "decoding.avroFiles",
        ensureAvroDefaults(decoding?.avroFiles),
        { shouldDirty: true }
      );
    }
  };

  const setFormatHint = (value: PayloadFormatHint) => {
    form.setValue("decoding.formatHint", value, { shouldDirty: true });

    if ((schemaSource ?? "NONE") !== "FILES") return;

    if (value === "PROTO") {
      form.setValue(
        "decoding.protoFiles",
        ensureProtoDefaults(decoding?.protoFiles),
        { shouldDirty: true }
      );
      form.setValue("decoding.avroFiles", undefined, { shouldDirty: true });
      return;
    }

    if (value === "AVRO") {
      form.setValue(
        "decoding.avroFiles",
        ensureAvroDefaults(decoding?.avroFiles),
        { shouldDirty: true }
      );
      form.setValue("decoding.protoFiles", undefined, { shouldDirty: true });
      return;
    }

    // AUTO: oba (opcjonalnie)
    form.setValue(
      "decoding.protoFiles",
      ensureProtoDefaults(decoding?.protoFiles),
      { shouldDirty: true }
    );
    form.setValue(
      "decoding.avroFiles",
      ensureAvroDefaults(decoding?.avroFiles),
      { shouldDirty: true }
    );
  };

  const schemaSourceOptions = schemaSourceSchema.options;
  const formatHintOptions = payloadFormatHintSchema.options;
  const authOptions = schemaRegistryAuthTypeSchema.options;

  const errors = form.formState.errors;

  const schemaRegistryAuthType =
    (decoding?.schemaRegistry?.authType as
      | SchemaRegistryAuthType
      | undefined) ?? "NONE";

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
              onCheckedChange={(checked) =>
                setSchemaSource(checked ? "SCHEMA_REGISTRY" : "NONE")
              }
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
              value={(schemaSource ?? "NONE") as SchemaSource}
              onValueChange={(v) => setSchemaSource(v as SchemaSource)}
              disabled={!decodingEnabled && (schemaSource ?? "NONE") === "NONE"}
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
                {errors.decoding.schemaSource.message as string}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Format Hint
            </Label>
            <Select
              value={(formatHint ?? "AUTO") as PayloadFormatHint}
              onValueChange={(v) => setFormatHint(v as PayloadFormatHint)}
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
                {errors.decoding.formatHint.message as string}
              </p>
            )}
          </div>
        </div>

        <Separator />

        {/* SCHEMA REGISTRY */}
        {(schemaSource ?? "NONE") === "SCHEMA_REGISTRY" && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Globe size={16} className="text-muted-foreground" />
              Schema Registry
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label className="text-xs text-muted-foreground">URL</Label>
                <Input
                  value={decoding?.schemaRegistry?.url ?? ""}
                  onChange={(e) =>
                    form.setValue(
                      "decoding.schemaRegistry",
                      {
                        ...ensureSchemaRegistryDefaults(
                          decoding?.schemaRegistry
                        ),
                        url: e.target.value,
                      },
                      { shouldDirty: true }
                    )
                  }
                  placeholder="http://schema-registry:8081"
                  className="bg-background font-mono text-sm"
                />
                {errors.decoding?.schemaRegistry?.url && (
                  <p className="text-destructive text-xs">
                    {errors.decoding.schemaRegistry.url.message as string}
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
                        ...ensureSchemaRegistryDefaults(
                          decoding?.schemaRegistry
                        ),
                        authType: v as SchemaRegistryAuthType,
                      },
                      { shouldDirty: true }
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
                      value={decoding?.schemaRegistry?.username ?? ""}
                      onChange={(e) =>
                        form.setValue(
                          "decoding.schemaRegistry",
                          {
                            ...ensureSchemaRegistryDefaults(
                              decoding?.schemaRegistry
                            ),
                            username: e.target.value,
                          },
                          { shouldDirty: true }
                        )
                      }
                      className="bg-background"
                    />
                    {errors.decoding?.schemaRegistry?.username && (
                      <p className="text-destructive text-xs">
                        {
                          errors.decoding.schemaRegistry.username
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
                      value={decoding?.schemaRegistry?.password ?? ""}
                      onChange={(e) =>
                        form.setValue(
                          "decoding.schemaRegistry",
                          {
                            ...ensureSchemaRegistryDefaults(
                              decoding?.schemaRegistry
                            ),
                            password: e.target.value,
                          },
                          { shouldDirty: true }
                        )
                      }
                      className="bg-background"
                    />
                    {errors.decoding?.schemaRegistry?.password && (
                      <p className="text-destructive text-xs">
                        {
                          errors.decoding.schemaRegistry.password
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
        {(schemaSource ?? "NONE") === "FILES" && (
          <div className="space-y-4 animate-in fade-in">
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

            {/* PROTO */}
            {(formatHint ?? "AUTO") === "PROTO" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Proto bundle
                  </Label>
                  <Select
                    value={decoding?.protoFiles?.bundleId ?? ""}
                    onValueChange={(v) =>
                      form.setValue(
                        "decoding.protoFiles",
                        {
                          ...ensureProtoDefaults(decoding?.protoFiles),
                          bundleId: v,
                        },
                        { shouldDirty: true }
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
                  {errors.decoding?.protoFiles?.bundleId && (
                    <p className="text-destructive text-xs">
                      {errors.decoding.protoFiles.bundleId.message as string}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    fileGlob
                  </Label>
                  <Input
                    value={decoding?.protoFiles?.fileGlob ?? "**/*.proto"}
                    onChange={(e) =>
                      form.setValue(
                        "decoding.protoFiles",
                        {
                          ...ensureProtoDefaults(decoding?.protoFiles),
                          fileGlob: e.target.value,
                        },
                        { shouldDirty: true }
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
                    value={decoding?.protoFiles?.typeHeaderName ?? ""}
                    onChange={(e) =>
                      form.setValue(
                        "decoding.protoFiles",
                        {
                          ...ensureProtoDefaults(decoding?.protoFiles),
                          typeHeaderName: e.target.value,
                        },
                        { shouldDirty: true }
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
                    value={decoding?.protoFiles?.fixedMessageFullName ?? ""}
                    onChange={(e) =>
                      form.setValue(
                        "decoding.protoFiles",
                        {
                          ...ensureProtoDefaults(decoding?.protoFiles),
                          fixedMessageFullName: e.target.value,
                        },
                        { shouldDirty: true }
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
                    value={decoding?.protoFiles?.typeHeaderValuePrefix ?? ""}
                    onChange={(e) =>
                      form.setValue(
                        "decoding.protoFiles",
                        {
                          ...ensureProtoDefaults(decoding?.protoFiles),
                          typeHeaderValuePrefix: e.target.value,
                        },
                        { shouldDirty: true }
                      )
                    }
                    placeholder="com.acme."
                    className="bg-background font-mono text-sm"
                  />
                </div>
              </div>
            )}

            {/* AVRO */}
            {(formatHint ?? "AUTO") === "AVRO" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Avro bundle
                  </Label>
                  <Select
                    value={decoding?.avroFiles?.bundleId ?? ""}
                    onValueChange={(v) =>
                      form.setValue(
                        "decoding.avroFiles",
                        {
                          ...ensureAvroDefaults(decoding?.avroFiles),
                          bundleId: v,
                        },
                        { shouldDirty: true }
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
                  {errors.decoding?.avroFiles?.bundleId && (
                    <p className="text-destructive text-xs">
                      {errors.decoding.avroFiles.bundleId.message as string}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    fileGlob
                  </Label>
                  <Input
                    value={decoding?.avroFiles?.fileGlob ?? "**/*.avsc"}
                    onChange={(e) =>
                      form.setValue(
                        "decoding.avroFiles",
                        {
                          ...ensureAvroDefaults(decoding?.avroFiles),
                          fileGlob: e.target.value,
                        },
                        { shouldDirty: true }
                      )
                    }
                    className="bg-background font-mono text-sm"
                  />
                </div>
              </div>
            )}

            {/* AUTO: allow both optional */}
            {(formatHint ?? "AUTO") === "AUTO" && (
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
                      value={decoding?.protoFiles?.bundleId ?? ""}
                      onValueChange={(v) =>
                        form.setValue(
                          "decoding.protoFiles",
                          {
                            ...ensureProtoDefaults(decoding?.protoFiles),
                            bundleId: v,
                          },
                          { shouldDirty: true }
                        )
                      }
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select bundle..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">(none)</SelectItem>
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
                      value={decoding?.avroFiles?.bundleId ?? ""}
                      onValueChange={(v) =>
                        form.setValue(
                          "decoding.avroFiles",
                          {
                            ...ensureAvroDefaults(decoding?.avroFiles),
                            bundleId: v,
                          },
                          { shouldDirty: true }
                        )
                      }
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select bundle..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">(none)</SelectItem>
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

            {(formatHint ?? "AUTO") !== "PROTO" &&
              (formatHint ?? "AUTO") !== "AVRO" &&
              (formatHint ?? "AUTO") !== "AUTO" && (
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
