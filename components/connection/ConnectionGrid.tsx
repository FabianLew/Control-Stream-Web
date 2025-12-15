"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreVertical, Pencil, ExternalLink, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

import { StreamTypeBadge } from "@/components/shared/StreamTypeBadge";
import { EditConnectionDialog } from "./EditConnectionDialog";
import { ConnectionOverviewDto, ConnectionDto } from "@/types/connection";
import { updateConnection } from "@/components/lib/api/connections";
import { ConnectionStatusBadge } from "./ConnectionStatusBadge";

const getConnectionsOverview = async (): Promise<ConnectionOverviewDto[]> => {
  const res = await fetch("/api/connections/overview");
  if (!res.ok) throw new Error("Failed to fetch connections");
  return res.json();
};

export function ConnectionGrid() {
  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingConnectionId, setEditingConnectionId] = useState<string | null>(
    null
  );

  const {
    data: connections,
    isLoading,
    isError,
  } = useQuery<ConnectionOverviewDto[]>({
    queryKey: ["connections-overview"],
    queryFn: getConnectionsOverview,
  });

  const updateMutation = useMutation({
    mutationFn: updateConnection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connections-overview"] });
      setIsEditOpen(false);
    },
  });

  const handleEditClick = (
    e: React.MouseEvent,
    conn: ConnectionOverviewDto
  ) => {
    e.preventDefault();
    setEditingConnectionId(conn.id);
    setIsEditOpen(true);
  };

  const handleSaveWrapper = async (updatedConn: ConnectionDto) => {
    await updateMutation.mutateAsync(updatedConn);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-[180px] rounded-xl border bg-card shadow-sm p-6 space-y-4"
          >
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (isError)
    return (
      <div className="p-4 text-sm text-destructive">
        Error loading connections.
      </div>
    );

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {connections?.map((conn) => (
          <div
            key={conn.id}
            className="group relative flex flex-col justify-between rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-muted-foreground/20"
          >
            {/* Top */}
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <h3 className="font-medium text-foreground tracking-tight flex items-center gap-2">
                    {conn.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <StreamTypeBadge type={conn.type} />
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        setEditingConnectionId(conn.id);
                        setIsEditOpen(true);
                      }}
                    >
                      <Pencil className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <div className="inline-flex items-center gap-2 px-2 py-1 rounded border border-border bg-muted/50 text-xs font-mono text-muted-foreground">
                  <Server className="h-3 w-3 opacity-70" />
                  {conn.host}:{conn.port}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-between rounded-b-xl">
              <div className="flex items-center gap-2">
                <ConnectionStatusBadge status={conn.status} showLabel={false} />
                <span className="text-[10px] uppercase font-medium text-muted-foreground tracking-wider">
                  {conn.status}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs gap-1.5 hover:bg-background border border-transparent hover:border-border"
                  onClick={(e) => {
                    e.preventDefault();
                    setEditingConnectionId(conn.id);
                    setIsEditOpen(true);
                  }}
                >
                  <Pencil size={12} />
                  Edit
                </Button>

                <Link href={`/connections/${conn.id}`}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs gap-1.5 hover:bg-background border border-transparent hover:border-border"
                  >
                    Details <ExternalLink size={12} />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      <EditConnectionDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        connectionId={editingConnectionId}
      />
    </>
  );
}
