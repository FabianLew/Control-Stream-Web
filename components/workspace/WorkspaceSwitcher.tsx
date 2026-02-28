"use client";

import * as React from "react";
import { useWorkspaceContext } from "@/components/workspace/WorkspaceProvider";
import { ChevronsUpDown, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function WorkspaceSwitcher() {
  const {
    currentWorkspace,
    workspaces,
    switchWorkspace,
    isSwitchingWorkspace,
  } = useWorkspaceContext();

  const [open, setOpen] = React.useState(false);

  return (
    <div className="rounded-lg border border-border bg-background/40 px-2 py-2">
      <div className="px-2 pb-1 text-[10px] uppercase tracking-wide text-text-secondary">
        Workspace
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-muted/40 transition"
          >
            <div className="min-w-0 flex-1 text-left">
              <div className="text-sm font-medium truncate">
                {currentWorkspace?.name ?? "—"}
              </div>
              <div className="text-xs text-text-secondary truncate">
                {currentWorkspace?.id ?? ""}
              </div>
            </div>

            <ChevronsUpDown size={16} className="opacity-70" />
          </button>
        </PopoverTrigger>

        <PopoverContent align="start" className="w-[320px] p-2">
          <div className="space-y-1">
            {workspaces.map((w) => {
              const isActive = w.id === currentWorkspace?.id;

              return (
                <button
                  key={w.id}
                  type="button"
                  disabled={isSwitchingWorkspace}
                  onClick={async () => {
                    if (isActive) {
                      setOpen(false);
                      return;
                    }
                    await switchWorkspace(w.id);
                    setOpen(false);
                  }}
                  className={[
                    "w-full text-left px-2 py-2 rounded-md text-sm transition flex items-center gap-2",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-white/5 text-text-secondary hover:text-white",
                    isSwitchingWorkspace ? "opacity-60 cursor-not-allowed" : "",
                  ].join(" ")}
                >
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">{w.name}</div>
                    <div className="truncate text-xs opacity-70">{w.id}</div>
                  </div>

                  {isActive ? <Check size={16} className="opacity-80" /> : null}
                </button>
              );
            })}
          </div>

          {isSwitchingWorkspace ? (
            <div className="pt-2 text-xs text-text-secondary">
              Switching workspace…
            </div>
          ) : null}
        </PopoverContent>
      </Popover>
    </div>
  );
}
