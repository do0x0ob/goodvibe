import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

// ==================== Types ====================

export interface VaultData {
  vault: {
    id: string;
    owner: string;
    balance: string;
    globalDonationPercentage: number;
    totalDonated: string;
    createdAt: string;
  };
  allocations: Array<{
    projectId: string;
    percentage: number;
    totalDonated: string;
    lastDonationAt: string;
  }>;
  stats: {
    estimatedAnnualYield: string;
    donationPool: string;
    retainedYield: string;
    activeProjects: number;
  };
}

export interface PlatformStats {
  totalProjectsCreated: number;
  totalVaultsCreated: number;
  totalValueLocked: string;
  totalDonated: string;
  activeProjects: number;
  activeDonors: number;
  createdAt: string;
}

// ==================== Hooks ====================

/**
 * Fetch vault data with allocations and calculated stats
 */
export function useVaultDetails(userAddress: string | undefined) {
  return useQuery({
    queryKey: ['vaultDetails', userAddress],
    queryFn: async () => {
      if (!userAddress) return null;
      
      const response = await axios.get(`/api/vault?address=${userAddress}`);
      const data: VaultData = response.data;
      
      // Convert string back to BigInt
      return {
        vault: {
          ...data.vault,
          balance: BigInt(data.vault.balance),
          totalDonated: BigInt(data.vault.totalDonated),
          createdAt: BigInt(data.vault.createdAt),
        },
        allocations: data.allocations.map(a => ({
          ...a,
          totalDonated: BigInt(a.totalDonated),
          lastDonationAt: BigInt(a.lastDonationAt),
        })),
        stats: {
          estimatedAnnualYield: BigInt(data.stats.estimatedAnnualYield),
          donationPool: BigInt(data.stats.donationPool),
          retainedYield: BigInt(data.stats.retainedYield),
          activeProjects: data.stats.activeProjects,
        },
      };
    },
    enabled: !!userAddress,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

/**
 * Fetch platform-wide statistics
 */
export function usePlatformStats() {
  return useQuery({
    queryKey: ['platformStats'],
    queryFn: async () => {
      const response = await axios.get('/api/stats');
      const data: PlatformStats = response.data;
      
      // Convert string back to BigInt
      return {
        ...data,
        totalValueLocked: BigInt(data.totalValueLocked),
        totalDonated: BigInt(data.totalDonated),
        createdAt: BigInt(data.createdAt),
      };
    },
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });
}
