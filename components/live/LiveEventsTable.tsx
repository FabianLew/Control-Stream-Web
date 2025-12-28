"use client";

import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { LiveEventDto } from "@/components/lib/api/live";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/shared/CopyButton";
import { StreamTypeBadge } from "@/components/shared/StreamTypeBadge";
import { isVendor, VENDOR_META } from "@/components/lib/vendors";

function formatPreview(e: LiveEventDto) {
  const raw = e.payload.payloadPretty ?? e.payload.payload ?? "";
  if (e.payload.payloadFormat === "BINARY")
    return e.payload.payloadBase64 ?? "";
  return raw;
}

function formatTime(ts: string) {
  try {
    return new Date(ts).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return ts;
  }
}

/**
 * Stabilny key dla “flash” i react key.
 * Zakłada, że metadata ma unikalne identyfikatory:
 * - Kafka: topic/partition/offset
 * - Rabbit: queue/deliveryTag
 * - Postgres: schema/table/cursorValue
 */
function liveEventKey(e: LiveEventDto) {
  if (isVendor(e.streamType, VENDOR_META.KAFKA)) {
    return `k:${e.streamId}:${e.metadata.topic}:${e.metadata.partition}:${e.metadata.offset}`;
  }
  if (isVendor(e.streamType, VENDOR_META.RABBIT)) {
    return `r:${e.streamId}:${e.metadata.queue}:${e.metadata.deliveryTag}`;
  }
  return `p:${e.streamId}:${e.metadata.schema}.${e.metadata.table}:${String(
    e.metadata.cursorValue
  )}`;
}

export function LiveEventsTable(props: {
  events: LiveEventDto[];
  streamNameById: Map<string, string>;
  onEventClick: (event: LiveEventDto) => void;
}) {
  const { events } = props;

  const FLASH_MS = 900;
  const MAX_FLASH_PER_TICK = 25;

  // które wiersze mają “mignąć”
  const [flashKeys, setFlashKeys] = useState<Set<string>>(() => new Set());

  // poprzedni snapshot keys -> do wykrywania "added since last render"
  const prevKeysRef = useRef<Set<string> | null>(null);

  // keys dla aktualnej listy (stabilne)
  const eventKeys = useMemo(() => events.map(liveEventKey), [events]);

  useEffect(() => {
    if (!events.length) {
      // jak tabela się wyczyści, resetuj snapshot
      prevKeysRef.current = new Set();
      return;
    }

    const currentKeysSet = new Set(eventKeys);

    // pierwszy render: ustaw snapshot, nie flashuj
    if (!prevKeysRef.current) {
      prevKeysRef.current = currentKeysSet;
      return;
    }

    // added = current - prev
    const added: string[] = [];
    for (const k of currentKeysSet) {
      if (!prevKeysRef.current.has(k)) {
        added.push(k);
        if (added.length >= MAX_FLASH_PER_TICK) break;
      }
    }

    // update snapshot na "current" (ważne: po policzeniu diff)
    prevKeysRef.current = currentKeysSet;

    if (added.length === 0) return;

    // dodaj do flash set
    setFlashKeys((prev) => {
      const next = new Set(prev);
      for (const k of added) next.add(k);
      return next;
    });

    // po czasie usuń tylko te dodane w tym ticku
    const timeout = window.setTimeout(() => {
      setFlashKeys((prev) => {
        const next = new Set(prev);
        for (const k of added) next.delete(k);
        return next;
      });
    }, FLASH_MS);

    return () => window.clearTimeout(timeout);
  }, [events.length, eventKeys]);

  return (
    <div className="w-full">
      <div className="w-full rounded-xl border border-border/60 overflow-hidden bg-card">
        {/* header */}
        <div className="grid grid-cols-[240px_160px_220px_1fr_140px] gap-0 px-4 py-2 text-[11px] text-muted-foreground border-b border-border/60 bg-muted/20">
          <div>Stream</div>
          <div>Type</div>
          <div>Correlation ID</div>
          <div>Content Preview</div>
          <div className="text-right">Time</div>
        </div>

        {/* rows */}
        <div className="divide-y divide-border/40">
          {events.map((e, idx) => {
            const key = eventKeys[idx];
            const shouldFlash = flashKeys.has(key);

            const streamName =
              props.streamNameById.get(e.streamId) ?? e.streamId;
            const corr = e.correlationId ?? null;
            const preview = formatPreview(e);

            return (
              <div
                key={key}
                className={[
                  "grid grid-cols-[240px_160px_220px_1fr_140px] px-4 py-3 text-sm cursor-pointer transition-colors",
                  idx % 2 === 0 ? "bg-background/30" : "bg-muted/10",
                  "hover:bg-muted/20",
                  shouldFlash ? "cs-row-flash" : "",
                ].join(" ")}
                onClick={() => props.onEventClick(e)}
              >
                <div className="truncate font-medium">{streamName}</div>

                <div className="flex items-center gap-2">
                  <StreamTypeBadge type={e.streamType} />
                  <Badge
                    variant="secondary"
                    className="font-mono text-[10px] font-normal"
                  >
                    {e.payload.payloadFormat}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 min-w-0">
                  {corr ? (
                    <>
                      <span className="truncate font-mono text-xs text-muted-foreground">
                        {corr}
                      </span>
                      <div
                        onClick={(ev: React.MouseEvent<HTMLDivElement>) =>
                          ev.stopPropagation()
                        }
                        className="inline-flex"
                      >
                        <CopyButton
                          text={corr}
                          label="Correlation ID"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        />
                      </div>
                    </>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>

                <div className="truncate font-mono text-xs text-muted-foreground">
                  {preview}
                </div>

                <div className="text-right text-xs text-muted-foreground">
                  <div className="font-mono text-foreground">
                    {formatTime(e.receivedAt)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
