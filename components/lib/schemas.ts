import { z } from "zod";

// Zakładam, że masz takie Enumy w systemie. Jeśli są inne, dostosuj stringi.
export const ConnectionTypeEnum = z.enum(["KAFKA", "RABBIT", "POSTGRES"]);
export const StreamTypeEnum = z.enum(["KAFKA", "RABBIT", "POSTGRES"]);
export const CorrelationKeyTypeEnum = z.enum(["HEADER", "PAYLOAD"]);

// --- CONNECTION SCHEMA ---
export const createConnectionSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  type: ConnectionTypeEnum,
  
  host: z.string().optional(), // Opcjonalne, bo Kafka może mieć to w metadata
  port: z.coerce.number().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  
  // W formularzu trzymamy to jako obiekt dla wygody walidacji.
  // Przed wysyłką zamienimy to na JSON string.
  metadata: z.object({
    databaseName: z.string().optional(), // Postgres
    schema: z.string().optional(),       // Postgres
    bootstrapServers: z.string().optional(), // Kafka
    sslEnabled: z.boolean().default(false),
    vhost: z.string().optional(),        // Rabbit
  }).optional()
}).refine((data) => {
    // Walidacja warunkowa
    if (data.type === "POSTGRES") {
        return !!data.host && !!data.port && !!data.username && !!data.metadata?.databaseName;
    }
    if (data.type === "KAFKA") {
        // Kafka wymaga albo host:port (stary styl) albo bootstrapServers w metadata
        return (!!data.host && !!data.port) || !!data.metadata?.bootstrapServers;
    }
    return true;
}, {
    message: "Missing required fields for selected type",
    path: ["type"],
});

export type CreateConnectionFormValues = z.infer<typeof createConnectionSchema>;


// --- STREAM SCHEMA ---
export const createStreamSchema = z.object({
  name: z.string().min(3, "Display name is required"),
  
  // To pole jest w DTO, ale zazwyczaj wynika z ConnectionType.
  // Na froncie ustawimy je automatycznie na podstawie wybranego Connection.
  type: StreamTypeEnum, 
  
  connectionId: z.string().min(1, "Connection is required"),
  
  technicalName: z.string().min(1, "Technical name (topic/table) is required"),
  
  // Nowe pola z Twojego DTO
  correlationKeyType: CorrelationKeyTypeEnum,
  correlationKeyName: z.string().min(1, "Key name is required (e.g. 'trace-id')"),
  
  // Metadata dla streama (np. specyficzne flagi consumer-group)
  metadata: z.object({
    consumerGroup: z.string().optional(),
    partitionCheck: z.boolean().optional()
  }).optional()
});

export type CreateStreamFormValues = z.infer<typeof createStreamSchema>;