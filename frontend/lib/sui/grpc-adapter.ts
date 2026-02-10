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

  // Dynamic fields queries
  getDynamicFields(params: {
    parentId: string;
    cursor?: string;
    limit?: number;
  }): Promise<any>;

  getDynamicFieldObject(params: {
    parentId: string;
    name: {
      type: string;
      value: any;
    };
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
      // ⚠️ Surflux GetObject 有問題，使用 HTTP 回退
      // 錯誤：FIELD_MISSING for requests[0].object_id
      console.log('⚠️  getObject using HTTP fallback (Surflux GetObject format issue)');
      const { suiClient } = await import('./client');
      return suiClient.getObject(params);
    },

    async getOwnedObjects(params) {
      // ✅ 使用 gRPC
      try {
        // 構建請求
        const request: any = {
          owner: params.owner,
          page_size: params.limit || 50,
          read_mask: {
            paths: ['object_id', 'object_type', 'json'],
          },
        };

        // 添加類型過濾
        if (params.filter?.StructType) {
          request.object_type = params.filter.StructType;
        }

        // 添加分頁
        if (params.cursor) {
          request.page_token = params.cursor;
        }

        const { response } = await grpcClient.stateService.listOwnedObjects(request);

        // 轉換 protobuf Value 為 JS 對象（重用 getObject 的函數）
        const convertProtobufValue = (value: any): any => {
          if (!value) return null;
          
          if (value.kind === 'structValue' || value.structValue) {
            const struct = value.structValue || value;
            const result: any = {};
            if (struct.fields) {
              for (const [key, val] of Object.entries(struct.fields)) {
                result[key] = convertProtobufValue(val);
              }
            }
            return result;
          }
          
          if (value.kind === 'stringValue' || value.stringValue !== undefined) {
            return value.stringValue;
          }
          if (value.kind === 'numberValue' || value.numberValue !== undefined) {
            return value.numberValue;
          }
          if (value.kind === 'boolValue' || value.boolValue !== undefined) {
            return value.boolValue;
          }
          if (value.kind === 'listValue' || value.listValue) {
            const list = value.listValue || value;
            return list.values?.map((v: any) => convertProtobufValue(v)) || [];
          }
          
          return value;
        };

        // 轉換為 SuiClient 格式
        const objects = (response.objects || []).map((obj: any) => {
          const result: any = {
            data: {
              objectId: obj.object_id || obj.objectId,
              type: obj.object_type || obj.type,
            },
          };
          
          // 只在有 json 時才解析
          if (obj.json) {
            result.data.content = convertProtobufValue(obj.json);
          }
          
          return result;
        });

        return {
          data: objects,
          nextCursor: response.nextPageToken || response.next_page_token,
          hasNextPage: !!(response.nextPageToken || response.next_page_token),
        };
      } catch (error) {
        console.error('getOwnedObjects error, falling back to HTTP:', error);
        const { suiClient } = await import('./client');
        return suiClient.getOwnedObjects(params as any);
      }
    },

    async getDynamicFields(params) {
      // ✅ 使用 gRPC + HTTP 混合方案
      // gRPC listDynamicFields 獲取 fieldId 列表，然後用 HTTP getObject 獲取 name
      try {
        const request: any = {
          parent: params.parentId,
          page_size: params.limit || 50,
        };

        if (params.cursor) {
          request.page_token = params.cursor;
        }

        const { response } = await grpcClient.stateService.listDynamicFields(request);

        // gRPC 只返回 parent 和 fieldId，需要用 HTTP getObject 獲取 name
        const { suiClient } = await import('./client');
        const fields = [];
        
        for (const field of (response.dynamicFields || [])) {
          const fieldId = field.fieldId || field.field_id;
          
          try {
            // 用 HTTP getObject 獲取完整的 field 信息（包括 name）
            const fieldObj = await suiClient.getObject({
              id: fieldId,
              options: { showContent: true, showType: true },
            });
            
            if (fieldObj.data?.content) {
              const content = fieldObj.data.content as any;
              fields.push({
                name: content.fields?.name || content.name,
                objectId: fieldId,
                objectType: fieldObj.data.type || content.type,
              });
            } else {
              // 如果無法獲取內容，至少返回 fieldId
              fields.push({
                name: undefined,
                objectId: fieldId,
                objectType: undefined,
              });
            }
          } catch (error) {
            // 單個 field 失敗不影響其他
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.warn(`Failed to get field ${fieldId}:`, errorMessage);
            fields.push({
              name: undefined,
              objectId: fieldId,
              objectType: undefined,
            });
          }
        }

        return {
          data: fields,
          nextCursor: response.nextPageToken || response.next_page_token,
          hasNextPage: !!(response.nextPageToken || response.next_page_token),
        };
      } catch (error) {
        console.error('getDynamicFields error, falling back to HTTP:', error);
        const { suiClient } = await import('./client');
        return suiClient.getDynamicFields(params);
      }
    },

    async getDynamicFieldObject(params) {
      // ✅ 使用 gRPC listDynamicFields 找 fieldId，然後用 HTTP getObject
      try {
        // 1. 用 gRPC 獲取所有 field IDs
        const { response } = await grpcClient.stateService.listDynamicFields({
          parent: params.parentId,
          page_size: 100,
        });

        // 2. 對每個 fieldId，用 HTTP getObject 比對 name
        const { suiClient } = await import('./client');
        
        for (const field of (response.dynamicFields || [])) {
          const fieldId = field.fieldId || field.field_id;
          
          try {
            const fieldObj = await suiClient.getObject({
              id: fieldId,
              options: { showContent: true },
            });
            
            if (!fieldObj.data?.content) continue;
            
            const content = fieldObj.data.content as any;
            const fieldName = content.fields?.name || content.name;
            
            // 比對 name
            const paramName = params.name;
            let isMatch = false;
            
            if (fieldName && paramName) {
              // 如果兩者都是對象格式 {type, value}
              if (typeof fieldName === 'object' && typeof paramName === 'object') {
                isMatch = (
                  fieldName.type === paramName.type &&
                  JSON.stringify(fieldName.value) === JSON.stringify(paramName.value)
                );
              } else {
                // 直接比較
                isMatch = JSON.stringify(fieldName) === JSON.stringify(paramName);
              }
            }
            
            if (isMatch) {
              return fieldObj;
            }
          } catch (error) {
            // 繼續下一個
            continue;
          }
        }
        
        throw new Error('Dynamic field not found');
      } catch (error) {
        console.error('getDynamicFieldObject error, falling back to HTTP:', error);
        const { suiClient } = await import('./client');
        return suiClient.getDynamicFieldObject(params);
      }
    },

    async queryEvents(params) {
      // ⚠️ Surflux gRPC 不支援 queryEvents
      // 回退到 HTTP JSON-RPC
      console.log('⚠️  queryEvents not supported in Surflux gRPC, using HTTP fallback');
      
      const { suiClient } = await import('./client');
      return suiClient.queryEvents(params as any);
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
