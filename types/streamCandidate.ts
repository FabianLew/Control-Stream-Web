import type { StreamType, CorrelationKeyType, StreamVendorConfigDto } from "./stream";
import type { PayloadFormatHint, SchemaSource } from "./decoding";

/** A stream candidate returned by GET /api/connections/{id}/stream-candidates */
export interface StreamCandidateDto {
  technicalName: string;
  streamType: StreamType;
  suggestedName: string;
  suggestedCorrelationKeyType?: CorrelationKeyType | null;
  suggestedCorrelationKeyName?: string | null;
  suggestedDecoding?: {
    formatHint?: PayloadFormatHint | null;
    schemaSource?: SchemaSource | null;
  } | null;
  /** Vendor config forwarded from the connection (e.g. Kafka consumerGroupId). */
  vendorConfig?: StreamVendorConfigDto | null;
  alreadyImported: boolean;
  /** 0.0–1.0. Absent means backend did not calculate confidence. */
  suggestionConfidence?: number | null;
  /** Rabbit-specific: queue has multiple possible bindings. */
  bindingAmbiguous?: boolean | null;
  /** Optional human-readable note from backend about why this suggestion was made. */
  notes?: string | null;
}

/** Fields a user can override per candidate before import. */
export interface CandidateOverride {
  suggestedName?: string;
  suggestedCorrelationKeyType?: CorrelationKeyType | null;
  suggestedCorrelationKeyName?: string | null;
  suggestedDecoding?: {
    formatHint?: PayloadFormatHint | null;
    schemaSource?: SchemaSource | null;
  } | null;
}

/**
 * The payload shape accepted by POST /api/connections/{id}/stream-candidates/import.
 * Distinct from StreamCandidateDto — uses `name` (not `suggestedName`) and omits
 * discovery-only fields (alreadyImported, suggestionConfidence, etc.).
 */
export interface ImportStreamCandidateDto {
  technicalName: string;
  name: string;
  streamType: StreamType;
  correlationKeyType?: CorrelationKeyType | null;
  correlationKeyName?: string | null;
  vendorConfig?: StreamVendorConfigDto | null;
  decoding?: {
    formatHint?: PayloadFormatHint | null;
    schemaSource?: SchemaSource | null;
  } | null;
}

export interface ImportStreamCandidatesPayload {
  candidates: ImportStreamCandidateDto[];
}

export interface ImportStreamCandidatesResult {
  importedCount?: number;
  streamIds?: string[];
}
