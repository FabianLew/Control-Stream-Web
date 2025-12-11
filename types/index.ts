export type StreamType = 'KAFKA' | 'RABBIT' | 'POSTGRES' | string;

export interface SearchMessageRow {
  streamId: string;
  streamName: string;
  streamType: StreamType;
  messageId: string;
  payload: string;
  headers: string; // JSON string
  correlationId: string;
  timestamp: string; // ISO Instant
  errorMessage?: string;
}

export interface SearchResult {
  queryCorrelationId: string;
  totalFound: number;
  executionTimeMs: number;
  messages: SearchMessageRow[];
}


export interface SearchFilters {
  correlationId?: string;
  contentContains?: string;
  streamIds?: string[];
  streamTypes?: string[];
  fromTime?: string;
  toTime?: string;
}

export interface StreamOption {
  id: string;
  name: string;
  type: StreamType;
}