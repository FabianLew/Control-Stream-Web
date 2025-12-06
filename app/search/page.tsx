"use client";

import { useState, useMemo, useEffect } from "react";
import { ResultsTable } from "@/components/search/ResultsTable";
import { PayloadViewer } from "@/components/search/PayloadViewer";
import { useSearch } from "@/hooks/useSearch";
import { SearchFilters, StreamOption } from "@/types";
import { AlertCircle, Filter, Search, X, ChevronDown, Check, Loader2 } from "lucide-react";

export default function SearchPage() {
  const { 
    filters, 
    setFilters, 
    search,
    loadMore,
    hasMore,
    results, 
    totalFound, 
    executionTime, 
    loading, 
    error 
  } = useSearch();
  
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // --- NOWE STANY DLA STREAMÓW ---
  const [allStreams, setAllStreams] = useState<StreamOption[]>([]); // Dane z backendu
  const [areStreamsLoading, setAreStreamsLoading] = useState(false);
  
  const [isStreamNameDropdownOpen, setIsStreamNameDropdownOpen] = useState(false);
  const [streamDropdownSearch, setStreamDropdownSearch] = useState(""); // Szukanie wewnątrz dropdowna

  // 1. Pobieranie listy strumieni przy starcie
  useEffect(() => {
    const fetchStreams = async () => {
      setAreStreamsLoading(true);
      try {
        // Dostosuj URL do swojego kontrolera
        const res = await fetch('/api/streams/names'); 
        if (res.ok) {
          const data = await res.json();
          setAllStreams(data);
        }
      } catch (e) {
        console.error("Failed to load streams", e);
      } finally {
        setAreStreamsLoading(false);
      }
    };
    fetchStreams();
  }, []);

  // 2. Logika filtrowania opcji w dropdownie
  // To decyduje, co użytkownik widzi na liście do wyboru
  const filteredStreamOptions = useMemo(() => {
    return allStreams.filter(stream => {
      // Warunek 1: Czy pasuje do zaznaczonych Typów (Kafka/Rabbit...)?
      const typeMatches = !filters.streamTypes || filters.streamTypes.length === 0 || filters.streamTypes.includes(stream.type);
      
      // Warunek 2: Czy pasuje do wpisanej frazy w wyszukiwarce dropdowna?
      const searchMatches = stream.name.toLowerCase().includes(streamDropdownSearch.toLowerCase());
      
      return typeMatches && searchMatches;
    });
  }, [allStreams, filters.streamTypes, streamDropdownSearch]);

  // Obsługa formularza
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    search();
  };

  const handleInputChange = (field: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const toggleStreamType = (type: string) => {
    const currentTypes = filters.streamTypes || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    
    handleInputChange("streamTypes", newTypes);
    // Nie czyścimy streamNames automatycznie - użytkownik może chcieć zachować wybór,
    // nawet jeśli chwilowo odfiltrował dany typ.
  };

  const toggleStream = (streamId: string) => {
    const currentIds = filters.streamIds || [];
    
    const newIds = currentIds.includes(streamId)
      ? currentIds.filter(id => id !== streamId)
      : [...currentIds, streamId];
    
    // Zapisujemy w stanie ID-ki
    handleInputChange("streamIds", newIds);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 p-6">
      
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">Event Explorer</h1>
        <p className="text-text-secondary">Live search across your Kafka, RabbitMQ and Postgres streams.</p>
      </div>

      <div className="p-6 rounded-2xl bg-background-card border border-border shadow-lg space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Main Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
              <input
                type="text"
                value={filters.correlationId || ''}
                onChange={(e) => handleInputChange("correlationId", e.target.value)}
                placeholder="Correlation ID (leave empty to fetch all)..."
                className="w-full bg-background-main/50 border border-border rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
              />
            </div>
            <button 
              type="button" 
              onClick={() => setShowFilters(!showFilters)}
              className={`p-3 rounded-xl border transition-colors flex items-center gap-2 ${showFilters ? 'bg-primary/20 border-primary text-primary' : 'bg-background-main/50 border-border text-text-secondary'}`}
            >
              <Filter size={20} />
              <span className="hidden sm:inline">Filters</span>
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 shadow-lg shadow-primary/20"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Search'}
            </button>
          </div>

          {/* Extended Filters Panel */}
          {showFilters && (
            <div className="pt-4 border-t border-border grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-2">
              
              {/* 1. Time Range */}
              <div className="space-y-2">
                <label className="text-xs uppercase font-bold text-text-secondary">Time Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    type="datetime-local" 
                    className="bg-background-main/30 border border-border rounded-lg p-2 text-sm text-white focus:border-primary outline-none"
                    onChange={(e) => handleInputChange("fromTime", e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                  />
                  <input 
                    type="datetime-local" 
                    className="bg-background-main/30 border border-border rounded-lg p-2 text-sm text-white focus:border-primary outline-none"
                    onChange={(e) => handleInputChange("toTime", e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                  />
                </div>
              </div>

              {/* 2. Payload & Types */}
              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-text-secondary">Payload Content</label>
                    <input 
                      type="text" 
                      placeholder="e.g. error, user_id..."
                      className="w-full bg-background-main/30 border border-border rounded-lg p-2 text-sm text-white focus:border-primary outline-none"
                      value={filters.contentContains || ''}
                      onChange={(e) => handleInputChange("contentContains", e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-text-secondary">Stream Types</label>
                    <div className="flex gap-2 flex-wrap">
                      {['KAFKA', 'RABBIT', 'POSTGRES'].map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => toggleStreamType(type)}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                            (filters.streamTypes || []).includes(type)
                              ? 'bg-primary/20 border-primary text-primary'
                              : 'bg-background-main/30 border-border text-text-secondary hover:border-text-secondary'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
              </div>

              {/* 3. Stream Name (Advanced Multi-select) */}
              <div className="space-y-2">
                 <label className="text-xs uppercase font-bold text-text-secondary">Stream Names</label>
                 <div className="relative">
                  
                   {/* Przycisk otwierający */}
                   <button
                      type="button"
                      onClick={() => setIsStreamNameDropdownOpen(!isStreamNameDropdownOpen)}
                      className="w-full bg-background-main/30 border border-border rounded-lg p-2 text-sm text-white flex justify-between items-center focus:border-primary transition-colors text-left"
                   >
                      <span className="truncate">
                        {filters.streamIds && filters.streamIds.length > 0
                          ? `${filters.streamIds.length} selected`
                          : "Select streams..."}
                      </span>
                      <ChevronDown size={16} className="text-text-secondary" />
                   </button>

                   {/* Dropdown Content */}
                   {isStreamNameDropdownOpen && (
                     <>
                       <div 
                         className="fixed inset-0 z-10" 
                         onClick={() => setIsStreamNameDropdownOpen(false)} 
                       />
                       
                       <div className="absolute z-20 mt-2 w-full bg-background-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 flex flex-col max-h-[300px]">
                          
                          {/* A. Search Input inside Dropdown */}
                          <div className="p-2 border-b border-border bg-background-card sticky top-0">
                            <div className="relative">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-text-secondary" size={14} />
                                <input 
                                  type="text"
                                  autoFocus
                                  placeholder="Filter streams..."
                                  className="w-full bg-background-main border border-border rounded-md py-1.5 pl-8 pr-2 text-xs text-white focus:border-primary outline-none"
                                  value={streamDropdownSearch}
                                  onChange={(e) => setStreamDropdownSearch(e.target.value)}
                                />
                            </div>
                          </div>

                          {/* B. Scrollable List */}
                          <div className="overflow-y-auto flex-1 p-1">
                            {areStreamsLoading ? (
                                <div className="p-4 text-center text-text-secondary"><Loader2 className="animate-spin mx-auto" /></div>
                            ) : filteredStreamOptions.length === 0 ? (
                                <div className="p-3 text-xs text-text-secondary text-center">
                                  No streams found.
                                </div>
                            ) : (
                            filteredStreamOptions.map(stream => {
                              // SPRAWDZAMY PO ID:
                              const isSelected = (filters.streamIds || []).includes(stream.id);
                              
                              return (
                                <div 
                                  key={stream.id} // Używamy ID jako klucza
                                  // PRZEKAZUJEMY ID:
                                  onClick={() => toggleStream(stream.id)} 
                                  className={`
                                    flex items-center gap-3 p-2 rounded-lg cursor-pointer text-sm transition-colors
                                    ${isSelected ? 'bg-primary/20 text-white' : 'text-text-secondary hover:bg-white/5'}
                                  `}
                                >
                                  <div className={`
                                    w-4 h-4 rounded border flex items-center justify-center flex-shrink-0
                                    ${isSelected ? 'bg-primary border-primary' : 'border-text-secondary/50'}
                                  `}>
                                    {isSelected && <Check size={10} className="text-white" />}
                                  </div>
                                  
                                  <div className="flex flex-col truncate">
                                    {/* Wyświetlamy NAZWĘ */}
                                    <span className="font-medium truncate">{stream.name}</span>
                                    <span className="text-[10px] opacity-60 uppercase">{stream.type}</span>
                                  </div>
                                </div>
                              );
                            })
                            )}
                          </div>
                          
                          {/* C. Footer (Optional info) */}
                          <div className="p-2 border-t border-border bg-background-lighter text-[10px] text-text-secondary flex justify-between">
                            <span>{filteredStreamOptions.length} available</span>
                            {filters.streamIds?.length ? (
                              // Czyścimy ID-ki
                              <button onClick={() => handleInputChange("streamIds", [])} className="hover:text-white underline">Clear</button>
                            ) : null}
                          </div>
                       </div>
                     </>
                   )}
                 </div>
                 
                 {/* Selected Tags Display */}
              {filters.streamIds && filters.streamIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2 max-h-[60px] overflow-y-auto custom-scrollbar">
                  {filters.streamIds.map(id => {
                    // SZUKAMY NAZWY DLA DANEGO ID:
                    const streamObj = allStreams.find(s => s.id === id);
                    const displayName = streamObj ? streamObj.name : id; // fallback do ID jeśli nie znaleziono

                    return (
                      <span key={id} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-background-main border border-border text-[10px] text-text-secondary animate-in zoom-in">
                        {displayName}
                        <button 
                          type="button"
                          // USUWANIE PO ID:
                          onClick={() => toggleStream(id)}
                          className="hover:text-white rounded-full p-0.5 hover:bg-white/10"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
              </div>

            </div>
          )}
        </form>
      </div>

      {/* ERROR & RESULTS SECTIONS (Bez zmian) */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-semibold text-white">Results</h2>
            <div className="flex gap-4 text-sm text-text-secondary font-mono">
              <span>Found: <span className="text-primary">{totalFound}</span></span>
              <span>Time: <span className="text-primary">{executionTime}ms</span></span>
            </div>
          </div>
          <ResultsTable 
            messages={results} 
            onMessageClick={setSelectedMessage} 
          />
          {hasMore && (
             <div className="flex justify-center pt-4 pb-12">
               <button
                 onClick={loadMore}
                 disabled={loading}
                 className="
                    group flex items-center gap-2 px-6 py-2.5 
                    bg-background-card border border-border rounded-full 
                    text-sm text-text-secondary hover:text-white hover:border-primary/50 hover:bg-white/5
                    transition-all shadow-lg active:scale-95
                 "
               >
                 {loading ? (
                   <>
                     <Loader2 size={16} className="animate-spin text-primary" />
                     <span>Loading more...</span>
                   </>
                 ) : (
                   <>
                     <ChevronDown size={16} className="group-hover:translate-y-0.5 transition-transform" />
                     <span>Load more results</span>
                   </>
                 )}
               </button>
             </div>
           )}
           
           {/* Informacja o końcu wyników */}
           {!hasMore && results.length > 0 && (
              <div className="text-center py-8">
                 <span className="text-xs text-text-secondary opacity-50 px-3 py-1 border border-border rounded-full">
                    End of results
                 </span>
              </div>
           )}
         </div>
       )}

      {!loading && !error && results.length === 0 && (
        <div className="text-center py-10 text-text-secondary">
           No events found matching your criteria.
        </div>
      )}

      <PayloadViewer 
        message={selectedMessage} 
        isOpen={!!selectedMessage} 
        onClose={() => setSelectedMessage(null)} 
      />
    </div>
  );
}