import { Transaction } from '@mysten/sui/transactions';
import { StableLayerClient } from 'stable-layer-sdk';
import { PACKAGE_ID, PLATFORM_ID, STABLE_COIN_TYPE, USDC_TYPE } from '@/config/sui';

export function buildCreateProjectTx(
  title: string,
  description: string,
  category: string,
  coverImageUrl: string,
  coinType: string
): Transaction {
  const tx = new Transaction();
  const titleBytes = Array.from(new TextEncoder().encode(title));
  const descBytes = Array.from(new TextEncoder().encode(description));
  const categoryBytes = Array.from(new TextEncoder().encode(category));
  const coverBytes = Array.from(new TextEncoder().encode(coverImageUrl));
  tx.moveCall({
    target: `${PACKAGE_ID}::project::create_project`,
    typeArguments: [coinType],
    arguments: [
      tx.object(PLATFORM_ID),
      tx.pure.vector('u8', titleBytes),
      tx.pure.vector('u8', descBytes),
      tx.pure.vector('u8', categoryBytes),
      tx.pure.vector('u8', coverBytes),
    ],
  });
  return tx;
}

export async function buildStartSupportingTx(
  client: StableLayerClient,
  suiClient: any,
  sender: string,
  projectId: string,
  supportRecordId: string,
  amount: bigint
): Promise<Transaction> {
  const tx = new Transaction();
  tx.setSender(sender);
  
  // Query user's USDC coins from chain
  const { objects } = await suiClient.listCoins({
    owner: sender,
    coinType: USDC_TYPE,
  });

  if (objects.length === 0) {
    throw new Error('No USDC in wallet. Please get USDC first.');
  }

  // Merge USDC coins and split the required amount
  const [primaryCoin, ...otherCoins] = objects.map((coin: { objectId: string }) => coin.objectId);

  if (otherCoins.length > 0) {
    tx.mergeCoins(tx.object(primaryCoin), otherCoins.map((id: string) => tx.object(id)));
  }

  const [usdcCoin] = tx.splitCoins(tx.object(primaryCoin), [tx.pure.u64(amount)]);

  await client.buildMintTx({
    tx,
    stableCoinType: STABLE_COIN_TYPE,
    usdcCoin,
    amount,
    sender,
    autoTransfer: true,
  });

  tx.moveCall({
    target: `${PACKAGE_ID}::project::support_project`,
    typeArguments: [STABLE_COIN_TYPE],
    arguments: [
      tx.object(projectId),
      tx.object(supportRecordId),
      tx.pure.u64(amount),
    ],
  });

  return tx;
}

/** 增加支持金額：mint btcUSDC + increase_support */
export async function buildIncreaseSupportTx(
  client: StableLayerClient,
  suiClient: any,
  sender: string,
  projectId: string,
  supportRecordId: string,
  additionalAmount: bigint
): Promise<Transaction> {
  const tx = new Transaction();
  tx.setSender(sender);

  const { objects } = await suiClient.listCoins({
    owner: sender,
    coinType: USDC_TYPE,
  });

  if (objects.length === 0) {
    throw new Error('No USDC in wallet. Please get USDC first.');
  }

  const [primaryCoin, ...otherCoins] = objects.map((coin: { objectId: string }) => coin.objectId);

  if (otherCoins.length > 0) {
    tx.mergeCoins(tx.object(primaryCoin), otherCoins.map((id: string) => tx.object(id)));
  }

  const [usdcCoin] = tx.splitCoins(tx.object(primaryCoin), [tx.pure.u64(additionalAmount)]);

  await client.buildMintTx({
    tx,
    stableCoinType: STABLE_COIN_TYPE,
    usdcCoin,
    amount: additionalAmount,
    sender,
    autoTransfer: true,
  });

  tx.moveCall({
    target: `${PACKAGE_ID}::project::increase_support`,
    typeArguments: [STABLE_COIN_TYPE],
    arguments: [
      tx.object(projectId),
      tx.object(supportRecordId),
      tx.pure.u64(additionalAmount),
    ],
  });

  return tx;
}

export async function buildWithdrawSupportTx(
  client: StableLayerClient,
  sender: string,
  projectId: string,
  supportRecordId: string,
  amount: bigint
): Promise<Transaction> {
  const tx = new Transaction();
  tx.setSender(sender);
  
  tx.moveCall({
    target: `${PACKAGE_ID}::project::decrease_support`,
    typeArguments: [STABLE_COIN_TYPE],
    arguments: [
      tx.object(projectId),
      tx.object(supportRecordId),
      tx.pure.u64(amount),
    ],
  });
  
  await client.buildBurnTx({
    tx,
    stableCoinType: STABLE_COIN_TYPE,
    amount,
    sender,
    autoTransfer: true,
  });
  
  return tx;
}

export function buildPostUpdateTx(
  projectCapId: string,
  projectId: string,
  updateId: string,
  title: string,
  content: string
): Transaction {
  const tx = new Transaction();
  
  const updateIdBytes = Array.from(new TextEncoder().encode(updateId));
  const titleBytes = Array.from(new TextEncoder().encode(title));
  const contentBytes = Array.from(new TextEncoder().encode(content));
  
  tx.moveCall({
    target: `${PACKAGE_ID}::project::post_update`,
    typeArguments: [STABLE_COIN_TYPE],
    arguments: [
      tx.object(projectCapId),
      tx.object(projectId),
      tx.pure.vector('u8', updateIdBytes),
      tx.pure.vector('u8', titleBytes),
      tx.pure.vector('u8', contentBytes),
    ],
  });
  
  return tx;
}

