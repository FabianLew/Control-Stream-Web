import { create } from "zustand";
import { SearchFilters, SearchMessageRow, SearchResult } from "@/types";

interface SearchState {
  // --- Stan Danych ---
  filters: SearchFilters;
  results: SearchMessageRow[];
  totalFound: number;
  executionTime: number;

  // --- Stan UI/Status ---a
  loading: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;

  // --- Akcje ---
  setFilters: (
    filters: SearchFilters | ((prev: SearchFilters) => SearchFilters)
  ) => void;
  performSearch: (isLoadMore?: boolean) => Promise<void>;
  reset: () => void;
}

// Helper do budowania URL (przeniesiony z hooka)
const buildQuery = (currentFilters: SearchFilters, pageNum: number) => {
  const params = new URLSearchParams();
  if (currentFilters.correlationId)
    params.append("correlationId", currentFilters.correlationId);
  if (currentFilters.contentContains)
    params.append("contentContains", currentFilters.contentContains);

  if (currentFilters.streamIds?.length) {
    params.append("streamIds", currentFilters.streamIds.join(","));
  }
  if (currentFilters.streamTypes?.length) {
    params.append("streamTypes", currentFilters.streamTypes.join(","));
  }

  if (currentFilters.fromTime)
    params.append("fromTime", currentFilters.fromTime);
  if (currentFilters.toTime) params.append("toTime", currentFilters.toTime);

  params.append("page", pageNum.toString());
  params.append("size", "50");

  return params.toString();
};

export const useSearchStore = create<SearchState>((set, get) => ({
  // Wartości początkowe
  filters: {},
  results: [],
  totalFound: 0,
  executionTime: 0,
  loading: false,
  error: null,
  page: 0,
  hasMore: false,

  // Aktualizacja filtrów (obsługuje też function update dla kompatybilności z useState)
  setFilters: (filtersInput) =>
    set((state) => {
      const newFilters =
        typeof filtersInput === "function"
          ? filtersInput(state.filters)
          : filtersInput;
      return { filters: newFilters };
    }),

  // Główna logika wyszukiwania
  performSearch: async (isLoadMore = false) => {
    const { filters, page, loading } = get();

    // Zapobiegamy podwójnemu fetchowaniu
    if (loading) return;

    set({ loading: true, error: null });

    const nextPage = isLoadMore ? page + 1 : 0;

    try {
      const query = buildQuery(filters, nextPage);
      const res = await fetch(`/api/search?${query}`);

      if (!res.ok) {
        throw new Error(`Search failed: ${res.statusText}`);
      }

      const data: SearchResult = await res.json();
      const newMessages = data.messages || [];

      set((state) => ({
        // Jeśli loadMore -> dodaj do tablicy, jeśli nowe -> nadpisz
        results: isLoadMore ? [...state.results, ...newMessages] : newMessages,
        totalFound: data.totalFound,
        executionTime: data.executionTimeMs, // Zakładam mapowanie z Twojego API
        hasMore: newMessages.length === 50,
        page: nextPage,
      }));
    } catch (err) {
      console.error(err);
      set({ error: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      set({ loading: false });
    }
  },

  // Opcjonalnie: resetowanie stanu do zera (np. przy wylogowaniu)
  reset: () =>
    set({
      filters: {},
      results: [],
      totalFound: 0,
      page: 0,
      hasMore: false,
    }),
}));
