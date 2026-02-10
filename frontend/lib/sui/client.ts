import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { NETWORKS, SUI_NETWORK } from '@/config/sui';

/**
 * 判斷是否啟用 gRPC
 * 透過環境變數 SUI_GRPC_ENDPOINT 和 SUI_GRPC_TOKEN 來決定
 */
export function isGrpcEnabled(): boolean {
  const hasEndpoint = !!(process.env.SUI_GRPC_ENDPOINT || process.env.NEXT_PUBLIC_SUI_GRPC_ENDPOINT);
  const hasToken = !!(process.env.SUI_GRPC_TOKEN || process.env.NEXT_PUBLIC_SUI_GRPC_TOKEN);
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
  if (isGrpcEnabled()) {
    try {
      // 使用 gRPC-Web（支援瀏覽器和 Node.js）
      const { getGrpcSuiAdapter } = require('./grpc-adapter');
      const adapter = getGrpcSuiAdapter();
      if (adapter) {
        console.log('✅ Using Surflux gRPC-Web for Sui queries');
        return adapter as any;
      }
    } catch (error) {
      console.error('Failed to load gRPC adapter, falling back to HTTP:', error);
    }
  }
  
  // 回退到 HTTP JSON-RPC
  console.log('Using HTTP JSON-RPC for Sui queries');
  return suiClient;
}

// 預設匯出：為了向後相容，保持原本的 suiClient
export default suiClient;

