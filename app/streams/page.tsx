'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LayoutGrid, List as ListIcon, Plus, Filter, X } from 'lucide-react';

// UI Components
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Custom Components
import { StreamList } from '@/components/stream/StreamList'; // Twój zrefaktoryzowany komponent
import { StreamGrid } from '@/components/stream/StreamGrid'; // Twój nowy komponent
import { EditStreamDialog } from '@/components/stream/EditStreamDialog';

// API & Types
import { getStreams, updateStream } from '@/components/lib/api/streams';
import { getConnections } from '@/components/lib/api/connections';
import { UnifiedStreamDto } from '@/types/stream';

export default function StreamsPage() {
  const queryClient = useQueryClient();
  
  // --- STATE ---
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedConnection, setSelectedConnection] = useState<string>('ALL');
  
  // Stan edycji (Dialog)
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingStream, setEditingStream] = useState<UnifiedStreamDto | null>(null);

  // --- DATA FETCHING ---
  // 1. Pobieramy wszystkie strumienie
  const { data: streams, isLoading: isStreamsLoading } = useQuery({
    queryKey: ['streams'],
    queryFn: getStreams,
  });

  // 2. Pobieramy połączenia (tylko do wypełnienia filtra w dropdownie)
  const { data: connections } = useQuery({
    queryKey: ['connections-list-filter'],
    queryFn: getConnections,
  });

  // --- MUTATIONS ---
  const updateMutation = useMutation({
    mutationFn: updateStream,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streams'] });
      setIsEditOpen(false);
    },
  });

  // --- HANDLERS ---
  const handleEditClick = (stream: UnifiedStreamDto) => {
    setEditingStream(stream);
    setIsEditOpen(true);
  };

  const handleSaveWrapper = async (updatedStream: UnifiedStreamDto) => {
    await updateMutation.mutateAsync(updatedStream);
  };

  // --- FILTERING LOGIC ---
  // Filtrujemy strumienie po stronie klienta (Client-side filtering)
  const filteredStreams = useMemo(() => {
    if (!streams) return [];
    if (selectedConnection === 'ALL') return streams;
    // Ważne: UnifiedStreamDto musi mieć pole `connectionId`
    return streams.filter(s => s.connectionId === selectedConnection);
  }, [streams, selectedConnection]);

  return (
    <main className="p-6 md:p-8 min-h-screen space-y-6 fade-in">
      
      {/* --- HEADER & CONTROLS --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Streams</h1>
          <p className="text-muted-foreground">
            Configure data flow definitions and processing logic.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          
          {/* 1. FILTER DROPDOWN */}
          <div className="w-[200px]">
            <Select value={selectedConnection} onValueChange={setSelectedConnection}>
                <SelectTrigger className="bg-background">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Filter size={14} />
                        <span className="text-foreground">
                             <SelectValue placeholder="Filter by Connection" />
                        </span>
                    </div>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">All Connections</SelectItem>
                    {connections?.map(conn => (
                        <SelectItem key={conn.id} value={conn.id}>
                            {conn.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>

          {/* 2. VIEW TOGGLE (Grid/List) */}
          <div className="flex items-center p-1 rounded-lg border bg-muted/40 text-muted-foreground">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'grid'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'hover:text-foreground'
              }`}
              title="Grid View"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'list'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'hover:text-foreground'
              }`}
              title="List View"
            >
              <ListIcon size={18} />
            </button>
          </div>

          {/* 3. ADD BUTTON */}
          <Button asChild className="gap-2">
            <Link href="/streams/create">
              <Plus size={16} />
              Add Stream
            </Link>
          </Button>
        </div>
      </div>

      {/* --- ACTIVE FILTER INDICATOR (Optional UX improvement) --- */}
      {selectedConnection !== 'ALL' && (
          <div className="flex items-center gap-2 text-sm animate-in fade-in slide-in-from-left-2">
             <span className="text-muted-foreground">Active Filter:</span>
             <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                {connections?.find(c => c.id === selectedConnection)?.name || 'Unknown Connection'}
                <button 
                  onClick={() => setSelectedConnection('ALL')} 
                  className="ml-1 hover:text-primary/70 transition-colors"
                >
                    <X size={12} />
                </button>
             </div>
          </div>
      )}

      {/* --- CONTENT AREA --- */}
      {viewMode === 'grid' ? (
        <StreamGrid 
            streams={filteredStreams} 
            isLoading={isStreamsLoading} 
            onEdit={handleEditClick} 
        />
      ) : (
        <StreamList 
            streams={filteredStreams} 
            isLoading={isStreamsLoading} 
            onEdit={handleEditClick} 
        />
      )}

      {/* --- DIALOG --- */}
      <EditStreamDialog 
        open={isEditOpen} 
        onOpenChange={setIsEditOpen}
        stream={editingStream}
        onSave={handleSaveWrapper}
      />
    </main>
  );
}