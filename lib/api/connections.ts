import type {
  ConnectionDto,
  ConnectionOverviewDto,
  ConnectionStreamOverviewDto,
  ConnectionTestResultDto,
  ConnectionUpsertPayload,
} from "@/types/connection";
import { requestJson, requestVoid } from "./helper";

export const getConnections = async (): Promise<ConnectionDto[]> =>
  requestJson("/api/connections");

export const getConnectionsOverview = async (): Promise<
  ConnectionOverviewDto[]
> => requestJson("/api/connections/overview");

export const getConnectionOverview = async (
  id: string
): Promise<ConnectionOverviewDto> =>
  requestJson(`/api/connections/${id}/overview`);

export const getConnection = async (id: string): Promise<ConnectionDto> =>
  requestJson(`/api/connections/${id}`);

export const getConnectionStreams = async (
  id: string
): Promise<ConnectionStreamOverviewDto[]> =>
  requestJson(`/api/streams/connection/${id}`);

export const testConnection = async (
  id: string
): Promise<ConnectionTestResultDto> =>
  requestJson(`/api/connections/${id}/test`, { method: "POST" });

export const createConnection = async (
  connection: ConnectionUpsertPayload
): Promise<ConnectionDto> =>
  requestJson("/api/connections", { method: "POST", json: connection });

export const updateConnection = async (
  connection: ConnectionDto
): Promise<ConnectionDto> => {
  const { id, ...payload } = connection;
  return requestJson(`/api/connections/${id}`, {
    method: "PUT",
    json: payload,
  });
};

export const updateConnectionById = async (
  id: string,
  payload: ConnectionUpsertPayload
): Promise<ConnectionDto> =>
  requestJson(`/api/connections/${id}`, {
    method: "PUT",
    json: payload,
  });

export const deleteConnection = async (id: string): Promise<void> =>
  requestVoid(`/api/connections/${id}`, { method: "DELETE" });
