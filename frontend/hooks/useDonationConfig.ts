'use client';

import { useState } from 'react';
import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { buildSetDonationConfigTx } from '@/utils/donationTx';
import { STABLE_COIN_TYPE } from '@/config/sui';
import { toast } from 'react-hot-toast';

export function useDonationConfig() {
  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [isLoading, setIsLoading] = useState(false);

  const setDonationConfig = async (
    vaultId: string,
    projectId: string,
    percentage: number
  ) => {
    if (!account) return;

    setIsLoading(true);
    const toastId = toast.loading('Saving configuration...');
    try {
      const tx = await buildSetDonationConfigTx(
        vaultId,
        projectId,
        percentage,
        STABLE_COIN_TYPE
      );

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: (result) => {
            console.log('Donation config saved:', result);
            toast.success('Configuration saved!', { id: toastId });
          },
          onError: (error) => {
            console.error('Error saving config:', error);
            toast.error(`Error saving config: ${error.message}`, { id: toastId });
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
    setDonationConfig,
    isLoading,
  };
}
