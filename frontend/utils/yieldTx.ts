import { Transaction } from '@mysten/sui/transactions';
import { StableLayerClient } from 'stable-layer-sdk';
import { PACKAGE_ID, STABLE_COIN_TYPE } from '@/config/sui';

export async function buildClaimYieldTx(
  client: StableLayerClient,
  sender: string
): Promise<Transaction> {
  const tx = new Transaction();
  tx.setSender(sender);
  
  await client.buildClaimTx({
    tx,
    lpToken: 'btcUSDC',
    sender,
    autoTransfer: true,
  });
  
  return tx;
}

export async function buildDonateYieldTx(
  client: StableLayerClient,
  sender: string,
  projectId: string
): Promise<Transaction> {
  const tx = new Transaction();
  tx.setSender(sender);
  
  const yieldCoin = await client.buildClaimTx({
    tx,
    lpToken: 'btcUSDC',
    sender,
    autoTransfer: false,
  });
  
  if (!yieldCoin) {
    throw new Error('No yield available to claim');
  }
  
  tx.moveCall({
    target: `${PACKAGE_ID}::project::donate_yield`,
    typeArguments: [STABLE_COIN_TYPE],
    arguments: [
      tx.object(projectId),
      yieldCoin,
    ],
  });
  
  return tx;
}

export async function buildClaimAndDonateToMultipleTx(
  client: StableLayerClient,
  senderAddress: string,
  projectIds: string[],
  donationPercentage: number
): Promise<Transaction> {
  const tx = new Transaction();
  
  const yieldCoin = await client.buildClaimTx({
    tx,
    lpToken: 'btcUSDC',
    autoTransfer: false,
  });
  
  if (!yieldCoin) {
    throw new Error('No yield available to claim');
  }
  
  if (donationPercentage === 0 || projectIds.length === 0) {
    tx.transferObjects([yieldCoin], tx.pure.address(senderAddress));
    return tx;
  }
  
  if (donationPercentage === 100) {
    for (const projectId of projectIds) {
      const share = tx.splitCoins(yieldCoin, [
        tx.pure.u64(BigInt(Math.floor(100 / projectIds.length))),
      ]);
      
      tx.moveCall({
        target: `${PACKAGE_ID}::project::donate_yield`,
        typeArguments: [STABLE_COIN_TYPE],
        arguments: [
          tx.object(projectId),
          share[0],
        ],
      });
    }
  } else {
    const donationAmount = tx.splitCoins(yieldCoin, [
      tx.pure.u64(BigInt(donationPercentage)),
    ]);
    
    for (const projectId of projectIds) {
      const share = tx.splitCoins(donationAmount[0], [
        tx.pure.u64(BigInt(Math.floor(donationPercentage / projectIds.length))),
      ]);
      
      tx.moveCall({
        target: `${PACKAGE_ID}::project::donate_yield`,
        typeArguments: [STABLE_COIN_TYPE],
        arguments: [
          tx.object(projectId),
          share[0],
        ],
      });
    }
    
    tx.transferObjects([yieldCoin], tx.pure.address(senderAddress));
  }
  
  return tx;
}

export function buildWithdrawProjectDonationsTx(
  projectCapId: string,
  projectId: string,
  amount: bigint,
  recipientAddress: string
): Transaction {
  const tx = new Transaction();
  
  const [coin] = tx.moveCall({
    target: `${PACKAGE_ID}::project::withdraw_donations`,
    typeArguments: [STABLE_COIN_TYPE],
    arguments: [
      tx.object(projectCapId),
      tx.object(projectId),
      tx.pure.u64(amount),
    ],
  });
  
  tx.transferObjects([coin], recipientAddress);
  
  return tx;
}

export async function buildWithdrawAndBurnTx(
  client: StableLayerClient,
  projectCapId: string,
  projectId: string,
  amount: bigint
): Promise<Transaction> {
  const tx = new Transaction();
  
  const [btcUsdcCoin] = tx.moveCall({
    target: `${PACKAGE_ID}::project::withdraw_donations`,
    typeArguments: [STABLE_COIN_TYPE],
    arguments: [
      tx.object(projectCapId),
      tx.object(projectId),
      tx.pure.u64(amount),
    ],
  });
  
  await client.buildBurnTx({
    tx,
    lpToken: 'btcUSDC',
    amount,
    autoTransfer: true,
  });
  
  return tx;
}
