import { useState, useCallback, useMemo } from 'react';
import type { SearchResult, SearchMessageRow, SearchFilters } from '@/types';

export const useSearch = () => {
  // Stan filtrów
  const [filters, setFilters] = useState<SearchFilters>({
    page: 0,
    size: 50, // Domyślny rozmiar strony
    correlationId: '',
  });

  // Stan wyników - tu trzymamy CAŁĄ listę (z akumulacją przy load more)
  const [accumulatedMessages, setAccumulatedMessages] = useState<SearchMessageRow[]>([]);
  
  // Metadane
  const [stats, setStats] = useState({ totalFound: 0, executionTime: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true); // Czy są kolejne strony?

  /**
   * Główna funkcja szukająca.
   * isLoadMore = true  -> Pobiera następną stronę i DOKLEJA do listy.
   * isLoadMore = false -> Pobiera stronę 0 i NADPISUJE listę (nowe szukanie).
   */
  const performSearch = useCallback(async (isLoadMore = false) => {
    setLoading(true);
    setError(null);

    try {
      // 1. Ustalanie numeru strony
      // Jeśli to nowe wyszukiwanie, resetujemy na 0. Jeśli dociąganie, bierzemy następną.
      const nextPage = isLoadMore ? (filters.page || 0) + 1 : 0;

      // Aktualizujemy stan filtrów (ważne dla kolejnych wywołań)
      setFilters(prev => ({ ...prev, page: nextPage }));

      // 2. Budowanie URL (URLSearchParams)
      const params = new URLSearchParams();
      
      // Standardowe filtry
      if (filters.correlationId) params.append('correlationId', filters.correlationId);
      if (filters.contentContains) params.append('contentContains', filters.contentContains);
      if (filters.fromTime) params.append('fromTime', filters.fromTime);
      if (filters.toTime) params.append('toTime', filters.toTime);
      
      // Tablice
      if (filters.streamTypes?.length) {
        filters.streamTypes.forEach(t => params.append('streamTypes', t));
      }
      if (filters.streamIds?.length) {
        filters.streamIds.forEach(n => params.append('streamIds', n));
      }

      // Paginacja (Spring Data format)
      params.append('page', nextPage.toString());
      params.append('size', (filters.size || 50).toString());
      // params.append('sort', 'timestamp,desc'); // Backend ma to domyślnie, ale można dodać

      // 3. Wywołanie API
      const response = await fetch(`/api/search?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data: SearchResult = await response.json();

      // 4. Spłaszczanie struktury (StreamResultEntry -> SearchMessageRow)
      const newRows = (data.results || []).flatMap((stream) =>
        stream.messages.map((msg) => ({
          ...msg,
          streamName: stream.streamName,
          streamType: stream.streamType,
        }))
      );

      // 5. Aktualizacja stanu
      if (isLoadMore) {
        // APPEND: Dodajemy nowe wyniki do starych
        setAccumulatedMessages(prev => [...prev, ...newRows]);
      } else {
        // REPLACE: Nowe wyszukiwanie, czyścimy stare wyniki
        setAccumulatedMessages(newRows);
      }

      setStats({
        totalFound: data.totalFound,
        executionTime: data.executionTimeMs
      });

      // Sprawdzenie czy mamy więcej stron
      // Jeśli backend zwrócił mniej wyników niż rozmiar strony, to znaczy, że to koniec.
      if (newRows.length < (filters.size || 50)) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

    } catch (err) {
      console.error(err);
      setError('Failed to fetch results.');
    } finally {
      setLoading(false);
    }
  }, [filters]); // Zależności: jeśli zmienią się inne filtry, funkcja się odświeży

  // Sortowanie klienta (opcjonalne, ale zalecane przy łączeniu paczek)
  // Backend sortuje per strona, ale przy appendowaniu warto się upewnić.
  const sortedResults = useMemo(() => {
    return [...accumulatedMessages]
  }, [accumulatedMessages]);

  return {
    filters,
    setFilters,
    // API Publiczne:
    search: () => performSearch(false), // Szukaj od nowa
    loadMore: () => performSearch(true), // Dociągnij
    results: sortedResults,
    totalFound: stats.totalFound,
    executionTime: stats.executionTime,
    loading,
    error,
    hasMore
  };
};