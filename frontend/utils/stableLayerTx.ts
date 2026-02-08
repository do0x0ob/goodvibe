import { Transaction } from '@mysten/sui/transactions';
import { StableLayerClient } from 'stable-layer-sdk';
import { PACKAGE_ID, STABLE_COIN_TYPE, USDC_TYPE } from '@/config/sui';

export function createStableLayerClient(sender: string) {
  return new StableLayerClient({
    network: 'mainnet',
    sender,
  });
}

export async function buildDepositTx(
  client: StableLayerClient,
  vaultId: string,
  amount: bigint,
  usdcCoinId: string
): Promise<Transaction> {
  const tx = new Transaction();
  
  const stableCoin = await client.buildMintTx({
    tx,
    stableCoinType: STABLE_COIN_TYPE,
    usdcCoin: tx.object(usdcCoinId),
    amount,
    autoTransfer: false,
  });
  
  if (stableCoin) {
    tx.moveCall({
      target: `${PACKAGE_ID}::vault::record_deposit`,
      typeArguments: [STABLE_COIN_TYPE],
      arguments: [
        tx.object(vaultId),
        stableCoin,
      ],
    });
  }
  
  return tx;
}

export async function buildWithdrawTx(
  client: StableLayerClient,
  vaultId: string,
  amount: bigint
): Promise<Transaction> {
  const tx = new Transaction();
  
  const stableCoin = tx.moveCall({
    target: `${PACKAGE_ID}::vault::withdraw_deposit`,
    typeArguments: [STABLE_COIN_TYPE],
    arguments: [
      tx.object(vaultId),
      tx.pure.u64(amount),
    ],
  });
  
  await client.buildBurnTx({
    tx,
    stableCoinType: STABLE_COIN_TYPE,
    amount,
    autoTransfer: true,
  });
  
  return tx;
}

export async function buildClaimAndDistributeTx(
  client: StableLayerClient,
  vaultId: string
): Promise<Transaction> {
  const tx = new Transaction();
  
  const rewardsCoin = await client.buildClaimTx({
    tx,
    stableCoinType: STABLE_COIN_TYPE,
    autoTransfer: false,
  });
  
  if (rewardsCoin) {
    tx.moveCall({
      target: `${PACKAGE_ID}::vault::distribute_rewards`,
      typeArguments: [STABLE_COIN_TYPE],
      arguments: [
        tx.object(vaultId),
        tx.object(PACKAGE_ID),
        rewardsCoin,
      ],
    });
  }
  
  return tx;
}
