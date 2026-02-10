import { Transaction } from '@mysten/sui/transactions';
import { StableLayerClient } from 'stable-layer-sdk';
import { STABLE_COIN_TYPE, USDC_TYPE } from '@/config/sui';

/**
 * Test function to build a mint stable coin transaction
 * This function only builds the transaction without signing or executing it.
 * 
 * @param client - StableLayerClient instance
 * @param sender - Sender address
 * @param usdcCoinId - USDC coin object ID to mint from
 * @param amount - Amount to mint (in smallest unit, e.g., 1_000_000 for 1 USDC)
 * @returns Transaction object ready for signing
 */
export async function testMintStableCoin(
  client: StableLayerClient,
  sender: string,
  usdcCoinId: string,
  amount: bigint
): Promise<Transaction> {
  const tx = new Transaction();
  
  // Build mint transaction using SDK
  const stableCoin = await client.buildMintTx({
    tx,
    stableCoinType: STABLE_COIN_TYPE,
    usdcCoin: tx.object(usdcCoinId),
    amount,
    autoTransfer: false, // Don't auto-transfer, return coin object reference
  });
  
  // Basic sanity check: ensure stableCoin is returned
  if (!stableCoin) {
    throw new Error('buildMintTx did not return a stable coin object');
  }
  
  // The transaction is ready but not signed
  // Frontend should use wallet to sign and execute
  return tx;
}

/**
 * Test function to build a claim rewards transaction
 * This function only builds the transaction without signing or executing it.
 * 
 * @param client - StableLayerClient instance
 * @param sender - Sender address
 * @returns Transaction object ready for signing
 */
export async function testClaimRewards(
  client: StableLayerClient,
  sender: string
): Promise<Transaction> {
  const tx = new Transaction();
  
  // Build claim transaction using SDK
  const rewardsCoin = await client.buildClaimTx({
    tx,
    stableCoinType: STABLE_COIN_TYPE,
    autoTransfer: false, // Don't auto-transfer, return coin object reference
  });
  
  // Basic sanity check: ensure rewardsCoin is returned (may be null if no rewards)
  // Note: rewardsCoin can be null if there are no rewards to claim
  
  // The transaction is ready but not signed
  // Frontend should use wallet to sign and execute
  return tx;
}

/**
 * Test function to build a burn stable coin transaction
 * This function only builds the transaction without signing or executing it.
 * 
 * @param client - StableLayerClient instance
 * @param sender - Sender address
 * @param amount - Amount to burn (in smallest unit)
 * @returns Transaction object ready for signing
 */
export async function testBurnStableCoin(
  client: StableLayerClient,
  sender: string,
  amount: bigint
): Promise<Transaction> {
  const tx = new Transaction();
  
  // Build burn transaction using SDK
  // SDK automatically handles coin selection from sender's wallet
  await client.buildBurnTx({
    tx,
    stableCoinType: STABLE_COIN_TYPE,
    amount,
    autoTransfer: true,
  });
  
  // The transaction is ready but not signed
  // Frontend should use wallet to sign and execute
  return tx;
}
