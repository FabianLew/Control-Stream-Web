"use client";

import type { SearchMessageRow } from "@/types";
import { useMemo } from "react";
import { EventPayloadViewerSheet } from "@/components/viewer/EventPayloadViewerSheet";
import type { ViewerMessage } from "@/types/viewer";

function safeParseHeaders(
  headers: SearchMessageRow["headers"] | undefined | null
): Record<string, any> {
  if (!headers) return {};
  if (typeof headers === "object") return headers as Record<string, any>;
  try {
    const parsed = JSON.parse(headers);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return { __raw: headers };
  }
}

export function PayloadViewer(props: {
  message: SearchMessageRow | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const viewerMessage: ViewerMessage | null = useMemo(() => {
    const m = props.message;
    if (!m) return null;

    return {
      messageId: m.messageId ?? "",
      timestamp: m.timestamp ?? "",
      streamId: m.streamId ?? "",
      streamName: m.streamName ?? "",
      streamType: m.streamType ?? "UNKNOWN",
      correlationId: m.correlationId ?? null,

      payload: m.payload ?? "",
      payloadPretty: m.payloadPretty ?? null,
      payloadBase64: m.payloadBase64 ?? "",
      payloadFormat: m.payloadFormat ?? "UNKNOWN",

      headers: safeParseHeaders(m.headers),
      replayDisabled: true,
    };
  }, [props.message]);

  return (
    <EventPayloadViewerSheet
      message={viewerMessage}
      isOpen={props.isOpen}
      onClose={props.onClose}
    />
  );
}
