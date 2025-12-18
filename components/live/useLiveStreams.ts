// components/live/useLiveStreams.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getJson } from "@/components/lib/api/helper";
import type { UnifiedStreamDto } from "@/types/stream";

export type LiveStreamVendor = "KAFKA" | "RABBIT" | "POSTGRES";

export type LiveStreamRef = {
  id: string;
  name: string;
  technicalName: string;
  type: LiveStreamVendor;
};

function toLiveStreamRef(s: UnifiedStreamDto): LiveStreamRef {
  return {
    id: s.id,
    name: s.name,
    technicalName: s.technicalName,
    type: s.type,
  };
}

export function useLiveStreams() {
  return useQuery({
    queryKey: ["streams", "all"],
    queryFn: () => getJson<UnifiedStreamDto[]>("/api/streams"),
    staleTime: 30_000,
    select: (data) => data.map(toLiveStreamRef),
  });
}
