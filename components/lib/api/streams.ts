import { UnifiedStreamDto } from '@/types/stream';


export const getStreams = async (): Promise<UnifiedStreamDto[]> => {
  const res = await fetch(`/api/streams`);
  
  if (!res.ok) {
    throw new Error('Failed to fetch streams');
  }
  
  return res.json();
};