import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { PACKAGE_ID } from '@/config/sui';

interface SupportedProject {
  projectId: string;
  amount: bigint;
  startedAt: bigint;
  lastUpdated: bigint;
}

export function useSupportRecord() {
  const client = useSuiClient();
  const account = useCurrentAccount();
  const address = account?.address;

  const { data: supportRecordId, isLoading: isLoadingRecord } = useQuery({
    queryKey: ['supportRecord', address],
    queryFn: async () => {
      if (!address) return null;

      const objects = await client.getOwnedObjects({
        owner: address,
        filter: {
          StructType: `${PACKAGE_ID}::support_record::SupportRecord`,
        },
        options: { showContent: true },
      });

      return objects.data[0]?.data?.objectId || null;
    },
    enabled: !!address,
  });

  const { data: supportedProjects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['supportedProjects', supportRecordId],
    queryFn: async () => {
      if (!supportRecordId) return [];

      const dynamicFields = await client.getDynamicFields({
        parentId: supportRecordId,
      });

      const projects: SupportedProject[] = [];

      for (const field of dynamicFields.data) {
        const fieldObject = await client.getObject({
          id: field.objectId,
          options: { showContent: true },
        });

        if (
          fieldObject.data?.content &&
          'fields' in fieldObject.data.content
        ) {
          const fields = fieldObject.data.content.fields as any;
          const value = fields.value.fields;

          projects.push({
            projectId: value.project_id,
            amount: BigInt(value.amount),
            startedAt: BigInt(value.started_at),
            lastUpdated: BigInt(value.last_updated),
          });
        }
      }

      return projects;
    },
    enabled: !!supportRecordId,
  });

  return {
    supportRecordId,
    supportedProjects: supportedProjects || [],
    isLoading: isLoadingRecord || isLoadingProjects,
    hasRecord: !!supportRecordId,
  };
}

export function useIsSupportingProject(projectId: string) {
  const { supportedProjects } = useSupportRecord();

  const supportInfo = supportedProjects.find(
    (p) => p.projectId === projectId
  );

  return {
    isSupporting: !!supportInfo,
    supportAmount: supportInfo?.amount || BigInt(0),
    startedAt: supportInfo?.startedAt,
  };
}
