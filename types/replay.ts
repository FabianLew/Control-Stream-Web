export type SchemaOptionDto = {
  schemaId: number;
  subject: string;
  version: number;
  displayName: string;
};

export type ProtoMessageTypeOptionDto = {
  messageFullName: string;
  displayName: string;
};

export type AvroSchemaOptionDto = {
  schemaPath: string;
  fullName: string | null;
  displayName: string;
};

export type SchemaSelectionDto = {
  schemaId?: number | null;
  subject?: string | null;
  version?: number | null;
  schemaPath?: string | null;
  messageFullName?: string | null;
  options?: Record<string, string>;
};

export type SendRequestDto = {
  streamId: string;
  payloadJson: string;
  schema: SchemaSelectionDto | null;
  key?: string | null;
  headers?: Record<string, string>;
  options?: Record<string, any>;
};

export type SendResultDto = {
  success: boolean;
  message?: string;
};

/** Query parameters for GET /api/send/streams/{streamId}/example */
export type GetExampleParams = {
  streamId: string;
  schemaId?: number;
  schemaPath?: string;
  messageFullName?: string;
};

/** Response from GET /api/send/streams/{streamId}/example */
export type ExamplePayloadDto = {
  payloadJson: string;
  /** Human-readable notes from backend about the generated example (may be empty). */
  notes: string[];
};
