// lib/streams/candidate-validator.ts
import type { StreamType, StreamVendorConfigDto } from "@/types/stream";
import { isVendor, VENDOR_META } from "@/components/lib/vendors";

export type CandidateImportStatus = "ready" | "incomplete" | "skipped";

/**
 * Returns true if the vendorConfig satisfies all required fields for the
 * given stream type.  A missing / null vendorConfig is always incomplete.
 *
 * Rules (aligned with backend validation):
 *   Kafka    — always valid; consumerGroupId is optional
 *   Rabbit   — exchange and routingKey must be non-empty strings
 *   Postgres — schema and timeColumn must be non-empty strings
 */
export function isVendorConfigComplete(
  streamType: StreamType,
  vendorConfig?: StreamVendorConfigDto | null
): boolean {
  if (!vendorConfig) return false;

  if (isVendor(streamType, VENDOR_META.KAFKA)) {
    return true; // consumerGroupId is optional
  }

  if (isVendor(streamType, VENDOR_META.RABBIT)) {
    const v = vendorConfig as any;
    return (
      typeof v.exchange === "string" &&
      v.exchange.trim().length > 0 &&
      typeof v.routingKey === "string" &&
      v.routingKey.trim().length > 0
    );
  }

  if (isVendor(streamType, VENDOR_META.POSTGRES)) {
    const v = vendorConfig as any;
    return (
      typeof v.schema === "string" &&
      v.schema.trim().length > 0 &&
      typeof v.timeColumn === "string" &&
      v.timeColumn.trim().length > 0
    );
  }

  return true; // unknown type → don't block
}

/**
 * Returns a sensible default vendorConfig for the given stream type.
 * Required fields are initialised to empty strings so the user can clearly
 * see what they need to fill in.
 */
export function getDefaultVendorConfig(
  streamType: StreamType
): StreamVendorConfigDto {
  if (isVendor(streamType, VENDOR_META.KAFKA)) {
    return { vendor: "KAFKA" };
  }

  if (isVendor(streamType, VENDOR_META.RABBIT)) {
    return {
      vendor: "RABBIT",
      exchange: "",
      routingKey: "",
      prefetchCount: undefined,
      shadowQueueName: undefined,
      searchShadowTtlMs: undefined,
      searchShadowMaxLength: undefined,
    } as unknown as StreamVendorConfigDto;
  }

  // POSTGRES
  return {
    vendor: "POSTGRES",
    schema: "public",
    timeColumn: "created_at",
  } as unknown as StreamVendorConfigDto;
}
