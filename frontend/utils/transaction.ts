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
  
  console.log('[resolveTransactionStatus] Checking result:', { 
    digest: digest || 'NO_DIGEST',
    hasEffects: !!result.effects,
    rawEffects: !!result.rawEffects,
  });
  
  if (!digest) {
    console.error('[resolveTransactionStatus] ❌ No digest');
    return { success: false, error: 'No transaction digest' };
  }

  // 檢查 result 中是否已有 effects.status（部分錢包/SDK 會回傳）
  const directStatus = result.effects?.status?.status;
  if (directStatus) {
    console.log('[resolveTransactionStatus] Direct status:', directStatus);
    if (directStatus === 'success') {
      return { success: true };
    }
    if (directStatus === 'failure') {
      const error = result.effects?.status?.error || 'Transaction failed';
      return { success: false, error };
    }
  }

  // 沒有 direct status，用 client 等待並查詢鏈上結果
  if (!client) {
    console.log('[resolveTransactionStatus] ✅ Have digest, no client - assuming success');
    return { success: true };
  }

  console.log('[resolveTransactionStatus] Waiting for transaction...');

  try {
    const tx = await client.waitForTransaction({
      digest,
      options: { showEffects: true },
      timeout: 45_000,
      pollInterval: 1_500,
    });
    
    console.log('[resolveTransactionStatus] Got transaction:', {
      digest: tx.digest,
      hasEffects: !!tx.effects,
      status: (tx as any).effects?.status,
    });
    
    const txStatus = (tx as any).effects?.status?.status;
    
    // 只有明確是 failure 才返回失敗
    if (txStatus === 'failure') {
      const error = (tx as any).effects?.status?.error || 'Transaction failed';
      console.error('[resolveTransactionStatus] ❌ Chain confirmed failure:', error);
      return { success: false, error };
    }
    
    // success 或其他情況都視為成功（保守策略）
    console.log('[resolveTransactionStatus] ✅ Chain result (not failure)');
    return { success: true };
  } catch (e: any) {
    console.warn('[resolveTransactionStatus] ⚠️ waitForTransaction failed:', e.message);
    console.log('[resolveTransactionStatus] ✅ But have digest - assuming success');
    // 有 digest 就視為成功（交易已送出）
    return { success: true };
  }
}

export async function executeTransactionWithToast(
  signAndExecute: (params: any) => Promise<any>,
  transaction: Transaction,
  options: ExecuteTransactionOptions = {}
): Promise<{ success: boolean; digest?: string }> {
  console.log('[executeTransactionWithToast] Called with options:', {
    loadingMessage: options.loadingMessage,
    successMessage: options.successMessage,
    hasClient: !!options.client,
  });

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
  console.log('[executeTransactionWithToast] Toast ID:', toastId);

  try {
    console.log('[executeTransactionWithToast] Calling signAndExecute...');
    
    const result = await signAndExecute({
      transaction,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });

    console.log('[executeTransactionWithToast] signAndExecute returned:', {
      digest: result.digest,
      hasEffects: !!result.effects,
      hasRawEffects: !!result.rawEffects,
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
      console.log('[executeTransactionWithToast] ✅ Success');
      toast.success(successMessage, {
        duration: 5000,
        icon: '✅',
      });
      if (onSuccess) await onSuccess(digest);
      return { success: true, digest };
    }

    console.error('[executeTransactionWithToast] ❌ Failed:', error);
    toast.error(`${errorMessage}: ${error || 'Unknown error'}`, {
      duration: 7000,
      icon: '❌',
    });
    if (onError) await onError(new Error(error || 'Unknown error'));
    return { success: false, digest };
  } catch (error: any) {
    console.error('[executeTransactionWithToast] Exception:', error);
    toast.dismiss(toastId);
    const errorMsg = error.message || errorMessage;
    toast.error(errorMsg, { duration: 7000, icon: '❌' });
    if (onError) await onError(error);
    return { success: false };
  }
}
