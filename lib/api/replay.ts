import type {
  SendRequestDto,
  SendResultDto,
  SchemaOptionDto,
  ProtoMessageTypeOptionDto,
  AvroSchemaOptionDto,
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
