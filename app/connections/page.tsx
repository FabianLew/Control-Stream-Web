'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ConnectionGrid } from '@/components/connection/ConnectionGrid';
import { ConnectionList } from '@/components/connection/ConnectionList';
import { LayoutGrid, List as ListIcon, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function ConnectionsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  return (
    <main className="p-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Connections</h1>
          <p className="text-muted-foreground">
            Manage your data sources and sinks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Przełącznik widoku - uproszczony, używający zmiennych motywu (bg-muted, bg-background) */}
          <div className="flex items-center p-1 rounded-lg border bg-muted/40 text-muted-foreground">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'grid'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'hover:text-foreground'
              }`}
              aria-label="Grid View"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'list'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'hover:text-foreground'
              }`}
              aria-label="List View"
            >
              <ListIcon size={18} />
            </button>
          </div>

          <Button asChild>
            <Link href="/connections/create">
              <Plus className="mr-2 h-4 w-4" />
              Add Connection
            </Link>
          </Button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <ConnectionGrid />
      ) : (
        <ConnectionList />
      )}
    </main>
  );
}