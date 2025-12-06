'use client';

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getConnections } from '@/components/lib/api/connections';
import { ConnectionDto } from '@/types/connection';
import { Button } from "@/components/ui/button";
import { Pencil, Loader2 } from "lucide-react"; // Dodałem Loader2
import { StreamTypeBadge } from "@/components/shared/StreamTypeBadge";
import { EditConnectionDialog } from "./EditConnectionDialog"; // Importujemy Twój dialog

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function ConnectionList() {
  const queryClient = useQueryClient();

  // 1. Stan do obsługi modala
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<ConnectionDto | null>(null);

  // 2. Pobieranie danych (Twoje istniejące)
  const { data, isLoading, isError } = useQuery<ConnectionDto[]>({
    queryKey: ['connections'],
    queryFn: getConnections,
  });

  // 3. Mutacja do zapisu danych (To zastępuje ręcznego fetcha)
  const updateMutation = useMutation({
    mutationFn: async (updatedConn: ConnectionDto) => {
      // Tutaj robimy strzał do API
      const res = await fetch(`/api/connections/${updatedConn.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConn),
      });
      if (!res.ok) throw new Error('Failed to update connection');
      return res.json();
    },
    onSuccess: () => {
      // To jest kluczowe: po sukcesie odświeżamy listę 'connections' automatycznie
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      // Modal zamknie się w handleSaveWrapper po await, lub tu:
      // setIsEditOpen(false); (ale lepiej kontrolować to w Dialogu)
    },
  });

  // Handler otwierania modala
  const handleEditClick = (conn: ConnectionDto) => {
    setEditingConnection(conn);
    setIsEditOpen(true);
  };

  // Handler zapisu przekazywany do Dialogu
  const handleSaveWrapper = async (updatedConn: ConnectionDto) => {
    // await sprawi, że modal poczeka na zakończenie requestu (pokazując loader)
    // Jeśli mutation rzuci błąd, Dialog go złapie i nie zamknie okna
    await updateMutation.mutateAsync(updatedConn); 
  };

  if (isLoading) return <div className="p-4 text-sm text-muted-foreground">Loading connections...</div>;
  if (isError) return <div className="p-4 text-sm text-red-500">Error loading connections.</div>;

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Host</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((conn) => (
              <TableRow key={conn.id}>
                <TableCell className="font-medium">{conn.name}</TableCell>
                <TableCell>
                  <StreamTypeBadge type={conn.type} />
                </TableCell>
                <TableCell className="text-muted-foreground font-mono text-xs">
                  {conn.host}:{conn.port}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {conn.updatedAt ? new Date(conn.updatedAt).toLocaleDateString() : '-'}
                </TableCell>
                <TableCell className="text-right">
                  {/* ZMIANA: Zamiast Link używamy onClick */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleEditClick(conn)}
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
                <TableCell colSpan={5} className="h-24 text-center">
                  No connections found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 4. Dodanie Modala na dole komponentu */}
      <EditConnectionDialog 
        open={isEditOpen} 
        onOpenChange={setIsEditOpen}
        connection={editingConnection}
        onSave={handleSaveWrapper}
      />
    </>
  );
}