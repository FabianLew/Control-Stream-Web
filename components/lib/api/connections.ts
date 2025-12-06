import { ConnectionDto } from '@/types/connection';

// GET - Pobieranie wszystkich połączeń
export const getConnections = async (): Promise<ConnectionDto[]> => {
  const res = await fetch(`/api/connections`);
  
  if (!res.ok) {
    throw new Error('Failed to fetch connections');
  }
  
  return res.json();
};

// POST - Tworzenie nowego połączenia
// (Zakładam, że create przyjmuje DTO bez ID, lub ID jest ignorowane przez backend)
export const createConnection = async (connection: Omit<ConnectionDto, 'id' | 'createdAt' | 'updatedAt'>): Promise<ConnectionDto> => {
  const res = await fetch(`/api/connections`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(connection),
  });

  if (!res.ok) {
    throw new Error('Failed to create connection');
  }

  return res.json();
};

// PUT - Aktualizacja istniejącego połączenia
export const updateConnection = async (connection: ConnectionDto): Promise<ConnectionDto> => {
  // Wyciągamy ID, reszta idzie do body
  const { id, ...payload } = connection;

  const res = await fetch(`/api/connections/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error('Failed to update connection');
  }

  return res.json();
};