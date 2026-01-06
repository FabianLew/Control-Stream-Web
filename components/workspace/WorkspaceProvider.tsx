"use client";

import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { getMe } from "@/lib/api/auth";
import {
  getCurrentWorkspace,
  listWorkspaces,
  setCurrentWorkspace,
} from "@/lib/api/workspaces";
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "@/lib/auth/session";
import type { WorkspaceDto } from "@/types/workspace";

type WorkspaceContextValue = {
  isAuthenticated: boolean;
  meEmail?: string;
  currentWorkspace?: WorkspaceDto;
  workspaces: WorkspaceDto[];
  switchWorkspace: (workspaceId: string) => Promise<void>;
  authMode: "jwt" | "none";
};

const WorkspaceContext = React.createContext<WorkspaceContextValue | null>(
  null
);

export function useWorkspaceContext(): WorkspaceContextValue {
  const ctx = React.useContext(WorkspaceContext);
  if (!ctx) throw new Error("WorkspaceProvider missing");
  return ctx;
}

function resolveAuthMode(): "jwt" | "none" {
  const raw = (process.env.NEXT_PUBLIC_AUTH_MODE ?? "jwt").toLowerCase();
  return raw === "none" ? "none" : "jwt";
}

export function WorkspaceProvider(props: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const authMode = resolveAuthMode();

  const token = getAccessToken();
  const isAuthenticated = authMode === "none" ? true : Boolean(token);

  // jwt-mode: jeśli brak tokenu -> redirect na landing
  React.useEffect(() => {
    if (authMode !== "jwt") return;

    if (!isAuthenticated) {
      const landing = process.env.NEXT_PUBLIC_LANDING_URL || "/";
      router.replace(landing);
    }
  }, [authMode, isAuthenticated, router]);

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    enabled: authMode === "jwt" && isAuthenticated,
    retry: false,
  });

  const currentWorkspaceQuery = useQuery({
    queryKey: ["workspaces", "current"],
    queryFn: getCurrentWorkspace,
    enabled: authMode === "jwt" && isAuthenticated,
    retry: false,
  });

  const workspacesQuery = useQuery({
    queryKey: ["workspaces", "list"],
    queryFn: listWorkspaces,
    enabled: authMode === "jwt" && isAuthenticated,
    retry: false,
  });

  async function switchWorkspace(workspaceId: string) {
    if (authMode !== "jwt") return;

    const res = await setCurrentWorkspace(workspaceId);
    setAccessToken(res.accessToken);

    await queryClient.invalidateQueries({ queryKey: ["me"] });
    await queryClient.invalidateQueries({ queryKey: ["workspaces"] });

    router.refresh();
  }

  // jwt-mode: jak token padł -> redirect
  React.useEffect(() => {
    if (authMode !== "jwt") return;

    if (
      meQuery.isError ||
      currentWorkspaceQuery.isError ||
      workspacesQuery.isError
    ) {
      if (!getAccessToken()) {
        clearAccessToken();
        const landing = process.env.NEXT_PUBLIC_LANDING_URL || "/";
        router.replace(landing);
      }
    }
  }, [
    authMode,
    meQuery.isError,
    currentWorkspaceQuery.isError,
    workspacesQuery.isError,
    router,
  ]);

  const value: WorkspaceContextValue = {
    authMode,
    isAuthenticated,
    meEmail: authMode === "jwt" ? meQuery.data?.email : undefined,
    currentWorkspace:
      authMode === "jwt" ? currentWorkspaceQuery.data : undefined,
    workspaces: authMode === "jwt" ? workspacesQuery.data ?? [] : [],
    switchWorkspace,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {props.children}
    </WorkspaceContext.Provider>
  );
}
