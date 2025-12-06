import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// Pamiętaj o imporcie nowego komponentu:
import { StreamTypeBadge } from "@/components/shared/StreamTypeBadge"; 
import { SearchMessageRow } from "@/types";
import { FileJson } from "lucide-react";

interface ResultsTableProps {
  messages: SearchMessageRow[];
  onMessageClick: (msg: SearchMessageRow) => void;
}

export function ResultsTable({ messages, onMessageClick }: ResultsTableProps) {
  return (
    <div className="rounded-xl border border-border bg-background-card overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-background-main/50">
          <TableRow className="hover:bg-transparent border-border">
            <TableHead className="w-[180px]">Stream</TableHead>
            <TableHead className="w-[100px]">Type</TableHead>
            <TableHead className="w-[200px]">Message ID</TableHead>
            <TableHead>Content Preview</TableHead>
            <TableHead className="w-[180px] text-right">Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {messages.map((msg, index) => (
            <TableRow 
              key={`${msg.messageId}-${index}`} 
              className="cursor-pointer hover:bg-white/5 border-border transition-colors group"
              onClick={() => onMessageClick(msg)}
            >
              <TableCell className="font-medium text-text-primary">
                {msg.streamName}
              </TableCell>
              <TableCell>
                {/* Użycie wspólnego komponentu */}
                <StreamTypeBadge type={msg.streamType} />
              </TableCell>
              <TableCell className="font-mono text-xs text-text-secondary truncate max-w-[150px]" title={msg.messageId}>
                {msg.messageId}
              </TableCell>
              <TableCell className="text-text-secondary text-sm">
                <div className="flex items-center gap-2">
                  <FileJson size={14} className="text-primary opacity-70 group-hover:opacity-100 transition-opacity" />
                  <span className="truncate max-w-[300px] opacity-80 font-mono text-xs">
                    {(msg.payload || "").substring(0, 80)}
                    {(msg.payload || "").length > 80 && "..."}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right text-text-secondary font-mono text-xs">
                {new Date(msg.timestamp).toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// UWAGA: Usuń lokalną definicję funkcji StreamTypeBadge z dołu tego pliku!