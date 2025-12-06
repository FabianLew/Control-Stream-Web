import { ConnectionDto } from '@/types/connection';


export const getConnections = async (): Promise<ConnectionDto[]> => {
  const res = await fetch(`/api/connections`);
  
  if (!res.ok) {
    throw new Error('Failed to fetch connections');
  }
  
  return res.json();
};