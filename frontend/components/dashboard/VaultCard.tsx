import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { formatBalance } from '@/utils/formatters';
import { useVaultOperations } from '@/hooks/useVaultOperations';
import { Vault } from '@/types/vault';
import { useQuery } from '@tanstack/react-query';
import { useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { USDC_TYPE } from '@/config/sui';
import { toast } from 'react-hot-toast';

interface VaultCardProps {
  vault: Vault;
}

export const VaultCard: React.FC<VaultCardProps> = ({ vault }) => {
  const { deposit, withdraw, claimRewards, isLoading } = useVaultOperations();
  const [amount, setAmount] = useState('');
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

  const handleDeposit = () => {
    if (!amount) return;
    const amountBigInt = BigInt(Math.floor(Number(amount) * 1_000_000));
    
    // Find a coin with enough balance
    const coin = usdcCoins?.find(c => BigInt(c.balance) >= amountBigInt);
    
    if (coin) {
        deposit(vault.id, amountBigInt, coin.coinObjectId);
    } else {
        toast.error("Insufficient USDC balance in a single coin object. Please merge coins or top up.");
    }
  };

  const handleWithdraw = () => {
    if (!amount) return;
    withdraw(vault.id, BigInt(Math.floor(Number(amount) * 1_000_000)));
  };

  return (
    <Card className="h-full">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-serif text-ink-900">Your Vault</h3>
          <p className="text-sm text-ink-500 mt-1">Manage your deposits and rewards</p>
        </div>
        <div className="bg-canvas-subtle px-3 py-1 rounded-full">
            <span className="text-xs font-medium text-ink-700">APY: ~5.2%</span>
        </div>
      </div>
      
      <div className="mt-2 mb-8">
        <div className="p-6 rounded-xl bg-canvas-default border border-ink-300/30">
          <dt className="text-sm font-medium text-ink-500 uppercase tracking-wider">Total Balance</dt>
          <dd className="mt-2 text-4xl font-serif text-ink-900">
            ${formatBalance(vault.balance)}
          </dd>
        </div>
      </div>
      
      <div className="space-y-6">
        <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">Amount (USDC)</label>
            <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-ink-500 sm:text-sm">$</span>
                </div>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="block w-full rounded-lg border-ink-300 pl-7 pr-12 focus:border-ink-900 focus:ring-ink-900 sm:text-sm py-3 bg-surface"
                    placeholder="0.00"
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-ink-500 sm:text-sm">USDC</span>
                </div>
            </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
            <Button onClick={handleDeposit} isLoading={isLoading} className="w-full">Deposit</Button>
            <Button onClick={handleWithdraw} variant="secondary" isLoading={isLoading} className="w-full">Withdraw</Button>
        </div>
        
        <div className="pt-4 border-t border-ink-300/20">
             <Button onClick={() => claimRewards(vault.id)} variant="outline" isLoading={isLoading} fullWidth className="border-dashed">
                Claim & Distribute Yield
             </Button>
        </div>
      </div>
    </Card>
  );
};
