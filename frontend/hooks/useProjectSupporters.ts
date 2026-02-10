import { useSuiClient } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { PACKAGE_ID } from '@/config/sui';
import { getProjectSupportersFromEvents } from '@/lib/sui/queries';

export function useProjectSupporters(projectId: string) {
  const client = useSuiClient();

  return useQuery({
    queryKey: ['projectSupporters', projectId],
    queryFn: () => getProjectSupportersFromEvents(client, PACKAGE_ID, projectId),
    enabled: !!projectId,
  });
}
