import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { NETWORKS, SUI_NETWORK } from '@/config/sui';

/**
 * 判斷是否啟用 gRPC
 * 透過環境變數 SUI_GRPC_ENDPOINT 來決定
 */
export function isGrpcEnabled(): boolean {
  return !!(process.env.SUI_GRPC_ENDPOINT || process.env.NEXT_PUBLIC_SUI_GRPC_ENDPOINT);
}

function getClientUrl() {
  if (SUI_NETWORK === 'mainnet') {
    return NETWORKS.mainnet.url;
  }
  return getFullnodeUrl(SUI_NETWORK as 'mainnet' | 'testnet' | 'devnet' | 'localnet');
}

/**
 * 傳統的 HTTP JSON-RPC 客戶端
 * 即使啟用 gRPC，某些操作仍可能需要回退到這個客戶端
 */
export const suiClient = new SuiClient({
  url: getClientUrl(),
});

/**
 * 取得 Sui 客戶端（自動選擇 gRPC 或 HTTP）
 * 
 * 注意：
 * - 如果設定了 SUI_GRPC_ENDPOINT，將使用 gRPC
 * - 否則使用傳統的 HTTP JSON-RPC
 * - 某些操作（如 queryEvents）在 gRPC 中實作方式不同，可能需要特殊處理
 */
export function getSuiClient() {
  if (isGrpcEnabled()) {
    console.log('Using gRPC for Sui queries');
    // 在 Node.js 環境中（API routes）才能使用 gRPC
    if (typeof window === 'undefined') {
      try {
        // 動態載入 gRPC 適配器（僅在伺服器端）
        const { getGrpcSuiAdapter } = require('./grpc-adapter');
        const adapter = getGrpcSuiAdapter();
        if (adapter) {
          return adapter as any;
        }
      } catch (error) {
        console.error('Failed to load gRPC adapter, falling back to HTTP:', error);
      }
    } else {
      console.warn('gRPC not available in browser, using HTTP JSON-RPC');
    }
  }
  
  // 回退到 HTTP JSON-RPC
  return suiClient;
}

// 預設匯出：為了向後相容，保持原本的 suiClient
export default suiClient;

