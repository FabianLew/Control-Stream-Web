export type ViewerPayloadFormat = string;

export type ViewerMessage = {
  messageId: string;
  timestamp: string; // ISO string
  streamId: string;
  streamName: string;
  streamType: string;
  correlationId: string | null;

  payload: string;
  payloadPretty: string | null;
  payloadBase64: string;
  payloadFormat: ViewerPayloadFormat;

  headers: Record<string, any>;
  replayDisabled?: boolean; // na razie true
};
