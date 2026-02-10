'use client';

import React from 'react';
import { formatBalance } from '@/utils/formatters';

interface WalletBalanceCardProps {
  wallet: {
    usdc: string;
    btcUSDC: string;
  };
}

/**
 * 錢包餘額卡片
 * 顯示用戶的 USDC 和 btcUSDC 餘額
 */
export const WalletBalanceCard: React.FC<WalletBalanceCardProps> = ({
  wallet,
}) => {
  const usdcBalance = BigInt(wallet.usdc);
  const btcUSDCBalance = BigInt(wallet.btcUSDC);

  return (
    <div className="bg-gradient-to-br from-ink-900 to-ink-800 rounded-3xl p-8 text-white shadow-xl">
      <h3 className="text-lg font-medium opacity-90 mb-6">Wallet Balance</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* USDC Balance */}
        <BalanceItem
          label="USDC"
          amount={usdcBalance}
          description="Available for minting btcUSDC"
          icon={
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" opacity="0.2" />
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
            </svg>
          }
        />

        {/* btcUSDC Balance */}
        <BalanceItem
          label="btcUSDC"
          amount={btcUSDCBalance}
          description="Supporting projects"
          highlighted
          icon={
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" opacity="0.8" />
            </svg>
          }
        />
      </div>
    </div>
  );
};

// ==================== Sub-Components ====================

interface BalanceItemProps {
  label: string;
  amount: bigint;
  description: string;
  highlighted?: boolean;
  icon: React.ReactNode;
}

function BalanceItem({
  label,
  amount,
  description,
  highlighted,
  icon,
}: BalanceItemProps) {
  return (
    <div
      className={`p-6 rounded-2xl ${
        highlighted ? 'bg-white/10 ring-2 ring-white/20' : 'bg-white/5'
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="opacity-70">{icon}</div>
        <span className="text-sm font-medium opacity-90">{label}</span>
      </div>
      
      <div className="mb-2">
        <span className="text-3xl font-bold">${formatBalance(amount)}</span>
      </div>
      
      <p className="text-sm opacity-70">{description}</p>
    </div>
  );
}
