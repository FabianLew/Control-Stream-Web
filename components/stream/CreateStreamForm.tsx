"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { StreamForm } from "@/components/stream/StreamForm";
import type { CreateStreamCommand } from "@/types/stream";

export function CreateStreamForm() {
  const router = useRouter();

  const onSubmit = async (payload: CreateStreamCommand) => {
    const res = await fetch("/api/streams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error("Failed to create stream");
    }

    router.push("/streams");
    router.refresh();
  };

  return (
    <StreamForm
      mode="create"
      onSubmit={onSubmit}
      navigateAfterSubmit={false} // bo nawigujemy tu
    />
  );
}
