export type LiveStreamVendor = "KAFKA" | "RABBIT" | "POSTGRES";
export type UUID = string;

export type LiveStreamRef = {
  id: UUID;
  name: string;
  type: LiveStreamVendor;
  technicalName?: string;
};

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
  cursorValue: unknown;
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
