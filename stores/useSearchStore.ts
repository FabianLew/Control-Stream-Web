import { create } from "zustand";
import type { SearchFilters, SearchMessageRow } from "@/types";
import { searchMessages } from "@/lib/api/search";

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
      const data = await searchMessages(filters, nextPage);
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
