export interface SearchMessage {
  messageId: string;
  streamName: string;
  streamType: "KAFKA" | "RABBIT" | "POSTGRES";
  streamOId: string;
  payload: string; // JSON string
  headers: string; // JSON string
  correlationId: string;
  timestamp: string; // ISO date string
}

export interface SearchResult {
  queryCorrelationId: string;
  totalFound: number;
  executionTimeMs: number;
  results: {
    streamName: string;
    streamType: string;
    errorMessage?: string;
    messages: SearchMessage[];
  }[];
}