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
