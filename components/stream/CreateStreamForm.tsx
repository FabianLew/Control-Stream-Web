"use client";

import React from "react";
import { StreamForm } from "@/components/stream/StreamForm";
import type { CreateStreamCommand } from "@/types/stream";
import { handleValidSubmit } from "@/components/lib/formError";
import { createStream } from "@/lib/api/streams";

export function CreateStreamForm() {
  const onSubmit = async (payload: CreateStreamCommand) => {
    await createStream(payload);

    handleValidSubmit({
      title: "Stream Created Successfully",
      description: "Your stream has been created and is ready to use.",
    });
  };

  return (
    <StreamForm mode="create" onSubmit={onSubmit} navigateAfterSubmit={true} />
  );
}
