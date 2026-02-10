import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { NETWORKS, SUI_NETWORK } from '@/config/sui';

/**
 * 判斷是否啟用 gRPC（僅伺服器端；API Key 絕不暴露給瀏覽器）
 * 僅讀取 SUI_GRPC_ENDPOINT 和 SUI_GRPC_TOKEN，不使用 NEXT_PUBLIC_*
 */
export function isGrpcEnabled(): boolean {
  if (typeof window !== 'undefined') return false; // 瀏覽器端一律不使用 gRPC，避免需傳 API Key
  const hasEndpoint = !!process.env.SUI_GRPC_ENDPOINT;
  const hasToken = !!process.env.SUI_GRPC_TOKEN;
  return hasEndpoint && hasToken;
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
 * 取得 Sui 客戶端（自動選擇 gRPC-Web 或 HTTP）
 * 
 * 注意：
 * - 如果設定了 SUI_GRPC_ENDPOINT 和 SUI_GRPC_TOKEN，將使用 gRPC-Web
 * - 使用 Surflux gRPC-Web，支援瀏覽器和 Node.js 環境
 * - 否則使用傳統的 HTTP JSON-RPC
 * - 某些操作（如 queryEvents）在 gRPC 中實作方式不同，可能需要特殊處理
 */
export function getSuiClient() {
  // 僅在伺服器端使用 gRPC（需 API Key）；瀏覽器端一律用 HTTP 以免暴露 Key
  if (typeof window === 'undefined' && isGrpcEnabled()) {
    try {
      const { getGrpcSuiAdapter } = require('./grpc-adapter');
      const adapter = getGrpcSuiAdapter();
      if (adapter) {
        return adapter as any;
      }
    } catch (error) {
      console.error('Failed to load gRPC adapter, falling back to HTTP:', error);
    }
  }
  return suiClient;
}

// 預設匯出：為了向後相容，保持原本的 suiClient
export default suiClient;

