'use client';

import { useQuery } from '@tanstack/react-query';
import { getConnections } from '@/components/lib/api/connections'; // Upewnij się, że ten plik istnieje (krok z poprzedniej odpowiedzi)
import { ConnectionDto } from '@/types/connection';     // Upewnij się, że ten plik istnieje
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Pencil, MoreHorizontal } from "lucide-react";
import { StreamTypeBadge } from "@/components/shared/StreamTypeBadge";

// Importujemy "klocki" wizualne, które masz w swoim projekcie
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function ConnectionList() {
  // Logika pobierania danych
  const { data, isLoading, isError } = useQuery<ConnectionDto[]>({
    queryKey: ['connections'],
    queryFn: getConnections,
  });

  if (isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading connections...</div>;
  }

  if (isError) {
    return <div className="p-4 text-sm text-red-500">Error loading connections.</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Host</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map((conn) => (
            <TableRow key={conn.id}>
              <TableCell className="font-medium">{conn.name}</TableCell>
              <TableCell>
                {/* Niezależnie czy pole nazywa się type, connectionType czy provider */}
                <StreamTypeBadge type={conn.type} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {conn.host}:{conn.port}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {conn.updatedAt ? new Date(conn.updatedAt).toLocaleDateString() : '-'}
              </TableCell>
            <TableCell className="text-right">
            <Button variant="outline" size="sm" asChild>
                <Link href={`/connections/${conn.id}`}>
                <Pencil className="mr-2 h-4 w-4" /> {/* Opcjonalna ikonka ołówka */}
                Edit
                </Link>
            </Button>
            </TableCell>
            </TableRow>
          ))}
          {(!data || data.length === 0) && (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                No connections found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}