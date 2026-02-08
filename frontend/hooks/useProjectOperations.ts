import { useState } from 'react';
import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { STABLE_COIN_TYPE } from '@/config/sui';
import { buildCreateProjectTx, buildWithdrawFundsTx, buildPostUpdateTx } from '@/utils/projectTx';
import { toast } from 'react-hot-toast';

export function useProjectOperations() {
  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [isLoading, setIsLoading] = useState(false);

  const createProject = async (data: { title: string; description: string; category: string; imageUrl: string }) => {
    if (!account) return;
    setIsLoading(true);
    const toastId = toast.loading('Creating project...');
    try {
      const tx = await buildCreateProjectTx(data.title, data.description, data.category, data.imageUrl, STABLE_COIN_TYPE);
      signAndExecute({ transaction: tx }, {
        onSuccess: (result) => {
          console.log('Project created:', result);
          toast.success('Project created successfully!', { id: toastId });
        },
        onError: (error) => {
          console.error('Error creating project:', error);
          toast.error(`Error creating project: ${error.message}`, { id: toastId });
        },
      });
    } catch (error: any) {
      console.error(error);
      toast.error(`Error: ${error.message}`, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const withdrawFunds = async (projectCapId: string, projectId: string, amount: bigint) => {
    if (!account) return;
    setIsLoading(true);
    const toastId = toast.loading('Withdrawing funds...');
    try {
        const tx = await buildWithdrawFundsTx(projectCapId, projectId, amount, STABLE_COIN_TYPE);
        signAndExecute({ transaction: tx }, {
            onSuccess: (result) => {
              console.log('Funds withdrawn:', result);
              toast.success('Funds withdrawn successfully!', { id: toastId });
            },
            onError: (error) => {
              console.error('Error withdrawing funds:', error);
              toast.error(`Error withdrawing funds: ${error.message}`, { id: toastId });
            },
        });
    } catch (error: any) {
        console.error(error);
        toast.error(`Error: ${error.message}`, { id: toastId });
    } finally {
        setIsLoading(false);
    }
  };

  const postUpdate = async (projectCapId: string, projectId: string, title: string, content: string) => {
    if (!account) return;
    setIsLoading(true);
    const toastId = toast.loading('Posting update...');
    try {
        const tx = await buildPostUpdateTx(projectCapId, projectId, title, content);
        signAndExecute({ transaction: tx }, {
            onSuccess: (result) => {
              console.log('Update posted:', result);
              toast.success('Update posted successfully!', { id: toastId });
            },
            onError: (error) => {
              console.error('Error posting update:', error);
              toast.error(`Error posting update: ${error.message}`, { id: toastId });
            },
        });
    } catch (error: any) {
        console.error(error);
        toast.error(`Error: ${error.message}`, { id: toastId });
    } finally {
        setIsLoading(false);
    }
  };

  return { createProject, withdrawFunds, postUpdate, isLoading };
}
