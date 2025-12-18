"use client";

export type UUID = string;
export type DropPolicy = "DROP_OLD";

export type LiveFilters = {
  correlationId: string | null;
  payloadContains: string | null;
};

export type LiveSessionOptions = {
  batchFlushMs: number;
  maxBufferEvents: number;
  dropPolicy: DropPolicy;
  prettyPayload: boolean;
};

export type LiveStreamOptions =
  | { vendor: "POSTGRES"; batchSize: number }
  | { vendor: "KAFKA"; pollTimeoutMs: number; maxRecords: number }
  | { vendor: "RABBIT"; prefetchCount: number };

export type CreateLiveSessionRequest = {
  streamIds: UUID[];
  filters: LiveFilters | null;
  sessionOptions: LiveSessionOptions | null;
  streamOptions: Record<UUID, LiveStreamOptions> | null;
};

export type CreateLiveSessionResponse = {
  sessionId: UUID;
  createdAt: string;
};

export type UpdateLiveSessionRequest = {
  streamIds: UUID[] | null;
  filters: LiveFilters | null;
};

// LIVE payload (decoded)
export type PayloadFormat =
  | "JSON"
  | "AVRO"
  | "PROTO"
  | "TEXT"
  | "BINARY"
  | string;

export type DecodedPayload = {
  payload: string | null;
  payloadPretty: string | null;
  payloadBase64: string | null;
  payloadFormat: PayloadFormat;
};

export type KafkaMetadata = {
  topic: string;
  partition: number;
  offset: number;
  key: string | null;
};
export type RabbitMetadata = {
  queue: string;
  exchange: string | null;
  routingKey: string | null;
  deliveryTag: number;
};
export type PostgresLiveMetadata = {
  schema: string;
  table: string;
  cursorColumn: string;
  cursorValue: any;
};

export type LiveEventDto =
  | {
      streamType: "KAFKA";
      receivedAt: string;
      streamId: UUID;
      correlationId: string | null;
      payload: DecodedPayload;
      metadata: KafkaMetadata;
    }
  | {
      streamType: "RABBIT";
      receivedAt: string;
      streamId: UUID;
      correlationId: string | null;
      payload: DecodedPayload;
      metadata: RabbitMetadata;
    }
  | {
      streamType: "POSTGRES";
      receivedAt: string;
      streamId: UUID;
      correlationId: string | null;
      payload: DecodedPayload;
      metadata: PostgresLiveMetadata;
    };

export type LiveBatchDto = {
  sequence: number;
  droppedSinceLast: number;
  events: LiveEventDto[];
};

const BASE = "/api/live";

async function http<T>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed (${res.status})`);
  }

  // 204
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function createLiveSession(
  req: CreateLiveSessionRequest
): Promise<CreateLiveSessionResponse> {
  return http<CreateLiveSessionResponse>(BASE, {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function updateLiveSession(
  sessionId: UUID,
  req: UpdateLiveSessionRequest
): Promise<void> {
  await http<void>(`${BASE}/${sessionId}`, {
    method: "PATCH",
    body: JSON.stringify(req),
  });
}

export async function deleteLiveSession(sessionId: UUID): Promise<void> {
  await http<void>(`${BASE}/${sessionId}`, { method: "DELETE" });
}

export function liveEventsUrl(sessionId: UUID) {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL;
  return `${base}/api/live/${sessionId}/events`;
}
