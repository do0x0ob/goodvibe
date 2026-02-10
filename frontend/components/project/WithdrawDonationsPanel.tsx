'use client';

import React, { useState } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { formatBalance } from '@/utils/formatters';
import { buildWithdrawDonationsTx } from '@/utils/projectTx';
import { buildWithdrawAndBurnTx } from '@/utils/yieldTx';
import { createStableLayerClient } from '@/utils/stableLayerTx';
import { PACKAGE_ID, STABLE_COIN_TYPE } from '@/config/sui';
import { useTransaction } from '@/hooks/useTransaction';

interface WithdrawDonationsPanelProps {
  projectId: string;
}

export const WithdrawDonationsPanel: React.FC<WithdrawDonationsPanelProps> = ({
  projectId,
}) => {
  const client = useSuiClient();
  const account = useCurrentAccount();
  const { execute, isExecuting } = useTransaction();
  const [amount, setAmount] = useState('');
  const [convertToUSDC, setConvertToUSDC] = useState(false);

  const { data: projectCapId } = useQuery({
    queryKey: ['projectCap', account?.address, projectId],
    queryFn: async () => {
      if (!account?.address) return null;

      const objects = await client.getOwnedObjects({
        owner: account.address,
        filter: {
          StructType: `${PACKAGE_ID}::project::ProjectCap`,
        },
        options: { showContent: true },
      });

      const cap = objects.data.find((obj) => {
        if (obj.data?.content && 'fields' in obj.data.content) {
          const fields = obj.data.content.fields as any;
          return fields.project_id === projectId;
        }
        return false;
      });

      return cap?.data?.objectId || null;
    },
    enabled: !!account?.address,
  });

  const { data: projectData, refetch } = useQuery({
    queryKey: ['projectBalance', projectId],
    queryFn: async () => {
      const obj = await client.getObject({
        id: projectId,
        options: { showContent: true },
      });

      if (obj.data?.content && 'fields' in obj.data.content) {
        const fields = obj.data.content.fields as any;
        const financial = fields.financial.fields;

        return {
          balance: BigInt(financial.balance),
          totalReceived: BigInt(financial.total_received),
          totalSupport: BigInt(financial.total_support_amount),
        };
      }

      return null;
    },
    refetchInterval: 10000,
  });

  const handleWithdraw = async () => {
    if (!account?.address || !projectCapId) {
      toast.error('Project cap not found');
      return;
    }

    const amountBigInt = BigInt(Math.floor(parseFloat(amount) * 1_000_000));

    if (amountBigInt <= 0 || (projectData && amountBigInt > projectData.balance)) {
      toast.error('Invalid withdrawal amount');
      return;
    }

    try {
      let tx;

      if (convertToUSDC) {
        const stableClient = createStableLayerClient(account.address);
        tx = await buildWithdrawAndBurnTx(
          stableClient,
          projectCapId,
          projectId,
          amountBigInt
        );
      } else {
        tx = buildWithdrawDonationsTx(projectCapId, projectId, amountBigInt);
      }

      const { success } = await execute(tx, {
        loadingMessage: 'Withdrawing donations...',
        successMessage: convertToUSDC 
          ? 'Withdrawn and converted to USDC'
          : 'Withdrawn successfully',
        errorMessage: 'Failed to withdraw',
        onSuccess: () => {
          setAmount('');
          refetch();
        },
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to withdraw');
    }
  };

  if (!projectCapId) {
    return (
      <div className="bg-surface rounded-2xl p-6 border border-ink-300/20">
        <p className="text-ink-500 text-center">
          You don't have permission to manage this project
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-2xl p-6 border border-ink-300/20 space-y-6">
      <div>
        <h2 className="text-2xl font-serif text-ink-900 mb-4">Withdraw Donations</h2>
        <p className="text-sm text-ink-500">
          Withdraw accumulated donations from supporters
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-canvas-subtle rounded-lg">
          <p className="text-sm text-ink-500 mb-1">Available Balance</p>
          <p className="text-2xl font-serif text-ink-900">
            ${formatBalance(projectData?.balance || BigInt(0))}
          </p>
        </div>

        <div className="p-4 bg-canvas-subtle rounded-lg">
          <p className="text-sm text-ink-500 mb-1">Total Received</p>
          <p className="text-2xl font-serif text-ink-900">
            ${formatBalance(projectData?.totalReceived || BigInt(0))}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink-900 mb-2">
            Withdrawal Amount (USDC)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-3 bg-canvas-subtle border border-ink-300/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-ink-900"
          />
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={convertToUSDC}
            onChange={(e) => setConvertToUSDC(e.target.checked)}
            className="w-5 h-5 rounded border-ink-300/20 text-ink-900 focus:ring-ink-900"
          />
          <span className="text-sm text-ink-700">
            Convert btcUSDC to USDC immediately
          </span>
        </label>

        <button
          onClick={handleWithdraw}
          disabled={isExecuting || !amount || (projectData?.balance || BigInt(0)) === BigInt(0)}
          className="w-full py-3 bg-ink-900 text-surface rounded-lg font-medium hover:bg-ink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExecuting ? 'Processing...' : 'Withdraw'}
        </button>
      </div>

      <div className="pt-4 border-t border-ink-300/20 text-sm text-ink-500">
        <p className="mb-2">
          <strong>Total Support Amount (recorded):</strong>{' '}
          ${formatBalance(projectData?.totalSupport || BigInt(0))}
        </p>
        <p className="text-xs">
          This shows the total amount users are supporting with, but doesn't reflect actual donations received.
        </p>
      </div>
    </div>
  );
};
