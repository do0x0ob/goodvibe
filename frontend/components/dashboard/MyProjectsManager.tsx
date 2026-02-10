'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatBalance } from '@/utils/formatters';
import { PACKAGE_ID } from '@/config/sui';
import { getProjectById, getProjectUpdates, getProjectSupportersFromEvents } from '@/lib/sui/queries';
import { createStableLayerClient } from '@/utils/stableLayerTx';
import { buildClaimYieldTx } from '@/utils/yieldTx';
import { useTransaction } from '@/hooks/useTransaction';
import toast from 'react-hot-toast';

interface MyProjectsManagerProps {
  userAddress: string;
  className?: string;
}

interface OwnedProjectData {
  projectId: string;
  projectCapId: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  balance: bigint;
  totalReceived: bigint;
  totalSupportAmount: bigint;
  supporterCount: number;
  updatesCount: number;
  isActive: boolean;
  createdAt: bigint;
}

/**
 * 我的項目管理器 - 垂直版
 * 顯示用戶創建的所有項目及其統計數據，適合放在側邊欄
 */
export const MyProjectsManager: React.FC<MyProjectsManagerProps> = ({ userAddress, className = '' }) => {
  const client = useSuiClient();
  const account = useCurrentAccount();
  const queryClient = useQueryClient();
  const { execute, isExecuting } = useTransaction();
  const [exportingProjectId, setExportingProjectId] = useState<string | null>(null);

  // Claim Reward 功能
  const handleClaimReward = async () => {
    if (!account?.address) return;
    const stableClient = createStableLayerClient(account.address);
    const tx = await buildClaimYieldTx(stableClient, account.address);
    await execute(tx, {
      loadingMessage: 'Claiming reward...',
      successMessage: 'Reward claimed successfully',
      errorMessage: 'Failed to claim reward',
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ['btcUSDCBalance', account.address] });
        await queryClient.invalidateQueries({ queryKey: ['ownedProjects', userAddress] });
      },
    });
  };

  // 導出 Active Supporters
  const handleExportSupporters = async (projectId: string, projectTitle: string) => {
    setExportingProjectId(projectId);
    try {
      toast.loading('Fetching supporters data...');
      
      // 獲取項目的 active supporters
      const supporters = await getProjectSupportersFromEvents(client, PACKAGE_ID, projectId);
      
      if (supporters.length === 0) {
        toast.dismiss();
        toast.error('No active supporters found for this project');
        return;
      }

      // 格式化為 CSV
      const csvHeaders = 'Address,Support Amount (USDC),Last Updated\n';
      const csvRows = supporters.map(supporter => {
        const amount = (Number(supporter.amount) / 1_000_000).toFixed(2); // 轉換為 USDC
        const date = new Date(supporter.lastUpdated).toISOString();
        return `${supporter.address},${amount},${date}`;
      }).join('\n');
      
      const csvContent = csvHeaders + csvRows;
      
      // 創建並下載文件
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      // 使用項目標題和日期生成文件名
      const fileName = `${projectTitle.replace(/[^a-z0-9]/gi, '_')}_supporters_${new Date().toISOString().split('T')[0]}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.dismiss();
      toast.success(`Exported ${supporters.length} active supporters`);
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Failed to export: ${error.message}`);
      console.error('[ExportSupporters] Error:', error);
    } finally {
      setExportingProjectId(null);
    }
  };

  // 查詢用戶擁有的 ProjectCap 並獲取項目數據
  const { data: myProjects = [], isLoading } = useQuery({
    queryKey: ['ownedProjects', userAddress],
    queryFn: async () => {
      console.log('[MyProjectsManager] Fetching projects for:', userAddress);

      // 1. 獲取用戶擁有的所有 ProjectCap
      const capsResponse = await client.getOwnedObjects({
        owner: userAddress,
        filter: { StructType: `${PACKAGE_ID}::project::ProjectCap` },
        options: { showContent: true },
      });

      console.log('[MyProjectsManager] Found ProjectCaps:', capsResponse.data.length);

      if (capsResponse.data.length === 0) {
        return [];
      }

      // 2. 並行獲取每個項目的詳細信息
      const projects = await Promise.all(
        capsResponse.data.map(async (capObj) => {
          try {
            const capFields = (capObj.data?.content as any)?.fields;
            if (!capFields) return null;

            const projectId = capFields.project_id;
            const projectCapId = capObj.data!.objectId;

            // 並行獲取項目數據和 updates
            const [projectData, updates] = await Promise.all([
              getProjectById(client, projectId, PACKAGE_ID),
              getProjectUpdates(client, projectId, PACKAGE_ID),
            ]);

            if (!projectData) return null;

            return {
              projectId,
              projectCapId,
              title: projectData.title,
              description: projectData.description,
              category: projectData.category,
              imageUrl: projectData.imageUrl,
              balance: projectData.balance || BigInt(0),
              totalReceived: projectData.raisedAmount,
              totalSupportAmount: projectData.totalSupportAmount || BigInt(0),
              supporterCount: projectData.supporterCount,
              updatesCount: updates.length,
              isActive: projectData.isActive ?? true,
              createdAt: projectData.createdAt || BigInt(0),
            } as OwnedProjectData;
          } catch (err) {
            console.error('[MyProjectsManager] Error processing project:', err);
            return null;
          }
        })
      );

      const validProjects = projects.filter((p): p is OwnedProjectData => p !== null);
      
      // 按創建時間排序（最新的在前）
      validProjects.sort((a, b) => Number(b.createdAt) - Number(a.createdAt));

      console.log('[MyProjectsManager] Returning projects:', validProjects.length);
      return validProjects;
    },
    enabled: !!userAddress && !!PACKAGE_ID,
    staleTime: 30000,
  });

  // Calculate stats
  const stats = React.useMemo(() => {
    return {
      totalProjects: myProjects.length,
      totalSupportReceived: myProjects.reduce((sum, p) => sum + p.totalSupportAmount, BigInt(0)),
      totalSupporters: myProjects.reduce((sum, p) => sum + p.supporterCount, 0),
    };
  }, [myProjects]);

  return (
    <div className={`rounded-3xl p-8 h-full flex flex-col ${className}`}>
      {/* Header Section */}
      <div className="mb-6">
        <h2 className="text-3xl font-serif font-medium text-ink-900 mb-2 leading-tight">
          My Projects
        </h2>
        <div className="flex gap-4 text-xs font-bold text-ink-500 uppercase tracking-widest">
           <span>{stats.totalProjects} Created</span>
           <span>•</span>
           <span>${formatBalance(stats.totalSupportReceived)} Raised</span>
        </div>
      </div>

      {/* Projects List - Vertical Stack */}
      <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 bg-white/20 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : myProjects.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center p-4 bg-white/40 rounded-xl border border-white/50 text-center">
            <p className="text-ink-600 mb-2 text-sm">No projects yet.</p>
            <div className="text-xs text-ink-400">Contact admin to create</div>
          </div>
        ) : (
          myProjects.map((project) => (
            <div
              key={project.projectId}
              className="group bg-white/40 hover:bg-white/80 transition-all duration-300 rounded-xl p-4 border border-transparent hover:border-white hover:shadow-sm"
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${project.isActive ? 'bg-ink-900 text-white' : 'bg-ink-200 text-ink-500'}`}>
                  {project.isActive ? 'Active' : 'Inactive'}
                </span>
                <span className="text-xs font-bold text-ink-700">
                  ${formatBalance(project.totalSupportAmount)}
                </span>
              </div>

              <Link href={`/project/${project.projectId}/manage`} className="block mb-3">
                <h3 className="text-lg font-serif text-ink-900 group-hover:text-ink-700 transition-colors line-clamp-1">
                  {project.title}
                </h3>
                <div className="text-[10px] text-ink-500 mt-1">
                    {project.supporterCount} Supporters • {project.updatesCount} Updates
                </div>
              </Link>

              <div className="flex gap-2">
                <Link 
                  href={`/project/${project.projectId}/manage`}
                  className="flex-1 text-center py-1.5 px-2 text-[10px] font-bold text-ink-900 bg-ink-900/5 hover:bg-ink-900 hover:text-white rounded-lg transition-all"
                >
                  Manage
                </Link>
                <button
                  onClick={() => handleExportSupporters(project.projectId, project.title)}
                  disabled={exportingProjectId === project.projectId || project.supporterCount === 0}
                  className="w-8 h-8 flex items-center justify-center text-ink-500 hover:text-ink-900 bg-white/50 hover:bg-white rounded-lg transition-all"
                  title="Export supporters"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
