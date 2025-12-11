import React from "react";
import {
  useSegmentedSearch,
  SearchResultDto,
} from "@/hooks/useSegmentedSearch";
import { SearchResultColumn } from "./SearchResultColumn";
import { Info, Hand } from "lucide-react";
import { cn } from "@/components/lib/utils";
import { useDraggableScroll } from "@/hooks/useDraggableScroll";

interface SegmentedSearchViewProps {
  results: SearchResultDto[];
  onMessageClick: (msg: any) => void;
}

const VISIBLE_COLUMNS = 3;
const COLUMN_WIDTH = 380; // px
const COLUMN_GAP = 24; // tailwind gap-6 (6 * 4px)

export const SegmentedSearchView: React.FC<SegmentedSearchViewProps> = ({
  results,
  onMessageClick,
}) => {
  const { groupedResults } = useSegmentedSearch(results);
  const streamNames = Object.keys(groupedResults);
  const { ref, events, isDragging } = useDraggableScroll();

  if (streamNames.length === 0) return null;

  // szerokość viewportu na kolumny = dokładnie 3 kolumny + 2 przerwy
  const visibleWidthPx =
    VISIBLE_COLUMNS * COLUMN_WIDTH + (VISIBLE_COLUMNS - 1) * COLUMN_GAP;

  return (
    <div className="w-full h-full flex flex-col animate-in fade-in duration-300">
      {/* Pasek info nad kolumnami */}
      <div className="flex-none px-6 pb-2 pt-0 flex items-center justify-between text-xs text-muted-foreground select-none">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5" />
          <span>{streamNames.length} active streams</span>
        </div>
        <div className="flex items-center gap-2 opacity-70">
          <Hand className="w-3.5 h-3.5" />
          <span>Drag to scroll</span>
        </div>
      </div>

      {/* Obszar z kolumnami – viewport na 3 kolumny, reszta w poziomym scrollu */}
      <div
        ref={ref}
        {...events}
        className={cn(
          "flex-1 w-full overflow-x-auto overflow-y-hidden px-6 pb-4 select-none",
          "scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent",
          isDragging ? "cursor-grabbing" : "cursor-grab",
          "active:cursor-grabbing"
        )}
      >
        {/* Ten wrapper ma stałą szerokość: zawsze 3 kolumny */}
        <div
          className="mx-auto h-full"
          style={{ width: `${visibleWidthPx}px` }}
        >
          {/* A tu jest faktyczna liczba kolumn (może być > 3) */}
          <div className="flex flex-row gap-6 h-full w-max">
            {streamNames.map((streamName) => (
              <div key={streamName} className="h-full w-[380px] shrink-0">
                <SearchResultColumn
                  streamName={streamName}
                  results={groupedResults[streamName]}
                  onEventClick={onMessageClick}
                />
              </div>
            ))}
            {/* mały „oddech” na końcu scrolla */}
            <div className="w-6 shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );
};
