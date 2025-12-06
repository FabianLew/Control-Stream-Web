'use client';

import { useQuery } from '@tanstack/react-query';
import { getStreams } from '@/components/lib/api/streams';
import { getConnections } from '@/components/lib/api/connections';
import { UnifiedStreamDto } from '@/types/stream';
import { ConnectionDto } from '@/types/connection';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { StreamTypeBadge } from "@/components/shared/StreamTypeBadge";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export function StreamList() {
  // 1. Pobieramy Strumienie
  const streamsQuery = useQuery<UnifiedStreamDto[]>({
    queryKey: ['streams'],
    queryFn: getStreams,
  });

  // 2. Pobieramy Połączenia (żeby wyświetlić ich nazwy zamiast ID)
  const connectionsQuery = useQuery<ConnectionDto[]>({
    queryKey: ['connections'],
    queryFn: getConnections,
  });

  const isLoading = streamsQuery.isLoading || connectionsQuery.isLoading;
  const isError = streamsQuery.isError || connectionsQuery.isError;

  // 3. Tworzymy mapę: ID -> Nazwa Połączenia dla szybkiego dostępu
  const connectionMap = new Map<string, string>();
  if (connectionsQuery.data) {
    connectionsQuery.data.forEach(conn => {
      connectionMap.set(conn.id, conn.name);
    });
  }

  if (isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading streams...</div>;
  }

  if (isError) {
    return <div className="p-4 text-sm text-red-500">Error loading data.</div>;
  }

  const streams = streamsQuery.data;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Technical Name</TableHead>
            <TableHead>Connection</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {streams?.map((stream) => (
            <TableRow key={stream.id}>
              <TableCell className="font-medium">{stream.name}</TableCell>
            
              <TableCell>
                <StreamTypeBadge type={stream.type} />
              </TableCell>

              <TableCell className="text-muted-foreground font-mono text-xs">
                {stream.technicalName}
              </TableCell>
              
              <TableCell>
                {/* Wyświetlamy nazwę z mapy lub fallback do ID, jeśli nie znaleziono */}
                {connectionMap.get(stream.connectionId) || <span className="text-red-400 text-xs">Unknown ({stream.connectionId.slice(0,8)}...)</span>}
              </TableCell>

              <TableCell className="text-muted-foreground">
                 {stream.updatedAt ? new Date(stream.updatedAt).toLocaleDateString() : '-'}
              </TableCell>

              <TableCell className="text-right">
                <Button variant="outline" size="sm" asChild>
                    <Link href={`/streams/${stream.id}`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                    </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {(!streams || streams.length === 0) && (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                No streams found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}