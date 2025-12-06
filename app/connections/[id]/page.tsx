import React from 'react';
import { ConnectionDetail } from '@/components/connection/ConnectionDetail';

// 1. Zmieniamy typowanie: params to teraz Promise
interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

// 2. Dodajemy 'async' do definicji funkcji
export default async function ConnectionDetailsPage({ params }: PageProps) {
  // 3. Rozpakowujemy ID używając await
  const { id } = await params;

  return (
    <main>
      <ConnectionDetail id={id} />
    </main>
  );
}