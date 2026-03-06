"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  MinusCircle,
  RotateCcw,
  SkipForward,
} from "lucide-react";

import { StreamTypeBadge } from "@/components/shared/StreamTypeBadge";
import { cn } from "@/components/lib/utils";
import { isVendor, VENDOR_META } from "@/components/lib/vendors";
import {
  toOptionalNumber,
  toOptionalString,
} from "@/lib/streams/form-mappers";
import {
  getDefaultVendorConfig,
  isVendorConfigComplete,
  type CandidateImportStatus,
} from "@/lib/streams/candidate-validator";
import type { ImportStreamCandidateDto } from "@/types/streamCandidate";
import type { StreamType, StreamVendorConfigDto } from "@/types/stream";

// ─── Internal state types ────────────────────────────────────────────────────

interface WizardItem {
  dto: ImportStreamCandidateDto;
  /** Local editable vendor config (may differ from dto.vendorConfig). */
  vendorConfig: StreamVendorConfigDto;
  status: CandidateImportStatus;
}

// ─── Public props ────────────────────────────────────────────────────────────

export interface BulkImportWizardProps {
  open: boolean;
  /** All selected candidates (complete + incomplete). */
  candidates: ImportStreamCandidateDto[];
  connectionName?: string;
  /** Called with the final, validated, non-skipped candidate list. */
  onImport: (candidates: ImportStreamCandidateDto[]) => void;
  onClose: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function initItem(dto: ImportStreamCandidateDto): WizardItem {
  // Use the dto's vendorConfig if present, otherwise fall back to type defaults.
  const vc =
    (dto.vendorConfig as StreamVendorConfigDto | null | undefined) ??
    getDefaultVendorConfig(dto.streamType);
  const complete = isVendorConfigComplete(dto.streamType, vc);
  return {
    dto,
    vendorConfig: vc,
    status: complete ? "ready" : "incomplete",
  };
}

// ─── Main wizard ─────────────────────────────────────────────────────────────

export function BulkImportWizard({
  open,
  candidates,
  connectionName,
  onImport,
  onClose,
}: BulkImportWizardProps) {
  const [items, setItems] = useState<WizardItem[]>(() =>
    candidates.map(initItem)
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  /** Per-field validation errors shown beneath inputs. */
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Re-initialise every time the dialog opens (candidates may have changed).
  useEffect(() => {
    if (open) {
      setItems(candidates.map(initItem));
      setCurrentIdx(0);
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const current = items[currentIdx];

  const readyCount = useMemo(
    () => items.filter((i) => i.status === "ready").length,
    [items]
  );
  const incompleteCount = useMemo(
    () => items.filter((i) => i.status === "incomplete").length,
    [items]
  );
  const skippedCount = useMemo(
    () => items.filter((i) => i.status === "skipped").length,
    [items]
  );

  /** Import is available only when no candidate is still incomplete. */
  const canImport = incompleteCount === 0 && readyCount > 0;

  // ── Mutators ────────────────────────────────────────────────────────────────

  function updateVendorConfig(newVc: StreamVendorConfigDto) {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== currentIdx) return item;
        const complete = isVendorConfigComplete(item.dto.streamType, newVc);
        return {
          ...item,
          vendorConfig: newVc,
          // A skipped item stays skipped; otherwise derive from completeness.
          status:
            item.status === "skipped"
              ? "skipped"
              : complete
              ? "ready"
              : "incomplete",
        };
      })
    );
    setErrors({});
  }

  function toggleSkip() {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== currentIdx) return item;
        if (item.status === "skipped") {
          // Restore → re-evaluate
          const complete = isVendorConfigComplete(
            item.dto.streamType,
            item.vendorConfig
          );
          return { ...item, status: complete ? "ready" : "incomplete" };
        }
        return { ...item, status: "skipped" };
      })
    );
  }

  function goTo(idx: number) {
    setCurrentIdx(idx);
    setErrors({});
  }

  // ── Submit ───────────────────────────────────────────────────────────────────

  function handleImport() {
    const finalDtos = items
      .filter((i) => i.status !== "skipped")
      .map((i) => ({ ...i.dto, vendorConfig: i.vendorConfig }));
    onImport(finalDtos);
  }

  if (!current) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) onClose();
        }}
      >
        {/*
         * We use a plain DialogContent for the Portal/Overlay boilerplate and
         * build our own interior layout inside a flex column div so we can
         * control height precisely without fighting the default grid.
         */}
        <DialogContent
          className="sm:max-w-[940px] p-0 gap-0 overflow-hidden"
          aria-describedby="wizard-description"
        >
          <div className="flex flex-col h-[85vh] max-h-[85vh]">
            {/* ── Header ────────────────────────────────────────────── */}
            <div className="px-6 pt-5 pb-4 border-b border-border/60 flex-none pr-14">
              <div className="flex items-center justify-between gap-3">
                <DialogTitle className="text-base font-semibold leading-none">
                  Complete stream configuration
                </DialogTitle>
                <Badge variant="outline" className="font-mono text-xs shrink-0">
                  {currentIdx + 1} / {items.length}
                </Badge>
              </div>
              <DialogDescription
                id="wizard-description"
                className="sr-only"
              >
                Review and complete vendor configuration for each selected
                stream candidate before importing.
              </DialogDescription>

              {/* Status summary row */}
              <div className="flex items-center gap-4 mt-2 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  {readyCount} ready
                </span>
                {incompleteCount > 0 && (
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    {incompleteCount} needs config
                  </span>
                )}
                {skippedCount > 0 && (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 shrink-0" />
                    {skippedCount} skipped
                  </span>
                )}
                {connectionName && (
                  <span className="ml-auto text-muted-foreground truncate">
                    {connectionName}
                  </span>
                )}
              </div>
            </div>

            {/* ── Body: sidebar + main ───────────────────────────────── */}
            <div className="flex flex-1 min-h-0">
              {/* Sidebar ─────────────────────────────────────────────── */}
              <aside className="w-52 shrink-0 border-r border-border/60 flex flex-col">
                <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium border-b border-border/40">
                  Candidates
                </div>
                <ScrollArea className="flex-1">
                  <div className="py-1">
                    {items.map((item, idx) => (
                      <button
                        key={item.dto.technicalName}
                        onClick={() => goTo(idx)}
                        className={cn(
                          "w-full text-left px-3 py-2.5 flex items-start gap-2.5 hover:bg-muted/40 transition-colors",
                          idx === currentIdx && "bg-muted/60"
                        )}
                      >
                        <StatusDot
                          status={item.status}
                          className="mt-[3px] shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-medium leading-snug">
                            {item.dto.name}
                          </div>
                          <div className="truncate text-[10px] text-muted-foreground font-mono mt-0.5">
                            {item.dto.technicalName}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </aside>

              {/* Main panel ─────────────────────────────────────────── */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                {/* Candidate info card */}
                <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="font-semibold text-base truncate">
                        {current.dto.name}
                      </div>
                      <div className="font-mono text-xs text-muted-foreground mt-0.5 truncate">
                        {current.dto.technicalName}
                      </div>
                      {connectionName && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {connectionName}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                      <StreamTypeBadge type={current.dto.streamType} />
                      <StatusBadge status={current.status} />
                    </div>
                  </div>

                  {(current.dto.correlationKeyType ||
                    current.dto.correlationKeyName) && (
                    <div className="mt-3 pt-3 border-t border-border/40 text-xs text-muted-foreground">
                      Correlation key:{" "}
                      {current.dto.correlationKeyType && (
                        <span className="font-mono text-foreground/70 mr-1">
                          {current.dto.correlationKeyType}
                        </span>
                      )}
                      {current.dto.correlationKeyName && (
                        <span className="font-mono text-foreground/70">
                          · {current.dto.correlationKeyName}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Skipped state or vendor config form */}
                {current.status === "skipped" ? (
                  <div className="rounded-lg border border-border/40 bg-muted/10 flex flex-col items-center justify-center py-12 gap-3">
                    <MinusCircle
                      size={32}
                      className="text-muted-foreground/30"
                    />
                    <p className="text-sm text-muted-foreground text-center max-w-[280px]">
                      This candidate is skipped and will not be imported.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 mt-1"
                      onClick={toggleSkip}
                    >
                      <RotateCcw size={12} />
                      Restore candidate
                    </Button>
                  </div>
                ) : (
                  <VendorConfigSection
                    streamType={current.dto.streamType}
                    value={current.vendorConfig}
                    errors={errors}
                    onChange={updateVendorConfig}
                  />
                )}
              </div>
            </div>

            {/* ── Footer ────────────────────────────────────────────── */}
            <div className="border-t border-border/60 px-6 py-4 flex items-center justify-between gap-3 flex-none">
              {/* Navigation */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goTo(currentIdx - 1)}
                  disabled={currentIdx === 0}
                  className="gap-1"
                >
                  <ChevronLeft size={14} />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goTo(currentIdx + 1)}
                  disabled={currentIdx === items.length - 1}
                  className="gap-1"
                >
                  Next
                  <ChevronRight size={14} />
                </Button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSkip}
                  className={cn(
                    "gap-1.5",
                    current.status === "skipped"
                      ? "text-muted-foreground"
                      : "text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                  )}
                >
                  {current.status === "skipped" ? (
                    <>
                      <RotateCcw size={13} />
                      Restore
                    </>
                  ) : (
                    <>
                      <SkipForward size={13} />
                      Skip this candidate
                    </>
                  )}
                </Button>

                <Tooltip>
                  <TooltipTrigger asChild>
                    {/* span wrapper needed so Tooltip works on disabled buttons */}
                    <span>
                      <Button
                        size="sm"
                        className="gap-2"
                        onClick={handleImport}
                        disabled={!canImport}
                      >
                        Import {readyCount} stream
                        {readyCount !== 1 ? "s" : ""}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!canImport && (
                    <TooltipContent
                      side="top"
                      className="max-w-[240px] text-center"
                    >
                      {readyCount === 0
                        ? "No streams are ready. Complete configuration or skip all candidates."
                        : "Complete or skip all remaining incomplete candidates before importing."}
                    </TooltipContent>
                  )}
                </Tooltip>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}

// ─── VendorConfigSection ─────────────────────────────────────────────────────

interface VendorConfigSectionProps {
  streamType: StreamType;
  value: StreamVendorConfigDto;
  errors: Record<string, string>;
  onChange: (newVc: StreamVendorConfigDto) => void;
}

function VendorConfigSection({
  streamType,
  value,
  errors,
  onChange,
}: VendorConfigSectionProps) {
  const vc = value as any;

  // ── RabbitMQ ──────────────────────────────────────────────────────────────
  if (isVendor(streamType, VENDOR_META.RABBIT)) {
    return (
      <div className="space-y-5">
        <SectionLabel>RabbitMQ Configuration</SectionLabel>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldGroup label="Exchange" required error={errors.exchange}>
            <Input
              value={vc.exchange ?? ""}
              onChange={(e) =>
                onChange({
                  ...vc,
                  vendor: "RABBIT",
                  exchange: e.target.value,
                } as StreamVendorConfigDto)
              }
              placeholder="e.g. orders.exchange"
              className="font-mono text-sm bg-muted/30"
            />
          </FieldGroup>

          <FieldGroup label="Routing Key" required error={errors.routingKey}>
            <Input
              value={vc.routingKey ?? ""}
              onChange={(e) =>
                onChange({
                  ...vc,
                  vendor: "RABBIT",
                  routingKey: e.target.value,
                } as StreamVendorConfigDto)
              }
              placeholder="e.g. orders.*"
              className="font-mono text-sm bg-muted/30"
            />
          </FieldGroup>
        </div>

        <Separator />
        <SectionLabel>Optional settings</SectionLabel>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldGroup label="Prefetch Count" hint="optional">
            <Input
              type="number"
              min={1}
              value={vc.prefetchCount == null ? "" : String(vc.prefetchCount)}
              onChange={(e) =>
                onChange({
                  ...vc,
                  vendor: "RABBIT",
                  prefetchCount: toOptionalNumber(e.target.value),
                } as StreamVendorConfigDto)
              }
              placeholder="e.g. 50"
              className="font-mono text-sm bg-muted/30"
            />
          </FieldGroup>

          <FieldGroup
            label="Shadow Queue Name"
            hint="auto-provisioned if empty"
          >
            <Input
              value={vc.shadowQueueName ?? ""}
              onChange={(e) =>
                onChange({
                  ...vc,
                  vendor: "RABBIT",
                  shadowQueueName: toOptionalString(e.target.value),
                } as StreamVendorConfigDto)
              }
              placeholder="leave empty"
              className="font-mono text-sm bg-muted/30"
            />
          </FieldGroup>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldGroup label="Search Shadow TTL (ms)" hint="optional">
            <Input
              type="number"
              min={1}
              value={
                vc.searchShadowTtlMs == null
                  ? ""
                  : String(vc.searchShadowTtlMs)
              }
              onChange={(e) =>
                onChange({
                  ...vc,
                  vendor: "RABBIT",
                  searchShadowTtlMs: toOptionalNumber(e.target.value),
                } as StreamVendorConfigDto)
              }
              placeholder="e.g. 86400000"
              className="font-mono text-sm bg-muted/30"
            />
          </FieldGroup>

          <FieldGroup label="Search Shadow Max Length" hint="optional">
            <Input
              type="number"
              min={1}
              value={
                vc.searchShadowMaxLength == null
                  ? ""
                  : String(vc.searchShadowMaxLength)
              }
              onChange={(e) =>
                onChange({
                  ...vc,
                  vendor: "RABBIT",
                  searchShadowMaxLength: toOptionalNumber(e.target.value),
                } as StreamVendorConfigDto)
              }
              placeholder="e.g. 100000"
              className="font-mono text-sm bg-muted/30"
            />
          </FieldGroup>
        </div>
      </div>
    );
  }

  // ── PostgreSQL ────────────────────────────────────────────────────────────
  if (isVendor(streamType, VENDOR_META.POSTGRES)) {
    return (
      <div className="space-y-5">
        <SectionLabel>PostgreSQL Configuration</SectionLabel>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldGroup label="Schema" required error={errors.schema}>
            <Input
              value={vc.schema ?? ""}
              onChange={(e) =>
                onChange({
                  ...vc,
                  vendor: "POSTGRES",
                  schema: e.target.value,
                } as StreamVendorConfigDto)
              }
              placeholder="public"
              className="font-mono text-sm bg-muted/30"
            />
          </FieldGroup>

          <FieldGroup label="Time Column" required error={errors.timeColumn}>
            <Input
              value={vc.timeColumn ?? ""}
              onChange={(e) =>
                onChange({
                  ...vc,
                  vendor: "POSTGRES",
                  timeColumn: e.target.value,
                } as StreamVendorConfigDto)
              }
              placeholder="created_at"
              className="font-mono text-sm bg-muted/30"
            />
          </FieldGroup>
        </div>
      </div>
    );
  }

  // ── Kafka ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <SectionLabel>Kafka Configuration</SectionLabel>

      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 flex items-start gap-2.5">
        <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
        <p className="text-xs text-emerald-400">
          Kafka streams require minimal configuration and are ready to import.
          The consumer group ID is optional.
        </p>
      </div>

      <FieldGroup
        label="Consumer Group ID"
        hint="optional — leave empty for default"
      >
        <Input
          value={vc.consumerGroupId ?? ""}
          onChange={(e) =>
            onChange({
              ...vc,
              vendor: "KAFKA",
              consumerGroupId: toOptionalString(e.target.value),
            } as StreamVendorConfigDto)
          }
          placeholder="e.g. controlstream-consumer"
          className="font-mono text-sm bg-muted/30"
        />
      </FieldGroup>
    </div>
  );
}

// ─── Reusable small components ───────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
      {children}
    </p>
  );
}

interface FieldGroupProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

function FieldGroup({
  label,
  required,
  hint,
  error,
  children,
}: FieldGroupProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        {required && (
          <Badge
            variant="secondary"
            className="text-[9px] h-[15px] px-1.5 font-normal"
          >
            Required
          </Badge>
        )}
        {!required && hint && (
          <span className="text-[10px] text-muted-foreground/50">{hint}</span>
        )}
      </div>
      {children}
      {error && <p className="text-destructive text-[11px]">{error}</p>}
    </div>
  );
}

function StatusDot({
  status,
  className,
}: {
  status: CandidateImportStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block w-2 h-2 rounded-full shrink-0",
        status === "ready" && "bg-emerald-400",
        status === "incomplete" && "bg-amber-400",
        status === "skipped" && "bg-muted-foreground/30",
        className
      )}
    />
  );
}

function StatusBadge({ status }: { status: CandidateImportStatus }) {
  if (status === "ready") {
    return (
      <Badge
        variant="outline"
        className="text-[10px] border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
      >
        Ready
      </Badge>
    );
  }
  if (status === "incomplete") {
    return (
      <Badge
        variant="outline"
        className="text-[10px] border-amber-500/30 bg-amber-500/10 text-amber-400 gap-1"
      >
        <AlertTriangle size={9} />
        Needs config
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="text-[10px] text-muted-foreground border-muted-foreground/20"
    >
      Skipped
    </Badge>
  );
}
