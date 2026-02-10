import { NextRequest, NextResponse } from 'next/server';
import { suiClient } from '@/lib/sui/client';
import { PACKAGE_ID, USDC_TYPE, STABLE_COIN_TYPE } from '@/config/sui';
import {
  getUserSupportRecord,
  getProjectById,
  getProjectUpdates,
} from '@/lib/sui/queries';

// ==================== Type Definitions ====================

interface SupporterData {
  hasRecord: boolean;
  recordId?: string;
  wallet: {
    usdc: string;
    btcUSDC: string;
  };
  supportedProjects: SupportedProject[];
}

interface SupportedProject {
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

interface CreatorData {
  projectCount: number;
  projects: OwnedProject[];
}

interface OwnedProject {
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

interface DashboardResponse {
  supporter: SupporterData;
  creator: CreatorData;
}

// ==================== Helper Functions ====================

async function fetchSupporterData(address: string): Promise<SupporterData> {
  try {
    // 1. 獲取 Support Record
    const recordId = await getUserSupportRecord(suiClient, address, PACKAGE_ID);
    
    if (!recordId) {
      return {
        hasRecord: false,
        wallet: await fetchWalletBalance(address),
        supportedProjects: [],
      };
    }

    // 2. 獲取支持的項目列表
    const supportedProjects = await fetchSupportedProjects(recordId);

    // 3. 獲取錢包餘額
    const wallet = await fetchWalletBalance(address);

    return {
      hasRecord: true,
      recordId,
      wallet,
      supportedProjects,
    };
  } catch (error) {
    console.error('[fetchSupporterData] Error:', error);
    return {
      hasRecord: false,
      wallet: { usdc: '0', btcUSDC: '0' },
      supportedProjects: [],
    };
  }
}

async function fetchSupportedProjects(recordId: string): Promise<SupportedProject[]> {
  try {
    // 獲取 SupportRecord 的 dynamic fields
    const dynamicFields = await suiClient.getDynamicFields({
      parentId: recordId,
    });

    const projects: SupportedProject[] = [];

    // 並行獲取每個項目的詳細信息
    await Promise.all(
      dynamicFields.data.map(async (field) => {
        try {
          const projectId = (field as any).name?.value || (field as any).name;
          
          // 獲取 ProjectSupport 數據
          const fieldObj = await suiClient.getDynamicFieldObject({
            parentId: recordId,
            name: (field as any).name,
          });

          const supportFields = (fieldObj.data?.content as any)?.fields;
          if (!supportFields) return;

          // 獲取 Project 詳細信息
          const projectData = await getProjectById(suiClient, projectId, PACKAGE_ID);
          if (!projectData) return;

          projects.push({
            projectId,
            supportInfo: {
              amount: String(supportFields.amount || 0),
              startedAt: Number(supportFields.started_at || 0),
              lastUpdated: Number(supportFields.last_updated || 0),
            },
            projectData: {
              title: projectData.title,
              category: projectData.category,
              imageUrl: projectData.imageUrl,
              creator: projectData.creator,
              totalSupportAmount: projectData.totalSupportAmount?.toString() || '0',
              supporterCount: projectData.supporterCount,
              isActive: projectData.isActive ?? true,
            },
          });
        } catch (err) {
          console.error('[fetchSupportedProjects] Error processing project:', err);
        }
      })
    );

    // 按最後更新時間排序（最新的在前）
    return projects.sort((a, b) => b.supportInfo.lastUpdated - a.supportInfo.lastUpdated);
  } catch (error) {
    console.error('[fetchSupportedProjects] Error:', error);
    return [];
  }
}

async function fetchWalletBalance(address: string): Promise<{ usdc: string; btcUSDC: string }> {
  try {
    // 並行查詢 USDC 和 btcUSDC 餘額
    const [usdcCoins, btcUSDCCoins] = await Promise.all([
      suiClient.getCoins({
        owner: address,
        coinType: USDC_TYPE,
      }),
      suiClient.getCoins({
        owner: address,
        coinType: STABLE_COIN_TYPE,
      }),
    ]);

    const usdcBalance = usdcCoins.data.reduce((sum, coin) => {
      return sum + BigInt(coin.balance);
    }, BigInt(0));

    const btcUSDCBalance = btcUSDCCoins.data.reduce((sum, coin) => {
      return sum + BigInt(coin.balance);
    }, BigInt(0));

    console.log('[fetchWalletBalance] Balances:', {
      usdc: usdcBalance.toString(),
      btcUSDC: btcUSDCBalance.toString(),
    });

    return {
      usdc: usdcBalance.toString(),
      btcUSDC: btcUSDCBalance.toString(),
    };
  } catch (error) {
    console.error('[fetchWalletBalance] Error:', error);
    return { usdc: '0', btcUSDC: '0' };
  }
}

async function fetchCreatorData(address: string): Promise<CreatorData> {
  try {
    // 1. 獲取用戶擁有的 ProjectCap
    const capsResponse = await suiClient.getOwnedObjects({
      owner: address,
      filter: { StructType: `${PACKAGE_ID}::project::ProjectCap` },
      options: { showContent: true },
    });

    if (capsResponse.data.length === 0) {
      return { projectCount: 0, projects: [] };
    }

    // 2. 並行獲取每個項目的詳細信息
    const projects = await Promise.all(
      capsResponse.data.map(async (capObj) => {
        try {
          const capFields = (capObj.data?.content as any)?.fields;
          if (!capFields) return null;

          const projectId = capFields.project_id;
          const projectCapId = capObj.data!.objectId;

          // 並行獲取項目數據和 updates 數量
          const [projectData, updates] = await Promise.all([
            getProjectById(suiClient, projectId, PACKAGE_ID),
            getProjectUpdates(suiClient, projectId, PACKAGE_ID),
          ]);

          if (!projectData) return null;

          return {
            projectId,
            projectCapId,
            metadata: {
              title: projectData.title,
              description: projectData.description,
              category: projectData.category,
              imageUrl: projectData.imageUrl,
            },
            financial: {
              balance: projectData.balance?.toString() || '0',
              totalReceived: projectData.raisedAmount.toString(),
              totalSupportAmount: projectData.totalSupportAmount?.toString() || '0',
            },
            stats: {
              supporterCount: projectData.supporterCount,
              updatesCount: updates.length,
              isActive: projectData.isActive ?? true,
              createdAt: projectData.createdAt?.toString() || '0',
            },
          } as OwnedProject;
        } catch (err) {
          console.error('[fetchCreatorData] Error processing project:', err);
          return null;
        }
      })
    );

    const validProjects = projects.filter((p): p is OwnedProject => p !== null);

    // 按創建時間排序（最新的在前）
    validProjects.sort((a, b) => Number(b.stats.createdAt) - Number(a.stats.createdAt));

    return {
      projectCount: validProjects.length,
      projects: validProjects,
    };
  } catch (error) {
    console.error('[fetchCreatorData] Error:', error);
    return { projectCount: 0, projects: [] };
  }
}

// ==================== API Handler ====================

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json(
      { error: 'Address parameter is required' },
      { status: 400 }
    );
  }

  if (!PACKAGE_ID) {
    return NextResponse.json(
      { error: 'Package ID not configured' },
      { status: 500 }
    );
  }

  try {
    console.log('[Dashboard API] Fetching data for address:', address);

    // 並行獲取 Supporter 和 Creator 數據
    const [supporter, creator] = await Promise.all([
      fetchSupporterData(address),
      fetchCreatorData(address),
    ]);

    const response: DashboardResponse = {
      supporter,
      creator,
    };

    console.log('[Dashboard API] Success:', {
      supportedProjects: supporter.supportedProjects.length,
      ownedProjects: creator.projectCount,
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[Dashboard API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', message: error.message },
      { status: 500 }
    );
  }
}
