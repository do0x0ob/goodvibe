import { Transaction, coinWithBalance } from '@mysten/sui/transactions';
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

export function buildCreateSupportRecordTx(senderAddress: string): Transaction {
  const tx = new Transaction();
  const [record] = tx.moveCall({
    target: `${PACKAGE_ID}::support_record::create_support_record`,
    arguments: [],
  });
  tx.transferObjects([record], tx.pure.address(senderAddress));
  return tx;
}

export async function buildDonateToProjectTx(
  client: StableLayerClient,
  suiClient: any,
  sender: string,
  projectId: string,
  amount: bigint,
  supportRecordId: string
): Promise<Transaction> {
  return buildStartSupportingTx(client, suiClient, sender, projectId, supportRecordId, amount);
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
  console.log('[buildStartSupportingTx] Fetching USDC coins from wallet...');
  const usdcCoins = await suiClient.getCoins({
    owner: sender,
    coinType: USDC_TYPE,
  });

  if (usdcCoins.data.length === 0) {
    throw new Error('No USDC in wallet. Please get USDC first.');
  }

  console.log(`[buildStartSupportingTx] Found ${usdcCoins.data.length} USDC coins`);

  // Merge USDC coins and split the required amount
  const [primaryCoin, ...otherCoins] = usdcCoins.data.map((coin: any) => coin.coinObjectId);

  if (otherCoins.length > 0) {
    tx.mergeCoins(tx.object(primaryCoin), otherCoins.map((id: string) => tx.object(id)));
  }

  const [usdcCoin] = tx.splitCoins(tx.object(primaryCoin), [tx.pure.u64(amount)]);
  
  console.log('[buildStartSupportingTx] Calling SDK buildMintTx...');
  
  await client.buildMintTx({
    tx,
    stableCoinType: STABLE_COIN_TYPE,
    usdcCoin,
    amount,
    sender,
    autoTransfer: true,
  });
  
  console.log('[buildStartSupportingTx] Adding support_project call...');
  
  tx.moveCall({
    target: `${PACKAGE_ID}::project::support_project`,
    typeArguments: [STABLE_COIN_TYPE],
    arguments: [
      tx.object(projectId),
      tx.object(supportRecordId),
      tx.pure.u64(amount),
    ],
  });
  
  console.log('[buildStartSupportingTx] Transaction built successfully');
  
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

  const usdcCoins = await suiClient.getCoins({
    owner: sender,
    coinType: USDC_TYPE,
  });

  if (usdcCoins.data.length === 0) {
    throw new Error('No USDC in wallet. Please get USDC first.');
  }

  const [primaryCoin, ...otherCoins] = usdcCoins.data.map((coin: any) => coin.coinObjectId);

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


export function buildWithdrawDonationsTx(
  projectCapId: string,
  projectId: string,
  amount: bigint
): Transaction {
  const tx = new Transaction();
  
  tx.moveCall({
    target: `${PACKAGE_ID}::project::withdraw_donations`,
    typeArguments: [STABLE_COIN_TYPE],
    arguments: [
      tx.object(projectCapId),
      tx.object(projectId),
      tx.pure.u64(amount),
    ],
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

