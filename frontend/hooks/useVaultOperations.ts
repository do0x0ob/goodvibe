'use client';

import { useState } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { createStableLayerClient, buildDepositTx, buildWithdrawTx, buildClaimAndDistributeTx } from '@/utils/stableLayerTx';
import { buildCreateVaultTx } from '@/utils/donationTx';
import { STABLE_COIN_TYPE } from '@/config/sui';
import { toast } from 'react-hot-toast';

export function useVaultOperations() {
  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();
  const [isLoading, setIsLoading] = useState(false);

  const createVault = async () => {
    if (!account) return;
    
    setIsLoading(true);
    const toastId = toast.loading('Creating vault...');
    try {
      const tx = await buildCreateVaultTx(STABLE_COIN_TYPE);
      
      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: (result) => {
            console.log('Vault created:', result);
            toast.success('Vault created successfully!', { id: toastId });
          },
          onError: (error) => {
            console.error('Error creating vault:', error);
            toast.error(`Error creating vault: ${error.message}`, { id: toastId });
          },
        }
      );
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(`Error: ${error.message}`, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const deposit = async (vaultId: string, amount: bigint, usdcCoinId: string) => {
    if (!account) return;
    
    setIsLoading(true);
    const toastId = toast.loading('Depositing funds...');
    try {
      const client = createStableLayerClient(account.address);
      const tx = await buildDepositTx(client, vaultId, amount, usdcCoinId);
      
      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: (result) => {
            console.log('Deposit successful:', result);
            toast.success('Deposit successful!', { id: toastId });
          },
          onError: (error) => {
            console.error('Error depositing:', error);
            toast.error(`Error depositing: ${error.message}`, { id: toastId });
          },
        }
      );
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(`Error: ${error.message}`, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const withdraw = async (vaultId: string, amount: bigint) => {
    if (!account) return;
    
    setIsLoading(true);
    const toastId = toast.loading('Withdrawing funds...');
    try {
      const client = createStableLayerClient(account.address);
      const tx = await buildWithdrawTx(client, vaultId, amount);
      
      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: (result) => {
            console.log('Withdrawal successful:', result);
            toast.success('Withdrawal successful!', { id: toastId });
          },
          onError: (error) => {
            console.error('Error withdrawing:', error);
            toast.error(`Error withdrawing: ${error.message}`, { id: toastId });
          },
        }
      );
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(`Error: ${error.message}`, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const claimRewards = async (vaultId: string) => {
    if (!account) return;
    
    setIsLoading(true);
    const toastId = toast.loading('Claiming rewards...');
    try {
      const client = createStableLayerClient(account.address);
      const tx = await buildClaimAndDistributeTx(client, vaultId);
      
      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: (result) => {
            console.log('Rewards claimed:', result);
            toast.success('Rewards claimed & distributed!', { id: toastId });
          },
          onError: (error) => {
            console.error('Error claiming rewards:', error);
            toast.error(`Error claiming rewards: ${error.message}`, { id: toastId });
          },
        }
      );
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(`Error: ${error.message}`, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createVault,
    deposit,
    withdraw,
    claimRewards,
    isLoading,
  };
}
