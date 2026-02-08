'use client';

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { formatBalance } from '@/utils/formatters';
import { useVaultOperations } from '@/hooks/useVaultOperations';
import { Vault } from '@/types/vault';
import { useQuery } from '@tanstack/react-query';
import { useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { USDC_TYPE } from '@/config/sui';
import { toast } from 'react-hot-toast';

interface VaultManagementProps {
  vault: Vault;
}

export const VaultManagement: React.FC<VaultManagementProps> = ({ vault }) => {
  const { deposit, withdraw, claimRewards, isLoading } = useVaultOperations();
  const [amount, setAmount] = useState('');
  const [activeAction, setActiveAction] = useState<'deposit' | 'withdraw'>('deposit');
  const suiClient = useSuiClient();
  const account = useCurrentAccount();

  // Fetch USDC coins
  const { data: usdcCoins } = useQuery({
    queryKey: ['usdcCoins', account?.address],
    queryFn: async () => {
        if (!account) return [];
        const coins = await suiClient.getCoins({
            owner: account.address,
            coinType: USDC_TYPE
        });
        return coins.data;
    },
    enabled: !!account
  });

  const totalUsdcBalance = usdcCoins?.reduce((sum, coin) => sum + BigInt(coin.balance), BigInt(0)) || BigInt(0);

  const handleDeposit = () => {
    if (!amount) return;
    const amountBigInt = BigInt(Math.floor(Number(amount) * 1_000_000));
    
    const coin = usdcCoins?.find(c => BigInt(c.balance) >= amountBigInt);
    
    if (coin) {
        deposit(vault.id, amountBigInt, coin.coinObjectId);
        setAmount('');
    } else {
        toast.error("Insufficient USDC balance in a single coin object.");
    }
  };

  const handleWithdraw = () => {
    if (!amount) return;
    withdraw(vault.id, BigInt(Math.floor(Number(amount) * 1_000_000)));
    setAmount('');
  };

  const handleMaxClick = () => {
    if (activeAction === 'deposit') {
      setAmount((Number(totalUsdcBalance) / 1_000_000).toFixed(2));
    } else {
      setAmount((Number(vault.balance) / 1_000_000).toFixed(2));
    }
  };

  return (
    <div className="bg-surface rounded-3xl p-8 border border-ink-300/20 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-serif text-ink-900">Vault Management</h3>
          <p className="text-sm text-ink-500 mt-1">Deposit, withdraw, and manage your funds</p>
        </div>
        <div className="bg-canvas-sage px-3 py-1.5 rounded-full">
          <span className="text-xs font-medium text-ink-900">APY: 5.2%</span>
        </div>
      </div>

      {/* Balance Display */}
      <div className="mb-6 p-5 rounded-xl bg-canvas-default border border-ink-300/20">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-ink-500 uppercase tracking-wide mb-1">Vault Balance</p>
            <p className="text-2xl font-serif text-ink-900">${formatBalance(vault.balance)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-ink-500 uppercase tracking-wide mb-1">Wallet Balance</p>
            <p className="text-xl font-serif text-ink-700">${formatBalance(totalUsdcBalance)}</p>
          </div>
        </div>
      </div>

      {/* Action Tabs */}
      <div className="mb-6">
        <div className="flex gap-2 p-1 bg-canvas-subtle rounded-lg">
          <button
            onClick={() => setActiveAction('deposit')}
            className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
              activeAction === 'deposit'
                ? 'bg-surface text-ink-900 shadow-sm'
                : 'text-ink-500 hover:text-ink-900'
            }`}
          >
            Deposit
          </button>
          <button
            onClick={() => setActiveAction('withdraw')}
            className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
              activeAction === 'withdraw'
                ? 'bg-surface text-ink-900 shadow-sm'
                : 'text-ink-500 hover:text-ink-900'
            }`}
          >
            Withdraw
          </button>
        </div>
      </div>

      {/* Amount Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-ink-700 mb-2">
          Amount (USDC)
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <span className="text-ink-500 text-sm">$</span>
          </div>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="block w-full rounded-lg border border-ink-300/30 pl-8 pr-20 py-3 focus:border-ink-900 focus:ring-1 focus:ring-ink-900 text-base bg-surface transition-colors"
            placeholder="0.00"
          />
          <button
            onClick={handleMaxClick}
            className="absolute inset-y-0 right-2 flex items-center px-3 text-xs font-medium text-ink-700 hover:text-ink-900 bg-canvas-subtle hover:bg-canvas-sand rounded-md transition-colors"
          >
            MAX
          </button>
        </div>
        <p className="mt-2 text-xs text-ink-500">
          {activeAction === 'deposit' 
            ? `Available: $${formatBalance(totalUsdcBalance)}` 
            : `Max withdrawal: $${formatBalance(vault.balance)}`
          }
        </p>
      </div>

      {/* Action Button */}
      <Button
        onClick={activeAction === 'deposit' ? handleDeposit : handleWithdraw}
        isLoading={isLoading}
        disabled={!amount || Number(amount) <= 0}
        className="w-full mb-4"
        size="lg"
      >
        {activeAction === 'deposit' ? 'Deposit USDC' : 'Withdraw USDC'}
      </Button>

      {/* Claim Rewards */}
      <div className="pt-4 border-t border-ink-300/20">
        <Button
          onClick={() => claimRewards(vault.id)}
          variant="outline"
          isLoading={isLoading}
          className="w-full border-dashed"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Claim & Distribute Yield
        </Button>
      </div>
    </div>
  );
};
