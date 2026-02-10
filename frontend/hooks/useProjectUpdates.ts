import { useSuiClient } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { getProjectUpdates } from '@/lib/sui/queries';

export function useProjectUpdates(projectId: string) {
  const client = useSuiClient();

  return useQuery({
    queryKey: ['projectUpdates', projectId],
    queryFn: async () => {
      console.log('[useProjectUpdates] Fetching updates for project:', projectId);
      const result = await getProjectUpdates(client, projectId);
      console.log('[useProjectUpdates] Got result:', result.length, 'updates');
      return result;
    },
    enabled: !!projectId,
    refetchInterval: false,
    staleTime: 10000, // 10 seconds
  });
}
