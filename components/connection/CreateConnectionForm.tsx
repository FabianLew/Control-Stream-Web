"use client";

import { useRouter } from "next/navigation";
import { ConnectionForm } from "@/components/connection/ConnectionForm";
import type { ConnectionUpsertPayload } from "@/types/connection";
import { createConnection } from "@/lib/api/connections";

export function CreateConnectionForm() {
  const router = useRouter();

  const submit = async (payload: ConnectionUpsertPayload) => {
    await createConnection(payload);

    router.push("/connections");
    router.refresh();
  };

  return <ConnectionForm mode="create" onSubmit={submit} />;
}
