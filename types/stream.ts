// /types/stream.ts
import type { ConnectionConfigDto } from "./connection";
import type { PayloadDecodingConfigDto } from "./decoding";

export type {
  SchemaSource,
  PayloadFormatHint,
  SchemaRegistryAuthType,
  SchemaRegistryConfigDto,
  ProtoFilesConfigDto,
  AvroFilesConfigDto,
  PayloadDecodingConfigDto,
} from "./decoding";

export type StreamType = "KAFKA" | "RABBIT" | "POSTGRES";
export type CorrelationKeyType = "HEADER" | "COLUMN";

// --- vendor configs ---
export type KafkaStreamVendorConfigDto = {
  vendor: "KAFKA";
  consumerGroupId?: string;
};

export type RabbitStreamVendorConfigDto = {
  vendor: "RABBIT";
  exchange: string;
  routingKey: string;
  prefetchCount?: number;
  shadowQueueName?: string | null;
  searchShadowTtlMs?: number | null;
  searchShadowMaxLength?: number | null;
};

export type PostgresStreamVendorConfigDto = {
  vendor: "POSTGRES";
  schema?: string;
  timeColumn?: string;
};

export type StreamVendorConfigDto =
  | KafkaStreamVendorConfigDto
  | RabbitStreamVendorConfigDto
  | PostgresStreamVendorConfigDto;

// --- DTOs ---
export interface UnifiedStreamDto {
  id: string;
  name: string;
  type: StreamType;
  connectionId: string;
  connectionName: string;
  technicalName: string;
  correlationKeyType: CorrelationKeyType;
  correlationKeyName?: string;
  vendorConfig: StreamVendorConfigDto;
  decoding: PayloadDecodingConfigDto;
  createdAt: string;
  updatedAt: string;
}

export type StreamOverviewDto = {
  id: string;
  name: string;
  type: StreamType;
  technicalName: string;
  correlationKeyName?: string;

  vendorConfig: StreamVendorConfigDto;
  decoding: PayloadDecodingConfigDto;

  connectionId: string;
  connectionName: string;
  connectionType: StreamType;
  connectionConfig: ConnectionConfigDto;
};

export type CreateStreamCommand = Omit<
  UnifiedStreamDto,
  "id" | "createdAt" | "updatedAt" | "connectionName"
>;
export type EditStreamCommand = CreateStreamCommand;
