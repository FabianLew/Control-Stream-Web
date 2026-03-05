// lib/connections/form-mappers.ts
import type { ConnectionDto, ConnectionUpsertPayload } from "@/types/connection";
import type { CreateConnectionFormValues } from "@/components/lib/schemas";

/**
 * ConnectionFormValues = CreateConnectionFormValues (alias).
 * Re-exported from this module so callers use the canonical name.
 */
export type ConnectionFormValues = CreateConnectionFormValues;

// ─── Primitive helpers ────────────────────────────────────────────────────────

export function toOptionalString(value: unknown): string | undefined {
  if (value == null) return undefined;
  const s = String(value).trim();
  return s.length ? s : undefined;
}

export function toRequiredString(value: unknown, fallback: string): string {
  return toOptionalString(value) ?? fallback;
}

export function toRequiredNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value) && value > 0)
    return value;
  const parsed = Number(String(value ?? "").trim());
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return fallback;
}

export function buildKafkaBootstrapServers(
  host: string,
  port: number
): string {
  return `${host}:${port}`;
}

export function buildPostgresJdbcUrl(
  host: string,
  port: number,
  dbName: string
): string {
  const safeDb = toRequiredString(dbName, "postgres");
  return `jdbc:postgresql://${host}:${port}/${safeDb}`;
}

// ─── Default values ───────────────────────────────────────────────────────────

export const DEFAULT_KAFKA_CONNECTION_VALUES: ConnectionFormValues = {
  name: "",
  type: "KAFKA",
  config: {
    vendor: "KAFKA",
    host: "localhost",
    port: 9092,
    bootstrapServers: "localhost:9092",
    securityProtocol: "PLAINTEXT",
    saslMechanism: undefined,
    saslJaasConfig: undefined,
    extra: {},
  },
};

export const DEFAULT_RABBIT_CONNECTION_VALUES: ConnectionFormValues = {
  name: "",
  type: "RABBIT",
  config: {
    vendor: "RABBIT",
    host: "localhost",
    port: 5672,
    username: "guest",
    password: "",
    virtualHost: "/",
  },
};

export const DEFAULT_POSTGRES_CONNECTION_VALUES: ConnectionFormValues = {
  name: "",
  type: "POSTGRES",
  config: {
    vendor: "POSTGRES",
    host: "localhost",
    port: 5432,
    jdbcUrl: "",
    username: "postgres",
    password: "",
  },
};

export function defaultValuesForType(type: string): ConnectionFormValues {
  if (type === "RABBIT") return DEFAULT_RABBIT_CONNECTION_VALUES;
  if (type === "POSTGRES") return DEFAULT_POSTGRES_CONNECTION_VALUES;
  return DEFAULT_KAFKA_CONNECTION_VALUES;
}

// ─── Public mappers ───────────────────────────────────────────────────────────

/**
 * Parses the database name from a Postgres JDBC URL.
 * Returns "postgres" as fallback.
 */
export function parsePostgresDatabaseName(
  jdbcUrl: string | null | undefined
): string {
  if (!jdbcUrl) return "postgres";
  const match = /jdbc:postgresql:\/\/[^/]+\/([^?]+).*/.exec(jdbcUrl);
  return match?.[1] ?? "postgres";
}

/**
 * Maps a backend ConnectionDto to ConnectionFormValues.
 * Use this to initialise or reset the connection form from API data.
 */
export function mapConnectionDtoToFormValues(
  dto: ConnectionDto
): ConnectionFormValues {
  const c = dto.config as any;
  const type = dto.type;

  if (type === "KAFKA") {
    const host = toRequiredString(c.host, "localhost");
    const port = toRequiredNumber(c.port, 9092);
    return {
      name: dto.name,
      type: "KAFKA",
      config: {
        vendor: "KAFKA",
        host,
        port,
        bootstrapServers: toRequiredString(
          c.bootstrapServers,
          buildKafkaBootstrapServers(host, port)
        ),
        securityProtocol: toOptionalString(c.securityProtocol) ?? "PLAINTEXT",
        saslMechanism: toOptionalString(c.saslMechanism),
        saslJaasConfig: toOptionalString(c.saslJaasConfig),
        extra:
          c.extra && typeof c.extra === "object" ? c.extra : undefined,
      },
    };
  }

  if (type === "RABBIT") {
    return {
      name: dto.name,
      type: "RABBIT",
      config: {
        vendor: "RABBIT",
        host: toRequiredString(c.host, "localhost"),
        port: toRequiredNumber(c.port, 5672),
        username: toRequiredString(c.username, "guest"),
        password: toOptionalString(c.password) ?? "",
        virtualHost: toRequiredString(c.virtualHost, "/"),
      },
    };
  }

  // POSTGRES
  const host = toRequiredString(c.host, "localhost");
  const port = toRequiredNumber(c.port, 5432);
  return {
    name: dto.name,
    type: "POSTGRES",
    config: {
      vendor: "POSTGRES",
      host,
      port,
      jdbcUrl: toRequiredString(
        c.jdbcUrl,
        buildPostgresJdbcUrl(host, port, "postgres")
      ),
      username: toRequiredString(c.username, "postgres"),
      password: toOptionalString(c.password) ?? "",
    },
  };
}

/**
 * Maps ConnectionFormValues to a create payload (password always included).
 */
export function mapFormValuesToCreateCommand(
  values: ConnectionFormValues,
  postgresDatabaseName: string
): ConnectionUpsertPayload {
  return normalizePayload("create", values, postgresDatabaseName);
}

/**
 * Maps ConnectionFormValues to an update payload (empty password omitted).
 */
export function mapFormValuesToUpdateCommand(
  values: ConnectionFormValues,
  postgresDatabaseName: string
): ConnectionUpsertPayload {
  return normalizePayload("update", values, postgresDatabaseName);
}

// ─── Internal normalization ───────────────────────────────────────────────────

function normalizePayload(
  mode: "create" | "update",
  raw: ConnectionFormValues,
  postgresDatabaseName: string
): ConnectionUpsertPayload {
  const name = toRequiredString(raw.name, "");
  const type = raw.type;
  const c = raw.config as any;

  if (type === "KAFKA") {
    const host = toRequiredString(c.host, "localhost");
    const port = toRequiredNumber(c.port, 9092);
    return {
      name,
      type: "KAFKA",
      config: {
        vendor: "KAFKA",
        host,
        port,
        bootstrapServers: buildKafkaBootstrapServers(host, port),
        securityProtocol: toOptionalString(c.securityProtocol) ?? "PLAINTEXT",
        saslMechanism: toOptionalString(c.saslMechanism),
        saslJaasConfig: toOptionalString(c.saslJaasConfig),
        extra:
          c.extra && typeof c.extra === "object" ? c.extra : undefined,
      },
    };
  }

  if (type === "RABBIT") {
    const host = toRequiredString(c.host, "localhost");
    const port = toRequiredNumber(c.port, 5672);
    const username = toRequiredString(c.username, "guest");
    const passwordRaw = toOptionalString(c.password);
    const virtualHost = toRequiredString(c.virtualHost, "/");
    const config: any = { vendor: "RABBIT", host, port, username, virtualHost };
    if (mode === "create") {
      config.password = passwordRaw ?? "";
    } else {
      if (passwordRaw) config.password = passwordRaw;
    }
    return { name, type: "RABBIT", config };
  }

  // POSTGRES
  const host = toRequiredString(c.host, "localhost");
  const port = toRequiredNumber(c.port, 5432);
  const username = toRequiredString(c.username, "postgres");
  const jdbcUrl = buildPostgresJdbcUrl(host, port, postgresDatabaseName);
  const passwordRaw = toOptionalString(c.password);
  const config: any = { vendor: "POSTGRES", host, port, jdbcUrl, username };
  if (mode === "create") {
    config.password = passwordRaw ?? "";
  } else {
    if (passwordRaw) config.password = passwordRaw;
  }
  return { name, type: "POSTGRES", config };
}
