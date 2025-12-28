"use client";

import { useRouter } from "next/navigation";
import { ConnectionForm } from "@/components/connection/ConnectionForm";
import type { CreateConnectionFormValues } from "@/components/lib/schemas";

export function CreateConnectionForm() {
  const router = useRouter();

  const submit = async (payload: CreateConnectionFormValues) => {
    const res = await fetch("/api/connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("Failed to create connection");

    router.push("/connections");
    router.refresh();
  };

  return <ConnectionForm mode="create" onSubmit={submit} />;
}
