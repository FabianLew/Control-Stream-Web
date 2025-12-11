"use client";

import { useEffect, useState } from "react";
import { useSearch } from "@/hooks/useSearch";
import { ResultsTable } from "@/components/search/ResultsTable";
import { SegmentedSearchView } from "@/components/search/SegmentedSearchView";
import { PayloadViewer } from "@/components/search/PayloadViewer";

import {
  AlertCircle,
  Search as SearchIcon,
  ChevronDown,
  Loader2,
  Clock,
  LayoutList,
  Columns,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StreamOption, SearchFilters } from "@/types";

// helper do datetime-local
const toInputFormat = (isoString?: string) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  const offset = date.getTimezoneOffset() * 60000;
  const localIso = new Date(date.getTime() - offset).toISOString();
  return localIso.slice(0, 16);
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
    error,
  } = useSearch();

  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [allStreams, setAllStreams] = useState<StreamOption[]>([]);
  const [areStreamsLoading, setAreStreamsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"unified" | "segmented">("unified");
  const [timePreset, setTimePreset] = useState<string>("1h");

  useEffect(() => {
    setAreStreamsLoading(true);
    fetch("/api/streams/names")
      .then((res) => (res.ok ? res.json() : []))
      .then(setAllStreams)
      .catch(console.error)
      .finally(() => setAreStreamsLoading(false));

    handlePresetChange("1h");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (field: keyof SearchFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    if (field === "fromTime" || field === "toTime") {
      setTimePreset("custom");
    }
  };

  const toggleVendorType = (type: string) => {
    const currentTypes = filters.streamTypes || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter((t) => t !== type)
      : [...currentTypes, type];
    handleInputChange("streamTypes", newTypes);
  };

  const handlePresetChange = (val: string) => {
    setTimePreset(val);
    if (val === "custom") return;

    const now = new Date();
    let from = new Date();

    switch (val) {
      case "15m":
        from.setMinutes(now.getMinutes() - 15);
        break;
      case "1h":
        from.setHours(now.getHours() - 1);
        break;
      case "24h":
        from.setHours(now.getHours() - 24);
        break;
      case "7d":
        from.setDate(now.getDate() - 7);
        break;
      default:
        return;
    }

    setFilters((prev) => ({
      ...prev,
      fromTime: from.toISOString(),
      toTime: now.toISOString(),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    search();
  };

  const hasActiveFilters = !!(
    filters.correlationId ||
    filters.contentContains ||
    (filters.streamIds && filters.streamIds.length > 0)
  );

  const selectedStreamIds = filters.streamIds ?? [];
  const selectedStreamCount = selectedStreamIds.length;
  const streamLabel =
    selectedStreamCount === 0
      ? "All Streams"
      : `${selectedStreamCount} selected`;

  const toggleStream = (streamId: string) => {
    const current = filters.streamIds ?? [];
    const exists = current.includes(streamId);
    const next = exists
      ? current.filter((id) => id !== streamId)
      : [...current, streamId];
    handleInputChange("streamIds", next);
  };

  const clearStreams = () => handleInputChange("streamIds", []);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full max-w-[100vw] overflow-hidden bg-background">
      {/* HEADER / FILTERS */}
      <div className="flex-none w-full border-b border-border bg-card px-4 py-3 shadow-sm z-10">
        <form onSubmit={handleSubmit} className="w-full">
          <div className="flex flex-wrap items-center gap-2 w-full">
            {/* Correlation ID */}
            <div className="relative group w-[220px]">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                <SearchIcon size={14} />
              </div>
              <Input
                placeholder="Correlation ID..."
                value={filters.correlationId || ""}
                onChange={(e) =>
                  handleInputChange("correlationId", e.target.value)
                }
                className="pl-9 h-9 bg-background text-sm font-mono focus-visible:ring-1"
              />
            </div>

            {/* Payload contains */}
            <div className="w-[220px]">
              <Input
                placeholder="Payload contains..."
                value={filters.contentContains || ""}
                onChange={(e) =>
                  handleInputChange("contentContains", e.target.value)
                }
                className="h-9 bg-background text-sm focus-visible:ring-1"
              />
            </div>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* MULTISELECT STREAMS */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 min-w-[190px] bg-background text-xs font-normal justify-between"
                >
                  <span className="truncate">
                    {areStreamsLoading ? "Loading streams..." : streamLabel}
                  </span>
                  <ChevronDown size={12} className="ml-2 shrink-0 opacity-60" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-64 p-2 space-y-2"
                align="start"
                sideOffset={4}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Streams
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[11px]"
                    onClick={clearStreams}
                  >
                    Clear
                  </Button>
                </div>

                <div className="flex items-center gap-2 py-1">
                  <Checkbox
                    id="all-streams"
                    checked={selectedStreamCount === 0}
                    onCheckedChange={() => clearStreams()}
                  />
                  <label
                    htmlFor="all-streams"
                    className="text-xs leading-none cursor-pointer"
                  >
                    All streams
                  </label>
                </div>

                <Separator className="my-1" />

                <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                  {allStreams.map((s) => {
                    const checked = selectedStreamIds.includes(s.id);
                    return (
                      <div
                        key={s.id}
                        className="flex items-center gap-2 py-0.5"
                      >
                        <Checkbox
                          id={`stream-${s.id}`}
                          checked={checked}
                          onCheckedChange={() => toggleStream(s.id)}
                        />
                        <label
                          htmlFor={`stream-${s.id}`}
                          className="text-xs leading-none cursor-pointer truncate"
                        >
                          {s.name}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>

            {/* TIME PRESET */}
            <Select value={timePreset} onValueChange={handlePresetChange}>
              <SelectTrigger className="w-[140px] h-9 bg-background text-xs">
                <Clock size={14} className="mr-2 text-muted-foreground" />
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

            {/* RIGHT SIDE: VIEW TOGGLE + SEARCH */}
            <div className="ml-auto flex items-center gap-3">
              {/* View mode switch */}
              <TooltipProvider>
                <div className="hidden lg:flex bg-muted/50 p-1 rounded-lg border border-border/50">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant={viewMode === "unified" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("unified")}
                        className={`h-7 px-3 text-xs gap-1.5 transition-all ${
                          viewMode === "unified"
                            ? "shadow-sm bg-background text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <LayoutList size={14} /> List
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      Unified chronological view
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant={
                          viewMode === "segmented" ? "secondary" : "ghost"
                        }
                        size="sm"
                        onClick={() => setViewMode("segmented")}
                        className={`h-7 px-3 text-xs gap-1.5 transition-all ${
                          viewMode === "segmented"
                            ? "shadow-sm bg-background text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Columns size={14} /> Streams
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      Grouped by stream columns
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>

              {/* Search button */}
              <Button
                type="submit"
                size="sm"
                disabled={loading}
                className={`h-9 px-6 font-medium transition-all ${
                  hasActiveFilters
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {loading ? (
                  <Loader2 size={14} className="animate-spin mr-2" />
                ) : (
                  <SearchIcon size={14} className="mr-2" />
                )}
                Search
              </Button>
            </div>
          </div>

          {/* ADVANCED FILTERS */}
          <Collapsible
            open={isAdvancedOpen}
            onOpenChange={setIsAdvancedOpen}
            className="mt-2"
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] text-muted-foreground gap-1 px-1 hover:bg-transparent hover:text-primary w-full justify-center border-t border-transparent hover:border-border mt-2"
              >
                {isAdvancedOpen ? "Hide" : "Show"} Advanced Filters{" "}
                <ChevronDown
                  size={10}
                  className={`transition-transform ${
                    isAdvancedOpen ? "rotate-180" : ""
                  }`}
                />
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="pt-3 pb-2 border-t border-dashed border-border mt-2 animate-in slide-in-from-top-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                    Vendor Type
                  </label>
                  <div className="flex gap-2">
                    {["KAFKA", "RABBIT", "POSTGRES"].map((t) => {
                      const isActive = filters.streamTypes?.includes(t);
                      return (
                        <Badge
                          key={t}
                          variant={isActive ? "default" : "outline"}
                          className={`cursor-pointer text-[10px] px-2.5 py-0.5 select-none transition-all ${
                            isActive
                              ? "hover:bg-primary/90 border-primary"
                              : "hover:border-primary hover:text-primary text-muted-foreground bg-background"
                          }`}
                          onClick={() => toggleVendorType(t)}
                        >
                          {t}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                    From
                  </label>
                  <Input
                    type="datetime-local"
                    className="h-8 text-xs bg-background font-sans [color-scheme:dark]"
                    value={toInputFormat(filters.fromTime)}
                    onChange={(e) =>
                      handleInputChange(
                        "fromTime",
                        new Date(e.target.value).toISOString()
                      )
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                    To
                  </label>
                  <Input
                    type="datetime-local"
                    className="h-8 text-xs bg-background font-sans [color-scheme:dark]"
                    value={toInputFormat(filters.toTime)}
                    onChange={(e) =>
                      handleInputChange(
                        "toTime",
                        new Date(e.target.value).toISOString()
                      )
                    }
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </form>
      </div>

      {/* RESULTS AREA */}
      <div className="flex-1 min-h-0 min-w-0 w-full overflow-hidden relative bg-background/50 flex flex-col">
        {error && (
          <div className="flex-none p-4 m-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-2 text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {results.length > 0 ? (
          <>
            <div className="flex-none px-6 pt-4 pb-2 flex justify-between items-end">
              <span className="text-xs text-muted-foreground">
                Found{" "}
                <span className="text-foreground font-medium">
                  {totalFound}
                </span>{" "}
                events
                <span className="mx-1.5 opacity-50">|</span>
                {executionTime}ms
              </span>
            </div>

            <div className="flex-1 min-h-0 min-w-0 w-full relative">
              {viewMode === "unified" ? (
                <div className="h-full w-full overflow-y-auto px-4 md:px-6 pb-4">
                  <ResultsTable
                    messages={results}
                    onMessageClick={setSelectedMessage}
                  />
                  {hasMore && (
                    <div className="py-4 text-center">
                      <Button
                        variant="outline"
                        onClick={loadMore}
                        disabled={loading}
                        className="gap-2 text-xs h-8"
                      >
                        {loading ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <ChevronDown size={12} />
                        )}
                        Load older events
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full w-full overflow-hidden">
                  <SegmentedSearchView
                    results={results}
                    onMessageClick={setSelectedMessage}
                  />
                </div>
              )}
            </div>
          </>
        ) : (
          !loading && (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4 opacity-70">
              <SearchIcon size={48} className="opacity-20" />
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
