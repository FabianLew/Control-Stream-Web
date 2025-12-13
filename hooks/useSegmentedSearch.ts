import { useMemo } from "react";
import { SearchMessageRow } from "@/types";

type GroupedResults = Record<string, SearchMessageRow[]>;

export const useSegmentedSearch = (results: SearchMessageRow[]) => {
  const groupedResults = useMemo(() => {
    return results.reduce<GroupedResults>((acc, item) => {
      // Zabezpieczenie na wypadek braku streamName
      const key = item.streamName || "Unknown Stream";

      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {});
  }, [results]);

  return { groupedResults };
};
