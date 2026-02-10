/**
 * 直接調用 StableLayer 合約的 Mint 功能（繞過 SDK）
 * 用於診斷和臨時解決 SDK 問題
 */

import { Transaction } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';
import { USDC_TYPE, STABLE_COIN_TYPE } from '@/config/sui';

// StableLayer 合約地址（從 SDK constants 複製）
const STABLE_LAYER_PACKAGE_ID = '0xa4a78d8d3d1df62fb81d10068142e79b0d30ad4e3f578060487e36ed9ea764da';
const STABLE_REGISTRY = '0x213f4d584c0770f455bb98c94a4ee5ea9ddbc3d4ebb98a0ad6d093eb6da41642';
const STABLE_VAULT_FARM = '0xe958b7d102b33bf3c09addb0e2cdff102ff2c93afe407ec5c2a541e8959a650c';
const STABLE_VAULT = '0x65f38160110cd6859d05f338ff54b4f462883bb6f87c667a65c0fb0e537410a7';

/**
 * 繞過 SDK，直接構建 Mint 交易
 * 注意：這是簡化版本，可能不包含完整的 StableLayer 邏輯
 */
export async function buildDirectMintTx(
  suiClient: SuiClient,
  sender: string,
  amount: bigint
): Promise<Transaction> {
  const tx = new Transaction();
  tx.setSender(sender);

  console.log('[buildDirectMintTx] Querying USDC coins...');
  
  // 查詢 USDC coins
  const usdcCoins = await suiClient.getCoins({
    owner: sender,
    coinType: USDC_TYPE,
  });

  if (usdcCoins.data.length === 0) {
    throw new Error('No USDC in wallet');
  }

  console.log(`[buildDirectMintTx] Found ${usdcCoins.data.length} USDC coins`);

  // 合併和分割 USDC
  const [primaryCoin, ...otherCoins] = usdcCoins.data.map((coin: any) => coin.coinObjectId);

  if (otherCoins.length > 0) {
    tx.mergeCoins(tx.object(primaryCoin), otherCoins.map((id: string) => tx.object(id)));
  }

  const [usdcCoin] = tx.splitCoins(tx.object(primaryCoin), [tx.pure.u64(amount)]);

  console.log('[buildDirectMintTx] Calling StableLayer mint...');

  // 注意：這只是示例，實際的 StableLayer mint 需要更多參數
  // 包括 Bucket Protocol 的 treasury, psmPool, savingPool 等
  // 這個簡化版本可能無法正常工作
  
  console.warn('[buildDirectMintTx] ⚠️ This is a simplified version and may not work correctly');
  console.warn('[buildDirectMintTx] Full implementation requires Bucket Protocol integration');

  return tx;
}

/**
 * 檢查用戶是否有 USDC
 */
export async function checkUSDCBalance(
  suiClient: SuiClient,
  owner: string
): Promise<{ hasUSDC: boolean; totalBalance: bigint; coinCount: number }> {
  const coins = await suiClient.getCoins({
    owner,
    coinType: USDC_TYPE,
  });

  const totalBalance = coins.data.reduce((sum: bigint, coin: any) => {
    return sum + BigInt(coin.balance);
  }, BigInt(0));

  return {
    hasUSDC: coins.data.length > 0,
    totalBalance,
    coinCount: coins.data.length,
  };
}
