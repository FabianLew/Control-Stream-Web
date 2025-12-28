"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { ConnectionForm } from "@/components/connection/ConnectionForm";
import type { CreateConnectionFormValues } from "@/components/lib/schemas";

export default function CreateConnectionPage() {
  const router = useRouter();

  const submit = async (payload: CreateConnectionFormValues) => {
    const res = await fetch("/api/connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error("Failed to create connection");
    }

    router.push("/connections");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-8 space-y-6 fade-in">
      <Link
        href="/connections"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors w-fit group"
      >
        <ArrowLeft
          size={16}
          className="mr-1 group-hover:-translate-x-1 transition-transform"
        />
        Back to Connections
      </Link>

      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Create New Connection
        </h1>
        <p className="text-muted-foreground">
          Setup a new data source or sink for your event streams.
        </p>
      </div>

      <ConnectionForm mode="create" onSubmit={submit} />
    </div>
  );
}
