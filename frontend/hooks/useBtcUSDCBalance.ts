import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { STABLE_COIN_TYPE } from '@/config/sui';

export function useBtcUSDCBalance() {
  const client = useSuiClient();
  const account = useCurrentAccount();
  const address = account?.address;

  const { data: balance, isLoading, refetch } = useQuery({
    queryKey: ['btcUSDCBalance', address],
    queryFn: async () => {
      if (!address) return BigInt(0);

      const coins = await client.getCoins({
        owner: address,
        coinType: STABLE_COIN_TYPE,
      });

      const total = coins.data.reduce(
        (sum, coin) => sum + BigInt(coin.balance),
        BigInt(0)
      );

      return total;
    },
    enabled: !!address,
    refetchInterval: 30000,
  });

  return {
    balance: balance || BigInt(0),
    isLoading,
    refetch,
  };
}
