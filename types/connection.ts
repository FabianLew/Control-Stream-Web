
export type ConnectionHealthStatus = 'ONLINE' | 'OFFLINE' | 'UNKNOWN' | 'ERROR';
export type StreamType = 'KAFKA' | 'RABBITMQ' | 'POSTGRES'
export type ConnectionType = 'KAFKA' | 'RABBITMQ' | 'POSTGRES';

export interface ConnectionDto {
  id: string;
  name: string;
  type: ConnectionType;
  host: string;
  port?: number;
  username?: string;
  metadata?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectionOverviewDto {
  id: string;
  name: string;
  type: ConnectionType;
  host: string;
  port: number;
  status: ConnectionHealthStatus;
  lastCheckedAt: string; // ISO Instant
  lastErrorMessage?: string;
}

export interface ConnectionTestResultDto {
  id: string;
  status: ConnectionHealthStatus;
  checkedAt: string;
  message?: string;
}

export interface ConnectionStreamOverviewDto {
  id: string;
  name: string;
  type: StreamType;
  technicalName: string;
  createdAt: string;
}