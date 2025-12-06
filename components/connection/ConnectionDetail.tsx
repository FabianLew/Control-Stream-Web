'use client'; // <--- TO JEST KLUCZOWE

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, RefreshCw, Server, Clock, AlertTriangle, Layers, PlayCircle 
} from 'lucide-react';
import Link from 'next/link';

// Typy
import { 
  ConnectionOverviewDto, 
  ConnectionStreamOverviewDto, 
  ConnectionTestResultDto 
} from '@/types/connection';

// Komponenty UI
import { Button } from "@/components/ui/button";
import { ConnectionStatusBadge } from './ConnectionStatusBadge';
import { StreamTypeBadge } from "@/components/shared/StreamTypeBadge"; // Używamy tego samego badge co w liście
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  id: string;
}

// Fetchery
const fetchConnection = async (id: string): Promise<ConnectionOverviewDto> => {
  const res = await fetch(`/api/connections/${id}/overview`);
  if (!res.ok) throw new Error('Failed to fetch connection');
  return res.json();
};

const fetchStreams = async (id: string): Promise<ConnectionStreamOverviewDto[]> => {
  const res = await fetch(`/api/streams/connection/${id}`);
  if (!res.ok) throw new Error('Failed to fetch streams');
  return res.json();
};

const testConnectionApi = async (id: string): Promise<ConnectionTestResultDto> => {
  const res = await fetch(`/api/connections/${id}/test`, { method: 'POST' });
  if (!res.ok) throw new Error('Test failed');
  return res.json();
};

export const ConnectionDetail = ({ id }: Props) => {
  const queryClient = useQueryClient();

  // 1. Pobieranie danych o połączeniu
  const { data: connection, isLoading: isConnLoading } = useQuery({
    queryKey: ['connection', id],
    queryFn: () => fetchConnection(id),
  });

  // 2. Pobieranie streamów
  const { data: streams, isLoading: isStreamsLoading } = useQuery({
    queryKey: ['connection-streams', id],
    queryFn: () => fetchStreams(id),
  });

  // 3. Obsługa testowania połączenia
  const testMutation = useMutation({
    mutationFn: () => testConnectionApi(id),
    onSuccess: (result) => {
      // Aktualizujemy cache danych połączenia nowym statusem
      queryClient.setQueryData(['connection', id], (old: ConnectionOverviewDto) => ({
        ...old,
        status: result.status,
        lastCheckedAt: result.checkedAt, // Zakładając, że typy się zgadzają (string/Date)
        lastErrorMessage: result.message
      }));
    }
  });

  if (isConnLoading) return <div className="p-8"><Skeleton className="h-12 w-1/3 mb-4" /><Skeleton className="h-64 w-full" /></div>;
  if (!connection) return <div className="p-8 text-destructive">Connection not found</div>;

  return (
    <div className="p-8">
      {/* Breadcrumb / Back */}
      <Link href="/connections" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft size={16} className="mr-1" /> Back to Connections
      </Link>

      {/* Header Section */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center border border-primary/20">
                <Server size={24} />
             </div>
             <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                  {connection.name}
                  <ConnectionStatusBadge status={connection.status} />
                </h1>
                <div className="text-sm text-muted-foreground mt-1 font-mono flex items-center gap-2">
                  {connection.host}:{connection.port} 
                  <span className="text-border">|</span> 
                  <span className="uppercase">{connection.type}</span>
                </div>
             </div>
          </div>

          <Button 
            onClick={() => testMutation.mutate()}
            disabled={testMutation.isPending}
            variant={testMutation.isPending ? "outline" : "default"}
            className="min-w-[160px]"
          >
            <RefreshCw size={18} className={`mr-2 ${testMutation.isPending ? "animate-spin" : ""}`} />
            {testMutation.isPending ? 'Testing...' : 'Test Connection'}
          </Button>
        </div>

        {/* Error Message Box */}
        {(connection.status === 'ERROR' || connection.status === 'OFFLINE') && connection.lastErrorMessage && (
        <div className="mt-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex gap-3 text-destructive">
            {/* ... reszta kodu błędu ... */}
        </div>
        )}

        <div className="mt-6 pt-6 border-t border-border flex gap-8 text-sm text-muted-foreground">
           <div className="flex items-center gap-2">
             <Clock size={16} />
             Last Checked: <span className="text-foreground font-medium">
               {connection.lastCheckedAt ? new Date(connection.lastCheckedAt).toLocaleString() : 'Never'}
             </span>
           </div>
        </div>
      </div>

      {/* Streams List Section */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <Layers size={20} className="text-muted-foreground" />
            Active Streams
            <span className="ml-2 bg-background text-muted-foreground text-xs py-0.5 px-2 rounded-full border border-border font-mono">
              {streams?.length || 0}
            </span>
          </h2>
        </div>
        
        {isStreamsLoading ? (
             <div className="p-6 space-y-2">
                 <Skeleton className="h-12 w-full" />
                 <Skeleton className="h-12 w-full" />
             </div>
        ) : (!streams || streams.length === 0) ? (
          <div className="p-12 text-center text-muted-foreground">
            <p>No streams configured for this connection yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-xs uppercase font-semibold text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-6 py-4">Stream Name</th>
                  <th className="px-6 py-4">Technical Name</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Created</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {streams.map((stream) => (
                  <tr key={stream.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{stream.name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{stream.technicalName}</td>
                    <td className="px-6 py-4">
                      <StreamTypeBadge type={stream.type} />
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(stream.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <Button variant="ghost" size="icon" className="hover:text-primary">
                         <PlayCircle size={18} />
                       </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};