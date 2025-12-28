// components/live/useLiveStreams.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import type { LiveStreamRef } from "@/types/live";
import type { UnifiedStreamDto } from "@/types/stream";
import { getStreams } from "@/lib/api/streams";

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
    queryFn: getStreams,
    staleTime: 30_000,
    select: (data) => data.map(toLiveStreamRef),
  });
}
