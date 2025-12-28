"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ConnectionOverviewDto, ConnectionDto } from "@/types/connection";
import {
  getConnectionsOverview,
  updateConnection,
} from "@/lib/api/connections";
import { Button } from "@/components/ui/button";
import { Pencil, Server } from "lucide-react";
import { StreamTypeBadge } from "@/components/shared/StreamTypeBadge";
import { ConnectionStatusBadge } from "./ConnectionStatusBadge";
import { EditConnectionDialog } from "./EditConnectionDialog";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function ConnectionList() {
  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingConnectionId, setEditingConnectionId] = useState<string | null>(
    null
  );

  const { data, isLoading, isError } = useQuery<ConnectionOverviewDto[]>({
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

  const handleEditClick = (conn: ConnectionOverviewDto) => {
    setEditingConnectionId(conn.id);
    setIsEditOpen(true);
  };

  const handleSaveWrapper = async (updatedConn: ConnectionDto) => {
    await updateMutation.mutateAsync(updatedConn);
  };

  if (isLoading)
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Loading connections...
      </div>
    );
  if (isError)
    return (
      <div className="p-4 text-sm text-destructive">
        Error loading connections.
      </div>
    );

  return (
    <>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Host Details</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((conn) => (
              <TableRow key={conn.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">
                      {conn.name}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <StreamTypeBadge type={conn.type} />
                </TableCell>

                <TableCell>
                  {/* Stylizacja spójna z StreamList: font-mono + text-muted-foreground */}
                  <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                    <Server size={12} className="opacity-70" />
                    {conn.host}:{conn.port}
                  </div>
                </TableCell>

                <TableCell>
                  {/* Stylizacja "Pill" z StreamList zaadaptowana do statusu */}
                  <div className="flex items-center gap-2">
                    <ConnectionStatusBadge
                      status={conn.status}
                      showLabel={false}
                    />
                    <span className="px-1.5 py-0.5 rounded border border-border bg-muted/50 uppercase text-[10px] font-medium text-muted-foreground">
                      {conn.status}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditClick(conn)}
                    className="h-8 w-8 p-0 lg:w-auto lg:px-2 lg:h-9"
                  >
                    <Pencil className="h-4 w-4 lg:mr-2" />
                    <span className="hidden lg:inline">Edit</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {(!data || data.length === 0) && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  No connections found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <EditConnectionDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        connectionId={editingConnectionId}
      />
    </>
  );
}
