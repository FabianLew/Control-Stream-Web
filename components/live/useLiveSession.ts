"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type {
  CreateLiveSessionRequest,
  LiveBatchDto,
  LiveEventDto,
  UpdateLiveSessionRequest,
  UUID,
} from "@/types/live";
import {
  createLiveSession,
  deleteLiveSession,
  liveEventsUrl,
  updateLiveSession,
} from "@/lib/api/live";

type LiveStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

type LiveState = {
  status: LiveStatus;
  sessionId: UUID | null;
  lastError: string | null;

  sequence: number | null;
  droppedTotal: number;
  events: LiveEventDto[];
};

function pushRingBuffer(
  current: LiveEventDto[],
  incoming: LiveEventDto[],
  limit: number
) {
  if (limit <= 0) return [];
  const merged = incoming.length ? incoming.concat(current) : current.slice();
  if (merged.length <= limit) return merged;
  return merged.slice(0, limit); // bo newest na początku
}

export function useLiveSession({
  clientLimit = 2000,
}: {
  clientLimit?: number;
} = {}) {
  const [state, setState] = useState<LiveState>({
    status: "idle",
    sessionId: null,
    lastError: null,
    sequence: null,
    droppedTotal: 0,
    events: [],
  });

  // --- SINGLE SOURCE OF TRUTH FOR SSE ---
  const esRef = useRef<EventSource | null>(null);

  // guards to avoid opening multiple SSE connections
  const connectingRef = useRef(false);
  const currentSessionIdRef = useRef<UUID | null>(null);

  // "we requested close" flag so we can ignore onerror during our own close()
  const requestedCloseRef = useRef(false);

  const closeSse = useCallback(() => {
    requestedCloseRef.current = true;

    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    connectingRef.current = false;
    currentSessionIdRef.current = null;
  }, []);

  const connectSse = useCallback(
    (sessionId: UUID) => {
      if (!sessionId) return;

      // ✅ already connected/connecting to the same session -> do nothing
      if (
        esRef.current &&
        currentSessionIdRef.current === sessionId &&
        (state.status === "connected" || state.status === "connecting")
      ) {
        return;
      }

      // ✅ connection in flight -> do nothing
      if (connectingRef.current) return;

      // always close previous connection first
      closeSse();

      requestedCloseRef.current = false;
      connectingRef.current = true;
      currentSessionIdRef.current = sessionId;

      setState((s) => ({
        ...s,
        status: "connecting",
        lastError: null,
      }));

      const es = new EventSource(liveEventsUrl(sessionId));
      esRef.current = es;

      es.addEventListener("live-connected", (e: MessageEvent) => {
        const id = String(e.data || sessionId) as UUID;

        // if this callback is from stale EventSource - ignore
        if (esRef.current !== es) return;

        connectingRef.current = false;

        setState((s) => ({
          ...s,
          status: "connected",
          sessionId: id,
          lastError: null,
        }));
      });

      es.addEventListener("live-batch", (e: MessageEvent) => {
        // if this callback is from stale EventSource - ignore
        if (esRef.current !== es) return;

        try {
          const batch = JSON.parse(e.data) as LiveBatchDto;

          setState((s) => ({
            ...s,
            status: "connected",
            sequence: batch.sequence,
            droppedTotal: s.droppedTotal + (batch.droppedSinceLast || 0),
            events: pushRingBuffer(s.events, batch.events ?? [], clientLimit),
          }));
        } catch {
          setState((s) => ({
            ...s,
            status: "error",
            lastError: "Failed to parse live-batch payload",
          }));
        }
      });

      es.addEventListener("live-stream-error", (event) => {
        // if this callback is from stale EventSource - ignore
        if (esRef.current !== es) return;

        try {
          const data = JSON.parse((event as MessageEvent).data) as {
            streamId: string;
            code: string;
            message: string;
          };

          toast.error("Some live streams failed: " + data.message, {
            duration: 1500,
          });
        } catch {
          toast.error("Some live streams failed", { duration: 1500 });
        }
      });

      es.onerror = () => {
        // if we closed intentionally - ignore
        if (requestedCloseRef.current) return;

        // if this callback is from stale EventSource - ignore
        if (esRef.current !== es) return;

        connectingRef.current = false;

        // IMPORTANT: stop EventSource internal reconnect loop
        es.close();
        esRef.current = null;

        setState((s) => ({
          ...s,
          status: "disconnected",
        }));
      };
    },
    [clientLimit, closeSse, state.status]
  );

  const create = useCallback(
    async (req: CreateLiveSessionRequest) => {
      try {
        setState((s) => ({ ...s, status: "connecting", lastError: null }));
        const res = await createLiveSession(req);

        setState((s) => ({
          ...s,
          sessionId: res.sessionId,
          events: [],
          droppedTotal: 0,
          sequence: null,
        }));

        connectSse(res.sessionId);
        toast.success("Live session created");
        return res.sessionId;
      } catch (e: any) {
        const msg = e?.message || "Failed to create live session";
        setState((s) => ({ ...s, status: "error", lastError: msg }));
        toast.error("Create failed", { description: msg });
        throw e;
      }
    },
    [connectSse]
  );

  const update = useCallback(
    async (sessionId: UUID, req: UpdateLiveSessionRequest) => {
      try {
        await updateLiveSession(sessionId, req);
        toast.success("Live session updated");
      } catch (e: any) {
        const msg = e?.message || "Failed to update live session";
        toast.error("Update failed", { description: msg });
        throw e;
      }
    },
    []
  );

  const remove = useCallback(
    async (sessionId: UUID) => {
      try {
        closeSse();
        await deleteLiveSession(sessionId);

        setState({
          status: "idle",
          sessionId: null,
          lastError: null,
          sequence: null,
          droppedTotal: 0,
          events: [],
        });

        toast.success("Live session deleted");
      } catch (e: any) {
        const msg = e?.message || "Failed to delete live session";
        toast.error("Delete failed", { description: msg });
        throw e;
      }
    },
    [closeSse]
  );

  const reconnect = useCallback(() => {
    if (!state.sessionId) return;
    connectSse(state.sessionId);
    toast.message("Reconnecting…");
  }, [connectSse, state.sessionId]);

  const clear = useCallback(() => {
    setState((s) => ({
      ...s,
      events: [],
      droppedTotal: 0,
      sequence: s.sequence,
    }));
  }, []);

  // cleanup on unmount
  useEffect(() => () => closeSse(), [closeSse]);

  return useMemo(
    () => ({
      ...state,
      create,
      update,
      remove,
      reconnect,
      clear,
    }),
    [state, create, update, remove, reconnect, clear]
  );
}
