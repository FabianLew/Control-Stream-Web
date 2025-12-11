"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SearchMessageRow } from "@/types";
import { Copy, FileJson,  List,  Code, RefreshCw, Hash, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface PayloadViewerProps {
  message: SearchMessageRow | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PayloadViewer({ message, isOpen, onClose }: PayloadViewerProps) {
  if (!message) return null;

  const formatJson = (jsonString: string) => {
    try {
      const obj = JSON.parse(jsonString);
      return JSON.stringify(obj, null, 2);
    } catch (e) {
      return jsonString;
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      {/* ZMIANA 1: Zwiększona szerokość panelu (sm:w-[90vw] sm:max-w-[1100px]) */}
      <SheetContent className="w-full sm:max-w-[1100px] sm:w-[90vw] bg-background border-l border-border overflow-y-auto flex flex-col p-0">
        
        {/* HEADER */}
        <div className="p-6 border-b border-border bg-muted/10 flex-none">
          <SheetHeader>
            <div className="flex items-center gap-3 mb-2">
                <Badge variant="outline" className="font-mono text-xs">{message.streamType}</Badge>
                <span className="text-xs text-muted-foreground font-mono">{new Date(message.timestamp).toLocaleString()}</span>
            </div>
            
            <SheetTitle className="text-xl font-mono text-foreground flex items-center gap-2 break-all">
              {message.messageId}
            </SheetTitle>
            
            <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="font-mono text-xs font-normal bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 px-2 py-1">
                    <Hash size={10} className="mr-1.5 inline opacity-70" />
                    {message.correlationId || "No Correlation ID"}
                </Badge>
            </div>

            <SheetDescription className="mt-2">
              Stream: <span className="font-bold text-foreground">{message.streamName}</span>
            </SheetDescription>
          </SheetHeader>
        </div>

        {/* CONTENT TABS */}
        <div className="flex-1 p-6 min-h-0 flex flex-col">
            <Tabs defaultValue="json" className="flex-1 flex flex-col min-h-0">
                
                {/* ZMIANA 2: flex-wrap zapobiega ucinaniu przycisków */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <TabsList>
                        <TabsTrigger value="json" className="gap-2"><FileJson size={14}/> JSON</TabsTrigger>
                        <TabsTrigger value="raw" className="gap-2"><Code size={14}/> Raw</TabsTrigger>
                        <TabsTrigger value="headers" className="gap-2"><List size={14}/> Metadata</TabsTrigger>
                    </TabsList>
                    
                    <div className="flex gap-2 ml-auto">
                        <Button variant="outline" size="sm" className="h-8 gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary/50" disabled>
                            <Play size={12}/> Reproduce
                        </Button>
                    </div>
                </div>

                {/* TAB PANELS */}
                <TabsContent value="json" className="flex-1 mt-0 min-h-0 relative flex flex-col">
                    <div className="relative rounded-lg border border-border bg-muted/30 p-4 flex-1 overflow-auto custom-scrollbar">
                        <Button 
                            variant="ghost" size="icon" 
                            className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-foreground z-10 bg-background/50 backdrop-blur-sm"
                            onClick={() => handleCopy(formatJson(message.payload))}
                        >
                            <Copy size={12} />
                        </Button>
                        <pre className="text-xs font-mono text-green-500 whitespace-pre-wrap leading-relaxed">
                            {formatJson(message.payload)}
                        </pre>
                    </div>
                </TabsContent>

                <TabsContent value="raw" className="flex-1 mt-0 min-h-0 flex flex-col">
                    <div className="rounded-lg border border-border bg-muted/30 p-4 flex-1 overflow-auto break-all font-mono text-xs text-muted-foreground custom-scrollbar">
                        {message.payload}
                    </div>
                </TabsContent>

                <TabsContent value="headers" className="flex-1 mt-0 min-h-0 flex flex-col">
                    <div className="rounded-lg border border-border bg-muted/30 p-0 overflow-hidden flex-1 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-sm">
                            <tbody className="divide-y divide-border">
                                <tr className="bg-muted/50">
                                    <td className="p-3 font-medium text-muted-foreground w-[150px]">Correlation ID</td>
                                    <td className="p-3 font-mono text-foreground">{message.correlationId || "-"}</td>
                                </tr>
                                {Object.entries(JSON.parse(message.headers || "{}")).map(([key, val]) => (
                                    <tr key={key}>
                                        <td className="p-3 font-medium text-muted-foreground">{key}</td>
                                        <td className="p-3 font-mono text-foreground break-all">{String(val)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </TabsContent>
            </Tabs>
        </div>

      </SheetContent>
    </Sheet>
  );
}