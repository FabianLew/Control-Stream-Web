"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SearchMessage, SearchMessageRow } from "@/types";
import { Copy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface PayloadViewerProps {
  message: SearchMessageRow | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PayloadViewer({ message, isOpen, onClose }: PayloadViewerProps) {
  if (!message) return null;

  // Próba sparsowania JSON-a do ładnego wyświetlenia
  const formatJson = (jsonString: string) => {
    try {
      const obj = JSON.parse(jsonString);
      return JSON.stringify(obj, null, 2);
    } catch (e) {
      return jsonString; // Fallback do zwykłego tekstu
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[600px] sm:w-[800px] bg-background-card border-border overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl font-mono text-primary flex items-center gap-2">
            Details: {message.messageId}
          </SheetTitle>
          <SheetDescription>
            Received from <span className="font-bold text-text-primary">{message.streamName}</span> ({message.streamType})
          </SheetDescription>
        </SheetHeader>

        {/* Section: Payload */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Message Payload</h3>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 text-xs border-border bg-background-main hover:bg-white/5"
              onClick={() => navigator.clipboard.writeText(message.payload)}
            >
              <Copy size={12} className="mr-2" /> Copy JSON
            </Button>
          </div>
          
          <div className="rounded-lg border border-border bg-background-main p-4 overflow-x-auto">
            <pre className="text-xs font-mono text-green-400 whitespace-pre-wrap">
              {formatJson(message.payload)}
            </pre>
          </div>
        </div>

        <Separator className="my-6 bg-border" />

        {/* Section: Headers */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Metadata & Headers</h3>
          <div className="rounded-lg border border-border bg-background-main p-4">
             <div className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
                
                <span className="text-text-secondary">Correlation ID:</span>
                <span className="font-mono text-text-primary">{message.correlationId || "N/A"}</span>

                <span className="text-text-secondary">Timestamp:</span>
                <span className="font-mono text-text-primary">{new Date(message.timestamp).toLocaleString()}</span>

                {/* Parsowanie nagłówków z JSON stringa */}
                {Object.entries(JSON.parse(message.headers || "{}")).map(([key, val]) => (
                    <div key={key} className="flex gap-2">
                        <span className="text-text-secondary truncate" title={key}>{key}:</span>
                        <span className="font-mono text-text-primary break-all">{String(val)}</span>
                    </div>
                ))}
             </div>
          </div>
        </div>

      </SheetContent>
    </Sheet>
  );
}