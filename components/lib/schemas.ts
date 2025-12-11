// schemas.ts
import { z } from "zod";

export const ConnectionTypeEnum = z.enum(["KAFKA", "RABBIT", "POSTGRES"]);
export const StreamTypeEnum = z.enum(["KAFKA", "RABBIT", "POSTGRES"]);
export const CorrelationKeyTypeEnum = z.enum(["HEADER", "PAYLOAD"]);


export const createConnectionSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  type: ConnectionTypeEnum,
  host: z.string().min(1, "Host is required"),

  // string z inputa → number w typie
  port: z.coerce.number().int().positive("Port must be > 0"),

  username: z.string().optional(),
  password: z.string().optional(),

  // UWAGA: metadata jest wymaganym obiektem,
  // ale jego pola (poza sslEnabled) są opcjonalne
  metadata: z.object({
    databaseName: z.string().optional(),
    virtualHost: z.string().optional(),
    sslEnabled: z.boolean().default(false),
    bootstrapServers: z.string().optional(),
  }),
});

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
  metadata: z.object({
    consumerGroup: z.string().optional(),
    partitionCheck: z.boolean().optional(),
    
    // Nowe pola, o które krzyczy TypeScript:
    schema: z.string().optional(),             // Dla Postgresa
    shadowQueueEnabled: z.boolean().optional() // Dla RabbitMQ
  }).optional(),
});

export type CreateStreamFormValues = z.infer<typeof createStreamSchema>;