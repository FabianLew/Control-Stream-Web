import { useState, useCallback } from 'react';
import { SearchFilters, SearchMessageRow, SearchResult } from '@/types';

// Zakładam, że masz jakąś funkcję fetchującą lub używasz fetch bezpośrednio
// Jeśli używasz axios/fetch, dostosuj wywołanie.

export function useSearch() {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [results, setResults] = useState<SearchMessageRow[]>([]);
  
  // Metadane wyszukiwania
  const [totalFound, setTotalFound] = useState(0);
  const [executionTime, setExecutionTime] = useState(0);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Paginacja (jeśli backend ją wspiera, tu przykład dla 'load more')
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Funkcja budująca Query String
  const buildQuery = (currentFilters: SearchFilters, pageNum: number) => {
    const params = new URLSearchParams();
    if (currentFilters.correlationId) params.append('correlationId', currentFilters.correlationId);
    if (currentFilters.contentContains) params.append('contentContains', currentFilters.contentContains);
    
    // Obsługa tablic (streamIds, streamTypes)
    if (currentFilters.streamIds?.length) {
       // W zależności od backendu: repeated param lub comma-separated
       params.append('streamIds', currentFilters.streamIds.join(',')); 
    }
    if (currentFilters.streamTypes?.length) {
       params.append('streamTypes', currentFilters.streamTypes.join(','));
    }

    if (currentFilters.fromTime) params.append('fromTime', currentFilters.fromTime);
    if (currentFilters.toTime) params.append('toTime', currentFilters.toTime);
    
    params.append('page', pageNum.toString());
    params.append('size', '50');
    
    return params.toString();
  };

  const search = useCallback(async (isLoadMore = false) => {
    setLoading(true);
    setError(null);
    
    const nextPage = isLoadMore ? page + 1 : 0;

    try {
      const query = buildQuery(filters, nextPage);
      const res = await fetch(`/api/search?${query}`);
      
      if (!res.ok) {
        throw new Error(`Search failed: ${res.statusText}`);
      }

      const data: SearchResult = await res.json();

      // AKTUALIZACJA: Teraz dane są już płaskie w `data.messages`
      const newMessages = data.messages || [];

      if (isLoadMore) {
        setResults(prev => [...prev, ...newMessages]);
      } else {
        setResults(newMessages);
      }

      setTotalFound(data.totalFound);
      setExecutionTime(data.executionTimeMs);
      
      // Prosta logika hasMore - jeśli przyszło mniej niż limit (np. 50), to koniec
      setHasMore(newMessages.length === 50); 
      setPage(nextPage);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  // Wrapper dla przycisku "Load More"
  const loadMore = () => search(true);

  // Wrapper dla nowego wyszukiwania (resetuje listę)
  const handleNewSearch = () => {
    setPage(0);
    search(false);
  };

  return {
    filters,
    setFilters,
    search: handleNewSearch, // To podpinasz pod przycisk "Search"
    loadMore,                // To podpinasz pod przycisk "Load more"
    hasMore,
    results,                 // To przekazujesz do <ResultsTable />
    totalFound,
    executionTime,
    loading,
    error
  };
}