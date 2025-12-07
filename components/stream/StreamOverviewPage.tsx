'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Search, 
  Send, 
  Terminal, 
  ExternalLink, 
  Code, 
  Server, 
  Database, 
  Activity, 
  Layers,
  Settings2,
  Copy,
  Hash,
  Cpu,
  AudioWaveform
} from 'lucide-react';

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

// Custom Components
import { StreamTypeBadge } from "@/components/shared/StreamTypeBadge";
import { StreamOverviewDto } from '@/types/stream';

interface Props {
  streamId: string;
}

// --- Fetcher ---
const fetchStreamOverview = async (streamId: string): Promise<StreamOverviewDto> => {
  const res = await fetch(`/api/streams/${streamId}/overview`);
  if (!res.ok) throw new Error('Failed to fetch stream details');
  return res.json();
};

// --- Helpers ---
const VendorIcon = ({ type, className }: { type: string, className?: string }) => {
  const t = type ? type.toUpperCase() : '';
  if (t === 'KAFKA') return <AudioWaveform className={`text-purple-500 ${className}`} />;
  if (t === 'RABBIT') return <Layers className={`text-orange-500 ${className}`} />;
  if (t === 'POSTGRES') return <Database className={`text-blue-500 ${className}`} />;
  return <Server className={`text-slate-500 ${className}`} />;
};

const CopyButton = ({ text }: { text: string }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
  };
  return (
    <Button variant="ghost" size="icon" className="h-4 w-4 ml-2 text-muted-foreground hover:text-foreground opacity-50 hover:opacity-100 transition-all" onClick={handleCopy}>
      <Copy size={10} />
    </Button>
  );
};

export function StreamOverviewPage({ streamId }: Props) {
  
  const { data: stream, isLoading, isError } = useQuery({
    queryKey: ['stream-overview', streamId],
    queryFn: () => fetchStreamOverview(streamId),
  });

  const parsedMetadata = useMemo(() => {
    if (!stream?.metadata) return null;
    try {
      return JSON.parse(stream.metadata);
    } catch (e) {
      return { raw: stream.metadata, error: "Invalid JSON" };
    }
  }, [stream?.metadata]);

  if (isLoading) return <StreamSkeleton />;
  if (isError || !stream) return <div className="p-8 text-destructive">Failed to load stream data.</div>;

  return (
    <div className="min-h-screen bg-background p-6 md:p-8 space-y-8 fade-in">
      
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col gap-6">
        {/* Breadcrumb */}
        <Link 
          href="/streams" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors w-fit group"
        >
          <ArrowLeft size={16} className="mr-1 group-hover:-translate-x-1 transition-transform" /> 
          Back to Streams
        </Link>

        {/* Main Header Info */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border pb-6">
          <div className="space-y-3">
             <div className="flex items-center gap-3">
               <h1 className="text-4xl font-bold tracking-tight text-foreground">{stream.name}</h1>
               <StreamTypeBadge type={stream.type} className="text-sm px-2.5 py-0.5 border-2" />
             </div>
             
             <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 font-mono bg-muted/50 px-2 py-0.5 rounded text-xs">
                   <Hash size={12} />
                   {stream.id}
                   <CopyButton text={stream.id} />
                </div>

                <div className="flex items-center gap-2">
                   <span className="text-muted-foreground/70">Connected via:</span>
                   <Link 
                      href={`/connections/${stream.connectionId}`}
                      className="flex items-center gap-1.5 font-medium text-foreground hover:text-primary transition-colors hover:underline"
                   >
                      <VendorIcon type={stream.connectionType} className="w-4 h-4" />
                      {stream.connectionName}
                      <ExternalLink size={12} className="opacity-50" />
                   </Link>
                </div>
             </div>
          </div>
          
          <Button variant="outline" className="gap-2 shadow-sm">
             <Settings2 size={16} /> Configure Stream
          </Button>
        </div>
      </div>

      {/* --- TABS SECTION --- */}
      <Tabs defaultValue="overview" className="w-full space-y-8">
        <TabsList className="w-full md:w-auto grid grid-cols-3 md:inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="vendor">Vendor Panel</TabsTrigger>
        </TabsList>

        {/* --- TAB: OVERVIEW --- */}
        <TabsContent value="overview" className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN (2/3) - Details & Actions */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* 1. Stream Details Card */}
              <Card className="rounded-xl shadow-sm border-border/60 bg-card overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/40 pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Code className="w-5 h-5 text-primary" />
                    Stream Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  
                  {/* Technical Name Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                    <label className="text-sm font-medium text-muted-foreground">Technical Name</label>
                    <div className="sm:col-span-3">
                       <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted/40 border border-border rounded-md font-mono text-sm text-foreground">
                          {stream.technicalName}
                          <CopyButton text={stream.technicalName} />
                       </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Metadata JSON Viewer */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                       <label className="text-sm font-medium text-muted-foreground">Metadata Configuration</label>
                       <Badge variant="outline" className="text-[10px] font-mono opacity-70">READ ONLY</Badge>
                    </div>
                    <div className="relative group">
                       <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <CopyButton text={JSON.stringify(parsedMetadata, null, 2)} />
                       </div>
                       <pre className="text-xs font-mono text-foreground/80 bg-slate-950 dark:bg-slate-900 p-4 rounded-lg border border-border overflow-x-auto custom-scrollbar shadow-inner leading-relaxed">
                          {JSON.stringify(parsedMetadata, null, 2)}
                       </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 2. Quick Actions Card */}
              <Card className="rounded-xl shadow-sm border-border/60 bg-card">
                 <CardHeader className="pb-4">
                    <CardTitle className="text-base">Quick Actions</CardTitle>
                 </CardHeader>
                 <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                       <Button variant="outline" className="h-20 flex flex-col gap-2 hover:border-primary/50 hover:bg-primary/5">
                          <Search size={20} />
                          Search
                       </Button>
                       <Button variant="outline" className="h-20 flex flex-col gap-2 hover:border-primary/50 hover:bg-primary/5">
                          <Send size={20} />
                          Publish
                       </Button>
                       {stream.type === 'POSTGRES' && (
                         <Button variant="outline" className="h-20 flex flex-col gap-2 hover:border-blue-500/50 hover:bg-blue-500/5 text-blue-600 dark:text-blue-400">
                            <Terminal size={20} />
                            SQL Explorer
                         </Button>
                       )}
                       {/* Placeholder for future action */}
                       <Button variant="outline" className="h-20 flex flex-col gap-2 opacity-50 cursor-not-allowed" disabled>
                          <Activity size={20} />
                          Stats (Soon)
                       </Button>
                    </div>
                 </CardContent>
              </Card>
            </div>

            {/* RIGHT COLUMN (1/3) - Connection & Context */}
            <div className="space-y-8">
              
              {/* 3. Connection Info Card */}
              <Card className="rounded-xl shadow-sm border-border/60 bg-card h-fit">
                <CardHeader className="bg-muted/30 border-b border-border/40 pb-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Server className="w-4 h-4 text-primary" />
                      Connection Info
                    </CardTitle>
                    <VendorIcon type={stream.connectionType} className="w-5 h-5" />
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-5 text-sm">
                  
                  {/* ZMIANA: Zamiast prostego tekstu Vendor, używamy StreamTypeBadge i labela 'TYPE' */}
                  <div className="flex justify-between items-center h-6">
                    <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Type</span>
                    <StreamTypeBadge type={stream.connectionType} />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex flex-col gap-1.5">
                    <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Host Address</span>
                    <div className="font-mono text-xs bg-muted/50 p-2 rounded border border-border flex justify-between items-center">
                      <span className="truncate">{stream.connectionHost}:{stream.connectionPort}</span>
                      <CopyButton text={`${stream.connectionHost}:${stream.connectionPort}`} />
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button variant="secondary" className="w-full gap-2 font-medium" asChild>
                      <Link href={`/connections/${stream.connectionId}`}>
                        Open Connection Details <ExternalLink size={14} />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 4. Future Stats Placeholder */}
              <Card className="rounded-xl border-dashed border-border/60 bg-muted/5 opacity-70">
                 <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                       <Cpu size={14} /> Live Metrics
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="text-xs text-muted-foreground pb-6">
                    Real-time throughput and latency metrics will appear here in the future update.
                 </CardContent>
              </Card>

            </div>
          </div>
        </TabsContent>

        {/* --- TAB: MESSAGES --- */}
        <TabsContent value="messages">
          <Card className="min-h-[400px] flex items-center justify-center rounded-xl border-dashed border-border bg-muted/5">
             <div className="text-center space-y-3">
                <div className="bg-background border border-border w-12 h-12 rounded-full flex items-center justify-center mx-auto shadow-sm">
                   <Search size={24} className="text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Message Explorer</h3>
                  <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-1">
                    Connect to <b>{stream.technicalName}</b> to browse live messages.
                  </p>
                </div>
                <Button className="mt-4">Connect & Browse</Button>
             </div>
          </Card>
        </TabsContent>

        {/* --- TAB: VENDOR PANEL --- */}
        <TabsContent value="vendor">
          <Card className="rounded-xl border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="w-5 h-5" />
                {stream.type} Specific Settings
              </CardTitle>
              <CardDescription>
                Advanced configuration for {stream.technicalName}.
              </CardDescription>
            </CardHeader>
            <CardContent className="min-h-[200px] flex items-center justify-center bg-muted/10">
               <div className="text-sm text-muted-foreground italic">
                 Extended controls for {stream.type} will be implemented here.
               </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// --- Skeleton Loading ---
function StreamSkeleton() {
  return (
    <div className="p-8 space-y-8 min-h-screen">
      <div className="space-y-4">
        <Skeleton className="h-4 w-32" />
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-2 space-y-8">
           <Skeleton className="h-[300px] rounded-xl" />
           <Skeleton className="h-[120px] rounded-xl" />
        </div>
        <div className="space-y-8">
          <Skeleton className="h-[250px] rounded-xl" />
          <Skeleton className="h-[100px] rounded-xl" />
        </div>
      </div>
    </div>
  );
}