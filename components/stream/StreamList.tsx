'use client';

import { UnifiedStreamDto } from '@/types/stream';
import { Button } from "@/components/ui/button";
import { Pencil, ArrowRight } from "lucide-react";
import { StreamTypeBadge } from "@/components/shared/StreamTypeBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from 'next/link';

interface StreamListProps {
  streams: UnifiedStreamDto[];
  isLoading: boolean;
  onEdit: (stream: UnifiedStreamDto) => void;
}

export function StreamList({ streams, isLoading, onEdit }: StreamListProps) {
  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading streams...</div>;
  }

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Technical Name</TableHead>
            <TableHead>Correlation</TableHead>
            <TableHead>Connection</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {streams.map((stream) => (
            <TableRow key={stream.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">{stream.name}</span>
                </div>
              </TableCell>
              
              <TableCell>
                <StreamTypeBadge type={stream.type} />
              </TableCell>
              
              <TableCell className="text-muted-foreground font-mono text-xs">
                {stream.technicalName}
              </TableCell>

              <TableCell className="text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded border border-border bg-muted/50 uppercase text-[10px]">
                      {stream.correlationKeyType}
                    </span>
                    {stream.correlationKeyName && (
                      <span className="font-mono opacity-80">{stream.correlationKeyName}</span>
                    )}
                  </div>
              </TableCell>

              <TableCell className="text-muted-foreground text-sm">
                 {/* Zakładam, że DTO ma connectionName, jeśli nie - usuń tę kolumnę */}
                 {stream.connectionName || '-'}
              </TableCell>

              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onEdit(stream)}
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Link href={`/streams/${stream.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                             <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>
              </TableCell>
            </TableRow>
          ))}
          
          {(!streams || streams.length === 0) && (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                No streams found matching your criteria.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}