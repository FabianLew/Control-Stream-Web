import React from 'react';
import { StreamOverviewPage } from '@/components/stream/StreamOverviewPage';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  return <StreamOverviewPage streamId={id} />;
}