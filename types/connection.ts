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