/**
 * 測試 Stable Layer SDK Mint 功能的簡化版本
 * 用於診斷 accumulatorMessage.readUint8 錯誤
 */

import { StableLayerClient } from 'stable-layer-sdk';
import { Transaction, coinWithBalance } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';
import { STABLE_COIN_TYPE, USDC_TYPE } from '@/config/sui';

export async function testSimpleMint(senderAddress: string) {
  console.log('🧪 Testing Simple Mint with SDK v2.0');
  console.log('=========================================\n');

  try {
    // Step 1: Create client
    console.log('Step 1: Creating StableLayerClient...');
    const client = new StableLayerClient({
      network: 'mainnet',
      sender: senderAddress,
    });
    console.log('✅ Client created\n');

    // Step 2: Create transaction
    console.log('Step 2: Creating transaction...');
    const tx = new Transaction();
    console.log('✅ Transaction created\n');

    // Step 3: Create USDC coin with coinWithBalance
    console.log('Step 3: Creating USDC coin...');
    console.log(`  Amount: 1 USDC (1000000 micro units)`);
    console.log(`  USDC Type: ${USDC_TYPE}`);
    
    const usdcCoin = coinWithBalance({
      balance: BigInt(1_000_000),
      type: USDC_TYPE,
    })(tx);
    console.log('✅ USDC coin created\n');

    // Step 4: Call buildMintTx
    console.log('Step 4: Calling buildMintTx...');
    console.log('  Parameters:');
    console.log(`    - stableCoinType: STABLE_COIN_TYPE`);
    console.log(`    - amount: 1000000`);
    console.log(`    - autoTransfer: true`);
    
    await client.buildMintTx({
      tx,
      stableCoinType: STABLE_COIN_TYPE,
      usdcCoin,
      amount: BigInt(1_000_000),
      autoTransfer: true,
    });
    
    console.log('✅ buildMintTx completed\n');

    // Step 5: Dev inspect (simulate execution)
    console.log('Step 5: Dev inspect transaction...');
    const suiClient = new SuiClient({
      url: 'https://fullnode.mainnet.sui.io:443',
    });

    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: senderAddress,
    });

    console.log('✅ Dev inspect result:');
    console.log(`  Status: ${result.effects.status.status}`);
    
    if (result.effects.status.status === 'success') {
      console.log('\n🎉 Success! Mint transaction is valid.\n');
      return { success: true, tx };
    } else {
      console.log('\n❌ Transaction would fail:');
      console.log(`  Error: ${result.effects.status.error}\n`);
      return { success: false, error: result.effects.status.error };
    }

  } catch (error: any) {
    console.error('\n❌ Error occurred:');
    console.error(`  Message: ${error.message}`);
    console.error(`  Stack: ${error.stack}\n`);
    
    if (error.message.includes('readUint8')) {
      console.error('⚠️  This is the readUint8 error!');
      console.error('   Possible causes:');
      console.error('   1. SDK version incompatibility');
      console.error('   2. Pyth price oracle issue');
      console.error('   3. Bucket Protocol integration issue');
      console.error('   4. Wrong coin type or parameters\n');
    }
    
    return { success: false, error: error.message };
  }
}

/**
 * 測試不使用 SDK，直接構建 Mint 交易
 * 用於對比和診斷
 */
export function testDirectMint(senderAddress: string) {
  console.log('🧪 Testing Direct Mint (without SDK)');
  console.log('=====================================\n');

  try {
    const tx = new Transaction();

    // 直接使用 USDC
    console.log('Creating transaction without SDK...');
    const usdcCoin = coinWithBalance({
      balance: BigInt(1_000_000),
      type: USDC_TYPE,
    })(tx);

    // 注意：這只是測試交易構建，實際 Mint 需要 SDK
    tx.transferObjects([usdcCoin], tx.pure.address(senderAddress));

    console.log('✅ Direct transaction created (USDC transfer only)\n');
    return { success: true, tx };

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return { success: false, error: error.message };
  }
}

// 用於在瀏覽器 console 中測試
if (typeof window !== 'undefined') {
  (window as any).testSimpleMint = testSimpleMint;
  (window as any).testDirectMint = testDirectMint;
}
