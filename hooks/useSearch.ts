import { useSearchStore } from "@/stores/useSearchStore";
import { useCallback } from "react";

export function useSearch() {
  // Pobieramy stan i akcje ze Store'a
  const filters = useSearchStore((state) => state.filters);
  const results = useSearchStore((state) => state.results);
  const totalFound = useSearchStore((state) => state.totalFound);
  const executionTime = useSearchStore((state) => state.executionTime);
  const loading = useSearchStore((state) => state.loading);
  const error = useSearchStore((state) => state.error);
  const hasMore = useSearchStore((state) => state.hasMore);

  const setFilters = useSearchStore((state) => state.setFilters);
  const performSearch = useSearchStore((state) => state.performSearch);

  // Wrapper dla nowego wyszukiwania (resetuje listę w store)
  const search = useCallback(() => {
    performSearch(false);
  }, [performSearch]);

  // Wrapper dla przycisku "Load More"
  const loadMore = useCallback(() => {
    performSearch(true);
  }, [performSearch]);

  return {
    filters,
    setFilters,
    search,
    loadMore,
    hasMore,
    results,
    totalFound,
    executionTime,
    loading,
    error,
  };
}
