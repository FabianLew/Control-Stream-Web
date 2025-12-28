"use client";

import { useRouter } from "next/navigation";
import { ConnectionForm } from "@/components/connection/ConnectionForm";
import type { CreateConnectionFormValues } from "@/components/lib/schemas";
import { createConnection } from "@/lib/api/connections";

export function CreateConnectionForm() {
  const router = useRouter();

  const submit = async (payload: CreateConnectionFormValues) => {
    await createConnection(payload);

    router.push("/connections");
    router.refresh();
  };

  return <ConnectionForm mode="create" onSubmit={submit} />;
}
