import { Transaction } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';
import toast from 'react-hot-toast';

const EXPLORER_BASE_URL = 'https://suivision.xyz/txblock';

export function getExplorerUrl(digest: string, network: 'mainnet' | 'testnet' = 'mainnet'): string {
  return `${EXPLORER_BASE_URL}/${digest}?network=${network}`;
}

export function openExplorer(digest: string, network: 'mainnet' | 'testnet' = 'mainnet'): void {
  window.open(getExplorerUrl(digest, network), '_blank');
}

interface TransactionToastOptions {
  loading?: string;
  success?: string;
  error?: string;
  network?: 'mainnet' | 'testnet';
}

export function showTransactionToast(
  digest: string,
  status: 'success' | 'error',
  options: TransactionToastOptions = {}
) {
  const { network = 'mainnet', success: successMsg, error: errorMsg } = options;

  const message = status === 'success' 
    ? (successMsg || 'Transaction successful')
    : (errorMsg || 'Transaction failed');

  const toastFn = status === 'success' ? toast.success : toast.error;
  const icon = status === 'success' ? '✅' : '❌';
  const duration = status === 'success' ? 5000 : 7000;

  toastFn(message, {
    duration,
    icon,
  });
}

export interface ExecuteTransactionOptions {
  loadingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
  network?: 'mainnet' | 'testnet';
  onSuccess?: (digest: string) => void | Promise<void>;
  onError?: (error: Error) => void | Promise<void>;
  /** 若 dapp-kit 未回傳 effects.status，用此 client 依 digest 查詢實際狀態 */
  client?: SuiClient;
}

/** 從交易結果判斷成功與否（保守策略：有 digest 就視為成功，除非明確失敗） */
async function resolveTransactionStatus(
  result: any,
  client?: SuiClient
): Promise<{ success: boolean; error?: string }> {
  const digest = result.digest;
  if (!digest) {
    return { success: false, error: 'No transaction digest' };
  }
  const directStatus = result.effects?.status?.status;
  if (directStatus) {
    if (directStatus === 'success') {
      return { success: true };
    }
    if (directStatus === 'failure') {
      const error = result.effects?.status?.error || 'Transaction failed';
      return { success: false, error };
    }
  }
  if (!client) {
    return { success: true };
  }
  try {
    const tx = await client.waitForTransaction({
      digest,
      options: { showEffects: true },
      timeout: 45_000,
      pollInterval: 1_500,
    });
    const txStatus = (tx as any).effects?.status?.status;
    if (txStatus === 'failure') {
      const error = (tx as any).effects?.status?.error || 'Transaction failed';
      return { success: false, error };
    }
    return { success: true };
  } catch {
    return { success: true };
  }
}

export async function executeTransactionWithToast(
  signAndExecute: (params: any) => Promise<any>,
  transaction: Transaction,
  options: ExecuteTransactionOptions = {}
): Promise<{ success: boolean; digest?: string }> {
  const {
    loadingMessage = 'Processing transaction...',
    successMessage = 'Transaction successful',
    errorMessage = 'Transaction failed',
    network = 'mainnet',
    onSuccess,
    onError,
    client,
  } = options;

  const toastId = toast.loading(loadingMessage);
  try {
    const result = await signAndExecute({
      transaction,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });
    const digest = result.digest;
    if (!digest) {
      toast.dismiss(toastId);
      toast.error(errorMessage + ': No transaction digest', {
        duration: 7000,
        icon: '❌',
      });
      return { success: false };
    }

    const { success, error } = await resolveTransactionStatus(result, client);
    toast.dismiss(toastId);
    if (success) {
      toast.success(successMessage, {
        duration: 5000,
        icon: '✅',
      });
      if (onSuccess) await onSuccess(digest);
      return { success: true, digest };
    }
    toast.error(`${errorMessage}: ${error || 'Unknown error'}`, {
      duration: 7000,
      icon: '❌',
    });
    if (onError) await onError(new Error(error || 'Unknown error'));
    return { success: false, digest };
  } catch (error: any) {
    toast.dismiss(toastId);
    const errorMsg = error.message || errorMessage;
    toast.error(errorMsg, { duration: 7000, icon: '❌' });
    if (onError) await onError(error);
    return { success: false };
  }
}
