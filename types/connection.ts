export type ConnectionType = "KAFKA" | "RABBIT" | "POSTGRES";
export type ConnectionHealthStatus = "ONLINE" | "OFFLINE" | "UNKNOWN" | "ERROR";

export type ConnectionConfigDto =
  | KafkaConnectionConfigDto
  | RabbitConnectionConfigDto
  | PostgresConnectionConfigDto;

export interface KafkaConnectionConfigDto {
  vendor: "KAFKA";
  host: string;
  port: number;
  bootstrapServers?: string | null;
  securityProtocol?: string | null;
  saslMechanism?: string | null;
  saslJaasConfig?: string | null;
  extra?: Record<string, string> | null;
}

export interface RabbitConnectionConfigDto {
  vendor: "RABBIT";
  host: string;
  port: number;
  username: string;
  password?: string | null;
  virtualHost: string;
}

export interface PostgresConnectionConfigDto {
  vendor: "POSTGRES";
  host: string;
  port: number;
  jdbcUrl?: string | null;
  username: string;
  password?: string | null;
}

export interface ConnectionDto {
  id: string;
  name: string;
  type: ConnectionType;
  config: ConnectionConfigDto;
  createdAt: string;
  updatedAt: string;
}

export type ConnectionUpsertPayload = Omit<
  ConnectionDto,
  "id" | "createdAt" | "updatedAt"
>;

export interface ConnectionOverviewDto {
  id: string;
  name: string;
  type: ConnectionType;
  host: string;
  port: number;
  status: ConnectionHealthStatus;
  lastCheckedAt: string;
  lastErrorMessage?: string | null;
}

export interface ConnectionTestResultDto {
  id: string;
  status: ConnectionHealthStatus;
  checkedAt: string;
  message?: string | null;
}

export interface ConnectionStreamOverviewDto {
  id: string;
  name: string;
  type: "KAFKA" | "RABBIT" | "POSTGRES" | string;
  technicalName: string;
  createdAt: string;
}
