import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_ID, STABLE_COIN_TYPE } from '@/config/sui';

export function buildCreateSupportRecordTx(senderAddress: string): Transaction {
  const tx = new Transaction();
  
  const [record] = tx.moveCall({
    target: `${PACKAGE_ID}::support_record::create_support_record`,
    arguments: [],
  });
  
  tx.transferObjects([record], tx.pure.address(senderAddress));
  
  return tx;
}

export function buildStartSupportTx(
  projectId: string,
  supportRecordId: string,
  amount: bigint
): Transaction {
  const tx = new Transaction();
  
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

export function buildIncreaseSupportTx(
  projectId: string,
  supportRecordId: string,
  additionalAmount: bigint
): Transaction {
  const tx = new Transaction();
  
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

export function buildDecreaseSupportTx(
  projectId: string,
  supportRecordId: string,
  decreaseAmount: bigint
): Transaction {
  const tx = new Transaction();
  
  tx.moveCall({
    target: `${PACKAGE_ID}::project::decrease_support`,
    typeArguments: [STABLE_COIN_TYPE],
    arguments: [
      tx.object(projectId),
      tx.object(supportRecordId),
      tx.pure.u64(decreaseAmount),
    ],
  });
  
  return tx;
}

export function buildEndSupportTx(
  projectId: string,
  supportRecordId: string
): Transaction {
  const tx = new Transaction();
  
  tx.moveCall({
    target: `${PACKAGE_ID}::project::end_support`,
    typeArguments: [STABLE_COIN_TYPE],
    arguments: [
      tx.object(projectId),
      tx.object(supportRecordId),
    ],
  });
  
  return tx;
}
