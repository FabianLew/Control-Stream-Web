"use client";

import React from "react";
import { StreamForm } from "@/components/stream/StreamForm";
import type { CreateStreamCommand } from "@/types/stream";
import { handleValidSubmit } from "@/components/lib/formError";

export function CreateStreamForm() {
  const onSubmit = async (payload: CreateStreamCommand) => {
    const res = await fetch("/api/streams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error("Failed to create stream");
    }

    handleValidSubmit({
      title: "Stream Created Successfully",
      description: "Your stream has been created and is ready to use.",
    });
  };

  return (
    <StreamForm mode="create" onSubmit={onSubmit} navigateAfterSubmit={true} />
  );
}
