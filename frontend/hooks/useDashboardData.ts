import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export interface DashboardData {
  vault: {
    id: string;
    balance: bigint;
    owner: string;
    apy: number;
  } | null;
  donations: Array<{
    projectId: string;
    percentage: number;
    totalDonated: bigint;
  }>;
  stats: {
    totalDonated: bigint;
    activeProjects: number;
    estimatedYield: bigint;
  };
}

export function useDashboardData(userAddress: string | undefined) {
  return useQuery({
    queryKey: ['dashboard', userAddress],
    queryFn: async () => {
      if (!userAddress) return null;
      
      const response = await axios.get(`/api/dashboard?address=${userAddress}`);
      const data = response.data;
      
      // Convert string back to BigInt
      return {
        vault: data.vault ? {
          ...data.vault,
          balance: BigInt(data.vault.balance),
        } : null,
        donations: data.donations.map((d: any) => ({
          ...d,
          totalDonated: BigInt(d.totalDonated),
        })),
        stats: {
          ...data.stats,
          totalDonated: BigInt(data.stats.totalDonated),
          estimatedYield: BigInt(data.stats.estimatedYield),
        },
      } as DashboardData;
    },
    enabled: !!userAddress,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
