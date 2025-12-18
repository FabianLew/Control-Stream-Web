export type LiveStreamVendor = "KAFKA" | "RABBIT" | "POSTGRES";

export type UUID = string;

export type LiveStreamRef = {
  id: UUID;
  name: string;
  type: LiveStreamVendor;
};
