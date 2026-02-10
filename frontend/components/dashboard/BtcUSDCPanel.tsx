'use client';

import React from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { formatBalance } from '@/utils/formatters';
import { USDC_TYPE } from '@/config/sui';

/**
 * USDC 錢包餘額面板
 * 顯示當前錢包中的 USDC 總量
 */
export const BtcUSDCPanel: React.FC = () => {
  const client = useSuiClient();
  const account = useCurrentAccount();
  const address = account?.address;

  const { data: balance = BigInt(0), isLoading } = useQuery({
    queryKey: ['usdcBalance', address],
    queryFn: async () => {
      if (!address) return BigInt(0);

      const coins = await client.getCoins({
        owner: address,
        coinType: USDC_TYPE,
      });

      const total = coins.data.reduce(
        (sum, coin) => sum + BigInt(coin.balance),
        BigInt(0)
      );

      return total;
    },
    enabled: !!address,
    refetchInterval: 30000, // 每 30 秒刷新一次
  });

  return (
    <div className="bg-canvas-sand rounded-3xl p-8 text-ink-900 shadow-sm relative overflow-hidden h-full min-h-[240px] flex flex-col justify-between">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-canvas-sage/20 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-ink-900/10 flex items-center justify-center backdrop-blur-sm">
            <svg className="w-5 h-5 text-ink-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-medium opacity-90 text-ink-900">Wallet Balance</h2>
        </div>
        <p className="text-sm text-ink-600 pl-13">Available USDC</p>
      </div>
      
      <div className="relative z-10 mt-auto">
        <p className="text-5xl font-serif font-bold tracking-tight text-ink-900">
          {isLoading ? (
            <span className="animate-pulse opacity-50">...</span>
          ) : (
            `$${formatBalance(balance)}`
          )}
        </p>
        <div className="mt-4 flex items-center gap-2 text-xs font-medium text-ink-500 uppercase tracking-widest">
          <span>Sui Network</span>
          <span className="w-1 h-1 rounded-full bg-ink-400" />
          <span>USDC</span>
        </div>
      </div>
    </div>
  );
};
