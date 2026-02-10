'use client';

import React from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/Button';
import { createStableLayerClient } from '@/utils/stableLayerTx';
import { buildClaimYieldTx } from '@/utils/yieldTx';
import { useTransaction } from '@/hooks/useTransaction';

/**
 * Claim Reward：Project Cap 擁有者領取 btcUSDC 收益。
 * 僅一個按鈕，調用 StableLayer buildClaimTx，autoTransfer 至 sender。
 */
export const ClaimRewardPanel: React.FC = () => {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const queryClient = useQueryClient();
  const { execute, isExecuting } = useTransaction();

  const handleClaim = async () => {
    if (!account?.address) return;
    const stableClient = createStableLayerClient(account.address);
    const tx = await buildClaimYieldTx(stableClient, account.address);
    await execute(tx, {
      loadingMessage: 'Claiming reward...',
      successMessage: 'Reward claimed successfully',
      errorMessage: 'Failed to claim reward',
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ['btcUSDCBalance', account.address] });
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-ink-100 p-6 shadow-sm">
        
        <Button 
          onClick={handleClaim} 
          disabled={isExecuting || !account?.address}
          fullWidth
          className="rounded-xl py-3 font-bold shadow-lg shadow-ink-900/10 hover:shadow-ink-900/20 transition-all"
        >
          {isExecuting ? 'Claiming Rewards...' : 'Claim Rewards'}
        </Button>

        <p className="mt-4 text-xs text-ink-400 text-center italic">
          * Note: This demo uses btcUSDC as an example. In a production environment, each project would have its own branded stablecoin powered by Stable Layer.
        </p>
      </div>
    </div>
  );
};
