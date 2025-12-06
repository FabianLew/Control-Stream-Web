export interface SearchMessage {
  messageId: string;
  payload: string;
  headers: string;
  correlationId: string;
  timestamp: string;
}

// 2. To jest grupa wyników z Backend API
export interface StreamResultEntry {
  streamName: string;
  streamType: "KAFKA" | "RABBIT" | "POSTGRES" | string;
  errorMessage?: string;
  messages: SearchMessage[];
}

// 3. To jest główna odpowiedź z Backend API
export interface SearchResult {
  queryCorrelationId: string;
  totalFound: number;
  executionTimeMs: number;
  results: StreamResultEntry[];
}


export interface SearchMessageRow extends SearchMessage {
  streamName: string;
  streamType: string;
}

export interface SearchFilters {
  correlationId?: string;       // Opcjonalne ID korelacji
  contentContains?: string;     // Szukanie w treści payloadu
  fromTime?: string;            // Data w formacie ISO String
  toTime?: string;              // Data w formacie ISO String
  streamTypes?: string[];       // np. ["KAFKA", "RABBIT", "POSTGRES"]
  streamIds?: string[];
  limit?: number;               // Limit wyników (domyślnie 10)
  page?: number; // Numer strony (0, 1, 2...)
  size?: number; // Ilość wyników na stronę (np. 50)
}

export type StreamType = 'KAFKA' | 'RABBIT' | 'POSTGRES';

export interface StreamOption {
  id : string;
  name: string;
  type: StreamType; 
}