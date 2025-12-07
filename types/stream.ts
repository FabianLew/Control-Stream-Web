export type StreamType = 'KAFKA' | 'RABBIT' | 'POSTGRES';
export type CorrelationKeyType = 'HEADER' | 'COLUMN';

export interface UnifiedStreamDto {
  id: string;
  name: string;
  type: StreamType;
  connectionId: string;
  connectionName: string;
  technicalName: string;
  correlationKeyType: CorrelationKeyType;
  correlationKeyName?: string;
  metadata?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StreamOverviewDto {
  id: string;
  name: string;
  type: StreamType;
  technicalName: string;
  connectionId: string;
  connectionName: string;
  connectionType: StreamType;
  connectionHost: string;
  connectionPort: number;
  metadata: string;
}