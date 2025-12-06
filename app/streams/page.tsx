import { StreamList } from '@/components/stream/StreamList';
import Link from 'next/link';
import { Button } from "@/components/ui/button"; // Używamy Button też tutaj dla spójności

export default function StreamsPage() {
  return (
    <main className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Streams</h1>
          <p className="text-muted-foreground">
            Configure data flow definitions and processing logic.
          </p>
        </div>
        <Button asChild>
            <Link href="/streams/create">
            Add Stream
            </Link>
        </Button>
      </div>

      <StreamList />
    </main>
  );
}