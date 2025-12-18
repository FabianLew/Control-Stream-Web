// /components/lib/schemas.ts
import { z } from "zod";

// --- CONNECTIONS ---
const kafkaConnectionConfigSchema = z.object({
  vendor: z.literal("KAFKA"),
  host: z.string().min(1),
  port: z.number().int().positive(),
  bootstrapServers: z.string().min(1),
  securityProtocol: z.string().optional(),
  saslMechanism: z.string().optional(),
  saslJaasConfig: z.string().optional(),
  extra: z.record(z.string(), z.string()).optional(),
});

const rabbitConnectionConfigSchema = z.object({
  vendor: z.literal("RABBIT"),
  host: z.string().min(1),
  port: z.number().int().positive(),
  username: z.string().min(1),
  password: z.string().min(1),
  virtualHost: z.string().min(1),
});

const postgresConnectionConfigSchema = z.object({
  vendor: z.literal("POSTGRES"),
  host: z.string().min(1),
  port: z.number().int().positive(),
  jdbcUrl: z.string().min(1),
  username: z.string().min(1),
  password: z.string().min(1),
});

export const createConnectionSchema = z.object({
  name: z.string().min(2),
  type: z.enum(["KAFKA", "RABBIT", "POSTGRES"]),
  config: z.union([
    kafkaConnectionConfigSchema,
    rabbitConnectionConfigSchema,
    postgresConnectionConfigSchema,
  ]),
});

export type CreateConnectionFormValues = z.infer<typeof createConnectionSchema>;

export const decodingSchema = z.object({
  schemaSource: z.enum(["SCHEMA_REGISTRY", "FILES", "NONE"]),
  formatHint: z.enum(["AUTO", "JSON", "AVRO", "PROTO", "TEXT", "BINARY"]),
  schemaRegistry: z
    .object({
      url: z.string().min(1),
      authType: z.enum(["NONE", "BASIC"]),
      username: z.string().optional(),
      password: z.string().optional(),
    })
    .optional(),

  protoFiles: z
    .object({
      bundleId: z.string().min(1),
      fileGlob: z.string().optional(),
      fixedMessageFullName: z.string().optional(),
      typeHeaderName: z.string().optional(),
      typeHeaderValuePrefix: z.string().optional(),
    })
    .optional(),

  avroFiles: z
    .object({
      bundleId: z.string().min(1),
      fileGlob: z.string().optional(),
    })
    .optional(),
});

const kafkaVendorSchema = z.object({
  vendor: z.literal("KAFKA"),
  topic: z.string().optional(),
  consumerGroupId: z.string().optional(),
  correlationHeader: z.string().optional(),
});

const rabbitVendorSchema = z.object({
  vendor: z.literal("RABBIT"),
  queue: z.string().optional(),
  exchange: z.string().optional(),
  routingKey: z.string().optional(),
  prefetchCount: z.number().int().positive().optional(),
  shadowQueueEnabled: z.boolean(), // wymagane!
  shadowQueueName: z.string().nullable().optional(),
  correlationHeader: z.string().optional(),
});

const postgresVendorSchema = z.object({
  vendor: z.literal("POSTGRES"),
  schema: z.string().optional(),
  table: z.string().optional(),
  correlationColumn: z.string().optional(),
  timeColumn: z.string().optional(),
});

const streamVendorConfigSchema = z.union([
  kafkaVendorSchema,
  rabbitVendorSchema,
  postgresVendorSchema,
]);

export const schemaSourceSchema = z.enum(["SCHEMA_REGISTRY", "FILES", "NONE"]);
export const payloadFormatHintSchema = z.enum([
  "AUTO",
  "JSON",
  "AVRO",
  "PROTO",
  "TEXT",
  "BINARY",
]);
export const schemaRegistryAuthTypeSchema = z.enum(["NONE", "BASIC"]);

export const schemaRegistryConfigSchema = z
  .object({
    url: z.string().trim().min(1, "Schema Registry URL is required"),
    authType: schemaRegistryAuthTypeSchema.default("NONE"),
    username: z.string().optional(),
    password: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.authType === "BASIC") {
      if (!val.username || val.username.trim() === "") {
        ctx.addIssue({
          code: "custom",
          path: ["username"],
          message: "Username is required for BASIC auth",
        });
      }
      if (!val.password || val.password.trim() === "") {
        ctx.addIssue({
          code: "custom",
          path: ["password"],
          message: "Password is required for BASIC auth",
        });
      }
    }
  });

export const protoFilesConfigSchema = z.object({
  bundleId: z.string().trim().min(1, "Proto bundleId is required"),
  fileGlob: z.string().optional(),
  fixedMessageFullName: z.string().optional(),
  typeHeaderName: z.string().optional(),
  typeHeaderValuePrefix: z.string().optional(),
});

export const avroFilesConfigSchema = z.object({
  bundleId: z.string().trim().min(1, "Avro bundleId is required"),
  fileGlob: z.string().optional(),
});

export const payloadDecodingConfigSchema = z
  .object({
    schemaSource: schemaSourceSchema.default("NONE"),
    formatHint: payloadFormatHintSchema.default("AUTO"),
    schemaRegistry: schemaRegistryConfigSchema.optional(),
    protoFiles: protoFilesConfigSchema.optional(),
    avroFiles: avroFilesConfigSchema.optional(),
  })
  .superRefine((val, ctx) => {
    if (val.schemaSource === "SCHEMA_REGISTRY") {
      if (!val.schemaRegistry?.url) {
        ctx.addIssue({
          code: "custom",
          path: ["schemaRegistry", "url"],
          message: "Schema Registry config is required",
        });
      }
    }

    if (val.schemaSource === "FILES") {
      if (val.formatHint === "PROTO") {
        if (!val.protoFiles?.bundleId) {
          ctx.addIssue({
            code: "custom",
            path: ["protoFiles", "bundleId"],
            message: "Proto bundleId is required",
          });
        }
      }

      if (val.formatHint === "AVRO") {
        if (!val.avroFiles?.bundleId) {
          ctx.addIssue({
            code: "custom",
            path: ["avroFiles", "bundleId"],
            message: "Avro bundleId is required",
          });
        }
      }

      if (val.formatHint === "AUTO") {
        // w AUTO oba są opcjonalne, ale jeśli podane, to muszą być niepuste
        if (val.protoFiles && !val.protoFiles.bundleId) {
          ctx.addIssue({
            code: "custom",
            path: ["protoFiles", "bundleId"],
            message: "Proto bundleId cannot be empty",
          });
        }
        if (val.avroFiles && !val.avroFiles.bundleId) {
          ctx.addIssue({
            code: "custom",
            path: ["avroFiles", "bundleId"],
            message: "Avro bundleId cannot be empty",
          });
        }
      }
    }
  });

// (opcjonalnie) eksport typu:
export type PayloadDecodingFormValues = z.infer<
  typeof payloadDecodingConfigSchema
>;
const streamBaseSchema = z.object({
  name: z.string().min(2),
  type: z.enum(["KAFKA", "RABBIT", "POSTGRES"]),
  connectionId: z.string().uuid(),
  technicalName: z.string().min(2),
  correlationKeyType: z.enum(["HEADER", "COLUMN"]),
  correlationKeyName: z.string().min(1),
  vendorConfig: streamVendorConfigSchema,
  decoding: decodingSchema,
});

export const createStreamSchema = streamBaseSchema;

export const editStreamSchema = streamBaseSchema
  .extend({
    // tutaj ewentualnie możesz poluzować minimalnie rzeczy, ale ja bym NIE poluzował na start
    // np. name: z.string().min(1) -> ale to wtedy rozwali spójność jeśli create jest min(2)
  })
  .superRefine((val, ctx) => {
    // jeśli chcesz – dodatkowa logika dla edit (ale raczej niepotrzebna)
    // ważne: correlationKeyName jest już min(1), więc nie trzeba tego walidować drugi raz
  });

export const streamFormSchema = z.union([createStreamSchema, editStreamSchema]);

export type CreateStreamFormValues = z.input<typeof createStreamSchema>;
export type EditStreamFormValues = z.input<typeof editStreamSchema>;
export type StreamFormValues = z.input<typeof streamFormSchema>;
