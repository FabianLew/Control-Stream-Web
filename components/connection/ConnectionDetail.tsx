'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Activity, 
  Server, 
  Clock, 
  Database,
  Hash,
  Calendar,
  Layers,
  PlayCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// UI Components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Custom Components & Types
import { ConnectionStatusBadge } from './ConnectionStatusBadge';
import { StreamTypeBadge } from "@/components/shared/StreamTypeBadge";
import { 
  ConnectionOverviewDto, 
  ConnectionStreamOverviewDto, 
  ConnectionTestResultDto 
} from '@/types/connection';

interface Props {
  id: string;
}

// --- API Fetchers ---
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

const getVendorConfig = (type: string) => {
  const t = type ? type.toUpperCase() : '';
  if (t.includes('KAFKA')) return { color: 'text-purple-600', bg: 'bg-purple-100', border: 'border-purple-200', icon: Activity };
  if (t.includes('RABBIT')) return { color: 'text-orange-600', bg: 'bg-orange-100', border: 'border-orange-200', icon: Layers };
  if (t.includes('POSTGRES') || t.includes('DB')) return { color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200', icon: Database };
  return { color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200', icon: Server };
};

export const ConnectionDetail = ({ id }: Props) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: connection, isLoading: isConnLoading } = useQuery({
    queryKey: ['connection', id],
    queryFn: () => fetchConnection(id),
  });

  const { data: streams, isLoading: isStreamsLoading } = useQuery({
    queryKey: ['connection-streams', id],
    queryFn: () => fetchStreams(id),
  });

  const testMutation = useMutation({
    mutationFn: () => testConnectionApi(id),
    onSuccess: (result) => {
      queryClient.setQueryData(['connection', id], (old: ConnectionOverviewDto) => ({
        ...old,
        status: result.status,
        lastCheckedAt: result.checkedAt,
        lastErrorMessage: result.message
      }));
    }
  });

  if (isConnLoading) return <div className="p-8"><Skeleton className="h-12 w-1/3 mb-6" /><Skeleton className="h-64 w-full" /></div>;
  if (!connection) return <div className="p-8 text-destructive">Connection not found</div>;

  const vendorStyle = getVendorConfig(connection.type);
  const VendorIcon = vendorStyle.icon;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 fade-in">
      {/* 1. Breadcrumb */}
      <Link href="/connections" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={16} className="mr-1" /> Back to Connections
      </Link>

      {/* 2. Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
           <div className={`w-14 h-14 rounded-xl flex items-center justify-center border shadow-sm ${vendorStyle.bg} ${vendorStyle.color} ${vendorStyle.border}`}>
              <VendorIcon size={28} />
           </div>
           
           <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
                {connection.name}
                <ConnectionStatusBadge status={connection.status} />
              </h1>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                 <span className="font-mono text-xs">{connection.id.slice(0, 8)}...</span>
                 <span className="text-border">|</span>
                 
                 {/* ZMIANA: Powiększony Badge w nagłówku (text-sm + font-medium) */}
                 <StreamTypeBadge 
                    type={connection.type} 
                    className="text-sm px-2.5 py-0.5 font-medium" 
                 />
              </div>
           </div>
        </div>

        <Button 
          onClick={() => testMutation.mutate()}
          disabled={testMutation.isPending}
          variant={testMutation.isPending ? "outline" : "default"}
          className="shadow-sm"
        >
          <Activity size={16} className={`mr-2 ${testMutation.isPending ? "animate-spin" : ""}`} />
          {testMutation.isPending ? 'Checking...' : 'Run Health Check'}
        </Button>
      </div>

      {/* 3. Main Content */}
      <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full md:w-auto grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="streams">Streams</TabsTrigger>
        </TabsList>

        {/* --- TAB: OVERVIEW --- */}
        <TabsContent value="overview" className="space-y-6 mt-6 fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* 3.1 Status KPI Widget */}
            <Card className="md:col-span-1 shadow-sm border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Connection Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="scale-125 origin-left py-1"> 
                      <ConnectionStatusBadge status={connection.status} showLabel={true} />
                    </div>
                  </div>
                  
                  {(connection.status === 'ERROR' || connection.status === 'OFFLINE') && connection.lastErrorMessage && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-xs text-destructive">
                      <p className="font-semibold mb-1">Error Message:</p>
                      {connection.lastErrorMessage}
                    </div>
                  )}

                  <div className="pt-4 border-t border-border mt-2">
                     <div className="flex items-center text-sm text-muted-foreground">
                        <Clock size={14} className="mr-2" />
                        Last checked:
                     </div>
                     <p className="text-sm font-medium mt-1 text-foreground pl-6">
                       {connection.lastCheckedAt 
                         ? new Date(connection.lastCheckedAt).toLocaleString() 
                         : 'Never'}
                     </p>
                     <p className="text-xs text-muted-foreground pl-6 mt-0.5">
                       {connection.lastCheckedAt && `(${formatDistanceToNow(new Date(connection.lastCheckedAt), { addSuffix: true })})`}
                     </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 3.2 Connection Details Widget */}
            <Card className="md:col-span-2 shadow-sm border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Connection Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-12 mt-2">
                   
                   <div className="space-y-1">
                      <div className="flex items-center text-xs text-muted-foreground mb-1">
                        <Server size={12} className="mr-1.5" /> Host
                      </div>
                      <div className="font-mono text-sm bg-muted/40 p-2 rounded border border-border w-fit text-foreground">
                        {connection.host}:{connection.port}
                      </div>
                   </div>

                   <div className="space-y-1">
                      <div className="flex items-center text-xs text-muted-foreground mb-1">
                        <Database size={12} className="mr-1.5" /> Type
                      </div>
                      {/* ZMIANA: Nieco większy badge w detalach (text-xs zamiast 10px) */}
                      <div>
                        <StreamTypeBadge type={connection.type} className="text-xs" />
                      </div>
                   </div>

                   <div className="space-y-1">
                      <div className="flex items-center text-xs text-muted-foreground mb-1">
                        <Hash size={12} className="mr-1.5" /> Connection ID
                      </div>
                      <div className="font-mono text-xs text-muted-foreground">{connection.id}</div>
                   </div>

                   <div className="space-y-1">
                      <div className="flex items-center text-xs text-muted-foreground mb-1">
                         <Calendar size={12} className="mr-1.5" /> Created At
                      </div>
                      <div className="text-sm text-muted-foreground">Dec 06, 2025 (Mocked)</div>
                   </div>

                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- TAB: STREAMS --- */}
        <TabsContent value="streams" className="mt-6 fade-in">
          <Card className="shadow-sm border-border">
            <CardHeader className="px-6 py-4 border-b border-border bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                   <CardTitle className="text-base font-semibold">Active Streams</CardTitle>
                   <CardDescription className="mt-1">
                     {streams?.length 
                       ? `${streams.length} stream${streams.length === 1 ? '' : 's'} connected and configured.` 
                       : 'No streams configured.'}
                   </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
               {isStreamsLoading ? (
                 <div className="p-6 space-y-3">
                     <Skeleton className="h-10 w-full" />
                     <Skeleton className="h-10 w-full" />
                 </div>
               ) : (!streams || streams.length === 0) ? (
                  <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                    <Layers size={48} className="text-muted-foreground/30 mb-4" />
                    <p>No streams found for this connection.</p>
                    <Button variant="link" className="mt-2 text-primary">Configure new stream</Button>
                  </div>
               ) : (
                 <Table>
                   <TableHeader className="bg-muted/40">
                     <TableRow>
                       <TableHead className="pl-6">Stream Name</TableHead>
                       <TableHead>Technical Name</TableHead>
                       <TableHead>Type</TableHead>
                       <TableHead>Status</TableHead>
                       <TableHead>Created</TableHead>
                       <TableHead className="text-right pr-6">Actions</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {streams.map((stream) => (
                       <TableRow key={stream.id} className="hover:bg-muted/30">
                         <TableCell className="pl-6 font-medium">
                            {stream.name}
                         </TableCell>
                         <TableCell className="font-mono text-xs text-muted-foreground">
                            {stream.technicalName}
                         </TableCell>
                         <TableCell>
                            {/* W tabeli zostawiamy standardowy rozmiar (mały) */}
                            <StreamTypeBadge type={stream.type} />
                         </TableCell>
                         <TableCell>
                            <Badge variant="outline" className="text-xs font-normal border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
                               Active
                            </Badge>
                         </TableCell>
                         <TableCell className="text-muted-foreground text-sm">
                            {new Date(stream.createdAt).toLocaleDateString()}
                         </TableCell>
                         <TableCell className="text-right pr-6">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary">
                              <PlayCircle size={16} />
                            </Button>
                         </TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};