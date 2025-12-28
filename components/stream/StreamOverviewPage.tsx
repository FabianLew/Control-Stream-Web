"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Search,
  Send,
  Terminal,
  ExternalLink,
  Code,
  Activity,
  Settings2,
  Hash,
  Cpu,
  IdCard,
  SlidersHorizontal,
  Braces,
  PlugZap,
  ChevronUp,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { getVendorMeta, isVendor, VENDOR_META } from "@/components/lib/vendors";

// UI Components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Custom Components
import { StreamTypeBadge } from "@/components/shared/StreamTypeBadge";
import { KeyValueRow } from "@/components/shared/KeyValueRow";
import { JsonBlock } from "@/components/shared/JsonBlock";
import { CopyButton } from "@/components/shared/CopyButton";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";

// Types
import type {
  StreamOverviewDto,
  StreamVendorConfigDto,
  KafkaStreamVendorConfigDto,
  RabbitStreamVendorConfigDto,
  PostgresStreamVendorConfigDto,
} from "@/types/stream";
import type {
  ConnectionConfigDto,
  KafkaConnectionConfigDto,
  RabbitConnectionConfigDto,
  PostgresConnectionConfigDto,
} from "@/types/connection";

interface Props {
  streamId: string;
}

// --- Fetcher ---
const fetchStreamOverview = async (
  streamId: string
): Promise<StreamOverviewDto> => {
  const res = await fetch(`/api/streams/${streamId}/overview`);
  if (!res.ok) throw new Error("Failed to fetch stream details");
  return res.json();
};

// --- Helpers ---
const VendorIcon = ({
  type,
  className,
}: {
  type: string;
  className?: string;
}) => {
  const vendor = getVendorMeta(type);
  const Icon = vendor.icon;
  return <Icon className={`${vendor.iconClass} ${className ?? ""}`} />;
};

// --- Section Nav ---
type SectionId = "identity" | "vendor" | "decoding" | "connection" | "advanced";

const sections: Array<{
  id: SectionId;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}> = [
  { id: "identity", label: "Identity", icon: IdCard },
  { id: "vendor", label: "Vendor", icon: SlidersHorizontal },
  { id: "decoding", label: "Decoding", icon: Braces },
  { id: "advanced", label: "Advanced", icon: Code },
];

// IMPORTANT: do NOT observe "connection" (it's sticky and would steal focus)
const observedSections: SectionId[] = [
  "identity",
  "vendor",
  "decoding",
  "advanced",
];

function scrollToSection(id: SectionId) {
  const el = document.getElementById(`section-${id}`);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function useActiveSection(sectionIds: SectionId[]) {
  const [active, setActive] = useState<SectionId>("identity");

  useEffect(() => {
    const elements = sectionIds
      .map((id) => document.getElementById(`section-${id}`))
      .filter(Boolean) as HTMLElement[];

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0)
          );

        if (visible[0]?.target?.id) {
          const id = visible[0].target.id.replace("section-", "") as SectionId;
          setActive(id);
        }
      },
      {
        root: null,
        rootMargin: "-25% 0px -60% 0px",
        threshold: [0.15, 0.25, 0.4, 0.55, 0.7],
      }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sectionIds]);

  return { active, setActive };
}

function SectionLandmark({
  icon: Icon,
  title,
  hint,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="flex items-center gap-2">
        <Icon size={16} className="text-primary" />
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          {title}
        </div>
      </div>
      {hint ? (
        <div className="text-xs text-muted-foreground">{hint}</div>
      ) : null}
    </div>
  );
}

function SectionFrame({
  id,
  active,
  children,
}: {
  id: SectionId;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <div id={`section-${id}`} className="scroll-mt-[140px] relative">
      {active ? (
        <div className="absolute -left-3 top-3 bottom-3 w-1 rounded-full bg-primary/60" />
      ) : null}

      <div
        className={`space-y-3 ${
          active
            ? "ring-1 ring-primary/25 bg-primary/[0.03] rounded-2xl p-3"
            : ""
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function StickySectionDock({
  active,
  streamType,
  onPick,
}: {
  active: SectionId;
  streamType: StreamOverviewDto["type"];
  onPick: (id: SectionId) => void;
}) {
  return (
    <div
      className="
        sticky top-0 z-30
        -mx-6 md:-mx-8 px-6 md:px-8
        py-3
      "
    >
      <div className="rounded-2xl border border-border/60 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="flex flex-col gap-2 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="text-xs text-muted-foreground">Sections</div>
              <Badge variant="outline" className="text-[10px]">
                {streamType}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {sections.map((s) => {
              const Icon = s.icon;
              const isActive = active === s.id;
              return (
                <Button
                  key={s.id}
                  type="button"
                  variant={isActive ? "secondary" : "outline"}
                  className={`h-9 rounded-full px-3 gap-2 ${
                    isActive
                      ? "border-primary/30 bg-primary/10"
                      : "border-border/60"
                  }`}
                  onClick={() => onPick(s.id)}
                >
                  <Icon
                    size={16}
                    className={
                      isActive ? "text-primary" : "text-muted-foreground"
                    }
                  />
                  <span className="text-sm">{s.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Vendor config section ---
function StreamVendorConfigSection({
  vendorConfig,
}: {
  vendorConfig: StreamOverviewDto["vendorConfig"];
}) {
  const isKafkaVendorConfig = (
    v: StreamVendorConfigDto
  ): v is KafkaStreamVendorConfigDto => isVendor(v.vendor, VENDOR_META.KAFKA);

  const isRabbitVendorConfig = (
    v: StreamVendorConfigDto
  ): v is RabbitStreamVendorConfigDto => isVendor(v.vendor, VENDOR_META.RABBIT);

  const isPostgresVendorConfig = (
    v: StreamVendorConfigDto
  ): v is PostgresStreamVendorConfigDto =>
    isVendor(v.vendor, VENDOR_META.POSTGRES);

  if (isKafkaVendorConfig(vendorConfig)) {
    return (
      <div className="space-y-3">
        <KeyValueRow
          label="Topic"
          value={vendorConfig.topic ?? <Badge variant="outline">default</Badge>}
          mono
          copyText={vendorConfig.topic ?? undefined}
        />
        <KeyValueRow
          label="Consumer Group"
          value={
            vendorConfig.consumerGroupId ?? (
              <Badge variant="outline">default</Badge>
            )
          }
          mono
          copyText={vendorConfig.consumerGroupId ?? undefined}
        />
        <KeyValueRow
          label="Correlation Header"
          value={
            vendorConfig.correlationHeader ?? (
              <Badge variant="outline">default</Badge>
            )
          }
          mono
          copyText={vendorConfig.correlationHeader ?? undefined}
        />
      </div>
    );
  }

  if (isRabbitVendorConfig(vendorConfig)) {
    return (
      <div className="space-y-3">
        <KeyValueRow
          label="Queue"
          value={vendorConfig.queue ?? <Badge variant="outline">not set</Badge>}
          mono
        />
        <KeyValueRow
          label="Exchange"
          value={
            vendorConfig.exchange ?? <Badge variant="outline">not set</Badge>
          }
          mono
        />
        <KeyValueRow
          label="Routing Key"
          value={
            vendorConfig.routingKey ?? <Badge variant="outline">not set</Badge>
          }
          mono
        />
        <KeyValueRow
          label="Prefetch"
          value={
            vendorConfig.prefetchCount ?? (
              <Badge variant="outline">default</Badge>
            )
          }
          mono
        />
        <KeyValueRow
          label="Shadow Queue"
          value={
            vendorConfig.shadowQueueEnabled ? (
              <Badge
                variant="outline"
                className="border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
              >
                enabled
              </Badge>
            ) : (
              <Badge variant="outline">disabled</Badge>
            )
          }
        />
        {vendorConfig.shadowQueueEnabled ? (
          <KeyValueRow
            label="Shadow Queue Name"
            value={
              vendorConfig.shadowQueueName ?? (
                <Badge variant="outline">auto</Badge>
              )
            }
            mono
            copyText={vendorConfig.shadowQueueName ?? undefined}
          />
        ) : null}
        <KeyValueRow
          label="Correlation Header"
          value={
            vendorConfig.correlationHeader ?? (
              <Badge variant="outline">default</Badge>
            )
          }
          mono
          copyText={vendorConfig.correlationHeader ?? undefined}
        />
      </div>
    );
  }

  if (isPostgresVendorConfig(vendorConfig)) {
    return (
      <div className="space-y-3">
        <KeyValueRow
          label="Schema"
          value={
            vendorConfig.schema ?? <Badge variant="outline">default</Badge>
          }
          mono
        />
        <KeyValueRow
          label="Table"
          value={vendorConfig.table ?? <Badge variant="outline">default</Badge>}
          mono
        />
        <KeyValueRow
          label="Correlation Column"
          value={
            vendorConfig.correlationColumn ?? (
              <Badge variant="outline">not set</Badge>
            )
          }
          mono
          copyText={vendorConfig.correlationColumn ?? undefined}
        />
        <KeyValueRow
          label="Time Column"
          value={
            vendorConfig.timeColumn ?? <Badge variant="outline">not set</Badge>
          }
          mono
          copyText={vendorConfig.timeColumn ?? undefined}
        />
      </div>
    );
  }

  return <JsonBlock value={vendorConfig} />;
}

// --- Decoding section ---
function DecodingSection({
  decoding,
}: {
  decoding: StreamOverviewDto["decoding"];
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{decoding.schemaSource}</Badge>
        <Badge variant="outline">{decoding.formatHint}</Badge>
      </div>

      {decoding.schemaSource === "SCHEMA_REGISTRY" &&
      decoding.schemaRegistry ? (
        <div className="space-y-3">
          <KeyValueRow
            label="Registry URL"
            value={
              decoding.schemaRegistry.url ?? (
                <Badge variant="outline">not set</Badge>
              )
            }
            mono
            copyText={decoding.schemaRegistry.url ?? undefined}
          />
          <KeyValueRow label="Auth" value={decoding.schemaRegistry.authType} />
          {decoding.schemaRegistry.authType === "BASIC" ? (
            <KeyValueRow
              label="Username"
              value={
                decoding.schemaRegistry.username ?? (
                  <Badge variant="outline">not set</Badge>
                )
              }
              mono
              copyText={decoding.schemaRegistry.username ?? undefined}
            />
          ) : null}
        </div>
      ) : null}

      {decoding.schemaSource === "FILES" ? (
        <div className="space-y-5">
          {decoding.protoFiles ? (
            <div className="space-y-3">
              <div className="text-sm font-medium">Proto files</div>
              <KeyValueRow
                label="Bundle ID"
                value={decoding.protoFiles.bundleId}
                mono
                copyText={decoding.protoFiles.bundleId}
              />
              {decoding.protoFiles.fileGlob ? (
                <KeyValueRow
                  label="Glob"
                  value={decoding.protoFiles.fileGlob}
                  mono
                />
              ) : null}
              {decoding.protoFiles.fixedMessageFullName ? (
                <KeyValueRow
                  label="Fixed Message"
                  value={decoding.protoFiles.fixedMessageFullName}
                  mono
                />
              ) : null}
              {decoding.protoFiles.typeHeaderName ? (
                <KeyValueRow
                  label="Type Header"
                  value={decoding.protoFiles.typeHeaderName}
                  mono
                />
              ) : null}
              {decoding.protoFiles.typeHeaderValuePrefix ? (
                <KeyValueRow
                  label="Type Prefix"
                  value={decoding.protoFiles.typeHeaderValuePrefix}
                  mono
                />
              ) : null}
            </div>
          ) : null}

          {decoding.avroFiles ? (
            <div className="space-y-3">
              <div className="text-sm font-medium">Avro files</div>
              <KeyValueRow
                label="Bundle ID"
                value={decoding.avroFiles.bundleId}
                mono
                copyText={decoding.avroFiles.bundleId}
              />
              {decoding.avroFiles.fileGlob ? (
                <KeyValueRow
                  label="Glob"
                  value={decoding.avroFiles.fileGlob}
                  mono
                />
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// --- Connection config mini ---
function ConnectionConfigMini({
  config,
}: {
  config: StreamOverviewDto["connectionConfig"];
}) {
  const isKafkaConfig = (
    v: ConnectionConfigDto
  ): v is KafkaConnectionConfigDto => isVendor(v.vendor, VENDOR_META.KAFKA);

  const isRabbitConfig = (
    v: ConnectionConfigDto
  ): v is RabbitConnectionConfigDto => isVendor(v.vendor, VENDOR_META.RABBIT);

  const isPostgresConfig = (
    v: ConnectionConfigDto
  ): v is PostgresConnectionConfigDto =>
    isVendor(v.vendor, VENDOR_META.POSTGRES);

  return (
    <div className="space-y-3">
      <KeyValueRow
        label="Vendor"
        value={<Badge variant="outline">{config.vendor}</Badge>}
      />
      <KeyValueRow
        label="Host"
        value={`${config.host}:${config.port}`}
        mono
        copyText={`${config.host}:${config.port}`}
      />

      {isKafkaConfig(config) ? (
        <>
          <KeyValueRow
            label="Bootstrap"
            value={
              config.bootstrapServers ?? (
                <Badge variant="outline">not set</Badge>
              )
            }
            mono
            copyText={config.bootstrapServers ?? undefined}
          />
          {config.securityProtocol ? (
            <KeyValueRow
              label="Security"
              value={config.securityProtocol}
              mono
            />
          ) : null}
          {config.saslMechanism ? (
            <KeyValueRow label="SASL" value={config.saslMechanism} mono />
          ) : null}
        </>
      ) : null}

      {isRabbitConfig(config) ? (
        <>
          {config.virtualHost ? (
            <KeyValueRow label="VHost" value={config.virtualHost} mono />
          ) : null}
          {config.username ? (
            <KeyValueRow label="Username" value={config.username} mono />
          ) : null}
        </>
      ) : null}

      {isPostgresConfig(config) ? (
        <>
          {config.jdbcUrl ? (
            <KeyValueRow label="JDBC URL" value={config.jdbcUrl} mono />
          ) : null}
          {config.username ? (
            <KeyValueRow label="Username" value={config.username} mono />
          ) : null}
        </>
      ) : null}
    </div>
  );
}

export function StreamOverviewPage({ streamId }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: stream,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["stream-overview", streamId],
    queryFn: () => fetchStreamOverview(streamId),
  });

  const { active, setActive } = useActiveSection(observedSections);

  const [rawVendorOpen, setRawVendorOpen] = useState(false);
  const [rawDecodingOpen, setRawDecodingOpen] = useState(false);
  const [rawConnectionOpen, setRawConnectionOpen] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/streams/${streamId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete stream");
    },
    onSuccess: () => {
      toast.success("Stream deleted successfully");

      queryClient.invalidateQueries({ queryKey: ["streams"] });
      queryClient.invalidateQueries({
        queryKey: ["stream-overview", streamId],
      });

      router.push("/streams");
      router.refresh();
    },
    onError: () => {
      toast.error("Stream not deleted", {
        description: "Something went wrong. Please try again.",
      });
    },
  });

  if (isLoading) return <StreamSkeleton />;
  if (isError || !stream)
    return (
      <div className="p-8 text-destructive">Failed to load stream data.</div>
    );

  const streamVendor = getVendorMeta(stream.type);

  return (
    <>
      <div className="min-h-screen bg-background p-6 md:p-8 space-y-4">
        {/* Header */}
        <div className="fade-in">
          <div className="flex flex-col gap-5">
            <Link
              href="/streams"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors w-fit group"
            >
              <ArrowLeft
                size={16}
                className="mr-1 group-hover:-translate-x-1 transition-transform"
              />
              Back to Streams
            </Link>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border pb-5">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                  {stream.name}
                </h1>
                <StreamTypeBadge
                  type={stream.type}
                  className="text-sm px-2.5 py-0.5 border-2"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 font-mono bg-muted/50 px-2 py-0.5 rounded text-xs">
                  <Hash size={12} />
                  {stream.id}
                  <CopyButton
                    text={stream.id}
                    label="Stream ID"
                    className="h-4 w-4 ml-2 text-muted-foreground hover:text-foreground opacity-50 hover:opacity-100 transition-all"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground/70">
                    Connected via:
                  </span>
                  <Link
                    href={`/connections/${stream.connectionId}`}
                    className="flex items-center gap-1.5 font-medium text-foreground hover:text-primary transition-colors hover:underline"
                  >
                    <VendorIcon
                      type={stream.connectionType}
                      className="w-4 h-4"
                    />
                    {stream.connectionName}
                    <ExternalLink size={12} className="opacity-50" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" className="gap-2 shadow-sm">
                <Settings2 size={16} /> Configure Stream
              </Button>

              <Button
                type="button"
                variant="outline"
                className="gap-2 shadow-sm border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 size={16} />
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Dock */}
        <StickySectionDock
          active={active}
          streamType={stream.type}
          onPick={(id) => {
            setActive(id);
            scrollToSection(id);

            if (id === "connection") {
              window.setTimeout(() => setActive("identity"), 600);
            }
          }}
        />

        {/* Tabs */}
        <div className="fade-in">
          <Tabs defaultValue="overview" className="w-full space-y-6">
            <TabsList className="w-full md:w-auto grid grid-cols-3 md:inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="vendor">Vendor Panel</TabsTrigger>
            </TabsList>

            {/* Overview */}
            <TabsContent
              value="overview"
              className="space-y-6 animate-in slide-in-from-bottom-2 duration-500"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left */}
                <div className="lg:col-span-2 space-y-8">
                  <SectionFrame id="identity" active={active === "identity"}>
                    <SectionLandmark
                      icon={IdCard}
                      title="Stream identity"
                      hint="Core identifiers"
                    />
                    <Card className="rounded-xl shadow-sm border-border/60 bg-card overflow-hidden">
                      <CardHeader className="bg-muted/30 border-b border-border/40">
                        <CardTitle className="text-base">Identity</CardTitle>
                        <CardDescription>
                          Optimized for quick copy & support workflows.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 space-y-5">
                        <KeyValueRow
                          label="Technical Name"
                          value={
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted/40 border border-border rounded-md font-mono text-sm text-foreground">
                              {stream.technicalName}
                              <CopyButton
                                text={stream.technicalName}
                                label="Technical Name"
                                className="h-4 w-4 ml-2 text-muted-foreground hover:text-foreground opacity-50 hover:opacity-100 transition-all"
                              />
                            </div>
                          }
                          mono
                        />
                        <KeyValueRow
                          label="Type"
                          value={<StreamTypeBadge type={stream.type} />}
                        />
                        <KeyValueRow
                          label="Stream ID"
                          value={
                            <span className="font-mono text-xs text-muted-foreground">
                              {stream.id}
                            </span>
                          }
                          mono
                          copyText={stream.id}
                        />
                      </CardContent>
                    </Card>
                  </SectionFrame>

                  <SectionFrame id="vendor" active={active === "vendor"}>
                    <SectionLandmark
                      icon={SlidersHorizontal}
                      title="Vendor configuration"
                      hint={stream.vendorConfig.vendor}
                    />
                    <Card className="rounded-xl shadow-sm border-border/60 bg-card overflow-hidden">
                      <CardHeader className="bg-muted/30 border-b border-border/40">
                        <CardTitle className="text-base">
                          Vendor configuration
                        </CardTitle>
                        <CardDescription>
                          Settings specific to Kafka / Rabbit / Postgres.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 space-y-5">
                        <StreamVendorConfigSection
                          vendorConfig={stream.vendorConfig}
                        />

                        <Separator />

                        <Collapsible
                          open={rawVendorOpen}
                          onOpenChange={setRawVendorOpen}
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium">
                              Raw vendor config
                            </div>
                            <CollapsibleTrigger asChild>
                              <Button variant="outline" size="sm">
                                {rawVendorOpen ? "Hide JSON" : "Show JSON"}
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                          <CollapsibleContent className="mt-3">
                            <JsonBlock value={stream.vendorConfig} />
                          </CollapsibleContent>
                        </Collapsible>
                      </CardContent>
                    </Card>
                  </SectionFrame>

                  <SectionFrame id="decoding" active={active === "decoding"}>
                    <SectionLandmark
                      icon={Braces}
                      title="Payload decoding"
                      hint={`${stream.decoding.schemaSource} · ${stream.decoding.formatHint}`}
                    />
                    <Card className="rounded-xl shadow-sm border-border/60 bg-card overflow-hidden">
                      <CardHeader className="bg-muted/30 border-b border-border/40">
                        <CardTitle className="text-base">
                          Payload decoding
                        </CardTitle>
                        <CardDescription>
                          Schema Registry or Schema Bundles strategy.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 space-y-5">
                        <DecodingSection decoding={stream.decoding} />

                        <Separator />

                        <Collapsible
                          open={rawDecodingOpen}
                          onOpenChange={setRawDecodingOpen}
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium">
                              Raw decoding config
                            </div>
                            <CollapsibleTrigger asChild>
                              <Button variant="outline" size="sm">
                                {rawDecodingOpen ? "Hide JSON" : "Show JSON"}
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                          <CollapsibleContent className="mt-3">
                            <JsonBlock value={stream.decoding} />
                          </CollapsibleContent>
                        </Collapsible>
                      </CardContent>
                    </Card>
                  </SectionFrame>

                  <SectionFrame id="advanced" active={active === "advanced"}>
                    <SectionLandmark
                      icon={Code}
                      title="Advanced & debug"
                      hint="Support view"
                    />
                    <Card className="rounded-xl shadow-sm border-border/60 bg-card overflow-hidden">
                      <CardHeader className="bg-muted/30 border-b border-border/40">
                        <CardTitle className="text-base">
                          Advanced & debug
                        </CardTitle>
                        <CardDescription>
                          Keep it collapsed by default for a cleaner overview.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 space-y-5">
                        <div className="text-sm text-muted-foreground">
                          Use when troubleshooting schema mismatch, auth,
                          routing or decoding.
                        </div>

                        <Collapsible
                          open={rawConnectionOpen}
                          onOpenChange={setRawConnectionOpen}
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium">
                              Raw connection config
                            </div>
                            <CollapsibleTrigger asChild>
                              <Button variant="outline" size="sm">
                                {rawConnectionOpen ? "Hide JSON" : "Show JSON"}
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                          <CollapsibleContent className="mt-3">
                            <JsonBlock value={stream.connectionConfig} />
                          </CollapsibleContent>
                        </Collapsible>
                      </CardContent>
                    </Card>
                  </SectionFrame>

                  {/* Quick Actions */}
                  <Card className="rounded-xl shadow-sm border-border/60 bg-card">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-base">Quick Actions</CardTitle>
                      <CardDescription>
                        Shortcuts for common operational tasks.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <Button
                          variant="outline"
                          className="h-20 flex flex-col gap-2 hover:border-primary/50 hover:bg-primary/5"
                        >
                          <Search size={20} />
                          Search
                        </Button>
                        <Button
                          variant="outline"
                          className="h-20 flex flex-col gap-2 hover:border-primary/50 hover:bg-primary/5"
                        >
                          <Send size={20} />
                          Publish
                        </Button>

                        {isVendor(stream.type, VENDOR_META.POSTGRES) ? (
                          <Button
                            variant="outline"
                            className={`h-20 flex flex-col gap-2 ${streamVendor.buttonAccent}`}
                          >
                            <Terminal size={20} />
                            SQL Explorer
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            className="h-20 flex flex-col gap-2 opacity-50"
                            disabled
                          >
                            <Terminal size={20} />
                            SQL Explorer
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          className="h-20 flex flex-col gap-2 opacity-50 cursor-not-allowed"
                          disabled
                        >
                          <Activity size={20} />
                          Stats (Soon)
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right sticky column */}
                <div className="space-y-6 sticky top-[140px] self-start">
                  <SectionFrame
                    id="connection"
                    active={active === "connection"}
                  >
                    <SectionLandmark
                      icon={PlugZap}
                      title="Connection context"
                      hint="Sticky card"
                    />
                    <Card className="rounded-xl shadow-sm border-border/60 bg-card overflow-hidden">
                      <CardHeader className="bg-muted/30 border-b border-border/40">
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle className="text-base">
                              Connection context
                            </CardTitle>
                            <CardDescription>
                              Always visible while you scroll.
                            </CardDescription>
                          </div>
                          <VendorIcon
                            type={stream.connectionType}
                            className="w-5 h-5"
                          />
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 space-y-5 text-sm">
                        <div className="flex justify-between items-center h-6">
                          <span className="text-muted-foreground text-[10px] uppercase tracking-wider">
                            Type
                          </span>
                          <StreamTypeBadge type={stream.connectionType} />
                        </div>

                        <Separator />

                        <ConnectionConfigMini
                          config={stream.connectionConfig}
                        />

                        <div className="pt-2">
                          <Button
                            variant="secondary"
                            className="w-full gap-2 font-medium"
                            asChild
                          >
                            <Link href={`/connections/${stream.connectionId}`}>
                              Open Connection Details <ExternalLink size={14} />
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </SectionFrame>

                  <Card className="rounded-xl border-dashed border-border/60 bg-muted/5 opacity-70">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                        <Cpu size={14} /> Live Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground pb-6">
                      Real-time throughput and latency metrics will appear here
                      in a future update.
                    </CardContent>
                  </Card>

                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full justify-between text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        const scroller = document.getElementById("app-scroll");
                        if (scroller) {
                          scroller.scrollTo({ top: 0, behavior: "smooth" });
                        } else {
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }
                      }}
                    >
                      <span className="inline-flex items-center gap-2">
                        <ChevronUp size={14} />
                        Back to top
                      </span>
                      <span className="opacity-60">↑</span>
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Messages */}
            <TabsContent value="messages">
              <Card className="min-h-[420px] flex items-center justify-center rounded-xl border-dashed border-border bg-muted/5">
                <div className="text-center space-y-3">
                  <div className="bg-background border border-border w-12 h-12 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <Search size={24} className="text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">Message Explorer</h3>
                    <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-1">
                      Connect to <b>{stream.technicalName}</b> to browse live
                      messages.
                    </p>
                  </div>
                  <Button className="mt-4">Connect & Browse</Button>
                </div>
              </Card>
            </TabsContent>

            {/* Vendor Panel */}
            <TabsContent value="vendor">
              <Card className="rounded-xl border-border/60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings2 className="w-5 h-5" />
                    {stream.type} Specific Settings
                  </CardTitle>
                  <CardDescription>
                    Advanced configuration for {stream.technicalName}.
                  </CardDescription>
                </CardHeader>
                <CardContent className="min-h-[220px] flex items-center justify-center bg-muted/10">
                  <div className="text-sm text-muted-foreground italic">
                    Extended controls for {stream.type} will be implemented
                    here.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete stream?"
        description={`This will permanently remove "${stream.name}". This action cannot be undone.`}
        confirmLabel="Delete Stream"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </>
  );
}

// --- Skeleton ---
function StreamSkeleton() {
  return (
    <div className="p-8 space-y-8 min-h-screen">
      <div className="space-y-4">
        <Skeleton className="h-4 w-32" />
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      <Skeleton className="h-16 w-full rounded-2xl" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Skeleton className="h-[220px] rounded-xl" />
          <Skeleton className="h-[260px] rounded-xl" />
          <Skeleton className="h-[320px] rounded-xl" />
          <Skeleton className="h-[180px] rounded-xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-[420px] rounded-xl" />
          <Skeleton className="h-[110px] rounded-xl" />
        </div>
      </div>
    </div>
  );
}
