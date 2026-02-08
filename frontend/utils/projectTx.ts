import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_ID, PLATFORM_ID } from '@/config/sui';

export async function buildCreateProjectTx(
  title: string,
  description: string,
  category: string,
  coverImageUrl: string,
  coinType: string
): Promise<Transaction> {
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

export async function buildWithdrawFundsTx(
  projectCapId: string,
  projectId: string,
  amount: bigint,
  coinType: string
): Promise<Transaction> {
  const tx = new Transaction();
  
  tx.moveCall({
    target: `${PACKAGE_ID}::project::withdraw_funds`,
    typeArguments: [coinType],
    arguments: [
      tx.object(projectCapId),
      tx.object(projectId),
      tx.pure.u64(amount),
    ],
  });
  
  return tx;
}

export async function buildPostUpdateTx(
  projectCapId: string,
  projectId: string,
  title: string,
  content: string
): Promise<Transaction> {
  const tx = new Transaction();
  
  const titleBytes = Array.from(new TextEncoder().encode(title));
  const contentBytes = Array.from(new TextEncoder().encode(content));
  
  tx.moveCall({
    target: `${PACKAGE_ID}::project::post_update`,
    arguments: [
      tx.object(projectCapId),
      tx.pure.id(projectId),
      tx.pure.vector('u8', titleBytes),
      tx.pure.vector('u8', contentBytes),
    ],
  });
  
  return tx;
}

export async function buildReceiveDonationTx(
  projectId: string,
  donationCoin: any,
  coinType: string
): Promise<Transaction> {
  const tx = new Transaction();
  
  tx.moveCall({
    target: `${PACKAGE_ID}::project::receive_donation`,
    typeArguments: [coinType],
    arguments: [
      tx.object(projectId),
      donationCoin,
      tx.object(PLATFORM_ID),
    ],
  });
  
  return tx;
}
