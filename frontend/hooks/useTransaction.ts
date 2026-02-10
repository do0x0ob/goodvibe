import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useState } from 'react';
import { executeTransactionWithToast, ExecuteTransactionOptions } from '@/utils/transaction';

export function useTransaction() {
  const client = useSuiClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const [isExecuting, setIsExecuting] = useState(false);

  const execute = async (
    transaction: Transaction,
    options?: ExecuteTransactionOptions
  ) => {
    setIsExecuting(true);
    try {
      const result = await executeTransactionWithToast(
        signAndExecute,
        transaction,
        { ...options, client }
      );
      return result;
    } finally {
      setIsExecuting(false);
    }
  };

  return {
    execute,
    isExecuting,
  };
}
