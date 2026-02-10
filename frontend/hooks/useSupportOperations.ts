import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { createStableLayerClient } from '@/utils/stableLayerTx';
import { buildStartSupportingTx, buildIncreaseSupportTx, buildWithdrawSupportTx } from '@/utils/projectTx';
import { buildCreateSupportRecordTx } from '@/utils/supportRecordTx';
import { buildDonateYieldTx } from '@/utils/yieldTx';
import { executeTransactionWithToast } from '@/utils/transaction';
import { getUserSupportRecord } from '@/lib/sui/queries';
import { PACKAGE_ID } from '@/config/sui';
import { useSupportRecord } from './useSupportRecord';

export function useSupportOperations() {
  const client = useSuiClient();
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const { supportRecordId } = useSupportRecord();

  const createSupportRecord = async () => {
    if (!account?.address) {
      toast.error('Please connect wallet');
      return null;
    }

    setIsLoading(true);
    try {
      const tx = buildCreateSupportRecordTx(account.address);

      const { success } = await executeTransactionWithToast(
        signAndExecute,
        tx,
        {
          loadingMessage: 'Creating support record...',
          successMessage: 'Support record created!',
          errorMessage: 'Failed to create support record',
          client,
          onSuccess: async () => {
            // 刷新 support record 與 dashboard 狀態
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: ['supportRecord', account.address] }),
              queryClient.invalidateQueries({ queryKey: ['dashboard', account.address] }),
            ]);
          },
        }
      );

      if (!success) {
        return null;
      }

      // 直接從鏈上查一次 SupportRecord ID，回傳給呼叫端繼續流程
      const recordId = await getUserSupportRecord(client, account.address, PACKAGE_ID);
      return recordId;
    } catch (error: any) {
      toast.error(error.message || 'Failed to create support record');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const startSupporting = async (
    projectId: string,
    supportRecordId: string,
    amount: bigint
  ) => {
    if (!account?.address) {
      toast.error('Please connect wallet');
      return false;
    }

    setIsLoading(true);
    try {
      const stableClient = createStableLayerClient(account.address);
      const tx = await buildStartSupportingTx(
        stableClient,
        client,
        account.address,
        projectId,
        supportRecordId,
        amount
      );
      const { success } = await executeTransactionWithToast(
        signAndExecute,
        tx,
        {
          loadingMessage: 'Minting btcUSDC and starting support...',
          successMessage: 'Successfully minted btcUSDC and started supporting!',
          errorMessage: 'Failed to start supporting',
          client,
          onSuccess: async () => {
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: ['project', projectId] }),
              queryClient.invalidateQueries({ queryKey: ['projectDetail', projectId] }),
              queryClient.invalidateQueries({ queryKey: ['supportRecord', account?.address] }),
              queryClient.invalidateQueries({ queryKey: ['supportedProjects', supportRecordId] }),
              queryClient.invalidateQueries({ queryKey: ['btcUSDCBalance', account?.address] }),
              queryClient.invalidateQueries({ queryKey: ['dashboard', account?.address] }),
            ]);
          }
        }
      );
      return success;
    } catch (error: any) {
      toast.error(error.message || 'Failed to start supporting');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const increaseSupport = async (
    projectId: string,
    supportRecordId: string,
    additionalAmount: bigint
  ) => {
    if (!account?.address) {
      toast.error('Please connect wallet');
      return false;
    }

    setIsLoading(true);
    try {
      const stableClient = createStableLayerClient(account.address);
      const tx = await buildIncreaseSupportTx(
        stableClient,
        client,
        account.address,
        projectId,
        supportRecordId,
        additionalAmount
      );

      const { success } = await executeTransactionWithToast(
        signAndExecute,
        tx,
        {
          loadingMessage: 'Minting more btcUSDC and adding support...',
          successMessage: 'Support increased successfully',
          errorMessage: 'Failed to increase support',
          client,
          onSuccess: async () => {
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: ['project', projectId] }),
              queryClient.invalidateQueries({ queryKey: ['projectDetail', projectId] }),
              queryClient.invalidateQueries({ queryKey: ['supportRecord', account?.address] }),
              queryClient.invalidateQueries({ queryKey: ['supportedProjects', supportRecordId] }),
              queryClient.invalidateQueries({ queryKey: ['btcUSDCBalance', account?.address] }),
              queryClient.invalidateQueries({ queryKey: ['dashboard', account?.address] }),
            ]);
          }
        }
      );
      return success;
    } catch (error: any) {
      toast.error((error as Error)?.message || 'Failed to increase support');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const withdrawSupport = async (
    projectId: string,
    supportRecordId: string,
    amount: bigint
  ) => {
    if (!account?.address) {
      toast.error('Please connect wallet');
      return false;
    }

    setIsLoading(true);
    try {
      const stableClient = createStableLayerClient(account.address);
      const tx = await buildWithdrawSupportTx(
        stableClient,
        account.address,
        projectId,
        supportRecordId,
        amount
      );

      const { success } = await executeTransactionWithToast(
        signAndExecute,
        tx,
        {
          loadingMessage: 'Withdrawing support...',
          successMessage: 'Support withdrawn successfully',
          errorMessage: 'Failed to withdraw support',
          client,
          onSuccess: async () => {
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: ['project', projectId] }),
              queryClient.invalidateQueries({ queryKey: ['projectDetail', projectId] }),
              queryClient.invalidateQueries({ queryKey: ['supportRecord', account?.address] }),
              queryClient.invalidateQueries({ queryKey: ['supportedProjects', supportRecordId] }),
              queryClient.invalidateQueries({ queryKey: ['btcUSDCBalance', account?.address] }),
              queryClient.invalidateQueries({ queryKey: ['dashboard', account?.address] }),
            ]);
          }
        }
      );
      return success;
    } catch (error: any) {
      toast.error((error as Error)?.message || 'Failed to withdraw support');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const donateYield = async (projectId: string) => {
    if (!account?.address) {
      toast.error('Please connect wallet');
      return false;
    }

    setIsLoading(true);
    try {
      const stableClient = createStableLayerClient(account.address);
      const tx = await buildDonateYieldTx(stableClient, account.address, projectId);

      const { success } = await executeTransactionWithToast(
        signAndExecute,
        tx,
        {
          loadingMessage: 'Donating yield...',
          successMessage: 'Yield donated to project successfully!',
          errorMessage: 'Failed to donate yield',
          client,
          onSuccess: async () => {
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: ['project', projectId] }),
              queryClient.invalidateQueries({ queryKey: ['btcUSDCBalance', account?.address] }),
              queryClient.invalidateQueries({ queryKey: ['dashboard', account?.address] }),
            ]);
          }
        }
      );
      return success;
    } catch (error: any) {
      toast.error((error as Error)?.message || 'Failed to donate yield');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createSupportRecord,
    startSupporting,
    increaseSupport,
    withdrawSupport,
    donateYield,
    isLoading,
  };
}
