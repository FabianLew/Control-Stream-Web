import { useMemo } from 'react';

// ZMIANA: streamType jest teraz stringiem, aby pasował do SearchMessageRow z Twojej aplikacji
export type SearchResultDto = {
  streamName: string;
  streamType: string; // Było: "KAFKA" | "RABBIT" | "POSTGRES"
  timestamp: string;
  correlationId: string | null;
  messageId: string;
  payload: string; // JSON string
};

type GroupedResults = Record<string, SearchResultDto[]>;

export const useSegmentedSearch = (results: SearchResultDto[]) => {
  const groupedResults = useMemo(() => {
    return results.reduce<GroupedResults>((acc, item) => {
      // Zabezpieczenie na wypadek braku streamName (choć typ tego nie zakłada)
      const key = item.streamName || 'Unknown Stream';
      
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {});
  }, [results]);

  return { groupedResults };
};