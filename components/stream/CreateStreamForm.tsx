"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createStreamSchema, CreateStreamFormValues } from "@/components/lib/schemas";
import { useState, useEffect } from "react";
import { 
  Loader2, 
  Sparkles, 
  Activity, 
  Layers, 
  Database, 
  Server, 
  Info, 
  Code, 
  Link as LinkIcon, 
  FileJson
} from "lucide-react";
import { useRouter } from "next/navigation";

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type ConnectionSummary = { id: string; name: string; type: "KAFKA" | "RABBIT" | "POSTGRES" };

const VendorIcon = ({ type }: { type: string }) => {
  if (type === 'KAFKA') return <Activity className="text-purple-500 h-5 w-5" />;
  if (type === 'RABBIT') return <Layers className="text-orange-500 h-5 w-5" />;
  if (type === 'POSTGRES') return <Database className="text-blue-500 h-5 w-5" />;
  return <Server className="text-slate-500 h-5 w-5" />;
};

const toSlug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export function CreateStreamForm() {
  const router = useRouter();
  const [connections, setConnections] = useState<ConnectionSummary[]>([]);
  const [isLoadingConn, setIsLoadingConn] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dodatkowe stany UI (nie mapowane 1:1 w głównym schema, wpadają do metadata)
  const [pgSchema, setPgSchema] = useState("public");
  const [rabbitShadow, setRabbitShadow] = useState(false);

  const form = useForm<CreateStreamFormValues>({
    resolver: zodResolver(createStreamSchema),
    defaultValues: {
      name: "",
      type: "KAFKA",
      connectionId: "",
      technicalName: "",
      correlationKeyType: "HEADER",
      correlationKeyName: "trace-id",
      metadata: {}
    }
  });

  const selectedConnectionId = form.watch("connectionId");
  const watchedName = form.watch("name");
  // Obserwujemy cały formularz do podglądu
  const formValues = form.watch(); 
  
  const activeConnection = connections.find(c => c.id === selectedConnectionId);

  // 1. Fetch Connections
  useEffect(() => {
    fetch("/api/connections/overview")
      .then(res => res.json())
      .then(data => setConnections(data))
      .catch(console.error)
      .finally(() => setIsLoadingConn(false));
  }, []);

  // 2. Auto-set Type & Defaults
  useEffect(() => {
    if (activeConnection) {
      form.setValue("type", activeConnection.type);
      
      if (activeConnection.type === 'POSTGRES') {
          form.setValue("correlationKeyType", "PAYLOAD");
          form.setValue("correlationKeyName", "trace_id");
      } else {
          form.setValue("correlationKeyType", "HEADER");
          form.setValue("correlationKeyName", "trace-id");
      }
    }
  }, [activeConnection, form]);

  // 3. Auto-Suggest Technical Name
  useEffect(() => {
    if (!activeConnection || !watchedName) return;

    const slug = toSlug(watchedName);
    let suggestion = slug;

    if (activeConnection.type === 'KAFKA') suggestion = `${slug}`;
    if (activeConnection.type === 'RABBIT') suggestion = `queue.${slug}`;
    if (activeConnection.type === 'POSTGRES') suggestion = `public.${slug.replace(/-/g, '_')}`;

    const currentTech = form.getValues("technicalName");
    if (!currentTech || currentTech.includes(slug.substring(0, 3))) {
        form.setValue("technicalName", suggestion);
    }
  }, [watchedName, activeConnection, form]);

  // --- HELPER: Budowanie payloadu (wspólny dla submit i preview) ---
  const buildPayload = (data: CreateStreamFormValues) => {
    // 1. Scalamy metadane z formularza i stanów lokalnych (schema, switch)
    let finalMetadata = { ...data.metadata };
    
    if (data.type === 'POSTGRES') {
        finalMetadata = { ...finalMetadata, schema: pgSchema };
    }
    if (data.type === 'RABBIT') {
        finalMetadata = { ...finalMetadata, shadowQueueEnabled: rabbitShadow };
    }

    // 2. Zwracamy obiekt DTO (płaski)
    return {
        name: data.name,
        type: data.type,
        connectionId: data.connectionId,
        technicalName: data.technicalName,
        correlationKeyType: data.correlationKeyType,
        correlationKeyName: data.correlationKeyName,
        // Tutaj zwracamy obiekt, stringify zrobimy w onSubmit (dla sieci) 
        // lub zostawimy obiekt (dla preview)
        metadata: finalMetadata
    };
  };

  const onSubmit = async (data: CreateStreamFormValues) => {
    setIsSubmitting(true);
    setError(null);

    const payloadObj = buildPayload(data);
    
    // Na backend 'metadata' musi iść jako string JSON
    const finalPayload = {
        ...payloadObj,
        metadata: JSON.stringify(payloadObj.metadata)
    };

    try {
      const res = await fetch("/api/streams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalPayload),
      });

      if (!res.ok) throw new Error("Failed to create stream");
      
      router.push("/streams");
      router.refresh();
    } catch (e) {
      setError("Failed to create stream. Please check configuration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPreviewJson = () => {
      // Używamy tej samej logiki co przy wysyłce
      const payload = buildPayload(formValues as CreateStreamFormValues);
      
      // W podglądzie zostawiamy 'metadata' jako obiekt, żeby było czytelnie dla oka,
      // mimo że fizycznie poleci jako string.
      return JSON.stringify(payload, null, 2);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* LEFT COLUMN: CONTEXT */}
        <div className="lg:col-span-1 space-y-6">
            <Card className="border-border/60 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base">Stream Context</CardTitle>
                    <CardDescription>Select the source/sink connection.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Connection</label>
                        <Select 
                            onValueChange={(val) => form.setValue("connectionId", val)} 
                            disabled={isLoadingConn}
                        >
                            <SelectTrigger className="bg-background">
                                <SelectValue placeholder="Select connection..." />
                            </SelectTrigger>
                            <SelectContent>
                                {connections.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                        <div className="flex items-center gap-2">
                                            <VendorIcon type={c.type} />
                                            <span>{c.name}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {form.formState.errors.connectionId && <p className="text-destructive text-xs">Connection is required</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Display Name</label>
                        <Input 
                            {...form.register("name")}
                            placeholder="e.g. Orders Stream"
                            className="bg-background"
                        />
                        {form.formState.errors.name && <p className="text-destructive text-xs">{form.formState.errors.name.message}</p>}
                    </div>

                </CardContent>
            </Card>

            <Card className="bg-muted/10 border-dashed border-border/60">
                <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2 text-primary text-sm font-medium">
                        <Info size={16} /> Information
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Streams map physical data sources (Topics, Queues) to ControlStream's internal logic. 
                    </p>
                </CardContent>
            </Card>
        </div>

        {/* RIGHT COLUMN: TECHNICAL CONFIG */}
        <div className="lg:col-span-2 space-y-6">
            <Card className="border-border/60 shadow-sm relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-1 transition-colors duration-300
                    ${activeConnection?.type === 'KAFKA' ? 'bg-purple-500' : 
                      activeConnection?.type === 'RABBIT' ? 'bg-orange-500' : 
                      activeConnection?.type === 'POSTGRES' ? 'bg-blue-500' : 'bg-slate-500'}`} 
                />

                <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted/30 rounded-lg border border-border">
                            {activeConnection ? <VendorIcon type={activeConnection.type} /> : <LinkIcon className="text-slate-500 h-5 w-5" />}
                        </div>
                        <div>
                            <CardTitle className="text-lg">
                                {activeConnection ? `${activeConnection.type} Configuration` : 'Configuration'}
                            </CardTitle>
                            <CardDescription>
                                Define technical details for {activeConnection?.name || 'the selected connection'}.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                    
                    {/* VENDOR FIELDS */}
                    {activeConnection?.type === 'POSTGRES' && (
                        <div className="grid grid-cols-2 gap-4 animate-in fade-in">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Table Schema</label>
                                <Input 
                                    value={pgSchema} 
                                    onChange={(e) => setPgSchema(e.target.value)} 
                                    className="bg-background font-mono text-sm" 
                                    placeholder="public"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Table Name</label>
                                <div className="relative">
                                    <Code className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                    <Input 
                                        {...form.register("technicalName")} 
                                        placeholder="users_table" 
                                        className="bg-background pl-9 font-mono text-sm border-primary/20 focus-visible:border-primary" 
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeConnection?.type !== 'POSTGRES' && (
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                {activeConnection?.type === 'RABBIT' ? 'Queue Name' : 'Topic Name'}
                            </label>
                            <div className="relative">
                                <Code className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input 
                                    {...form.register("technicalName")} 
                                    placeholder={activeConnection?.type === 'RABBIT' ? "orders.queue" : "orders-topic"} 
                                    className="bg-background pl-9 font-mono text-sm border-primary/20 focus-visible:border-primary" 
                                />
                            </div>
                            {form.formState.errors.technicalName && <p className="text-destructive text-xs">{form.formState.errors.technicalName.message}</p>}
                        </div>
                    )}

                    {activeConnection?.type === 'RABBIT' && (
                        <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/20 animate-in fade-in">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-medium">Shadow Queue</Label>
                                <p className="text-[10px] text-muted-foreground">Create a side-queue for non-intrusive monitoring.</p>
                            </div>
                            <Switch checked={rabbitShadow} onCheckedChange={setRabbitShadow} />
                        </div>
                    )}

                    <Separator />

                    {/* CORRELATION */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Correlation Strategy</label>
                            <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">Required for Tracing</Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs text-muted-foreground">Location</label>
                                <Select 
                                    onValueChange={(val) => form.setValue("correlationKeyType", val as "HEADER" | "PAYLOAD")} 
                                    value={form.watch("correlationKeyType")} 
                                >
                                    <SelectTrigger className="bg-background text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="HEADER">Header (Metadata)</SelectItem>
                                        <SelectItem value="PAYLOAD">Payload (Body)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div className="col-span-2 space-y-2">
                                <label className="text-xs text-muted-foreground">Key Name / Path</label>
                                <Input 
                                    {...form.register("correlationKeyName")}
                                    placeholder={activeConnection?.type === 'POSTGRES' ? "trace_id" : "header.trace-id"}
                                    className="bg-background font-mono text-sm"
                                />
                                {form.formState.errors.correlationKeyName && <p className="text-destructive text-xs">{form.formState.errors.correlationKeyName.message}</p>}
                            </div>
                        </div>
                    </div>

                    {/* PREVIEW */}
                    <div className="mt-6 pt-6 border-t border-border space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            <FileJson size={12} /> Definition Preview
                        </div>
                        <div className="bg-slate-950 rounded-lg border border-border p-4 shadow-inner">
                            <pre className="text-xs font-mono text-blue-400 overflow-x-auto whitespace-pre-wrap">
                                {getPreviewJson()}
                            </pre>
                        </div>
                    </div>

                </CardContent>
            </Card>

            {error && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2 animate-in slide-in-from-top-2">
                    <Activity size={16} /> {error}
                </div>
            )}

            <div className="flex justify-end">
                <Button 
                    type="submit" 
                    disabled={isSubmitting || !activeConnection}
                    className="w-full sm:w-auto px-8 py-6 text-base font-medium shadow-lg shadow-primary/20"
                >
                    {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" size={18} />}
                    Create Stream
                </Button>
            </div>
        </div>
      </div>
    </form>
  );
}