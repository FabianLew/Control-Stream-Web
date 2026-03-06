// lib/streams/candidate-mapper.ts
import type {
  StreamCandidateDto,
  CandidateOverride,
  ImportStreamCandidateDto,
} from "@/types/streamCandidate";

/**
 * Maps a discovery candidate (plus any user-applied overrides) to the clean
 * import request DTO that the backend expects.
 *
 * Field mapping:
 *   suggestedName             → name
 *   suggestedCorrelationKeyType → correlationKeyType
 *   suggestedCorrelationKeyName → correlationKeyName
 *   suggestedDecoding           → decoding
 *   vendorConfig                → vendorConfig  (passed through as-is)
 *
 * Discovery-only fields (alreadyImported, suggestionConfidence,
 * bindingAmbiguous, notes) are intentionally excluded from the output.
 */
export function mapCandidateToImportPayload(
  candidate: StreamCandidateDto,
  override?: CandidateOverride | null
): ImportStreamCandidateDto {
  // Name: prefer override, fall back to backend suggestion.
  const name =
    override?.suggestedName !== undefined && override.suggestedName.trim() !== ""
      ? override.suggestedName.trim()
      : candidate.suggestedName;

  // Correlation key type: prefer override when explicitly set (including null).
  const correlationKeyType =
    override && "suggestedCorrelationKeyType" in override
      ? override.suggestedCorrelationKeyType
      : candidate.suggestedCorrelationKeyType;

  // Correlation key name: prefer override when explicitly set (including null).
  const correlationKeyName =
    override && "suggestedCorrelationKeyName" in override
      ? override.suggestedCorrelationKeyName
      : candidate.suggestedCorrelationKeyName;

  // Decoding: prefer override when explicitly set (including null).
  const decoding =
    override && "suggestedDecoding" in override
      ? override.suggestedDecoding
      : candidate.suggestedDecoding;

  return {
    technicalName: candidate.technicalName,
    name,
    streamType: candidate.streamType,
    correlationKeyType: correlationKeyType ?? undefined,
    correlationKeyName: correlationKeyName ?? undefined,
    vendorConfig: candidate.vendorConfig ?? undefined,
    decoding: decoding ?? undefined,
  };
}
