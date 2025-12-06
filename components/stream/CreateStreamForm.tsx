"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createStreamSchema, CreateStreamFormValues } from "@/components/lib/schemas";
import { useState, useEffect } from "react";
import { Loader2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

type ConnectionSummary = { id: string; name: string; type: string };

export function CreateStreamForm() {
  const router = useRouter();
  const [connections, setConnections] = useState<ConnectionSummary[]>([]);
  const [isLoadingConn, setIsLoadingConn] = useState(true);
  
  const form = useForm<CreateStreamFormValues>({
    resolver: zodResolver(createStreamSchema),
    defaultValues: {
      type: "KAFKA",
      correlationKeyType: "HEADER", // Domyślna wartość
      correlationKeyName: "trace-id" // Domyślna wartość
    }
  });

  // Pobieranie połączeń
  useEffect(() => {
    fetch("/api/connections")
      .then(res => res.json())
      .then(data => setConnections(data))
      .catch(console.error)
      .finally(() => setIsLoadingConn(false));
  }, []);

  // Automatyczne ustawienie typu streama po wybraniu connection
  const selectedConnectionId = form.watch("connectionId");
  useEffect(() => {
    const conn = connections.find(c => c.id === selectedConnectionId);
    if (conn) {
      form.setValue("type", conn.type as any);
    }
  }, [selectedConnectionId, connections, form]);

  const onSubmit = async (data: CreateStreamFormValues) => {
    // --- KONWERSJA DTO ---
    const payload = {
        name: data.name,
        type: data.type,
        connectionId: data.connectionId,
        technicalName: data.technicalName,
        correlationKeyType: data.correlationKeyType,
        correlationKeyName: data.correlationKeyName,
        // Serializacja metadata
        metadata: data.metadata ? JSON.stringify(data.metadata) : "{}"
    };

    try {
        const res = await fetch("/api/streams", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (res.ok) router.push("/streams");
    } catch(e) { console.error(e); }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-background-card border border-border rounded-xl">
      <h2 className="text-xl font-bold text-white mb-6">New Stream Definition</h2>
      
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {/* 1. Connection Selection */}
        <div className="space-y-2">
            <label className="text-xs font-bold text-text-secondary uppercase">Connection</label>
            <select 
              {...form.register("connectionId")}
              disabled={isLoadingConn}
              className="w-full bg-background-main border border-border rounded-lg p-2 text-white text-sm"
            >
              <option value="">Select connection...</option>
              {connections.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
              ))}
            </select>
            {form.formState.errors.connectionId && <p className="text-red-400 text-xs">Required</p>}
        </div>

        {/* 2. Basic Info */}
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="text-xs font-bold text-text-secondary uppercase">Display Name</label>
                <input {...form.register("name")} placeholder="e.g. Orders Stream" className="w-full bg-background-main border border-border rounded-lg p-2 text-white text-sm" />
            </div>
            <div className="space-y-2">
                <label className="text-xs font-bold text-text-secondary uppercase">Technical Name</label>
                <input {...form.register("technicalName")} placeholder="topic_name / table_name" className="w-full bg-background-main border border-border rounded-lg p-2 text-white text-sm font-mono" />
            </div>
        </div>

        {/* 3. Correlation Configuration (NOWE DLA CIEBIE) */}
        <div className="p-4 bg-background-main/30 rounded-lg border border-border/50 space-y-4">
            <h3 className="text-sm font-semibold text-primary mb-2">Correlation Settings</h3>
            <p className="text-xs text-text-secondary -mt-3 mb-2">How should we identify related messages in this stream?</p>

            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <label className="text-xs text-text-secondary">Location Type</label>
                    <select {...form.register("correlationKeyType")} className="w-full bg-background-card border border-border rounded p-2 text-white text-sm">
                        <option value="HEADER">Header (Metadata)</option>
                        <option value="PAYLOAD">Payload (Body)</option>
                    </select>
                </div>
                <div className="col-span-2 space-y-2">
                    <label className="text-xs text-text-secondary">Key Name / Path</label>
                    <input 
                        {...form.register("correlationKeyName")} 
                        placeholder="e.g. trace-id or header.correlation_id" 
                        className="w-full bg-background-card border border-border rounded p-2 text-white text-sm font-mono" 
                    />
                     {form.formState.errors.correlationKeyName && <p className="text-red-400 text-xs">Required</p>}
                </div>
            </div>
        </div>

        <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2.5 rounded-lg">
          {form.formState.isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : "Create Stream"}
        </button>
      </form>
    </div>
  );
}