// /components/lib/api/streams.ts
import {
  UnifiedStreamDto,
  CreateStreamCommand,
  EditStreamCommand,
} from "@/types/stream";

export const getStreams = async (): Promise<UnifiedStreamDto[]> => {
  const res = await fetch(`/api/streams`);
  if (!res.ok) throw new Error("Failed to fetch streams");
  return res.json();
};

export const createStream = async (
  command: CreateStreamCommand
): Promise<UnifiedStreamDto> => {
  const res = await fetch(`/api/streams`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });
  if (!res.ok) throw new Error("Failed to create stream");
  return res.json();
};

export const updateStreamCommand = async (args: {
  id: string;
  command: EditStreamCommand;
}): Promise<UnifiedStreamDto> => {
  const res = await fetch(`/api/streams/${args.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args.command),
  });
  if (!res.ok) throw new Error("Failed to update stream");
  return res.json();
};

export const deleteStream = async (id: string): Promise<void> => {
  const res = await fetch(`/api/streams/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete stream");
};
