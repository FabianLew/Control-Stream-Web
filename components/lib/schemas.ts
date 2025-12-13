// schemas.ts
import { z } from "zod";

export const ConnectionTypeEnum = z.enum(["KAFKA", "RABBIT", "POSTGRES"]);
export const StreamTypeEnum = z.enum(["KAFKA", "RABBIT", "POSTGRES"]);
export const CorrelationKeyTypeEnum = z.enum(["HEADER", "PAYLOAD"]);

// Definicja podstawowa
const baseSchema = z.object({
  id: z.string().optional(), // Opcjonalne ID dla trybu edycji
  name: z.string().min(2, "Name must be at least 2 characters"),
  type: z.enum(["KAFKA", "RABBIT", "POSTGRES"]),
  host: z.string().min(1, "Host is required"),
  port: z.number().int().positive("Port must be a positive number"),
  username: z.string().optional(),
  password: z.string().optional(),

  // Metadata jako zagnieżdżony obiekt
  metadata: z.object({
    databaseName: z.string().optional(),
    virtualHost: z.string().optional(),
    sslEnabled: z.boolean().default(false).optional(),
    bootstrapServers: z.string().optional(),
  }),

  // --- NOWE POLA DLA SCHEMA REGISTRY ---
  schemaRegistryEnabled: z.boolean().default(false),
  schemaRegistryUrl: z.string().optional(),
  schemaRegistryAuth: z.enum(["NONE", "BASIC"]).default("NONE").optional(),
  schemaRegistryUsername: z.string().optional(),
  schemaRegistryPassword: z.string().optional(),
});

// Dodajemy refine, aby dynamicznie walidować pola w zależności od wyboru
export const createConnectionSchema = baseSchema.superRefine((data, ctx) => {
  // 1. Walidacja dla POSTGRES
  if (data.type === "POSTGRES") {
    if (!data.metadata.databaseName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Database name is required for PostgreSQL",
        path: ["metadata", "databaseName"],
      });
    }
    if (!data.username) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Username is required for PostgreSQL",
        path: ["username"],
      });
    }
  }

  // 2. Walidacja dla Schema Registry (tylko w Kafka)
  if (data.type === "KAFKA" && data.schemaRegistryEnabled) {
    if (!data.schemaRegistryUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Schema Registry URL is required when enabled",
        path: ["schemaRegistryUrl"],
      });
    }

    // Jeśli wybrano Basic Auth, wymagany user i hasło
    if (data.schemaRegistryAuth === "BASIC") {
      if (!data.schemaRegistryUsername) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Username is required for Basic Auth",
          path: ["schemaRegistryUsername"],
        });
      }
      if (!data.schemaRegistryPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Password is required for Basic Auth",
          path: ["schemaRegistryPassword"],
        });
      }
    }
  }
});

// Eksportujemy wywnioskowany typ TypeScript
export type CreateConnectionFormValues = z.infer<typeof createConnectionSchema>;

// --- STREAM SCHEMA ---
export const createStreamSchema = z.object({
  name: z.string().min(3, "Display name is required"),
  type: StreamTypeEnum,
  connectionId: z.string().min(1, "Connection is required"),
  technicalName: z.string().min(1, "Technical name (topic/table) is required"),
  correlationKeyType: CorrelationKeyTypeEnum,
  correlationKeyName: z.string().min(1, "Key name is required"),

  // ZMIANA TUTAJ: Rozszerzamy metadata o pola dla Postgresa i RabbitMQ
  metadata: z
    .object({
      consumerGroup: z.string().optional(),
      partitionCheck: z.boolean().optional(),

      // Nowe pola, o które krzyczy TypeScript:
      schema: z.string().optional(), // Dla Postgresa
      shadowQueueEnabled: z.boolean().optional(), // Dla RabbitMQ
    })
    .optional(),
});

export type CreateStreamFormValues = z.infer<typeof createStreamSchema>;
