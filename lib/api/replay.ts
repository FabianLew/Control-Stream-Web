import type {
  SendRequestDto,
  SendResultDto,
  SchemaOptionDto,
  ProtoMessageTypeOptionDto,
  AvroSchemaOptionDto,
  GetExampleParams,
  ExamplePayloadDto,
} from "@/types/replay";
import { requestJson } from "./helper";

export async function sendReplayMessage(
  payload: SendRequestDto
): Promise<SendResultDto> {
  return requestJson<SendResultDto>("/api/send", {
    method: "POST",
    json: payload,
  });
}

export async function getSchemaRegistrySchemas(
  streamId: string
): Promise<SchemaOptionDto[]> {
  return requestJson<SchemaOptionDto[]>(
    `/api/send/streams/${streamId}/schema-registry/schemas`
  );
}

export async function getProtoSupportedMessageTypes(
  streamId: string
): Promise<ProtoMessageTypeOptionDto[]> {
  return requestJson<ProtoMessageTypeOptionDto[]>(
    `/api/send/streams/${streamId}/proto/supported-message-types`
  );
}

export async function getAvroSupportedSchemas(
  streamId: string
): Promise<AvroSchemaOptionDto[]> {
  return requestJson<AvroSchemaOptionDto[]>(
    `/api/send/streams/${streamId}/avro/supported-schemas`
  );
}

/**
 * Fetches a backend-generated example payload for the given stream context.
 * Pass the schema/type params that are relevant for the stream's decoding mode:
 *   - schemaId  → Schema Registry
 *   - schemaPath → AVRO FILES
 *   - messageFullName → PROTO FILES
 * Omit all three for streams with no schema (JSON / NONE).
 */
export async function getSendExample({
  streamId,
  schemaId,
  schemaPath,
  messageFullName,
}: GetExampleParams): Promise<ExamplePayloadDto> {
  const params = new URLSearchParams();
  if (schemaId != null) params.set("schemaId", String(schemaId));
  if (schemaPath != null) params.set("schemaPath", schemaPath);
  if (messageFullName != null) params.set("messageFullName", messageFullName);
  const qs = params.toString();
  return requestJson<ExamplePayloadDto>(
    `/api/send/streams/${encodeURIComponent(streamId)}/example${qs ? `?${qs}` : ""}`
  );
}
