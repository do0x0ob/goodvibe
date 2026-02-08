import { useSuiClient } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { Vault } from '@/types/vault';

function parseVaultData(data: any): Vault {
  const fields = data.data?.content?.fields;
  return {
    id: data.data?.objectId,
    name: fields?.name || 'My Vault',
    balance: BigInt(fields?.deposited_balance || 0),
    donations: {}, // TODO: Parse donation config
    owner: fields?.owner,
  };
}

export function useVaultData(vaultId: string | null) {
  const suiClient = useSuiClient();
  
  return useQuery({
    queryKey: ['vault', vaultId],
    queryFn: async () => {
      if (!vaultId) return null;
      const vault = await suiClient.getObject({
        id: vaultId,
        options: { showContent: true },
      });
      return parseVaultData(vault);
    },
    enabled: !!vaultId,
  });
}
