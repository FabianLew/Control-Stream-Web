"use client";

import type {
  CreateLiveSessionRequest,
  CreateLiveSessionResponse,
  UpdateLiveSessionRequest,
  UUID,
} from "@/types/live";
import { requestJson, requestVoid } from "./helper";

const BASE = "/api/live";

export async function createLiveSession(
  req: CreateLiveSessionRequest
): Promise<CreateLiveSessionResponse> {
  return requestJson<CreateLiveSessionResponse>(BASE, {
    method: "POST",
    json: req,
  });
}

export async function updateLiveSession(
  sessionId: UUID,
  req: UpdateLiveSessionRequest
): Promise<void> {
  await requestVoid(`${BASE}/${sessionId}`, {
    method: "PATCH",
    json: req,
  });
}

export async function deleteLiveSession(sessionId: UUID): Promise<void> {
  await requestVoid(`${BASE}/${sessionId}`, { method: "DELETE" });
}

export function liveEventsUrl(sessionId: UUID) {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL;
  return `${base}/api/live/${sessionId}/events`;
}
