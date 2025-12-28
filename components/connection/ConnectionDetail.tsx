"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Activity,
  Server,
  Clock,
  Hash,
  Layers,
  PlayCircle,
  ChevronUp,
  ShieldCheck,
  AlertTriangle,
  Settings2,
  Braces,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

// UI
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Custom
import { ConnectionStatusBadge } from "./ConnectionStatusBadge";
import { StreamTypeBadge } from "@/components/shared/StreamTypeBadge";
import { KeyValueRow } from "@/components/shared/KeyValueRow";
import { JsonBlock } from "@/components/shared/JsonBlock";
import { CopyButton } from "@/components/shared/CopyButton";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
import { getVendorMeta } from "@/components/lib/vendors";
import {
  deleteConnection,
  getConnectionOverview,
  getConnectionStreams,
  testConnection,
} from "@/lib/api/connections";

// Types
import type {
  ConnectionOverviewDto,
  ConnectionStreamOverviewDto,
} from "@/types/connection";

interface Props {
  id: string;
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

function humanCheckedAt(instant?: string | null) {
  if (!instant) return { primary: "Never", secondary: null as string | null };
  const date = new Date(instant);
  return {
    primary: date.toLocaleString(),
    secondary: `(${formatDistanceToNow(date, { addSuffix: true })})`,
  };
}

export const ConnectionDetail = ({ id }: Props) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: connection, isLoading: isConnLoading } =
    useQuery<ConnectionOverviewDto>({
    queryKey: ["connection", id],
    queryFn: () => getConnectionOverview(id),
  });

  const { data: streams, isLoading: isStreamsLoading } =
    useQuery<ConnectionStreamOverviewDto[]>({
    queryKey: ["connection-streams", id],
    queryFn: () => getConnectionStreams(id),
  });

  const testMutation = useMutation({
    mutationFn: () => testConnection(id),
    onSuccess: (result) => {
      queryClient.setQueryData(
        ["connection", id],
        (old?: ConnectionOverviewDto) =>
          old
            ? {
                ...old,
                status: result.status,
                lastCheckedAt: result.checkedAt,
                lastErrorMessage: result.message,
              }
            : old
      );
    },
    onError: () => {
      toast.error("Health check failed", {
        description: "Unable to verify connection. Please try again.",
      });
    },
  });

  const [rawOpen, setRawOpen] = useState(false);

  // --- Delete connection ---
  const [deleteOpen, setDeleteOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => deleteConnection(id),
    onSuccess: () => {
      toast.success("Connection deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["connections"] });
      router.push("/connections");
      router.refresh();
    },
    onError: () => {
      toast.error("Connection not deleted", {
        description:
          "It may still be referenced by streams, or an unexpected error occurred.",
      });
    },
  });

  if (isConnLoading) return <ConnectionSkeleton />;
  if (!connection)
    return <div className="p-8 text-destructive">Connection not found</div>;

  const vendor = getVendorMeta(String(connection.type));
  const VendorIcon = vendor.icon;

  const hostPort = `${connection.host}:${connection.port}`;
  const checked = humanCheckedAt(connection.lastCheckedAt as any);

  return (
    <>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 fade-in">
        {/* Breadcrumb */}
        <Link
          href="/connections"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors w-fit group"
        >
          <ArrowLeft
            size={16}
            className="mr-1 group-hover:-translate-x-1 transition-transform"
          />
          Back to Connections
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border pb-5">
          <div className="flex items-start gap-4">
            <div
              className={[
                "w-12 h-12 rounded-xl flex items-center justify-center border",
                "shadow-sm",
                vendor.tone.bg,
                vendor.tone.border,
                vendor.tone.ring,
                "ring-1",
              ].join(" ")}
            >
              <VendorIcon className={vendor.tone.fg} size={22} />
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  {connection.name}
                </h1>

                <ConnectionStatusBadge status={connection.status} />

                <StreamTypeBadge
                  type={connection.type as any}
                  className="text-sm px-2.5 py-0.5 border-2"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 font-mono bg-muted/50 px-2 py-0.5 rounded text-xs">
                  <Hash size={12} />
                  {String(connection.id)}
                  <CopyButton
                    text={connection.id}
                    label="Value"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground/70">Endpoint:</span>
                  <span className="font-mono text-xs">{hostPort}</span>
                  <CopyButton
                    text={hostPort}
                    label="Value"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => testMutation.mutate()}
              disabled={testMutation.isPending}
              variant={testMutation.isPending ? "outline" : "default"}
              className="shadow-sm gap-2"
            >
              <Activity
                size={16}
                className={testMutation.isPending ? "animate-spin" : ""}
              />
              {testMutation.isPending ? "Checking..." : "Run Health Check"}
            </Button>

            <Button variant="outline" className="shadow-sm gap-2">
              <Settings2 size={16} />
              Configure
            </Button>

            <Button
              type="button"
              variant="outline"
              className="shadow-sm gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
              onClick={() => setDeleteOpen(true)}
              disabled={deleteMutation.isPending}
            >
              <Trash2 size={16} />
              Delete
            </Button>
          </div>
        </div>

        {/* Content */}
        <Tabs defaultValue="overview" className="w-full space-y-6">
          <TabsList className="w-full md:w-auto grid grid-cols-2 h-10 rounded-md bg-muted p-1 text-muted-foreground">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="streams">Streams</TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left */}
              <div className="lg:col-span-2 space-y-8">
                <div className="space-y-3">
                  <SectionLandmark
                    icon={Server}
                    title="Connection identity"
                    hint={vendor.label}
                  />
                  <Card className="rounded-xl shadow-sm border-border/60 bg-card overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b border-border/40">
                      <CardTitle className="text-base">Identity</CardTitle>
                      <CardDescription>
                        Core connection fields used by streams and health
                        checks.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-5">
                      <KeyValueRow
                        label="Name"
                        value={
                          <span className="font-medium">{connection.name}</span>
                        }
                      />
                      <KeyValueRow
                        label="Type"
                        value={
                          <StreamTypeBadge type={connection.type as any} />
                        }
                      />
                      <KeyValueRow
                        label="Host"
                        value={
                          <span className="font-mono text-sm">{hostPort}</span>
                        }
                        mono
                        copyText={hostPort}
                      />
                      <KeyValueRow
                        label="Connection ID"
                        value={
                          <span className="font-mono text-xs text-muted-foreground">
                            {String(connection.id)}
                          </span>
                        }
                        mono
                        copyText={String(connection.id)}
                      />
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-3">
                  <SectionLandmark
                    icon={Braces}
                    title="Raw connection data"
                    hint="Support view"
                  />
                  <Card className="rounded-xl shadow-sm border-border/60 bg-card overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b border-border/40">
                      <CardTitle className="text-base">Raw JSON</CardTitle>
                      <CardDescription>
                        Use for debugging UI mapping, status refresh and DTO
                        drift.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-5">
                      <Collapsible open={rawOpen} onOpenChange={setRawOpen}>
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">
                            ConnectionOverviewDto
                          </div>
                          <CollapsibleTrigger asChild>
                            <Button variant="outline" size="sm">
                              {rawOpen ? "Hide JSON" : "Show JSON"}
                            </Button>
                          </CollapsibleTrigger>
                        </div>
                        <CollapsibleContent className="mt-3">
                          <JsonBlock value={connection} />
                        </CollapsibleContent>
                      </Collapsible>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Right sticky column */}
              <div className="space-y-6 sticky top-[140px] self-start">
                <div className="space-y-3">
                  <SectionLandmark
                    icon={ShieldCheck}
                    title="Health status"
                    hint="Sticky card"
                  />
                  <Card className="rounded-xl shadow-sm border-border/60 bg-card overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b border-border/40">
                      <CardTitle className="text-base">
                        Connection health
                      </CardTitle>
                      <CardDescription>
                        Always visible while you scroll.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-5">
                      <div className="flex items-center justify-between">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">
                          Status
                        </div>
                        <ConnectionStatusBadge
                          status={connection.status}
                          showLabel={true}
                        />
                      </div>

                      {(connection.status === "ERROR" ||
                        connection.status === "OFFLINE") &&
                      connection.lastErrorMessage ? (
                        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3">
                          <div className="flex items-center gap-2 text-destructive text-xs font-medium">
                            <AlertTriangle size={14} />
                            Last error
                          </div>
                          <div className="mt-2 text-xs text-destructive/90">
                            {connection.lastErrorMessage}
                          </div>
                        </div>
                      ) : null}

                      <Separator />

                      <KeyValueRow
                        label="Last checked"
                        value={
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-foreground">
                              {checked.primary}
                            </div>
                            {checked.secondary ? (
                              <div className="text-xs text-muted-foreground">
                                {checked.secondary}
                              </div>
                            ) : null}
                          </div>
                        }
                      />

                      <div className="pt-2">
                        <Button
                          type="button"
                          variant="ghost"
                          className="w-full justify-between text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            const scroller =
                              document.getElementById("app-scroll");
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
                    </CardContent>
                  </Card>
                </div>

                <Card className="rounded-xl border-dashed border-border/60 bg-muted/5 opacity-70">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                      <Clock size={14} /> Auto checks
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground pb-6">
                    Scheduling / retries will appear here in a future update.
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* STREAMS */}
          <TabsContent value="streams">
            <Card className="shadow-sm border-border/60 rounded-xl overflow-hidden">
              <CardHeader className="px-6 py-4 border-b border-border bg-muted/20">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">
                      Streams
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {streams?.length
                        ? `${streams.length} stream${
                            streams.length === 1 ? "" : "s"
                          } connected and configured.`
                        : "No streams configured."}
                    </CardDescription>
                  </div>

                  <Button variant="outline" className="gap-2">
                    <Layers size={16} />
                    Create stream
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {isStreamsLoading ? (
                  <div className="p-6 space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : !streams || streams.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                    <Layers
                      size={48}
                      className="text-muted-foreground/30 mb-4"
                    />
                    <p>No streams found for this connection.</p>
                    <Button variant="link" className="mt-2 text-primary">
                      Configure new stream
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="pl-6">Stream Name</TableHead>
                        <TableHead>Technical Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right pr-6">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {streams.map((stream) => (
                        <TableRow key={stream.id} className="hover:bg-muted/30">
                          <TableCell className="pl-6 font-medium">
                            <Link
                              href={`/streams/${stream.id}`}
                              className="hover:underline hover:text-primary transition-colors"
                            >
                              {stream.name}
                            </Link>
                          </TableCell>

                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {stream.technicalName}
                          </TableCell>

                          <TableCell>
                            <StreamTypeBadge type={stream.type as any} />
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant="outline"
                              className="text-xs font-normal border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                            >
                              Active
                            </Badge>
                          </TableCell>

                          <TableCell className="text-muted-foreground text-sm">
                            {stream.createdAt
                              ? new Date(stream.createdAt).toLocaleDateString()
                              : "—"}
                          </TableCell>

                          <TableCell className="text-right pr-6">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:text-primary"
                            >
                              <PlayCircle size={16} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete connection?"
        description={`This will permanently remove "${connection.name}". Streams using this connection may stop working. This action cannot be undone.`}
        confirmLabel="Delete Connection"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </>
  );
};

function ConnectionSkeleton() {
  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <Skeleton className="h-4 w-40" />
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-44" />
      </div>

      <Skeleton className="h-10 w-72 rounded-md" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Skeleton className="h-[240px] rounded-xl" />
          <Skeleton className="h-[220px] rounded-xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-[340px] rounded-xl" />
          <Skeleton className="h-[110px] rounded-xl" />
        </div>
      </div>
    </div>
  );
}
