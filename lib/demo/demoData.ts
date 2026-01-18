// lib/demo/demoData.ts
import type {
  ConnectionDto,
  ConnectionOverviewDto,
  ConnectionStreamOverviewDto,
  ConnectionTestResultDto,
} from "@/types/connection";
import type { UnifiedStreamDto, StreamOverviewDto } from "@/types/stream";
import type { PayloadDecodingConfigDto } from "@/types/decoding";
import type {
  CreateLiveSessionRequest,
  CreateLiveSessionResponse,
  LiveBatchDto,
  LiveEventDto,
  DecodedPayload,
  PayloadFormat,
} from "@/types/live";
import type { SearchResult, SearchMessageRow } from "@/types";
import type {
  SchemaBundleDto,
  SchemaBundleDetailsDto,
} from "@/types/schema-bundle";
function nowIso() {
  return new Date().toISOString();
}

function isoMinutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function uuid(seed: string) {
  // deterministyczny "UUID-like" do demo (wystarczy do UI)
  return `${seed.padEnd(8, "0")}-demo-4000-8000-${seed
    .padEnd(12, "0")
    .slice(0, 12)}`;
}

const decodingNone: PayloadDecodingConfigDto = {
  schemaSource: "NONE",
  formatHint: "AUTO",
};

const decodingSchemaRegistry: PayloadDecodingConfigDto = {
  schemaSource: "SCHEMA_REGISTRY",
  formatHint: "AVRO",
  schemaRegistry: {
    url: "https://schema-registry.demo.controlstream",
    authType: "BASIC",
    username: "demo",
    password: "demo",
  },
};

const decodingFilesProto: PayloadDecodingConfigDto = {
  schemaSource: "FILES",
  formatHint: "PROTO",
  protoFiles: {
    bundleId: uuid("bundle-proto"),
    fileGlob: "**/*.proto",
    fixedMessageFullName: "demo.OrderCreated",
  },
};

export const demoConnections: ConnectionDto[] = [
  {
    id: uuid("conn-kafka"),
    name: "Demo Kafka Cluster",
    type: "KAFKA",
    config: {
      vendor: "KAFKA",
      host: "kafka.demo.local",
      port: 9092,
      bootstrapServers: "kafka.demo.local:9092",
      securityProtocol: "SASL_SSL",
      saslMechanism: "PLAIN",
      saslJaasConfig:
        "org.apache.kafka.common.security.plain.PlainLoginModule required username='demo' password='demo';",
      extra: { "client.id": "controlstream-demo" },
    },
    createdAt: isoMinutesAgo(60 * 24),
    updatedAt: isoMinutesAgo(10),
  },
  {
    id: uuid("conn-rabbit"),
    name: "Demo RabbitMQ",
    type: "RABBIT",
    config: {
      vendor: "RABBIT",
      host: "rabbit.demo.local",
      port: 5672,
      username: "demo",
      password: null,
      virtualHost: "/",
    },
    createdAt: isoMinutesAgo(60 * 24),
    updatedAt: isoMinutesAgo(20),
  },
  {
    id: uuid("conn-pg"),
    name: "Demo Postgres",
    type: "POSTGRES",
    config: {
      vendor: "POSTGRES",
      host: "postgres.demo.local",
      port: 5432,
      jdbcUrl: "jdbc:postgresql://postgres.demo.local:5432/controlstream",
      username: "demo",
      password: null,
    },
    createdAt: isoMinutesAgo(60 * 24),
    updatedAt: isoMinutesAgo(30),
  },
];

export const demoConnectionsOverview: ConnectionOverviewDto[] = [
  {
    id: demoConnections[0].id,
    name: demoConnections[0].name,
    type: demoConnections[0].type,
    host: demoConnections[0].config.host,
    port: demoConnections[0].config.port,
    status: "ONLINE",
    lastCheckedAt: isoMinutesAgo(2),
    lastErrorMessage: null,
  },
  {
    id: demoConnections[1].id,
    name: demoConnections[1].name,
    type: demoConnections[1].type,
    host: demoConnections[1].config.host,
    port: demoConnections[1].config.port,
    status: "ONLINE",
    lastCheckedAt: isoMinutesAgo(3),
    lastErrorMessage: null,
  },
  {
    id: demoConnections[2].id,
    name: demoConnections[2].name,
    type: demoConnections[2].type,
    host: demoConnections[2].config.host,
    port: demoConnections[2].config.port,
    status: "UNKNOWN",
    lastCheckedAt: isoMinutesAgo(8),
    lastErrorMessage: null,
  },
];

export const demoStreams: UnifiedStreamDto[] = [
  {
    id: uuid("stream-kafka-orders"),
    name: "Orders (Kafka)",
    type: "KAFKA",
    connectionId: demoConnections[0].id,
    connectionName: demoConnections[0].name,
    technicalName: "orders.v1",
    correlationKeyType: "HEADER",
    correlationKeyName: "x-correlation-id",
    vendorConfig: {
      vendor: "KAFKA",
      topic: "orders.v1",
      consumerGroupId: "controlstream-demo",
      correlationHeader: "x-correlation-id",
    },
    decoding: decodingSchemaRegistry,
    createdAt: isoMinutesAgo(60 * 3),
    updatedAt: isoMinutesAgo(25),
  },
  {
    id: uuid("stream-rabbit-payments"),
    name: "Payments (Rabbit)",
    type: "RABBIT",
    connectionId: demoConnections[1].id,
    connectionName: demoConnections[1].name,
    technicalName: "payments.queue",
    correlationKeyType: "HEADER",
    correlationKeyName: "x-correlation-id",
    vendorConfig: {
      vendor: "RABBIT",
      exchange: "payments.exchange",
      routingKey: "payments.created",
      prefetchCount: 100,
      shadowQueueName: "payments.shadow",
      correlationHeader: "x-correlation-id",
    },
    decoding: decodingNone,
    createdAt: isoMinutesAgo(60 * 6),
    updatedAt: isoMinutesAgo(40),
  },
  {
    id: uuid("stream-pg-outbox"),
    name: "Outbox (Postgres)",
    type: "POSTGRES",
    connectionId: demoConnections[2].id,
    connectionName: demoConnections[2].name,
    technicalName: "public.outbox_events",
    correlationKeyType: "COLUMN",
    correlationKeyName: "correlation_id",
    vendorConfig: {
      vendor: "POSTGRES",
      schema: "public",
      table: "outbox_events",
      correlationColumn: "correlation_id",
      timeColumn: "created_at",
    },
    decoding: decodingFilesProto,
    createdAt: isoMinutesAgo(60 * 8),
    updatedAt: isoMinutesAgo(50),
  },
];

export const demoStreamOverviewById: Record<string, StreamOverviewDto> =
  Object.fromEntries(
    demoStreams.map((stream) => {
      const connection = demoConnections.find(
        (c) => c.id === stream.connectionId,
      )!;
      const overview: StreamOverviewDto = {
        id: stream.id,
        name: stream.name,
        type: stream.type,
        technicalName: stream.technicalName,
        vendorConfig: stream.vendorConfig,
        decoding: stream.decoding,
        connectionId: connection.id,
        connectionName: connection.name,
        connectionType: connection.type,
        connectionConfig: connection.config,
      };
      return [stream.id, overview];
    }),
  );

export const demoConnectionStreamsByConnectionId: Record<
  string,
  ConnectionStreamOverviewDto[]
> = Object.fromEntries(
  demoConnections.map((c) => [
    c.id,
    demoStreams
      .filter((s) => s.connectionId === c.id)
      .map((s) => ({
        id: s.id,
        name: s.name,
        type: s.type,
        technicalName: s.technicalName,
        createdAt: s.createdAt,
      })),
  ]),
);

export function demoTestConnection(id: string): ConnectionTestResultDto {
  const overview = demoConnectionsOverview.find((x) => x.id === id);
  return {
    id,
    status: overview?.status ?? "UNKNOWN",
    checkedAt: nowIso(),
    message:
      overview?.status === "ONLINE"
        ? "Connection OK (demo)"
        : "Connection check skipped (demo)",
  };
}

// ---- Search demo ----

function base64Of(text: string) {
  return Buffer.from(text, "utf8").toString("base64");
}

function makePayload(format: PayloadFormat, obj: unknown): DecodedPayload {
  if (format === "BINARY") {
    const raw = "01020304DEMO";
    return {
      payload: null,
      payloadPretty: null,
      payloadBase64: base64Of(raw),
      payloadFormat: "BINARY",
    };
  }
  if (format === "TEXT") {
    const raw = String(obj);
    return {
      payload: raw,
      payloadPretty: null,
      payloadBase64: base64Of(raw),
      payloadFormat: "TEXT",
    };
  }
  // JSON/AVRO/PROTO -> udajemy JSON pretty w payloadPretty
  const json = typeof obj === "string" ? obj : JSON.stringify(obj);
  const pretty = typeof obj === "string" ? obj : JSON.stringify(obj, null, 2);
  return {
    payload: json,
    payloadPretty: pretty,
    payloadBase64: base64Of(json),
    payloadFormat: format,
  };
}

function chooseFormat(streamId: string): PayloadFormat {
  if (streamId.includes("kafka")) return "AVRO";
  if (streamId.includes("rabbit")) return "JSON";
  if (streamId.includes("pg")) return "PROTO";
  return "TEXT";
}

export function demoSearch(params: URLSearchParams): SearchResult {
  const correlationId =
    params.get("correlationId") ?? params.get("queryCorrelationId") ?? "";
  const payloadContains =
    params.get("payloadContains") ??
    params.get("contentContains") ??
    params.get("content") ??
    "";

  const streamIds = params.getAll("streamIds");
  const streamTypes = params.getAll("streamTypes");

  const page = Number(params.get("page") ?? "0");
  const size = Number(params.get("size") ?? params.get("limit") ?? "50");

  const filteredStreams = demoStreams.filter((s) => {
    if (streamIds.length > 0 && !streamIds.includes(s.id)) return false;
    if (streamTypes.length > 0 && !streamTypes.includes(s.type)) return false;
    return true;
  });

  const totalPool = 240; // demo "duża baza"
  const all: SearchMessageRow[] = [];
  for (let i = 0; i < totalPool; i++) {
    const stream =
      filteredStreams[i % filteredStreams.length] ??
      demoStreams[i % demoStreams.length];
    const fmt = chooseFormat(stream.id);
    const cid = correlationId
      ? correlationId
      : i % 4 === 0
        ? null
        : `corr-${(i % 25).toString().padStart(2, "0")}`;
    const payloadObject = {
      eventType:
        stream.type === "KAFKA"
          ? "OrderCreated"
          : stream.type === "RABBIT"
            ? "PaymentCaptured"
            : "OutboxEvent",
      id: `evt-${i.toString().padStart(6, "0")}`,
      correlationId: cid,
      ts: isoMinutesAgo(i),
      demo: true,
    };

    const decoded = makePayload(fmt, payloadObject);

    const row: SearchMessageRow = {
      streamId: stream.id,
      streamName: stream.name,
      streamType: stream.type,
      messageId: `msg-${i.toString().padStart(6, "0")}`,
      correlationId: cid,
      timestamp: isoMinutesAgo(i),
      headers: {
        "x-correlation-id": cid ?? "",
        "x-demo": "true",
      },
      payloadFormat: decoded.payloadFormat as any,
      payloadPretty: decoded.payloadPretty ?? null,
      payloadBase64: decoded.payloadBase64 ?? base64Of(""),
      payload: decoded.payload ?? "",
      errorMessage: undefined,
    };

    // filtr payloadContains (na payload/payloadPretty)
    if (payloadContains) {
      const haystack = `${row.payload} ${
        row.payloadPretty ?? ""
      }`.toLowerCase();
      if (!haystack.includes(payloadContains.toLowerCase())) continue;
    }

    // filtr correlationId
    if (correlationId && row.correlationId !== correlationId) continue;

    all.push(row);
  }

  const totalFound = all.length;
  const start = page * size;
  const messages = all.slice(start, start + size);

  return {
    queryCorrelationId: correlationId,
    totalFound,
    executionTimeMs: 12 + Math.floor(Math.random() * 20),
    messages,
  };
}

// ---- Live demo ----

export function demoCreateLiveSession(
  _req: CreateLiveSessionRequest,
): CreateLiveSessionResponse {
  return {
    sessionId: uuid(`live-${Math.random().toString(16).slice(2, 10)}`),
    createdAt: nowIso(),
  };
}

export function demoLiveBatches(
  sessionId: string,
  count: number,
): LiveBatchDto[] {
  const batches: LiveBatchDto[] = [];
  let sequence = 1;
  for (let b = 0; b < count; b++) {
    const events: LiveEventDto[] = [];
    const streams = demoStreams;
    for (let i = 0; i < 4; i++) {
      const stream = streams[(b * 4 + i) % streams.length];
      const receivedAt = new Date(
        Date.now() - (b * 400 + i * 50),
      ).toISOString();
      const correlationId =
        i % 3 === 0
          ? null
          : `live-corr-${(b % 10).toString().padStart(2, "0")}`;
      const fmt = chooseFormat(stream.id);
      const payload = makePayload(fmt, {
        sessionId,
        streamId: stream.id,
        seq: sequence,
        action: "LIVE_EVENT",
      });

      if (stream.type === "KAFKA") {
        events.push({
          streamType: "KAFKA",
          receivedAt,
          streamId: stream.id,
          correlationId,
          payload,
          metadata: {
            topic: (stream.vendorConfig as any).topic ?? "demo.topic",
            partition: 1,
            offset: 1000 + sequence,
            key: correlationId,
          },
        });
      } else if (stream.type === "RABBIT") {
        events.push({
          streamType: "RABBIT",
          receivedAt,
          streamId: stream.id,
          correlationId,
          payload,
          metadata: {
            queue: (stream.vendorConfig as any).queue ?? "demo.queue",
            exchange: (stream.vendorConfig as any).exchange ?? null,
            routingKey: (stream.vendorConfig as any).routingKey ?? null,
            deliveryTag: 5000 + sequence,
          },
        });
      } else {
        events.push({
          streamType: "POSTGRES",
          receivedAt,
          streamId: stream.id,
          correlationId,
          payload,
          metadata: {
            schema: (stream.vendorConfig as any).schema ?? "public",
            table: (stream.vendorConfig as any).table ?? "outbox_events",
            cursorColumn: "id",
            cursorValue: `demo-${sequence}`,
          },
        });
      }

      sequence++;
    }

    batches.push({
      sequence: b + 1,
      droppedSinceLast: 0,
      events,
    });
  }

  return batches;
}

export const demoSchemaBundles: SchemaBundleDto[] = [
  {
    bundleId: "bundle-proto-demo",
    sha256: "demo-sha256-proto-001",
    fileCount: 4,
    sizeBytes: 182_400,
    uploadedAt: isoMinutesAgo(60 * 24),
  },
  {
    bundleId: "bundle-avro-demo",
    sha256: "demo-sha256-avro-002",
    fileCount: 6,
    sizeBytes: 245_120,
    uploadedAt: isoMinutesAgo(60 * 36),
  },
];

export const demoSchemaBundleDetailsById: Record<
  string,
  SchemaBundleDetailsDto
> = {
  "bundle-proto-demo": {
    ...demoSchemaBundles[0],
    files: [
      "demo/order.proto",
      "demo/common.proto",
      "demo/payment.proto",
      "google/protobuf/timestamp.proto",
    ],
  },
  "bundle-avro-demo": {
    ...demoSchemaBundles[1],
    files: [
      "avro/order-created.avsc",
      "avro/order-updated.avsc",
      "avro/payment-captured.avsc",
      "avro/common-money.avsc",
      "avro/common-address.avsc",
      "avro/common-metadata.avsc",
    ],
  },
};
