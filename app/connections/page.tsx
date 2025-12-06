import { ConnectionList } from '@/components/connection/ConnectionList';
import { Plus } from "lucide-react";
import Link from 'next/link';

export default function ConnectionsPage() {
  return (
    <main className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Connections</h1>
          <p className="text-muted-foreground">
            Manage your external data sources and sinks.
          </p>
        </div>
        
        <Link 
          href="/connections/create" 
          className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={18} />
          Add Stream
        </Link>
      </div>

      <ConnectionList />
    </main>
  );
}