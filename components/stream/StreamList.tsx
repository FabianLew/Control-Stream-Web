'use client';

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// Importujemy updateStream z naszej warstwy API
import { getStreams, updateStream } from '@/components/lib/api/streams'; 
import { UnifiedStreamDto } from '@/types/stream';
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { StreamTypeBadge } from "@/components/shared/StreamTypeBadge";
import { EditStreamDialog } from "./EditStreamDialog";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function StreamList() {
  const queryClient = useQueryClient();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingStream, setEditingStream] = useState<UnifiedStreamDto | null>(null);

  const { data, isLoading, isError } = useQuery<UnifiedStreamDto[]>({
    queryKey: ['streams'],
    queryFn: getStreams,
  });

  // ZMIANA: Używamy gotowej funkcji updateStream
  const updateMutation = useMutation({
    mutationFn: updateStream,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streams'] });
    },
  });

  const handleEditClick = (stream: UnifiedStreamDto) => {
    setEditingStream(stream);
    setIsEditOpen(true);
  };

  const handleSaveWrapper = async (updatedStream: UnifiedStreamDto) => {
    // updateStream zajmie się oddzieleniem ID od payloadu
    await updateMutation.mutateAsync(updatedStream);
  };

  if (isLoading) return <div className="p-4 text-sm text-muted-foreground">Loading streams...</div>;
  if (isError) return <div className="p-4 text-sm text-red-500">Error loading streams.</div>;

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Technical Name</TableHead>
              <TableHead>Correlation</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((stream) => (
              <TableRow key={stream.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{stream.name}</span>
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
                      <span className="px-1.5 py-0.5 rounded border border-border bg-white/5 uppercase text-[10px]">
                        {stream.correlationKeyType}
                      </span>
                      {stream.correlationKeyName && (
                        <span className="font-mono opacity-80">{stream.correlationKeyName}</span>
                      )}
                    </div>
                </TableCell>

                <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleEditClick(stream)}
                    className="h-8 w-8 p-0 lg:w-auto lg:px-2 lg:h-9"
                  >
                    <Pencil className="h-4 w-4 lg:mr-2" />
                    <span className="hidden lg:inline">Edit</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            
            {(!data || data.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No streams found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <EditStreamDialog 
        open={isEditOpen} 
        onOpenChange={setIsEditOpen}
        stream={editingStream}
        onSave={handleSaveWrapper}
      />
    </>
  );
}