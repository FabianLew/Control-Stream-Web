import React from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SearchMessageRow, normalizeMessage } from "@/types";
import { ExternalLink, Clock, Hash } from "lucide-react";
import { cn } from "@/components/lib/utils";
import { getVendorMeta } from "@/components/lib/vendors";

interface SearchResultColumnProps {
  streamName: string;
  results: SearchMessageRow[];
  onEventClick: (event: SearchMessageRow) => void;
}

// Vendor style helper (Kafka / Rabbit / Postgres).
const getVendorStyles = (type: string) => getVendorMeta(type).search;

export const SearchResultColumn: React.FC<SearchResultColumnProps> = ({
  streamName,
  results,
  onEventClick,
}) => {
  const streamType = results[0]?.streamType || "KAFKA";
  const styles = getVendorStyles(streamType);
  const Icon = styles.icon;

  // Time of last event for header.
  const getLastActivity = () => {
    if (!results.length) return "";
    const date = new Date(results[0].timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full w-[360px] min-w-[360px] rounded-xl border overflow-hidden shadow-sm transition-colors",
        "bg-card/20",
        styles.borderColor
      )}
    >
      {/* --- HEADER --- */}
      <div
        className={cn(
          "p-3 border-b flex flex-col gap-2",
          styles.bgColor,
          styles.borderColor
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div
              className={cn(
                "p-1.5 rounded-md shrink-0 bg-background/60 backdrop-blur-sm",
                styles.color
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <h3
              className="font-semibold text-sm truncate text-foreground/90"
              title={streamName}
            >
              {streamName}
            </h3>
          </div>
          {/* Type badge (KAFKA, RABBIT, etc.) */}
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] h-5 px-1.5 shrink-0",
              styles.badgeVariant
            )}
          >
            {streamType}
          </Badge>
        </div>

        {/* Column metadata (count, time) */}
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground pl-1">
          <span className="flex items-center gap-1">
            <Hash className="h-3 w-3 opacity-70" />
            <span className="font-medium text-foreground">
              {results.length}
            </span>{" "}
            events
          </span>
          <span className="w-1 h-1 rounded-full bg-foreground/20" />
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3 opacity-70" />
            Last: {getLastActivity()}
          </span>
        </div>
      </div>

      {/* --- SCROLLABLE CONTENT --- */}
      <ScrollArea className="flex-1 bg-background/40">
        <div className="flex flex-col">
          {results.map((event, index) => {
            const { displayPayload, formatLabel, formatColor } =
              normalizeMessage(event);

            return (
              <div
                key={`${event.messageId}-${index}`}
                onClick={() => onEventClick(event)}
                className={cn(
                  "group relative p-3 border-b border-border/40 transition-all cursor-pointer",
                  "bg-background/40",
                  styles.cardHover
                )}
              >
                {/* Open icon on hover */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                </div>

                {/* Timestamp */}
                <div className="mb-1.5 flex items-center">
                  <span className="text-[10px] font-mono text-muted-foreground/70 bg-muted/50 px-1.5 py-0.5 rounded">
                    {new Date(event.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      fractionalSecondDigits: 3,
                    })}
                  </span>
                </div>

                {/* Format badge + Correlation ID */}
                <div className="mb-2 pr-4 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={formatColor}
                      className="text-[9px] h-4 px-1 py-0 pointer-events-none"
                    >
                      {formatLabel}
                    </Badge>
                  </div>

                  <span
                    className={cn(
                      "text-xs font-semibold font-mono tracking-tight break-all mt-1",
                      styles.color
                    )}
                  >
                    {event.correlationId || event.messageId}
                  </span>
                </div>

                {/* Payload preview */}
                <div className="relative pl-2.5">
                  <div
                    className={cn(
                      "absolute left-0 top-0 bottom-0 w-0.5 rounded-full transition-colors opacity-30 group-hover:opacity-100",
                      styles.bgColor.replace("/10", "/80")
                    )}
                  />

                  <p className="text-[10px] font-mono text-muted-foreground line-clamp-3 leading-relaxed opacity-80 group-hover:opacity-100 break-all">
                    {displayPayload}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
