"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Search,
  Download,
  CheckSquare,
  Layers,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  Pencil,
  AlertTriangle,
  RotateCcw,
  Info,
} from "lucide-react";
import { toast } from "sonner";

// UI
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Custom
import { StreamTypeBadge } from "@/components/shared/StreamTypeBadge";
import { getVendorMeta } from "@/components/lib/vendors";
import {
  getConnectionOverview,
  getStreamCandidates,
  importStreamCandidates,
} from "@/lib/api/connections";
import { mapCandidateToImportPayload } from "@/lib/streams/candidate-mapper";
import { isVendorConfigComplete } from "@/lib/streams/candidate-validator";
import { BulkImportWizard } from "@/components/connection/BulkImportWizard";

// Types
import type { ConnectionOverviewDto } from "@/types/connection";
import type { CorrelationKeyType } from "@/types/stream";
import type { PayloadFormatHint, SchemaSource } from "@/types/decoding";
import type {
  CandidateOverride,
  ImportStreamCandidateDto,
  StreamCandidateDto,
} from "@/types/streamCandidate";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const FORMAT_HINT_OPTIONS: { value: PayloadFormatHint; label: string }[] = [
  { value: "AUTO", label: "AUTO — let backend decide" },
  { value: "JSON", label: "JSON" },
  { value: "PROTO", label: "PROTO" },
  { value: "AVRO", label: "AVRO" },
  { value: "TEXT", label: "TEXT" },
  { value: "BINARY", label: "BINARY" },
];

const SCHEMA_SOURCE_OPTIONS: { value: SchemaSource; label: string }[] = [
  { value: "NONE", label: "NONE — no schema" },
  { value: "SCHEMA_REGISTRY", label: "SCHEMA_REGISTRY" },
  { value: "FILES", label: "FILES — bundle" },
];

const CORR_KEY_TYPE_OPTIONS: {
  value: CorrelationKeyType | "_none";
  label: string;
}[] = [
  { value: "_none", label: "— not set" },
  { value: "HEADER", label: "HEADER" },
  { value: "COLUMN", label: "COLUMN" },
];

// ─────────────────────────────────────────────
// Main page component
// ─────────────────────────────────────────────

interface Props {
  connectionId: string;
}

export function DiscoverStreamsPage({ connectionId }: Props) {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [overrides, setOverrides] = useState<Record<string, CandidateOverride>>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState<number | null>(null);

  // ── Wizard state ─────────────────────────────────────────────────────────
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardCandidates, setWizardCandidates] = useState<
    ImportStreamCandidateDto[]
  >([]);

  // ── queries ──────────────────────────────────
  const { data: connection } = useQuery<ConnectionOverviewDto>({
    queryKey: ["connection", connectionId],
    queryFn: () => getConnectionOverview(connectionId),
  });

  const {
    data: candidates,
    isLoading,
    isError,
    refetch,
  } = useQuery<StreamCandidateDto[]>({
    queryKey: ["stream-candidates", connectionId],
    queryFn: () => getStreamCandidates(connectionId),
  });

  // ── derived ──────────────────────────────────
  const filtered = useMemo(() => {
    if (!candidates) return [];
    const q = search.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter(
      (c) =>
        c.technicalName.toLowerCase().includes(q) ||
        c.suggestedName.toLowerCase().includes(q)
    );
  }, [candidates, search]);

  const selectableFiltered = useMemo(
    () => filtered.filter((c) => !c.alreadyImported),
    [filtered]
  );

  const allVisibleSelected =
    selectableFiltered.length > 0 &&
    selectableFiltered.every((c) => selectedKeys.has(c.technicalName));

  const someVisibleSelected = selectableFiltered.some((c) =>
    selectedKeys.has(c.technicalName)
  );

  const editingCandidate = useMemo(
    () => candidates?.find((c) => c.technicalName === editingKey) ?? null,
    [candidates, editingKey]
  );

  // ── helpers ──────────────────────────────────

  /** Merge backend suggestion with any user overrides. */
  function getEffective(c: StreamCandidateDto): StreamCandidateDto {
    const ov = overrides[c.technicalName];
    if (!ov) return c;
    return {
      ...c,
      suggestedName: ov.suggestedName ?? c.suggestedName,
      suggestedCorrelationKeyType:
        ov.suggestedCorrelationKeyType !== undefined
          ? ov.suggestedCorrelationKeyType
          : c.suggestedCorrelationKeyType,
      suggestedCorrelationKeyName:
        ov.suggestedCorrelationKeyName !== undefined
          ? ov.suggestedCorrelationKeyName
          : c.suggestedCorrelationKeyName,
      suggestedDecoding:
        ov.suggestedDecoding !== undefined
          ? ov.suggestedDecoding
          : c.suggestedDecoding,
    };
  }

  function toggleRow(key: string) {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleAll() {
    if (allVisibleSelected) {
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        selectableFiltered.forEach((c) => next.delete(c.technicalName));
        return next;
      });
    } else {
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        selectableFiltered.forEach((c) => next.add(c.technicalName));
        return next;
      });
    }
  }

  function clearSelection() {
    setSelectedKeys(new Set());
  }

  function handleNameChange(technicalName: string, value: string) {
    setOverrides((prev) => ({
      ...prev,
      [technicalName]: { ...prev[technicalName], suggestedName: value },
    }));
  }

  function applyOverride(technicalName: string, ov: CandidateOverride) {
    setOverrides((prev) => ({ ...prev, [technicalName]: ov }));
    setEditingKey(null);
  }

  function resetOverride(technicalName: string) {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[technicalName];
      return next;
    });
    setEditingKey(null);
  }

  /**
   * Called when the user clicks "Import N streams" in the footer.
   * - If all selected candidates already have valid vendorConfig → import
   *   directly.
   * - If any candidate is missing required vendorConfig fields → open the
   *   Bulk Import Wizard so the user can complete them before submitting.
   */
  function handleImportClick() {
    if (!candidates) return;
    const toImport = candidates
      .filter((c) => selectedKeys.has(c.technicalName))
      .map((c) => mapCandidateToImportPayload(c, overrides[c.technicalName]));

    const allComplete = toImport.every((dto) =>
      isVendorConfigComplete(dto.streamType, dto.vendorConfig as any)
    );

    if (allComplete) {
      importMutation.mutate(toImport);
    } else {
      setWizardCandidates(toImport);
      setWizardOpen(true);
    }
  }

  // ── mutation ─────────────────────────────────
  const importMutation = useMutation({
    mutationFn: (dtos: ImportStreamCandidateDto[]) =>
      importStreamCandidates(connectionId, { candidates: dtos }),
    onSuccess: (result, dtos) => {
      const count = result?.importedCount ?? dtos.length;
      setImportedCount(count);
      setSelectedKeys(new Set());
      toast.success(`Imported ${count} stream${count !== 1 ? "s" : ""}`, {
        description: "The streams are now visible in your Streams overview.",
      });
      queryClient.invalidateQueries({ queryKey: ["streams"] });
      queryClient.invalidateQueries({
        queryKey: ["connection-streams", connectionId],
      });
      refetch();
    },
    onError: (e: any) => {
      toast.error("Import failed", {
        description: e?.message ?? "Please try again.",
      });
    },
  });

  const vendor = connection ? getVendorMeta(connection.type) : null;

  // ── render ────────────────────────────────────
  return (
    <TooltipProvider delayDuration={300}>
      <>
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 fade-in">
          {/* Breadcrumb */}
          <Link
            href={`/connections/${connectionId}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors w-fit group"
          >
            <ArrowLeft
              size={16}
              className="mr-1 group-hover:-translate-x-1 transition-transform"
            />
            Back to Connection
          </Link>

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border pb-5">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {connection && vendor ? (
                  <>
                    <StreamTypeBadge type={connection.type as any} />
                    <span className="text-muted-foreground/40">·</span>
                    <span>{connection.name}</span>
                  </>
                ) : (
                  <Skeleton className="h-4 w-52" />
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                Discover Streams
              </h1>
              <p className="text-sm text-muted-foreground max-w-2xl">
                Discover topics, queues or tables available under this
                connection. Review backend suggestions and import them as
                streams.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {importedCount !== null && (
                <Button variant="outline" className="gap-2" asChild>
                  <Link href="/streams">
                    <ExternalLink size={16} />
                    Go to Streams
                  </Link>
                </Button>
              )}
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw
                  size={16}
                  className={isLoading ? "animate-spin" : ""}
                />
                Refresh
              </Button>
            </div>
          </div>

          {/* Error state */}
          {isError ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
              <AlertCircle size={40} className="text-destructive/50" />
              <p className="text-muted-foreground">
                Failed to discover streams. Check that the connection is
                reachable.
              </p>
              <Button
                variant="outline"
                onClick={() => refetch()}
                className="gap-2 mt-1"
              >
                <RefreshCw size={14} />
                Retry
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Controls row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                  />
                  <Input
                    placeholder="Filter by name or technical name…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-muted/30 border-border/60 h-9"
                  />
                </div>

                {!isLoading && candidates && (
                  <p className="text-xs text-muted-foreground whitespace-nowrap">
                    {filtered.length} candidate
                    {filtered.length !== 1 ? "s" : ""}
                    {filtered.length !== candidates.length
                      ? ` of ${candidates.length}`
                      : ""}
                    {selectedKeys.size > 0 && (
                      <span className="ml-2 text-primary font-medium">
                        · {selectedKeys.size} selected
                      </span>
                    )}
                    {Object.keys(overrides).length > 0 && (
                      <span className="ml-2 text-blue-400 font-medium">
                        · {Object.keys(overrides).length} edited
                      </span>
                    )}
                  </p>
                )}
              </div>

              {/* Table */}
              <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="w-12 pl-5">
                        <Checkbox
                          checked={
                            allVisibleSelected
                              ? true
                              : someVisibleSelected
                              ? "indeterminate"
                              : false
                          }
                          onCheckedChange={toggleAll}
                          disabled={
                            isLoading || selectableFiltered.length === 0
                          }
                          aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead className="min-w-[180px]">Name</TableHead>
                      <TableHead className="min-w-[180px]">
                        Technical name
                      </TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="min-w-[130px]">Decoding</TableHead>
                      <TableHead className="min-w-[140px]">
                        Correlation key
                      </TableHead>
                      <TableHead className="text-right pr-4 min-w-[160px]">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {isLoading ? (
                      <LoadingRows />
                    ) : filtered.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="py-16 text-center text-muted-foreground"
                        >
                          <div className="flex flex-col items-center gap-3">
                            <Layers
                              size={36}
                              className="text-muted-foreground/25"
                            />
                            {search ? (
                              <p>No candidates match your filter.</p>
                            ) : (
                              <p>
                                No stream candidates found for this connection.
                              </p>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((candidate) => {
                        const isDisabled = candidate.alreadyImported;
                        const isSelected =
                          !isDisabled &&
                          selectedKeys.has(candidate.technicalName);
                        const effective = getEffective(candidate);
                        const isEdited =
                          !!overrides[candidate.technicalName] && !isDisabled;

                        return (
                          <TableRow
                            key={candidate.technicalName}
                            className={[
                              "transition-colors group/row",
                              isDisabled
                                ? "opacity-50"
                                : "cursor-pointer hover:bg-muted/30",
                              isSelected
                                ? "bg-primary/5 hover:bg-primary/8"
                                : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                            onClick={() => {
                              if (!isDisabled)
                                toggleRow(candidate.technicalName);
                            }}
                          >
                            {/* Checkbox */}
                            <TableCell
                              className="pl-5 w-12"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Checkbox
                                checked={isSelected}
                                disabled={isDisabled}
                                onCheckedChange={() => {
                                  if (!isDisabled)
                                    toggleRow(candidate.technicalName);
                                }}
                                aria-label={`Select ${candidate.suggestedName}`}
                              />
                            </TableCell>

                            {/* Name — inline editable */}
                            <TableCell
                              className="font-medium"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center gap-1.5">
                                <Input
                                  value={effective.suggestedName}
                                  onChange={(e) =>
                                    handleNameChange(
                                      candidate.technicalName,
                                      e.target.value
                                    )
                                  }
                                  disabled={isDisabled}
                                  className="h-7 bg-transparent border-transparent hover:border-border/60 focus:border-primary focus:bg-card text-sm font-medium px-2 transition-colors min-w-[130px]"
                                  aria-label="Stream name"
                                />
                                {isEdited && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Defaults edited — will be applied on
                                      import
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </TableCell>

                            {/* Technical name */}
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {candidate.technicalName}
                            </TableCell>

                            {/* Stream type */}
                            <TableCell>
                              <StreamTypeBadge type={candidate.streamType} />
                            </TableCell>

                            {/* Decoding */}
                            <TableCell>
                              <DecodingCell decoding={effective.suggestedDecoding} />
                            </TableCell>

                            {/* Correlation key */}
                            <TableCell>
                              <CorrelationKeyCell
                                keyType={effective.suggestedCorrelationKeyType}
                                keyName={effective.suggestedCorrelationKeyName}
                              />
                            </TableCell>

                            {/* Status + warnings + edit */}
                            <TableCell className="pr-4">
                              <div className="flex items-center justify-end gap-2 flex-wrap">
                                {/* Binding ambiguous warning */}
                                {candidate.bindingAmbiguous && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] border-amber-500/30 bg-amber-500/10 text-amber-400 gap-1 cursor-default shrink-0"
                                      >
                                        <AlertTriangle size={9} />
                                        Binding ambiguous
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent
                                      className="max-w-[260px] text-center"
                                      side="left"
                                    >
                                      Queue has multiple possible bindings.
                                      Imported stream may need manual
                                      adjustment.
                                    </TooltipContent>
                                  </Tooltip>
                                )}

                                {/* Confidence */}
                                {candidate.suggestionConfidence != null && (
                                  <ConfidenceChip
                                    confidence={candidate.suggestionConfidence}
                                  />
                                )}

                                {/* Status badge */}
                                {candidate.alreadyImported ? (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] border-muted-foreground/20 bg-muted/30 text-muted-foreground shrink-0"
                                  >
                                    Already imported
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shrink-0"
                                  >
                                    Available
                                  </Badge>
                                )}

                                {/* Edit button */}
                                {!isDisabled && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 opacity-0 group-hover/row:opacity-100 transition-opacity text-muted-foreground hover:text-foreground shrink-0"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingKey(
                                            candidate.technicalName
                                          );
                                        }}
                                        aria-label="Edit candidate defaults"
                                      >
                                        <Pencil size={12} />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="left">
                                      Edit defaults before import
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Spacer so content isn't hidden behind fixed footer */}
          {selectedKeys.size > 0 && <div className="h-20" />}
        </div>

        {/* Bulk action footer */}
        {selectedKeys.size > 0 && (
          <div className="fixed bottom-0 left-[280px] right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm shadow-2xl">
            <div className="max-w-7xl mx-auto px-6 md:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CheckSquare size={16} className="text-primary shrink-0" />
                <span className="text-sm font-medium">
                  {selectedKeys.size} stream
                  {selectedKeys.size !== 1 ? "s" : ""} selected
                </span>
                <button
                  onClick={clearSelection}
                  className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
                >
                  Clear
                </button>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Edit-selection shortcut when exactly one row is selected */}
                {selectedKeys.size === 1 && (() => {
                  const key = [...selectedKeys][0];
                  const cand = candidates?.find(
                    (c) => c.technicalName === key
                  );
                  return cand && !cand.alreadyImported ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => setEditingKey(key)}
                    >
                      <Pencil size={13} />
                      Edit selection
                    </Button>
                  ) : null;
                })()}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSelection}
                  disabled={importMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={handleImportClick}
                  disabled={importMutation.isPending}
                >
                  <Download
                    size={14}
                    className={importMutation.isPending ? "animate-bounce" : ""}
                  />
                  {importMutation.isPending
                    ? "Importing…"
                    : `Import ${selectedKeys.size} stream${
                        selectedKeys.size !== 1 ? "s" : ""
                      }`}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit candidate drawer */}
        <CandidateEditDrawer
          open={editingKey !== null}
          candidate={editingCandidate}
          currentOverride={
            editingKey ? overrides[editingKey] : undefined
          }
          onApply={(ov) => {
            if (editingKey) applyOverride(editingKey, ov);
          }}
          onReset={() => {
            if (editingKey) resetOverride(editingKey);
          }}
          onClose={() => setEditingKey(null)}
        />

        {/* Bulk Import Configuration Wizard */}
        <BulkImportWizard
          open={wizardOpen}
          candidates={wizardCandidates}
          connectionName={connection?.name}
          onImport={(dtos) => {
            setWizardOpen(false);
            importMutation.mutate(dtos);
          }}
          onClose={() => setWizardOpen(false)}
        />
      </>
    </TooltipProvider>
  );
}

// ─────────────────────────────────────────────
// CandidateEditDrawer
// ─────────────────────────────────────────────

interface DrawerProps {
  open: boolean;
  candidate: StreamCandidateDto | null;
  currentOverride?: CandidateOverride;
  onApply: (override: CandidateOverride) => void;
  onReset: () => void;
  onClose: () => void;
}

function CandidateEditDrawer({
  open,
  candidate,
  currentOverride,
  onApply,
  onReset,
  onClose,
}: DrawerProps) {
  // Local form state — reset when candidate/override changes
  const [name, setName] = useState("");
  const [formatHint, setFormatHint] = useState<string>("AUTO");
  const [schemaSource, setSchemaSource] = useState<string>("NONE");
  const [corrKeyType, setCorrKeyType] = useState<string>("_none");
  const [corrKeyName, setCorrKeyName] = useState<string>("");

  useEffect(() => {
    if (!candidate) return;
    const effective: StreamCandidateDto = currentOverride
      ? {
          ...candidate,
          suggestedName: currentOverride.suggestedName ?? candidate.suggestedName,
          suggestedCorrelationKeyType:
            currentOverride.suggestedCorrelationKeyType !== undefined
              ? currentOverride.suggestedCorrelationKeyType
              : candidate.suggestedCorrelationKeyType,
          suggestedCorrelationKeyName:
            currentOverride.suggestedCorrelationKeyName !== undefined
              ? currentOverride.suggestedCorrelationKeyName
              : candidate.suggestedCorrelationKeyName,
          suggestedDecoding:
            currentOverride.suggestedDecoding !== undefined
              ? currentOverride.suggestedDecoding
              : candidate.suggestedDecoding,
        }
      : candidate;

    setName(effective.suggestedName ?? "");
    setFormatHint(effective.suggestedDecoding?.formatHint ?? "AUTO");
    setSchemaSource(effective.suggestedDecoding?.schemaSource ?? "NONE");
    setCorrKeyType(effective.suggestedCorrelationKeyType ?? "_none");
    setCorrKeyName(effective.suggestedCorrelationKeyName ?? "");
  }, [candidate, currentOverride, open]);

  function handleApply() {
    onApply({
      suggestedName: name,
      suggestedDecoding: {
        formatHint: (formatHint || "AUTO") as PayloadFormatHint,
        schemaSource: (schemaSource || "NONE") as SchemaSource,
      },
      suggestedCorrelationKeyType:
        corrKeyType === "_none"
          ? null
          : (corrKeyType as CorrelationKeyType),
      suggestedCorrelationKeyName:
        corrKeyType === "_none" ? null : corrKeyName || null,
    });
  }

  if (!candidate) return null;

  const hasOverride = !!currentOverride;

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <SheetContent
        side="right"
        className="sm:max-w-md w-full flex flex-col gap-0 p-0"
      >
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/60">
          <SheetTitle className="text-base">Edit candidate defaults</SheetTitle>
          <SheetDescription className="font-mono text-xs truncate">
            {candidate.technicalName}
          </SheetDescription>
        </SheetHeader>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Stream name */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Stream name
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Orders Topic"
              className="bg-muted/30"
            />
            <p className="text-[11px] text-muted-foreground">
              Used as the display name after import.
            </p>
          </div>

          <Separator />

          {/* Payload decoding */}
          <div className="space-y-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              Payload decoding
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Format hint
              </Label>
              <Select value={formatHint} onValueChange={setFormatHint}>
                <SelectTrigger className="bg-muted/30 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMAT_HINT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Schema source
              </Label>
              <Select value={schemaSource} onValueChange={setSchemaSource}>
                <SelectTrigger className="bg-muted/30 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCHEMA_SOURCE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Correlation key */}
          <div className="space-y-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              Correlation key
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Key type</Label>
              <Select value={corrKeyType} onValueChange={setCorrKeyType}>
                <SelectTrigger className="bg-muted/30 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CORR_KEY_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {corrKeyType !== "_none" && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Key name
                </Label>
                <Input
                  value={corrKeyName}
                  onChange={(e) => setCorrKeyName(e.target.value)}
                  placeholder={
                    corrKeyType === "HEADER" ? "e.g. correlationId" : "e.g. order_id"
                  }
                  className="bg-muted/30 font-mono text-sm"
                />
              </div>
            )}
          </div>

          {/* Read-only: notes from backend */}
          {candidate.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  <Info size={11} />
                  Backend note
                </div>
                <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2.5 border border-border/40">
                  {candidate.notes}
                </p>
              </div>
            </>
          )}

          {/* Read-only: confidence */}
          {candidate.suggestionConfidence != null && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Suggestion confidence
                </div>
                <div className="flex items-center gap-3">
                  <ConfidenceBar confidence={candidate.suggestionConfidence} />
                  <span className="text-sm font-mono">
                    {Math.round(candidate.suggestionConfidence * 100)}%
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  How confident the backend is in these defaults. Low confidence
                  values may need manual review.
                </p>
              </div>
            </>
          )}

          {/* Binding ambiguous warning (full) */}
          {candidate.bindingAmbiguous && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 flex gap-3">
              <AlertTriangle
                size={16}
                className="text-amber-400 shrink-0 mt-0.5"
              />
              <div className="space-y-1">
                <p className="text-xs font-medium text-amber-400">
                  Binding ambiguous
                </p>
                <p className="text-xs text-amber-400/80">
                  Queue has multiple possible bindings. The imported stream may
                  need manual adjustment to the exchange and routing key after
                  import.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border/60 px-6 py-4 flex items-center justify-between gap-3">
          {hasOverride ? (
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground"
              onClick={onReset}
            >
              <RotateCcw size={13} />
              Reset to suggested
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">
              Showing backend suggestions
            </span>
          )}

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleApply}>
              Apply
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─────────────────────────────────────────────
// Small display sub-components
// ─────────────────────────────────────────────

const FORMAT_BADGE_STYLES: Record<string, string> = {
  JSON: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  PROTO: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  AVRO: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  TEXT: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  BINARY: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

const SCHEMA_BADGE_STYLES: Record<string, string> = {
  SCHEMA_REGISTRY: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  FILES: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
};

function DecodingCell({
  decoding,
}: {
  decoding?: { formatHint?: string | null; schemaSource?: string | null } | null;
}) {
  const format = decoding?.formatHint;
  const schema = decoding?.schemaSource;

  if (!format && !schema) {
    return <span className="text-muted-foreground/40 text-xs">—</span>;
  }

  const formatStyle = format ? FORMAT_BADGE_STYLES[format] : null;
  const schemaStyle = schema ? SCHEMA_BADGE_STYLES[schema] : null;

  return (
    <div className="flex flex-wrap gap-1">
      {format && (
        <Badge
          variant="outline"
          className={`text-[10px] font-mono px-1.5 py-0.5 ${
            formatStyle ??
            "bg-muted/30 text-muted-foreground border-border/40"
          }`}
        >
          {format}
        </Badge>
      )}
      {schema && schema !== "NONE" && (
        <Badge
          variant="outline"
          className={`text-[10px] font-mono px-1.5 py-0.5 ${
            schemaStyle ??
            "bg-muted/30 text-muted-foreground border-border/40"
          }`}
        >
          {schema}
        </Badge>
      )}
    </div>
  );
}

function CorrelationKeyCell({
  keyType,
  keyName,
}: {
  keyType?: string | null;
  keyName?: string | null;
}) {
  if (!keyType) {
    return <span className="text-muted-foreground/40 text-xs">—</span>;
  }
  return (
    <div className="space-y-0.5">
      <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
        {keyType}
      </div>
      <div className="text-xs font-mono text-foreground/70">
        {keyName ?? <span className="text-muted-foreground/40">not set</span>}
      </div>
    </div>
  );
}

function ConfidenceChip({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const color =
    confidence >= 0.8
      ? "bg-emerald-400"
      : confidence >= 0.5
      ? "bg-amber-400"
      : "bg-orange-400";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1 cursor-default">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${color}`} />
          <span className="text-[10px] text-muted-foreground font-mono">
            {pct}%
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="left">
        Backend suggestion confidence: {pct}%
      </TooltipContent>
    </Tooltip>
  );
}

function ConfidenceBar({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const color =
    confidence >= 0.8
      ? "bg-emerald-400"
      : confidence >= 0.5
      ? "bg-amber-400"
      : "bg-orange-400";

  return (
    <div className="flex-1 max-w-[120px] h-1.5 bg-muted rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell className="pl-5">
            <Skeleton className="h-4 w-4 rounded" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-36" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-44" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-16 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-20 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-28" />
          </TableCell>
          <TableCell className="pr-4">
            <div className="flex justify-end gap-1.5">
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
