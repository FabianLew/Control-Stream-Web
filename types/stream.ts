export type StreamType = 'KAFKA' | 'RABBIT' | 'POSTGRES';
export type CorrelationKeyType = 'HEADER' | 'COLUMN';

export interface UnifiedStreamDto {
  id: string;
  name: string;
  type: StreamType;
  connectionId: string;
  technicalName: string;
  correlationKeyType: CorrelationKeyType;
  correlationKeyName?: string;
  metadata?: string;
  createdAt: string;
  updatedAt: string;
}