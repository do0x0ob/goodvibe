import { useQuery } from '@tanstack/react-query';
import { useCurrentAccount } from '@mysten/dapp-kit';
import axios from 'axios';

// ==================== Type Definitions ====================

export interface SupportedProject {
  projectId: string;
  supportInfo: {
    amount: string;
    startedAt: number;
    lastUpdated: number;
  };
  projectData: {
    title: string;
    category: string;
    imageUrl: string;
    creator: string;
    totalSupportAmount: string;
    supporterCount: number;
    isActive: boolean;
  };
}

export interface OwnedProject {
  projectId: string;
  projectCapId: string;
  metadata: {
    title: string;
    description: string;
    category: string;
    imageUrl: string;
  };
  financial: {
    balance: string;
    totalReceived: string;
    totalSupportAmount: string;
  };
  stats: {
    supporterCount: number;
    updatesCount: number;
    isActive: boolean;
    createdAt: string;
  };
}

export interface DashboardData {
  supporter: {
    hasRecord: boolean;
    recordId?: string;
    wallet: {
      usdc: string;
      btcUSDC: string;
    };
    supportedProjects: SupportedProject[];
  };
  creator: {
    projectCount: number;
    projects: OwnedProject[];
  };
}

// ==================== Hook ====================

/**
 * 統一的 Dashboard 數據查詢 Hook
 * 
 * 包含兩個視角的完整數據：
 * 1. Supporter - 支持的項目、錢包餘額
 * 2. Creator - 創建的項目、財務統計
 */
export function useDashboardV2() {
  const account = useCurrentAccount();
  const address = account?.address;

  return useQuery({
    queryKey: ['dashboardV2', address],
    queryFn: async (): Promise<DashboardData | null> => {
      if (!address) return null;

      console.log('[useDashboardV2] Fetching for address:', address);
      
      const response = await axios.get<DashboardData>(
        `/api/dashboard-v2?address=${address}`
      );

      console.log('[useDashboardV2] Success:', {
        supportedProjects: response.data.supporter.supportedProjects.length,
        ownedProjects: response.data.creator.projectCount,
      });

      return response.data;
    },
    enabled: !!address,
    staleTime: 30 * 1000, // 30 seconds
    retry: 2,
  });
}

// ==================== Convenience Hooks ====================

/**
 * 僅獲取 Supporter 數據的 Hook
 */
export function useSupporterData() {
  const { data, ...rest } = useDashboardV2();
  
  return {
    data: data?.supporter,
    ...rest,
  };
}

/**
 * 僅獲取 Creator 數據的 Hook
 */
export function useCreatorData() {
  const { data, ...rest } = useDashboardV2();
  
  return {
    data: data?.creator,
    ...rest,
  };
}

/**
 * 獲取錢包餘額的 Hook
 */
export function useWalletBalance() {
  const { data, ...rest } = useDashboardV2();
  
  return {
    data: data?.supporter.wallet,
    ...rest,
  };
}
