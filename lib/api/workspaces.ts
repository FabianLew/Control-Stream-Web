import { requestJson } from "@/lib/api/helper";
import type { WorkspaceDto } from "@/types/workspace";
import type { AuthResponseDto } from "@/types/auth";

export const getCurrentWorkspace = async (): Promise<WorkspaceDto> =>
  requestJson("/api/workspaces/current");

export const listWorkspaces = async (): Promise<WorkspaceDto[]> =>
  requestJson("/api/workspaces");

export const setCurrentWorkspace = async (
  workspaceId: string
): Promise<AuthResponseDto> =>
  requestJson(`/api/workspaces/current/${workspaceId}`, { method: "POST" });
