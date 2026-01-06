"use client";

import { useWorkspaceContext } from "@/components/workspace/WorkspaceProvider";
import { ChevronsUpDown } from "lucide-react";

export function WorkspaceSwitcher() {
  const { currentWorkspace, workspaces, switchWorkspace } =
    useWorkspaceContext();

  return (
    <div className="rounded-lg border border-border bg-background/40 px-2 py-2">
      <div className="px-2 pb-1 text-[10px] uppercase tracking-wide text-text-secondary">
        Workspace
      </div>

      <div className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-muted/40 transition">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium truncate">
            {currentWorkspace?.name ?? "—"}
          </div>
          <div className="text-xs text-text-secondary truncate">
            {currentWorkspace?.id ?? ""}
          </div>
        </div>

        <ChevronsUpDown size={16} className="opacity-70" />
      </div>

      <div className="mt-2 space-y-1">
        {workspaces.map((w) => {
          const isActive = w.id === currentWorkspace?.id;
          return (
            <button
              key={w.id}
              type="button"
              onClick={() => switchWorkspace(w.id)}
              className={[
                "w-full text-left px-2 py-1.5 rounded-md text-sm transition",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-white/5 text-text-secondary hover:text-white",
              ].join(" ")}
            >
              {w.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
