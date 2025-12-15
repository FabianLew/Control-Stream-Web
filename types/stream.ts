// /types/stream.ts

export type StreamType = "KAFKA" | "RABBIT" | "POSTGRES";
export type CorrelationKeyType = "HEADER" | "COLUMN";

export type SchemaSource = "SCHEMA_REGISTRY" | "FILES" | "NONE";
export type PayloadFormatHint =
  | "AUTO"
  | "JSON"
  | "AVRO"
  | "PROTO"
  | "TEXT"
  | "BINARY";

export type SchemaRegistryAuthType = "NONE" | "BASIC";

export interface SchemaRegistryConfigDto {
  url: string;
  authType: SchemaRegistryAuthType;
  username?: string;
  password?: string;
}

export interface ProtoFilesConfigDto {
  bundleId: string;
  fileGlob?: string;
  fixedMessageFullName?: string;
  typeHeaderName?: string;
  typeHeaderValuePrefix?: string;
}

export interface AvroFilesConfigDto {
  bundleId: string;
  fileGlob?: string;
}

export interface PayloadDecodingConfigDto {
  schemaSource: SchemaSource;
  formatHint: PayloadFormatHint;
  schemaRegistry?: SchemaRegistryConfigDto;
  protoFiles?: ProtoFilesConfigDto;
  avroFiles?: AvroFilesConfigDto;
}

// --- vendor configs ---
export type KafkaStreamVendorConfigDto = {
  vendor: "KAFKA";
  topic?: string;
  consumerGroupId?: string;
  correlationHeader?: string;
};

export type RabbitStreamVendorConfigDto = {
  vendor: "RABBIT";
  queue?: string;
  exchange?: string;
  routingKey?: string;
  prefetchCount?: number;
  shadowQueueEnabled: boolean;
  shadowQueueName?: string | null;
  correlationHeader?: string;
};

export type PostgresStreamVendorConfigDto = {
  vendor: "POSTGRES";
  schema?: string;
  table?: string;
  correlationColumn?: string;
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

export type CreateStreamCommand = Omit<
  UnifiedStreamDto,
  "id" | "createdAt" | "updatedAt" | "connectionName"
>;
export type EditStreamCommand = CreateStreamCommand;
