import React from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SearchMessageRow, normalizeMessage } from "@/types"; // Zaktualizowany import typów
import {
  ExternalLink,
  Database,
  Activity,
  Radio,
  Clock,
  Hash,
  Zap,
} from "lucide-react";
import { cn } from "@/components/lib/utils";

interface SearchResultColumnProps {
  streamName: string;
  results: SearchMessageRow[];
  onEventClick: (event: SearchMessageRow) => void;
}

// 🎨 Helper stylów dla vendorów
// Zwraca ikonę i kolory w zależności od typu strumienia (Kafka/Rabbit/Postgres)
const getVendorStyles = (type: string) => {
  const t = (type || "").toUpperCase();

  if (t.includes("KAFKA")) {
    return {
      icon: <Activity className="h-4 w-4" />,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/30",
      badgeVariant:
        "border-orange-500/50 text-orange-600 dark:text-orange-400 bg-orange-500/10",
      cardHover: "hover:border-orange-500/30 hover:bg-orange-500/5",
    };
  }
  if (t.includes("RABBIT")) {
    return {
      icon: <Radio className="h-4 w-4" />,
      color: "text-rose-500",
      bgColor: "bg-rose-500/10",
      borderColor: "border-rose-500/30",
      badgeVariant:
        "border-rose-500/50 text-rose-600 dark:text-rose-400 bg-rose-500/10",
      cardHover: "hover:border-rose-500/30 hover:bg-rose-500/5",
    };
  }
  if (t.includes("POSTGRES") || t.includes("DB")) {
    return {
      icon: <Database className="h-4 w-4" />,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
      badgeVariant:
        "border-blue-500/50 text-blue-600 dark:text-blue-400 bg-blue-500/10",
      cardHover: "hover:border-blue-500/30 hover:bg-blue-500/5",
    };
  }
  // Default (np. nieznany typ)
  return {
    icon: <Zap className="h-4 w-4" />,
    color: "text-slate-500",
    bgColor: "bg-slate-500/10",
    borderColor: "border-border/60",
    badgeVariant: "outline",
    cardHover: "hover:bg-muted/50",
  };
};

export const SearchResultColumn: React.FC<SearchResultColumnProps> = ({
  streamName,
  results,
  onEventClick,
}) => {
  // Zakładamy, że typ strumienia jest spójny dla całej kolumny
  const streamType = results[0]?.streamType || "KAFKA";
  const styles = getVendorStyles(streamType);

  // Pobranie czasu ostatniego eventu do nagłówka
  const getLastActivity = () => {
    if (!results.length) return "";
    const date = new Date(results[0].timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full w-[360px] min-w-[360px] rounded-xl border overflow-hidden shadow-sm transition-colors",
        "bg-card/20", // Domyślne tło kolumny
        styles.borderColor // Kolor ramki zależny od vendora
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
              {styles.icon}
            </div>
            <h3
              className="font-semibold text-sm truncate text-foreground/90"
              title={streamName}
            >
              {streamName}
            </h3>
          </div>
          {/* Badge typu (KAFKA, RABBIT itp.) */}
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

        {/* Metadane kolumny (Liczba eventów, Czas) */}
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
            // Używamy helpera normalizeMessage do obsługi formatów (JSON/AVRO/BINARY)
            const { displayPayload, formatLabel, formatColor } =
              normalizeMessage(event);

            return (
              <div
                key={`${event.messageId}-${index}`}
                onClick={() => onEventClick(event)}
                className={cn(
                  "group relative p-3 border-b border-border/40 transition-all cursor-pointer",
                  "bg-background/40",
                  styles.cardHover // Dynamiczny kolor hovera
                )}
              >
                {/* Ikona otwarcia (pojawia się na hover) */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                </div>

                {/* 1. Timestamp */}
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

                {/* 2. Format Badge + Correlation ID */}
                <div className="mb-2 pr-4 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    {/* Nowy Badge Formatu (JSON/AVRO/BINARY) */}
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

                {/* 3. Payload Preview */}
                <div className="relative pl-2.5">
                  {/* Kolorowy pasek po lewej stronie payloadu */}
                  <div
                    className={cn(
                      "absolute left-0 top-0 bottom-0 w-0.5 rounded-full transition-colors opacity-30 group-hover:opacity-100",
                      styles.bgColor.replace("/10", "/80") // Hack na ciemniejszy kolor paska
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
