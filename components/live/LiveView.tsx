"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LiveEventDto, UUID } from "@/components/lib/api/live";
import { useLiveSession } from "@/components/live/useLiveSession";
import { useLiveStreams } from "@/components/live/useLiveStreams";

import { LiveHeader } from "@/components/live/LiveHeader";
import { LiveStatsLine } from "@/components/live/LiveStatsLine";
import { LiveEventsTable } from "@/components/live/LiveEventsTable";
import { LivePayloadViewer } from "@/components/live/LivePayloadViewer";

import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

export type LiveFiltersState = {
  correlationId: string; // UI-only
  payloadContains: string; // UI-only
  streamIds: UUID[]; // server-relevant (session streams)
};

const DEFAULT_FILTERS: LiveFiltersState = {
  correlationId: "",
  payloadContains: "",
  streamIds: [],
};

function eventText(e: LiveEventDto): string {
  return (
    e.payload.payloadPretty ??
    e.payload.payload ??
    e.payload.payloadBase64 ??
    ""
  );
}

export function LiveView() {
  const live = useLiveSession({ clientLimit: 2000 });

  const {
    data: streams = [],
    isLoading: streamsLoading,
    isError: streamsError,
  } = useLiveStreams();

  const streamNameById = useMemo(() => {
    const map = new Map<string, string>();
    (streams ?? []).forEach((s: any) => map.set(s.id, s.name));
    return map;
  }, [streams]);

  const [filters, setFilters] = useState<LiveFiltersState>(DEFAULT_FILTERS);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // UX extras
  const [followTail, setFollowTail] = useState(true);
  const [paused, setPaused] = useState(false);

  const [selectedEvent, setSelectedEvent] = useState<LiveEventDto | null>(null);

  // "frozen" view: gdy paused -> nie nadpisuj listy w UI
  const [frozenEvents, setFrozenEvents] = useState<LiveEventDto[]>([]);
  const wasPausedRef = useRef(false);

  // Effective streams: [] => ALL
  const effectiveStreamIds: UUID[] = useMemo(() => {
    if (filters.streamIds.length > 0) return filters.streamIds;
    return (streams ?? []).map((s: any) => s.id as UUID);
  }, [filters.streamIds, streams]);

  const canStart = effectiveStreamIds.length > 0;

  // SESSION: create bez backend filters
  const start = async () => {
    if (!canStart) return;

    await live.create({
      streamIds: effectiveStreamIds,
      filters: null, // ✅ frontend filtering
      sessionOptions: {
        batchFlushMs: 250,
        maxBufferEvents: 10000,
        dropPolicy: "DROP_OLD",
        prettyPayload: true,
      },
      streamOptions: null,
    });
  };

  const stop = async () => {
    if (!live.sessionId) return;
    await live.remove(live.sessionId);
  };

  const reconnect = async () => {
    await live.reconnect();
  };

  // Update tylko stream selection (bez filters)
  const applyUpdate = async () => {
    if (!live.sessionId) return;

    await live.update(live.sessionId, {
      streamIds: effectiveStreamIds,
      filters: null, // ✅ frontend filtering
    });
  };

  // PAUSE: zamrażamy listę na wejściu w paused, a na wyjściu doganiamy
  useEffect(() => {
    if (paused && !wasPausedRef.current) {
      wasPausedRef.current = true;
      setFrozenEvents(live.events);
      return;
    }

    if (!paused && wasPausedRef.current) {
      wasPausedRef.current = false;
      setFrozenEvents([]);
    }
  }, [paused, live.events]);

  // UI source events: paused => frozen snapshot, else live
  const baseEvents = paused ? frozenEvents : live.events;

  // FRONTEND FILTERING (correlationId + payloadContains)
  const visibleEvents = useMemo(() => {
    const corr = filters.correlationId.trim();
    const needle = filters.payloadContains.trim().toLowerCase();

    if (!corr && !needle) return baseEvents;

    return baseEvents.filter((e) => {
      if (corr && (e.correlationId ?? "") !== corr) return false;
      if (needle && !eventText(e).toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [baseEvents, filters.correlationId, filters.payloadContains]);

  // Follow tail:
  // - mamy newest-first => scrollTop = 0
  useEffect(() => {
    if (!followTail || paused) return;

    const el = document.getElementById("cs-live-scroll-area");
    if (!el) return;

    // newest-first
    el.scrollTop = 0;
  }, [visibleEvents.length, followTail, paused]);

  const status = live.status;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full max-w-[100vw] overflow-hidden bg-background">
      {/* HEADER (Search-like) */}
      <LiveHeader
        filters={filters}
        onFiltersChange={setFilters}
        streams={streams}
        streamsLoading={streamsLoading}
        streamsError={streamsError}
        isAdvancedOpen={isAdvancedOpen}
        isAdvancedEnabled={false}
        onAdvancedOpenChange={setIsAdvancedOpen}
        status={status}
        sessionId={live.sessionId}
        onStart={start}
        onStop={stop}
        onReconnect={reconnect}
        onApplyUpdate={applyUpdate}
        canStart={canStart}
        followTail={followTail}
        onFollowTailChange={setFollowTail}
        paused={paused}
        onPausedChange={setPaused}
      />

      {/* RESULTS AREA (Search-like) */}
      <div className="flex-1 min-h-0 min-w-0 w-full overflow-hidden relative bg-background/50 flex flex-col">
        <LiveStatsLine
          status={status}
          buffered={live.events.length}
          bufferLimit={2000}
          dropped={live.droppedTotal}
          sessionId={live.sessionId}
        />

        {visibleEvents.length > 0 ? (
          <div className="flex-1 min-h-0 min-w-0 w-full relative">
            <div
              id="cs-live-scroll-area"
              className="h-full w-full overflow-y-auto px-4 md:px-6 pb-4"
            >
              <LiveEventsTable
                events={visibleEvents}
                streamNameById={streamNameById}
                onEventClick={setSelectedEvent}
              />
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4 opacity-70">
            <Activity size={48} className="opacity-20" />
            <p>No live events yet. Start a session or adjust filters.</p>
            <div className="flex items-center gap-2">
              <Button onClick={start} disabled={!canStart}>
                Start
              </Button>
              {status === "disconnected" ? (
                <Button variant="secondary" onClick={reconnect}>
                  Reconnect
                </Button>
              ) : null}
            </div>
          </div>
        )}
      </div>

      <LivePayloadViewer
        event={selectedEvent}
        streamName={
          selectedEvent
            ? streamNameById.get(selectedEvent.streamId) ?? null
            : null
        }
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
