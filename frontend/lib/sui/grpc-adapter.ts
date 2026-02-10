/**
 * gRPC 適配器：將 SuiClient 的 API 轉換為 Surflux gRPC 呼叫
 * 這個檔案提供與原本 SuiClient 相容的介面，但使用 gRPC-Web 作為底層傳輸
 */

import { getSuiGrpcClient } from './grpc-client';

export interface GrpcSuiClientAdapter {
  // Object queries
  getObject(params: {
    id: string;
    options?: {
      showType?: boolean;
      showOwner?: boolean;
      showPreviousTransaction?: boolean;
      showDisplay?: boolean;
      showContent?: boolean;
      showBcs?: boolean;
      showStorageRebate?: boolean;
    };
  }): Promise<any>;

  getOwnedObjects(params: {
    owner: string;
    filter?: {
      StructType?: string;
      Package?: string;
      Module?: string;
      MatchAll?: any[];
      MatchAny?: any[];
      MatchNone?: any[];
    };
    options?: {
      showType?: boolean;
      showOwner?: boolean;
      showPreviousTransaction?: boolean;
      showDisplay?: boolean;
      showContent?: boolean;
      showBcs?: boolean;
      showStorageRebate?: boolean;
    };
    cursor?: string;
    limit?: number;
  }): Promise<any>;

  // Event queries
  queryEvents(params: {
    query: {
      MoveEventType?: string;
      Transaction?: string;
      MoveModule?: { package: string; module: string };
      EventType?: string;
      Sender?: string;
      Recipient?: { AddressOwner: string };
      Object?: string;
      TimeRange?: { start_time: string; end_time: string };
      All?: any[];
      Any?: any[];
    };
    cursor?: string;
    limit?: number;
    order?: 'ascending' | 'descending';
  }): Promise<any>;

  // Transaction queries
  getTransactionBlock(params: {
    digest: string;
    options?: {
      showInput?: boolean;
      showRawInput?: boolean;
      showEffects?: boolean;
      showEvents?: boolean;
      showObjectChanges?: boolean;
      showBalanceChanges?: boolean;
    };
  }): Promise<any>;

  // Checkpoint queries  
  getCheckpoint(params: { id: string }): Promise<any>;

  // Balance queries
  getBalance(params: { owner: string; coinType?: string }): Promise<any>;
  getAllBalances(params: { owner: string }): Promise<any>;
}

/**
 * 建立 gRPC 適配器實例（使用 Surflux gRPC-Web）
 */
export function createGrpcSuiAdapter(): GrpcSuiClientAdapter | null {
  const grpcClient = getSuiGrpcClient();
  
  if (!grpcClient) {
    console.warn('gRPC client not available, falling back to JSON-RPC');
    return null;
  }

  return {
    async getObject(params) {
      // ⚠️ Surflux gRPC getObject 格式問題，回退到 HTTP
      console.log('⚠️  getObject using HTTP fallback for compatibility');
      const { suiClient } = await import('./client');
      return suiClient.getObject(params);
    },

    async getOwnedObjects(params) {
      // ✅ 使用 gRPC（此方法通常工作正常）
      try {
        const { response } = await grpcClient.stateService.listOwnedObjects({
          owner: params.owner,
          filter: params.filter,
          limit: params.limit || 50,
          cursor: params.cursor,
        });

        // 轉換為 SuiClient 格式
        return {
          data: response.objects || [],
          nextCursor: response.next_cursor,
          hasNextPage: !!response.next_cursor,
        };
      } catch (error) {
        console.error('getOwnedObjects error, falling back to HTTP:', error);
        // 回退到 HTTP
        const { suiClient } = await import('./client');
        return suiClient.getOwnedObjects(params);
      }
    },

    async queryEvents(params) {
      // ⚠️ Surflux gRPC 不支援 queryEvents
      // 回退到 HTTP JSON-RPC
      console.log('⚠️  queryEvents not supported in Surflux gRPC, using HTTP fallback');
      
      const { suiClient } = await import('./client');
      return suiClient.queryEvents(params);
    },

    async getTransactionBlock(params) {
      try {
        const { response } = await grpcClient.ledgerService.getTransaction({
          digest: params.digest,
        });

        return {
          data: response.transaction,
        };
      } catch (error) {
        console.error('getTransactionBlock error, falling back to HTTP:', error);
        const { suiClient } = await import('./client');
        return suiClient.getTransactionBlock(params);
      }
    },

    async getCheckpoint(params) {
      try {
        const { response } = await grpcClient.ledgerService.getCheckpoint({
          checkpoint_id: params.id,
        });

        return {
          data: response.checkpoint,
        };
      } catch (error) {
        console.error('getCheckpoint error:', error);
        throw error;
      }
    },

    async getBalance(params) {
      try {
        // Surflux 要求必須提供 coin_type
        const coinType = params.coinType || '0x2::sui::SUI';
        
        const { response } = await grpcClient.stateService.getBalance({
          owner: params.owner,
          coin_type: coinType,
        });

        // 轉換為 SuiClient 格式
        return {
          coinType: response.coin_type,
          coinObjectCount: response.coin_object_count,
          totalBalance: response.total_balance,
          lockedBalance: response.locked_balance,
        };
      } catch (error) {
        console.error('getBalance error, falling back to HTTP:', error);
        const { suiClient } = await import('./client');
        return suiClient.getBalance(params);
      }
    },

    async getAllBalances(params) {
      try {
        const { response } = await grpcClient.stateService.listBalances({
          owner: params.owner,
        });

        // 轉換為 SuiClient 格式
        return {
          data: response.balances || [],
          nextCursor: response.next_cursor,
          hasNextPage: !!response.next_cursor,
        };
      } catch (error) {
        console.error('getAllBalances error:', error);
        throw error;
      }
    },
  };
}

// 全域適配器實例
let adapterInstance: GrpcSuiClientAdapter | null = null;

/**
 * 取得全域 gRPC 適配器實例
 */
export function getGrpcSuiAdapter(): GrpcSuiClientAdapter | null {
  if (!adapterInstance) {
    adapterInstance = createGrpcSuiAdapter();
  }
  return adapterInstance;
}
