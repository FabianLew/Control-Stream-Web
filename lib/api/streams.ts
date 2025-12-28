// /lib/api/streams.ts
import type {
  UnifiedStreamDto,
  CreateStreamCommand,
  EditStreamCommand,
  StreamOverviewDto,
} from "@/types/stream";
import type { StreamOption } from "@/types";
import { requestJson, requestVoid } from "./helper";

export const getStreams = async (): Promise<UnifiedStreamDto[]> =>
  requestJson("/api/streams");

export const getStreamsByConnection = async (
  connectionId: string
): Promise<UnifiedStreamDto[]> =>
  requestJson(`/api/streams/connection/${connectionId}`);

export const getStreamOverview = async (
  streamId: string
): Promise<StreamOverviewDto> =>
  requestJson(`/api/streams/${streamId}/overview`);

export const getStreamNames = async (): Promise<StreamOption[]> =>
  requestJson("/api/streams/names");

export const createStream = async (
  command: CreateStreamCommand
): Promise<UnifiedStreamDto> =>
  requestJson("/api/streams", { method: "POST", json: command });

export const updateStream = async (args: {
  id: string;
  command: EditStreamCommand;
}): Promise<UnifiedStreamDto> =>
  requestJson(`/api/streams/${args.id}`, {
    method: "PUT",
    json: args.command,
  });

export const deleteStream = async (id: string): Promise<void> =>
  requestVoid(`/api/streams/${id}`, { method: "DELETE" });
