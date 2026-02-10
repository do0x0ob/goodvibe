import { useCurrentAccount } from '@mysten/dapp-kit';
import { useQueryClient } from '@tanstack/react-query';
import { STABLE_COIN_TYPE } from '@/config/sui';
import { buildCreateProjectTx, buildPostUpdateTx } from '@/utils/projectTx';
import { toast } from 'react-hot-toast';
import { useTransaction } from './useTransaction';

export function useProjectOperations() {
  const account = useCurrentAccount();
  const { execute, isExecuting } = useTransaction();
  const queryClient = useQueryClient();

  const createProject = async (data: { 
    title: string; 
    description: string; 
    category: string; 
    imageUrl: string;
  }) => {
    if (!account) {
      toast.error('Please connect your wallet');
      return { success: false };
    }

    try {
      const tx = buildCreateProjectTx(
        data.title, 
        data.description, 
        data.category, 
        data.imageUrl, 
        STABLE_COIN_TYPE
      );

      const result = await execute(tx, {
        loadingMessage: 'Creating project...',
        successMessage: 'Project created successfully!',
        errorMessage: 'Failed to create project',
        onSuccess: async (digest) => {
          console.log('[createProject] ✅ onSuccess callback triggered, digest:', digest);
          // 刷新項目列表和用戶儀表板
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['projects'] }),
            queryClient.invalidateQueries({ queryKey: ['dashboard', account?.address] }),
          ]);
          console.log('[createProject] ✅ All queries invalidated');
        }
      });

      return result;
    } catch (error: any) {
      // 不要在這裡再次顯示 toast，execute 已經處理了
      console.error('[createProject] Error:', error);
      return { success: false };
    }
  };

  const postUpdate = async (
    projectCapId: string,
    projectId: string,
    updateId: string,
    title: string,
    content: string
  ) => {
    if (!account) {
      toast.error('Please connect your wallet');
      return { success: false };
    }

    try {
      const tx = buildPostUpdateTx(projectCapId, projectId, updateId, title, content);

      const result = await execute(tx, {
        loadingMessage: 'Posting update...',
        successMessage: 'Update posted successfully!',
        errorMessage: 'Failed to post update',
        onSuccess: async (digest) => {
          console.log('[postUpdate] ✅ onSuccess callback triggered, digest:', digest);
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['project', projectId] }),
            queryClient.invalidateQueries({ queryKey: ['projectUpdates', projectId] }),
          ]);
        }
      });

      return result;
    } catch (error: any) {
      // 不要在這裡再次顯示 toast
      console.error('[postUpdate] Error:', error);
      return { success: false };
    }
  };

  return { 
    createProject, 
    postUpdate, 
    isLoading: isExecuting,
  };
}
