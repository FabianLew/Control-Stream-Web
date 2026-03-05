// lib/streams/form-mappers.ts
import type {
  UnifiedStreamDto,
  CreateStreamCommand,
  EditStreamCommand,
  StreamType,
  StreamVendorConfigDto,
  SchemaSource,
  PayloadFormatHint,
  SchemaRegistryAuthType,
} from "@/types/stream";
import type { StreamFormValues } from "@/components/lib/schemas";
import { isVendor, VENDOR_META } from "@/components/lib/vendors";

// ─── Primitive helpers ───────────────────────────────────────────────────────

export function toOptionalString(value: unknown): string | undefined {
  if (value == null) return undefined;
  const s = String(value).trim();
  return s.length ? s : undefined;
}

export function toOptionalNumber(value: unknown): number | undefined {
  if (value == null) return undefined;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  const s = String(value).trim();
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

// ─── Field normalizers ───────────────────────────────────────────────────────

export function normalizeCorrelationKeyType(
  streamType: StreamType,
  raw: unknown
): "HEADER" | "COLUMN" {
  if (raw === "HEADER" || raw === "COLUMN") return raw;
  return isVendor(streamType, VENDOR_META.POSTGRES) ? "COLUMN" : "HEADER";
}

export function normalizeCorrelationKeyName(
  streamType: StreamType,
  raw: unknown
): string {
  const value = toOptionalString(raw);
  if (value) return value;
  return isVendor(streamType, VENDOR_META.POSTGRES) ? "trace_id" : "trace-id";
}

/**
 * Maps raw backend decoding config to StreamFormValues["decoding"].
 * Converts null → undefined and handles source-based exclusivity.
 */
export function normalizeDecoding(input: any): StreamFormValues["decoding"] {
  const schemaSource = (input?.schemaSource ?? "NONE") as SchemaSource;
  const formatHint = (input?.formatHint ?? "AUTO") as PayloadFormatHint;

  if (schemaSource === "NONE") {
    return {
      schemaSource: "NONE",
      formatHint,
      schemaRegistry: undefined,
      protoFiles: undefined,
      avroFiles: undefined,
    };
  }

  if (schemaSource === "SCHEMA_REGISTRY") {
    const sr = input?.schemaRegistry ?? undefined;
    const authType = (sr?.authType ?? "NONE") as SchemaRegistryAuthType;

    return {
      schemaSource: "SCHEMA_REGISTRY",
      formatHint,
      schemaRegistry: sr
        ? {
            url: String(sr.url ?? "").trim(),
            authType,
            username:
              authType === "BASIC" ? toOptionalString(sr.username) : undefined,
            password:
              authType === "BASIC" ? toOptionalString(sr.password) : undefined,
          }
        : undefined,
      protoFiles: undefined,
      avroFiles: undefined,
    };
  }

  // FILES
  const proto = input?.protoFiles;
  const avro = input?.avroFiles;

  return {
    schemaSource: "FILES",
    formatHint,
    schemaRegistry: undefined,
    protoFiles:
      proto && typeof proto === "object"
        ? {
            bundleId: String(proto.bundleId ?? "").trim(),
            fileGlob: toOptionalString(proto.fileGlob),
            fixedMessageFullName: toOptionalString(proto.fixedMessageFullName),
            typeHeaderName: toOptionalString(proto.typeHeaderName),
            typeHeaderValuePrefix: toOptionalString(proto.typeHeaderValuePrefix),
          }
        : undefined,
    avroFiles:
      avro && typeof avro === "object"
        ? {
            bundleId: String(avro.bundleId ?? "").trim(),
            fileGlob: toOptionalString(avro.fileGlob),
          }
        : undefined,
  };
}

/**
 * Ensures vendor config object is valid for the given stream type.
 * Returns a normalised object with correct vendor-specific defaults.
 */
export function ensureVendorConfigForType(
  type: StreamType,
  current?: StreamVendorConfigDto | null
): StreamVendorConfigDto {
  if (isVendor(type, VENDOR_META.KAFKA)) {
    if (current && isVendor(current.vendor, VENDOR_META.KAFKA)) {
      return {
        vendor: "KAFKA",
        // null is not accepted by z.string().optional() — normalize to undefined
        consumerGroupId: toOptionalString((current as any).consumerGroupId),
      };
    }
    return { vendor: "KAFKA" };
  }

  if (isVendor(type, VENDOR_META.RABBIT)) {
    if (current && isVendor(current.vendor, VENDOR_META.RABBIT)) {
      const c: any = current;
      return {
        ...current,
        exchange: c.exchange == null ? undefined : String(c.exchange),
        routingKey: c.routingKey == null ? undefined : String(c.routingKey),
        prefetchCount:
          c.prefetchCount == null ? undefined : Number(c.prefetchCount),
        searchShadowTtlMs:
          c.searchShadowTtlMs == null
            ? undefined
            : Number(c.searchShadowTtlMs),
        searchShadowMaxLength:
          c.searchShadowMaxLength == null
            ? undefined
            : Number(c.searchShadowMaxLength),
        shadowQueueName:
          c.shadowQueueName == null ? undefined : String(c.shadowQueueName),
      } as any;
    }

    return {
      vendor: "RABBIT",
      exchange: "",
      routingKey: "",
      prefetchCount: undefined,
      searchShadowTtlMs: undefined,
      searchShadowMaxLength: undefined,
      shadowQueueName: undefined,
    } as any;
  }

  // POSTGRES
  if (current && isVendor(current.vendor, VENDOR_META.POSTGRES)) {
    const c = current as any;
    return {
      vendor: "POSTGRES",
      // null is not accepted by z.string().optional() — normalize to undefined
      schema: toOptionalString(c.schema),
      timeColumn: toOptionalString(c.timeColumn),
    };
  }
  return { vendor: "POSTGRES", schema: "public" };
}

/**
 * Normalises vendor config for submission (form → command direction).
 */
function normalizeVendorConfig(
  type: StreamType,
  vendorConfig: StreamVendorConfigDto | undefined
): StreamVendorConfigDto {
  const current = vendorConfig ?? ({} as any);

  if (isVendor(type, VENDOR_META.KAFKA)) {
    const v = isVendor(current.vendor, VENDOR_META.KAFKA)
      ? current
      : { vendor: "KAFKA" };
    return {
      vendor: "KAFKA",
      consumerGroupId: toOptionalString(v.consumerGroupId),
    };
  }

  if (isVendor(type, VENDOR_META.RABBIT)) {
    const v = isVendor(current.vendor, VENDOR_META.RABBIT)
      ? current
      : ({ vendor: "RABBIT" } as any);

    return {
      vendor: "RABBIT",
      exchange: String(v.exchange ?? "").trim(),
      routingKey: String(v.routingKey ?? "").trim(),
      prefetchCount: toOptionalNumber(v.prefetchCount),
      searchShadowTtlMs: toOptionalNumber((v as any).searchShadowTtlMs),
      searchShadowMaxLength: toOptionalNumber(
        (v as any).searchShadowMaxLength
      ),
      shadowQueueName: toOptionalString((v as any).shadowQueueName),
    } as any;
  }

  // POSTGRES
  const v = isVendor(current.vendor, VENDOR_META.POSTGRES)
    ? current
    : ({ vendor: "POSTGRES" } as any);
  return {
    vendor: "POSTGRES",
    schema: toOptionalString(v.schema) ?? "public",
    timeColumn: toOptionalString(v.timeColumn),
  };
}

// ─── Default values ───────────────────────────────────────────────────────────

export const DEFAULT_STREAM_FORM_VALUES: StreamFormValues = {
  name: "",
  type: "KAFKA",
  connectionId: "",
  technicalName: "",
  correlationKeyType: "HEADER",
  correlationKeyName: "trace-id",
  vendorConfig: { vendor: "KAFKA" },
  decoding: { schemaSource: "NONE", formatHint: "AUTO" },
};

// ─── Public mappers ───────────────────────────────────────────────────────────

/**
 * Maps a backend UnifiedStreamDto (or StreamOverviewDto) to StreamFormValues.
 * Use this to initialise or reset the stream form from API data.
 */
export function mapStreamDtoToFormValues(
  stream: Pick<
    UnifiedStreamDto,
    | "name"
    | "type"
    | "connectionId"
    | "technicalName"
    | "vendorConfig"
    | "decoding"
  > & { correlationKeyType?: string; correlationKeyName?: string }
): StreamFormValues {
  return {
    ...DEFAULT_STREAM_FORM_VALUES,
    name: stream.name ?? "",
    type: stream.type,
    connectionId: stream.connectionId ?? "",
    technicalName: stream.technicalName ?? "",
    correlationKeyType: normalizeCorrelationKeyType(
      stream.type,
      stream.correlationKeyType
    ),
    correlationKeyName: normalizeCorrelationKeyName(
      stream.type,
      stream.correlationKeyName
    ),
    vendorConfig: ensureVendorConfigForType(
      stream.type,
      stream.vendorConfig
    ) as any,
    decoding: normalizeDecoding(stream.decoding) as any,
  };
}

/**
 * Maps StreamFormValues to a CreateStreamCommand / EditStreamCommand.
 * Normalises all fields and sets nulls correctly based on schemaSource.
 */
export function mapFormValuesToCommand(
  data: StreamFormValues
): CreateStreamCommand | EditStreamCommand {
  const name = (data.name ?? "").trim();
  const technical = (data.technicalName ?? "").trim();

  const correlationKeyType = normalizeCorrelationKeyType(
    data.type,
    (data as any).correlationKeyType
  );

  const correlationKeyName = normalizeCorrelationKeyName(
    data.type,
    (data as any).correlationKeyName
  );

  const normalizedVendor = normalizeVendorConfig(
    data.type,
    data.vendorConfig as any
  );

  const normalizedDecoding = normalizeDecoding(data.decoding);

  return {
    name,
    type: data.type,
    connectionId: data.connectionId,
    technicalName: technical,
    correlationKeyType,
    correlationKeyName,
    vendorConfig: normalizedVendor,
    decoding: normalizedDecoding as any,
  } as any;
}

/** Alias — maps form values to a CreateStreamCommand. */
export const mapFormValuesToCreateCommand = mapFormValuesToCommand;

/** Alias — maps form values to an EditStreamCommand. */
export const mapFormValuesToEditCommand = mapFormValuesToCommand;
