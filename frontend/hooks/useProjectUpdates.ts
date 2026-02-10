import { useSuiClient } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { getProjectUpdates } from '@/lib/sui/queries';

export function useProjectUpdates(projectId: string) {
  const client = useSuiClient();

  return useQuery({
    queryKey: ['projectUpdates', projectId],
    queryFn: async () => getProjectUpdates(client, projectId),
    enabled: !!projectId,
    refetchInterval: false,
    staleTime: 10000, // 10 seconds
  });
}
