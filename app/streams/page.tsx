"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LayoutGrid, List as ListIcon, Plus, X } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { FilterMultiSelect } from "@/components/ui/filter-multi-select"; // Import nowego komponentu

// Custom Components
import { StreamList } from "@/components/stream/StreamList";
import { StreamGrid } from "@/components/stream/StreamGrid";
import { EditStreamDialog } from "@/components/stream/EditStreamDialog";

// API & Types
import { getStreams, updateStream } from "@/components/lib/api/streams";
import { getConnections } from "@/components/lib/api/connections";
import { UnifiedStreamDto } from "@/types/stream";

export default function StreamsPage() {
  const queryClient = useQueryClient();

  // --- STATE ---
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // ZMIANA: Teraz przechowujemy tablicę ID, a nie pojedynczy string
  const [selectedConnectionIds, setSelectedConnectionIds] = useState<string[]>(
    []
  );

  // Stan edycji (Dialog)
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingStream, setEditingStream] = useState<UnifiedStreamDto | null>(
    null
  );

  // --- DATA FETCHING ---
  // 1. Pobieramy wszystkie strumienie
  const { data: streams, isLoading: isStreamsLoading } = useQuery({
    queryKey: ["streams"],
    queryFn: getStreams,
  });

  // 2. Pobieramy połączenia (do wypełnienia filtra)
  const { data: connections, isLoading: isConnectionsLoading } = useQuery({
    queryKey: ["connections-list-filter"],
    queryFn: getConnections,
  });

  // --- MUTATIONS ---
  const updateMutation = useMutation({
    mutationFn: updateStream,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["streams"] });
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
  const filteredStreams = useMemo(() => {
    if (!streams) return [];

    // Jeśli tablica pusta -> pokazujemy wszystko
    if (selectedConnectionIds.length === 0) return streams;

    // Filtrowanie po wielu ID
    return streams.filter((s) =>
      selectedConnectionIds.includes(s.connectionId)
    );
  }, [streams, selectedConnectionIds]);

  // Helper do usuwania pojedynczego filtra z paska aktywnych filtrów
  const removeConnectionFilter = (id: string) => {
    setSelectedConnectionIds((prev) => prev.filter((item) => item !== id));
  };

  return (
    <main className="p-6 md:p-8 min-h-screen space-y-6 fade-in">
      {/* --- HEADER & CONTROLS --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Streams
          </h1>
          <p className="text-muted-foreground">
            Configure data flow definitions and processing logic.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* 1. FILTER MULTISELECT (Connections) */}
          <div className="w-[200px]">
            <FilterMultiSelect
              title="Connections"
              // Mapujemy Twoje dane connections na format { id, label }
              options={
                connections?.map((conn) => ({
                  id: conn.id,
                  label: conn.name,
                })) || []
              }
              selected={selectedConnectionIds}
              onChange={setSelectedConnectionIds}
              isLoading={isConnectionsLoading}
              placeholder="Filter by Connection"
            />
          </div>

          {/* 2. VIEW TOGGLE (Grid/List) */}
          <div className="flex items-center p-1 rounded-lg border bg-muted/40 text-muted-foreground">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === "grid"
                  ? "bg-background text-foreground shadow-sm"
                  : "hover:text-foreground"
              }`}
              title="Grid View"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === "list"
                  ? "bg-background text-foreground shadow-sm"
                  : "hover:text-foreground"
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

      {/* --- ACTIVE FILTER INDICATOR --- */}
      {/* Wyświetlamy aktywne filtry jako badge, które można usunąć */}
      {selectedConnectionIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm animate-in fade-in slide-in-from-left-2">
          <span className="text-muted-foreground">Active Filter:</span>

          {selectedConnectionIds.map((id) => {
            const connName =
              connections?.find((c) => c.id === id)?.name || "Unknown";
            return (
              <div
                key={id}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20"
              >
                <span className="truncate max-w-[200px]">{connName}</span>
                <button
                  onClick={() => removeConnectionFilter(id)}
                  className="ml-1 hover:text-primary/70 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}

          <Button
            variant="ghost"
            size="sm"
            className="h-5 px-2 text-[10px] text-muted-foreground hover:text-foreground"
            onClick={() => setSelectedConnectionIds([])}
          >
            Clear all
          </Button>
        </div>
      )}

      {/* --- CONTENT AREA --- */}
      {viewMode === "grid" ? (
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
