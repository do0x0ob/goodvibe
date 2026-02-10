/**
 * gRPC 適配器：將 SuiClient 的 API 轉換為 gRPC 呼叫
 * 這個檔案提供與原本 SuiClient 相容的介面，但使用 gRPC 作為底層傳輸
 */

import { getSuiGrpcClients, callGrpcMethod, callGrpcStream } from './grpc-client';

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
 * 建立 gRPC 適配器實例
 */
export function createGrpcSuiAdapter(): GrpcSuiClientAdapter | null {
  const clients = getSuiGrpcClients();
  
  if (!clients) {
    console.warn('gRPC clients not available, falling back to JSON-RPC');
    return null;
  }

  return {
    async getObject(params) {
      const request = {
        object_id: params.id,
      };
      
      const response = await callGrpcMethod(
        clients.ledger,
        'GetObject',
        request
      );
      
      return response;
    },

    async getOwnedObjects(params) {
      const request = {
        owner: params.owner,
        filter: params.filter,
        limit: params.limit || 50,
        cursor: params.cursor,
      };

      const response = await callGrpcMethod(
        clients.state,
        'ListOwnedObjects',
        request
      );

      return response;
    },

    async queryEvents(params) {
      // gRPC 使用基於 checkpoint 的事件查詢
      const { queryEventsViaGrpc } = await import('./grpc-events');
      
      const result = await queryEventsViaGrpc({
        query: params.query,
        cursor: params.cursor,
        limit: params.limit,
        order: params.order,
      });

      // 轉換為與 SuiClient 相容的格式
      return {
        data: result.data,
        nextCursor: result.nextCursor,
        hasNextPage: result.hasNextPage,
      };
    },

    async getTransactionBlock(params) {
      const request = {
        digest: params.digest,
      };

      const response = await callGrpcMethod(
        clients.ledger,
        'GetTransaction',
        request
      );

      return response;
    },

    async getCheckpoint(params) {
      const request = {
        checkpoint_id: params.id,
      };

      const response = await callGrpcMethod(
        clients.ledger,
        'GetCheckpoint',
        request
      );

      return response;
    },

    async getBalance(params) {
      const request = {
        owner: params.owner,
        coin_type: params.coinType,
      };

      const response = await callGrpcMethod(
        clients.state,
        'GetBalance',
        request
      );

      return response;
    },

    async getAllBalances(params) {
      const request = {
        owner: params.owner,
      };

      const response = await callGrpcMethod(
        clients.state,
        'ListBalances',
        request
      );

      return response;
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
