import { useState, useMemo } from 'react';

// --- Definicje typów (możesz je przenieść do osobnego pliku types.ts) ---
export interface Message {
  timestamp: string;
  content: string;
  [key: string]: any;
}

export interface StreamResult {
  streamName: string;
  streamType: string;
  messages: Message[];
}

export interface SearchMessageRow extends Message {
  streamName: string;
  streamType: string;
}
// -----------------------------------------------------------------------

export const useSearch = () => {
  const [query, setQuery] = useState('');
  const [rawResults, setRawResults] = useState<StreamResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Funkcja wykonująca strzał do API
  const performSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Tutaj wstawiasz swój URL do API
      const response = await fetch(`/api/search?correlationId=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error('Błąd pobierania danych');
      }

      const data: StreamResult[] = await response.json();
      setRawResults(data);
      
    } catch (err) {
      console.error(err);
      setError('Wystąpił problem z wyszukiwaniem.');
      setRawResults([]); // Czyścimy wyniki w razie błędu
    } finally {
      setLoading(false);
    }
  };

  // --- TWOJA LOGIKA PRZETWARZANIA DANYCH ---
  // Przenosimy ją tutaj. Dzięki useMemo wykona się tylko gdy zmienią się dane z API.
  const processedResults: SearchMessageRow[] = useMemo(() => {
    return rawResults
      .flatMap((stream) =>
        stream.messages.map((msg) => ({
          ...msg,
          streamName: stream.streamName,
          streamType: stream.streamType,
        }))
      )
  }, [rawResults]);

  // Zwracamy wszystko, czego potrzebuje widok (page.tsx)
  return {
    query,
    setQuery,
    performSearch,
    results: processedResults, // Zwracamy już posortowane, płaskie dane!
    loading,
    error
  };
};