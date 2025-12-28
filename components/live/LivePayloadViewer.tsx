"use client";

import { useMemo } from "react";
import type { LiveEventDto } from "@/types/live";
import { EventPayloadViewerSheet } from "@/components/viewer/EventPayloadViewerSheet";
import type { ViewerMessage } from "@/types/viewer";
import { isVendor, VENDOR_META } from "@/components/lib/vendors";

type KafkaLiveEvent = Extract<LiveEventDto, { streamType: "KAFKA" }>;
type RabbitLiveEvent = Extract<LiveEventDto, { streamType: "RABBIT" }>;
type PostgresLiveEvent = Extract<LiveEventDto, { streamType: "POSTGRES" }>;

const isKafkaEvent = (e: LiveEventDto): e is KafkaLiveEvent =>
  isVendor(e.streamType, VENDOR_META.KAFKA);
const isRabbitEvent = (e: LiveEventDto): e is RabbitLiveEvent =>
  isVendor(e.streamType, VENDOR_META.RABBIT);
const isPostgresEvent = (e: LiveEventDto): e is PostgresLiveEvent =>
  isVendor(e.streamType, VENDOR_META.POSTGRES);

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
    let syntheticId = `e:${e.streamId}`;
    if (isKafkaEvent(e)) {
      syntheticId = `kafka:${e.metadata.topic}:${e.metadata.partition}:${e.metadata.offset}`;
    } else if (isRabbitEvent(e)) {
      syntheticId = `rabbit:${e.metadata.queue}:${e.metadata.deliveryTag}`;
    } else if (isPostgresEvent(e)) {
      syntheticId = `pg:${e.metadata.schema}.${e.metadata.table}:${String(
        e.metadata.cursorValue
      )}`;
    }

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
