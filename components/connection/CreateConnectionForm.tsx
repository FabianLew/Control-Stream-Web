"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createConnectionSchema, CreateConnectionFormValues } from "@/components/lib/schemas";
import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";

export function CreateConnectionForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

const form = useForm({
    resolver: zodResolver(createConnectionSchema),
    defaultValues: {
      type: "KAFKA",
      port: undefined, 
      metadata: { sslEnabled: false }
    }
});
  // Obserwujemy zmianę typu, aby wyświetlać odpowiednie pola
  const selectedType = form.watch("type");

  const onSubmit = async (data: CreateConnectionFormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/connections", { // Proxy do backendu Javy
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to create connection");
      
      router.push("/connections"); // Przekierowanie po sukcesie
      router.refresh();
    } catch (e) {
      setError("Something went wrong. Please check your inputs.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-background-card border border-border rounded-xl">
      <h2 className="text-xl font-bold text-white mb-6">New Connection</h2>
      
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {/* 1. Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-secondary uppercase">Name</label>
            <input 
              {...form.register("name")}
              placeholder="e.g. Production Kafka"
              className="w-full bg-background-main border border-border rounded-lg p-2 text-white"
            />
            {form.formState.errors.name && <p className="text-red-400 text-xs">{form.formState.errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-secondary uppercase">Type</label>
            <select 
              {...form.register("type")}
              className="w-full bg-background-main border border-border rounded-lg p-2 text-white"
            >
              <option value="KAFKA">Apache Kafka</option>
              <option value="RABBIT">RabbitMQ</option>
              <option value="POSTGRES">PostgreSQL</option>
            </select>
          </div>
        </div>

        {/* 2. Dynamic Fields based on Type */}
        <div className="p-4 bg-background-main/30 rounded-lg border border-border/50 space-y-4">
            <h3 className="text-sm font-semibold text-primary mb-2">
                {selectedType === 'POSTGRES' ? 'Database Configuration' : 'Broker Configuration'}
            </h3>

            {/* Common Fields: Host/Port (Ukrywamy dla Kafki jeśli wolimy bootstrapServers string) */}
            <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                    <label className="text-xs text-text-secondary">Host</label>
                    <input {...form.register("host")} placeholder="localhost" className="w-full bg-background-card border border-border rounded p-2 text-white text-sm" />
                </div>
                <div className="space-y-2">
                    <label className="text-xs text-text-secondary">Port</label>
                    <input {...form.register("port")} placeholder={selectedType === 'POSTGRES' ? "5432" : "9092"} type="number" className="w-full bg-background-card border border-border rounded p-2 text-white text-sm" />
                </div>
            </div>

            {/* Auth Fields */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs text-text-secondary">Username</label>
                    <input {...form.register("username")} className="w-full bg-background-card border border-border rounded p-2 text-white text-sm" />
                </div>
                <div className="space-y-2">
                    <label className="text-xs text-text-secondary">Password</label>
                    <input {...form.register("password")} type="password" className="w-full bg-background-card border border-border rounded p-2 text-white text-sm" />
                </div>
            </div>

            {/* POSTGRES SPECIFIC */}
            {selectedType === "POSTGRES" && (
                <div className="space-y-2 animate-in fade-in">
                    <label className="text-xs text-text-secondary">Database Name</label>
                    <input {...form.register("metadata.databaseName")} placeholder="my_db" className="w-full bg-background-card border border-border rounded p-2 text-white text-sm" />
                </div>
            )}
             {selectedType === "POSTGRES" && (
                <div className="space-y-2 animate-in fade-in">
                    <label className="text-xs text-text-secondary">Schema (Optional)</label>
                    <input {...form.register("metadata.schema")} placeholder="public" className="w-full bg-background-card border border-border rounded p-2 text-white text-sm" />
                </div>
            )}
        </div>

        {error && <div className="text-red-400 text-sm">{error}</div>}

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2.5 rounded-lg flex justify-center items-center gap-2 transition-colors"
        >
          {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={18} />}
          Save Connection
        </button>
      </form>
    </div>
  );
}