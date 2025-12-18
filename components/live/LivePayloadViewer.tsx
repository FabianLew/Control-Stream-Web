"use client";

import { useMemo } from "react";
import type { LiveEventDto } from "@/components/lib/api/live";
import { EventPayloadViewerSheet } from "@/components/viewer/EventPayloadViewerSheet";
import type { ViewerMessage } from "@/types/viewer";

function safeHeadersFromLive(event: LiveEventDto): Record<string, any> {
  // Live nie ma headers w kontrakcie – możemy w headers wkleić metadata + correlationId jako ułatwienie
  return {
    correlationId: event.correlationId ?? null,
    streamType: event.streamType,
    ...event.metadata,
  };
}

export function LivePayloadViewer(props: {
  event: LiveEventDto | null;
  streamName: string | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const viewerMessage: ViewerMessage | null = useMemo(() => {
    const e = props.event;
    if (!e) return null;

    // messageId w live: zależy od vendorów — generujemy stabilny “synthetic id”
    const syntheticId =
      e.streamType === "KAFKA"
        ? `kafka:${e.metadata.topic}:${e.metadata.partition}:${e.metadata.offset}`
        : e.streamType === "RABBIT"
        ? `rabbit:${e.metadata.queue}:${e.metadata.deliveryTag}`
        : `pg:${e.metadata.schema}.${e.metadata.table}:${String(
            e.metadata.cursorValue
          )}`;

    const payload = e.payload.payload ?? "";
    const payloadPretty = e.payload.payloadPretty ?? null;
    const payloadBase64 = e.payload.payloadBase64 ?? "";

    return {
      messageId: syntheticId,
      timestamp: e.receivedAt,
      streamId: e.streamId,
      streamName: props.streamName ?? e.streamId,
      streamType: e.streamType,
      correlationId: e.correlationId ?? null,

      payload,
      payloadPretty,
      payloadBase64,
      payloadFormat: e.payload.payloadFormat ?? "UNKNOWN",

      headers: {},
      replayDisabled: true,
    };
  }, [props.event, props.streamName]);

  return (
    <EventPayloadViewerSheet
      message={viewerMessage}
      isOpen={props.isOpen}
      onClose={props.onClose}
    />
  );
}
