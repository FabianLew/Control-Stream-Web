// /types/decoding.ts
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
