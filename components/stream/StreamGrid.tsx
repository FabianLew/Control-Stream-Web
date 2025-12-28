"use client";

import { UnifiedStreamDto } from '@/types/stream';
import { Button } from "@/components/ui/button";
import { Pencil, ArrowRight } from "lucide-react";
import { StreamTypeBadge } from "@/components/shared/StreamTypeBadge";
import Link from 'next/link';
import { Badge } from "@/components/ui/badge";
import { getVendorMeta } from "@/components/lib/vendors";

interface StreamGridProps {
  streams: UnifiedStreamDto[];
  isLoading: boolean;
  onEdit: (stream: UnifiedStreamDto) => void;
}

// Helper do ikony (opcjonalnie, zależy co masz w DTO)
const StreamIcon = ({ type }: { type: string }) => {
    const vendor = getVendorMeta(type);
    const Icon = vendor.icon;
    return <Icon className={`${vendor.iconClass} h-5 w-5`} />;
};

export function StreamGrid({ streams, isLoading, onEdit }: StreamGridProps) {
  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading streams...</div>;
  }

  if (!streams || streams.length === 0) {
     return <div className="p-12 text-center border border-dashed rounded-lg text-muted-foreground">No streams found matching your criteria.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {streams.map((stream) => (
        <div 
            key={stream.id} 
            className="group relative flex flex-col justify-between rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-muted-foreground/20 p-5"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted/30 rounded-lg border border-border">
                        <StreamIcon type={stream.type} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground leading-tight">{stream.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1 font-mono">{stream.technicalName}</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => onEdit(stream)}>
                    <Pencil className="h-4 w-4" />
                </Button>
            </div>

            <div className="space-y-3 mb-4">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Type</span>
                    <StreamTypeBadge type={stream.type} />
                 </div>
                 
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Connection</span>
                    {/* Badge Connection */}
                    <Badge variant="outline" className="font-normal text-xs bg-muted/50">
                        {stream.connectionName || 'Unknown'}
                    </Badge>
                 </div>

                 <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Correlation</span>
                    <span className="text-xs font-mono bg-muted/30 px-1.5 py-0.5 rounded border border-border">
                        {stream.correlationKeyType}
                    </span>
                 </div>
            </div>

            <div className="mt-auto pt-4 border-t border-border flex justify-end">
                <Link href={`/streams/${stream.id}`} className="w-full">
                    <Button variant="outline" size="sm" className="w-full gap-2">
                        View Overview <ArrowRight size={14} />
                    </Button>
                </Link>
            </div>
        </div>
      ))}
    </div>
  );
}
