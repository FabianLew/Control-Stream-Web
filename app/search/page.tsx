"use client";

import { useState, useEffect } from "react";
import { ResultsTable } from "@/components/search/ResultsTable";
import { PayloadViewer } from "@/components/search/PayloadViewer";
import { useSearch } from "@/hooks/useSearch";
import { SearchFilters, StreamOption } from "@/types";
import { 
    AlertCircle, Search, ChevronDown, Loader2, 
    Clock
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// --- HELPER: Formatowanie daty dla input type="datetime-local" ---
// Input oczekuje: "YYYY-MM-DDTHH:mm", a w stanie trzymamy ISO ("YYYY-MM-DDTHH:mm:ss.sssZ")
const toInputFormat = (isoString?: string) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  // Musimy uwzględnić strefę czasową użytkownika, bo datetime-local działa lokalnie
  // Prost trick na przesunięcie strefy:
  const offset = date.getTimezoneOffset() * 60000;
  const localIso = new Date(date.getTime() - offset).toISOString();
  return localIso.slice(0, 16); // Wycina sekundy i 'Z'
};

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
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [allStreams, setAllStreams] = useState<StreamOption[]>([]);
  const [areStreamsLoading, setAreStreamsLoading] = useState(false);

  // Stan dla selecta presetów (żeby wiedzieć co wyświetlić w SelectValue)
  const [timePreset, setTimePreset] = useState<string>("1h");

  useEffect(() => {
    setAreStreamsLoading(true);
    fetch('/api/streams/names')
        .then(res => res.ok ? res.json() : [])
        .then(setAllStreams)
        .catch(err => console.error(err))
        .finally(() => setAreStreamsLoading(false));
    
    // Inicjalizacja domyślnego czasu (np. 1h) przy starcie
    handlePresetChange("1h");
  }, []);

  const handleInputChange = (field: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    // Jeśli użytkownik ręcznie zmienia daty, resetujemy preset na "custom"
    if (field === 'fromTime' || field === 'toTime') {
        setTimePreset("custom");
    }
  };

  const toggleVendorType = (type: string) => {
    const currentTypes = filters.streamTypes || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    
    handleInputChange("streamTypes", newTypes);
  };

  // --- LOGIKA PRESETÓW CZASOWYCH ---
  const handlePresetChange = (val: string) => {
    setTimePreset(val);
    if (val === 'custom') return;

    const now = new Date();
    let from = new Date();

    switch (val) {
        case '15m': from.setMinutes(now.getMinutes() - 15); break;
        case '1h': from.setHours(now.getHours() - 1); break;
        case '24h': from.setHours(now.getHours() - 24); break;
        case '7d': from.setDate(now.getDate() - 7); break;
        default: return;
    }

    setFilters(prev => ({
        ...prev,
        fromTime: from.toISOString(),
        toTime: now.toISOString()
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    search();
  };

  const hasActiveFilters = !!(filters.correlationId || filters.contentContains || (filters.streamIds && filters.streamIds.length > 0));

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-background">
      
      <div className="border-b border-border bg-card px-4 py-3 shadow-sm z-10 flex-none">
        <form onSubmit={handleSubmit}>
            <div className="flex flex-wrap items-center gap-2">
                
                <div className="relative group w-[220px]">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                        <Search size={14} />
                    </div>
                    <Input 
                        placeholder="Correlation ID..." 
                        value={filters.correlationId || ''}
                        onChange={(e) => handleInputChange("correlationId", e.target.value)}
                        className="pl-9 h-9 bg-background text-sm font-mono focus-visible:ring-1"
                    />
                </div>

                <div className="w-[220px]">
                    <Input 
                        placeholder="Payload contains..." 
                        value={filters.contentContains || ''}
                        onChange={(e) => handleInputChange("contentContains", e.target.value)}
                        className="h-9 bg-background text-sm focus-visible:ring-1"
                    />
                </div>

                <Separator orientation="vertical" className="h-6 mx-1" />

                <Select 
                    value={filters.streamIds?.[0] || "ALL"} 
                    onValueChange={(val) => handleInputChange("streamIds", val === "ALL" ? [] : [val])}
                >
                    <SelectTrigger className="w-[180px] h-9 bg-background text-xs">
                        <SelectValue placeholder="All Streams" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Streams</SelectItem>
                        {allStreams.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* --- TIME PRESET SELECT --- */}
                <Select 
                    value={timePreset} 
                    onValueChange={handlePresetChange}
                >
                    <SelectTrigger className="w-[140px] h-9 bg-background text-xs">
                        <Clock size={14} className="mr-2 text-muted-foreground"/>
                        <SelectValue placeholder="Time Range" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="15m">Last 15 min</SelectItem>
                        <SelectItem value="1h">Last 1 Hour</SelectItem>
                        <SelectItem value="24h">Last 24 Hours</SelectItem>
                        <SelectItem value="7d">Last 7 Days</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                </Select>

                <Button 
                    type="submit" 
                    size="sm"
                    disabled={loading}
                    className={`h-9 px-6 ml-auto font-medium transition-all ${
                        hasActiveFilters ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                >
                    {loading ? <Loader2 size={14} className="animate-spin mr-2"/> : <Search size={14} className="mr-2"/>}
                    Search
                </Button>
            </div>

            <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen} className="mt-2">
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] text-muted-foreground gap-1 px-1 hover:bg-transparent hover:text-primary w-full justify-center border-t border-transparent hover:border-border mt-2">
                        {isAdvancedOpen ? 'Hide' : 'Show'} Advanced Filters <ChevronDown size={10} className={`transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`}/>
                    </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="pt-3 pb-2 border-t border-dashed border-border mt-2 animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Vendor Type</label>
                            <div className="flex gap-2">
                                {['KAFKA', 'RABBIT', 'POSTGRES'].map(t => {
                                    const isActive = filters.streamTypes?.includes(t);
                                    return (
                                        <Badge 
                                            key={t} 
                                            variant={isActive ? "default" : "outline"} 
                                            className={`
                                                cursor-pointer text-[10px] px-2.5 py-0.5 select-none transition-all
                                                ${isActive 
                                                    ? 'hover:bg-primary/90 border-primary' 
                                                    : 'hover:border-primary hover:text-primary text-muted-foreground bg-background'
                                                }
                                            `}
                                            onClick={() => toggleVendorType(t)}
                                        >
                                            {t}
                                        </Badge>
                                    );
                                })}
                            </div>
                        </div>

                        {/* --- DATE INPUTS SYNCED WITH PRESET --- */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">From</label>
                            <div className="relative">
                                <Input 
                                    type="datetime-local" 
                                    className="h-8 text-xs bg-background font-sans [color-scheme:dark]" 
                                    // Używamy helpera toInputFormat
                                    value={toInputFormat(filters.fromTime)}
                                    onChange={(e) => {
                                        // Przy zmianie ręcznej konwertujemy z powrotem na ISO
                                        const date = new Date(e.target.value);
                                        handleInputChange("fromTime", date.toISOString());
                                    }}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">To</label>
                            <div className="relative">
                                <Input 
                                    type="datetime-local" 
                                    className="h-8 text-xs bg-background font-sans [color-scheme:dark]"
                                    value={toInputFormat(filters.toTime)}
                                    onChange={(e) => {
                                        const date = new Date(e.target.value);
                                        handleInputChange("toTime", date.toISOString());
                                    }}
                                />
                            </div>
                        </div>

                    </div>
                </CollapsibleContent>
            </Collapsible>
        </form>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 bg-background/50">
        {error && (
            <div className="mb-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-2 text-sm">
                <AlertCircle size={16} /> {error}
            </div>
        )}

        {results.length > 0 ? (
            <div className="space-y-2">
                <div className="flex justify-between items-end px-1 pb-1">
                    <span className="text-xs text-muted-foreground">
                        Found <span className="text-foreground font-medium">{totalFound}</span> events 
                        <span className="mx-1.5 opacity-50">|</span> 
                        {executionTime}ms
                    </span>
                </div>
                
                <ResultsTable 
                    messages={results} 
                    onMessageClick={setSelectedMessage} 
                />

                {hasMore && (
                    <div className="py-4 text-center">
                        <Button variant="outline" onClick={loadMore} disabled={loading} className="gap-2 text-xs h-8">
                            {loading ? <Loader2 size={12} className="animate-spin"/> : <ChevronDown size={12}/>}
                            Load older events
                        </Button>
                    </div>
                )}
            </div>
        ) : (
            !loading && (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4 opacity-70">
                    <Search size={48} className="opacity-20"/>
                    <p>No events found. Try adjusting your filters.</p>
                </div>
            )
        )}
      </div>

      <PayloadViewer 
        message={selectedMessage} 
        isOpen={!!selectedMessage} 
        onClose={() => setSelectedMessage(null)} 
      />
    </div>
  );
}