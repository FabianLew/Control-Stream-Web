import { UnifiedStreamDto } from '@/types/stream';

// GET - Pobieranie wszystkich strumieni
export const getStreams = async (): Promise<UnifiedStreamDto[]> => {
  const res = await fetch(`/api/streams`);
  
  if (!res.ok) {
    throw new Error('Failed to fetch streams');
  }
  
  return res.json();
};

// POST - Tworzenie nowego strumienia
export const createStream = async (stream: Omit<UnifiedStreamDto, 'id' | 'createdAt' | 'updatedAt'>): Promise<UnifiedStreamDto> => {
  const res = await fetch(`/api/streams`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(stream),
  });

  if (!res.ok) {
    throw new Error('Failed to create stream');
  }

  return res.json();
};

// PUT - Aktualizacja istniejącego strumienia
export const updateStream = async (stream: UnifiedStreamDto): Promise<UnifiedStreamDto> => {
  // Wyciągamy ID, reszta idzie do body
  const { id, ...payload } = stream;

  const res = await fetch(`/api/streams/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error('Failed to update stream');
  }

  return res.json();
};