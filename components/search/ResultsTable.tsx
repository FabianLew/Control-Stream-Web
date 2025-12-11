"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StreamTypeBadge } from "@/components/shared/StreamTypeBadge";
import { SearchMessageRow } from "@/types";
import { FileJson, ArrowRight, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface ResultsTableProps {
  messages: SearchMessageRow[];
  onMessageClick: (msg: SearchMessageRow) => void;
}

const getRowSeverityClass = (payload: string) => {
    const lower = payload.toLowerCase();
    if (lower.includes("error") || lower.includes("exception") || lower.includes("fail")) {
        return "bg-red-500/5 hover:bg-red-500/10 border-l-2 border-l-red-500";
    }
    if (lower.includes("warn")) {
        return "bg-amber-500/5 hover:bg-amber-500/10 border-l-2 border-l-amber-500";
    }
    return "hover:bg-muted/50 border-l-2 border-l-transparent";
};

export function ResultsTable({ messages, onMessageClick }: ResultsTableProps) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow className="hover:bg-transparent border-border">
            <TableHead className="w-[180px]">Stream</TableHead>
            <TableHead className="w-[90px]">Type</TableHead>
            {/* ZMIANA: Dodano kolumnę Correlation ID */}
            <TableHead className="w-[160px]">Correlation ID</TableHead>
            <TableHead className="w-[160px]">Message ID</TableHead>
            <TableHead>Content Preview</TableHead>
            <TableHead className="w-[160px] text-right">Time</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {messages.map((msg, index) => {
            const rowClass = getRowSeverityClass(msg.payload || "");
            
            return (
                <TableRow 
                  key={`${msg.messageId}-${index}`} 
                  className={`cursor-pointer transition-colors group ${rowClass}`}
                  onClick={() => onMessageClick(msg)}
                >
                  <TableCell>
                    <div className="flex flex-col">
                        <Link 
                            href={`/streams/${msg.streamId || '#'}`}
                            className="font-medium text-foreground hover:text-primary hover:underline flex items-center gap-1 w-fit"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {msg.streamName}
                            <ExternalLink size={10} className="opacity-50"/>
                        </Link>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <StreamTypeBadge type={msg.streamType} />
                  </TableCell>

                  {/* ZMIANA: Wyświetlanie Correlation ID */}
                  <TableCell className="font-mono text-xs text-foreground/80 truncate max-w-[150px]" title={msg.correlationId}>
                    {msg.correlationId || "-"}
                  </TableCell>
                  
                  <TableCell className="font-mono text-xs text-muted-foreground truncate max-w-[150px]" title={msg.messageId}>
                    {msg.messageId.substring(0, 12)}...
                  </TableCell>
                  
                  <TableCell className="text-muted-foreground text-sm">
                    <div className="flex items-center gap-2">
                      <FileJson size={14} className="text-primary opacity-50 group-hover:opacity-100 transition-opacity shrink-0" />
                      <code className="truncate max-w-[400px] opacity-90 font-mono text-xs bg-muted/30 px-1.5 py-0.5 rounded text-foreground/80">
                        {(msg.payload || "").substring(0, 100)}
                      </code>
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end">
                        <span className="text-xs font-mono text-foreground">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                        </span>
                    </div>
                  </TableCell>

                  <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all">
                          <ArrowRight size={16} />
                      </Button>
                  </TableCell>
                </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}