/**
 * Sui gRPC 客戶端 - 支援 Surflux gRPC-Web
 * 
 * 使用 @mysten/sui/grpc 和 @protobuf-ts/grpcweb-transport
 * 支援瀏覽器和 Node.js 環境
 */

import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport';

// gRPC 配置
const getGrpcEndpoint = () => {
  const endpoint = process.env.SUI_GRPC_ENDPOINT || process.env.NEXT_PUBLIC_SUI_GRPC_ENDPOINT || '';
  // 如果端點包含 :443，移除它並使用 https://
  if (endpoint.includes(':443')) {
    return `https://${endpoint.replace(':443', '')}`;
  }
  // 如果端點已經有 https://，直接使用
  if (endpoint.startsWith('https://')) {
    return endpoint;
  }
  // 否則加上 https://
  return endpoint ? `https://${endpoint}` : '';
};

const getGrpcApiKey = () => {
  return process.env.SUI_GRPC_TOKEN || process.env.NEXT_PUBLIC_SUI_GRPC_TOKEN || '';
};

// Sui gRPC 客戶端實例
let grpcClientInstance: any = null;

/**
 * 建立 gRPC Transport（帶 API Key 認證）
 */
function createGrpcTransport() {
  const baseUrl = getGrpcEndpoint();
  const apiKey = getGrpcApiKey();

  if (!baseUrl) {
    console.warn('SUI_GRPC_ENDPOINT not configured');
    return null;
  }

  // 自訂 fetch 函數以注入 API Key
  const fetchWithApiKey = (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    if (apiKey) {
      headers.set('x-api-key', apiKey);
    }
    return fetch(input, { ...init, headers });
  };

  return new GrpcWebFetchTransport({
    baseUrl,
    fetch: fetchWithApiKey,
  });
}

/**
 * 初始化 Sui gRPC 客戶端
 */
export function initializeSuiGrpcClient(): any {
  if (!getGrpcEndpoint()) {
    console.warn('gRPC endpoint not configured. Please set SUI_GRPC_ENDPOINT in .env');
    return null;
  }

  try {
    // 動態載入 @mysten/sui/grpc
    // 這個可能需要在執行時才能判斷是否可用
    const { SuiGrpcClient } = require('@mysten/sui/grpc');
    
    const transport = createGrpcTransport();
    if (!transport) {
      return null;
    }

    const client = new SuiGrpcClient({
      network: 'mainnet',
      transport,
    });

    return client;
  } catch (error) {
    console.error('Failed to initialize gRPC client:', error);
    console.warn('Make sure @mysten/sui/grpc is available. Falling back to HTTP JSON-RPC');
    return null;
  }
}

/**
 * 取得全域 gRPC 客戶端實例（單例模式）
 */
export function getSuiGrpcClient(): any {
  if (!grpcClientInstance) {
    grpcClientInstance = initializeSuiGrpcClient();
  }
  return grpcClientInstance;
}

/**
 * 檢查 gRPC 是否可用
 */
export function isGrpcAvailable(): boolean {
  return !!(getGrpcEndpoint() && getGrpcApiKey());
}

export default {
  getSuiGrpcClient,
  isGrpcAvailable,
};
