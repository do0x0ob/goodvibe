/**
 * gRPC 事件查詢實作
 * 
 * 在 Sui gRPC 中，事件查詢的方式與 JSON-RPC 不同：
 * - JSON-RPC: 直接查詢事件 (queryEvents)
 * - gRPC: 透過 checkpoint 掃描取得事件
 * 
 * 這個檔案實作了基於 checkpoint 的事件掃描機制
 */

import { getSuiGrpcClients, callGrpcMethod, callGrpcStream } from './grpc-client';

export interface EventFilter {
  MoveEventType?: string;
  Transaction?: string;
  MoveModule?: { package: string; module: string };
  Sender?: string;
  Object?: string;
}

export interface QueryEventsParams {
  query: EventFilter;
  cursor?: string;
  limit?: number;
  order?: 'ascending' | 'descending';
}

export interface EventResult {
  data: any[];
  nextCursor: string | null;
  hasNextPage: boolean;
}

/**
 * 透過 gRPC 查詢事件
 * 使用 checkpoint 掃描方式
 */
export async function queryEventsViaGrpc(params: QueryEventsParams): Promise<EventResult> {
  const clients = getSuiGrpcClients();
  
  if (!clients) {
    throw new Error('gRPC clients not initialized');
  }

  // 策略：使用 subscription service 串流最新的 checkpoints
  // 然後從 checkpoint 中過濾出符合條件的事件
  
  const limit = params.limit || 50;
  const events: any[] = [];
  
  try {
    // 方法 1: 使用 LedgerService 取得最新的 checkpoint 資訊
    const serviceInfo = await callGrpcMethod(
      clients.ledger,
      'GetServiceInfo',
      {}
    );

    const currentCheckpoint = serviceInfo.checkpoint_height;
    
    // 從當前 checkpoint 往回掃描
    // 注意：這是簡化版本，實際使用時可能需要更複雜的邏輯
    const checkpointsToScan = 100; // 掃描最近 100 個 checkpoints
    const startCheckpoint = Math.max(0, currentCheckpoint - checkpointsToScan);

    for (let i = currentCheckpoint; i >= startCheckpoint && events.length < limit; i--) {
      try {
        const checkpoint = await callGrpcMethod(
          clients.ledger,
          'GetCheckpoint',
          { sequence_number: i }
        );

        // 從 checkpoint 中提取事件
        if (checkpoint.transactions) {
          for (const tx of checkpoint.transactions) {
            // 取得完整的交易資料（包含事件）
            if (tx.digest) {
              try {
                const txDetail = await callGrpcMethod(
                  clients.ledger,
                  'GetTransaction',
                  { digest: tx.digest }
                );

                // 過濾符合條件的事件
                if (txDetail.events) {
                  const filteredEvents = filterEvents(txDetail.events, params.query);
                  events.push(...filteredEvents);
                }
              } catch (txError) {
                // 個別交易錯誤不影響整體掃描
                console.warn(`Failed to get transaction ${tx.digest}:`, txError);
              }
            }
          }
        }
      } catch (checkpointError) {
        console.warn(`Failed to get checkpoint ${i}:`, checkpointError);
      }
    }

    return {
      data: events.slice(0, limit),
      nextCursor: events.length >= limit ? String(startCheckpoint) : null,
      hasNextPage: events.length >= limit,
    };
    
  } catch (error) {
    console.error('Error querying events via gRPC:', error);
    throw error;
  }
}

/**
 * 過濾事件
 */
function filterEvents(events: any[], filter: EventFilter): any[] {
  if (!events || events.length === 0) {
    return [];
  }

  return events.filter((event) => {
    // 檢查 MoveEventType
    if (filter.MoveEventType) {
      if (event.type !== filter.MoveEventType) {
        return false;
      }
    }

    // 檢查 MoveModule
    if (filter.MoveModule) {
      const eventType = event.type || '';
      const expectedModule = `${filter.MoveModule.package}::${filter.MoveModule.module}`;
      if (!eventType.startsWith(expectedModule)) {
        return false;
      }
    }

    // 檢查 Sender
    if (filter.Sender) {
      if (event.sender !== filter.Sender) {
        return false;
      }
    }

    // 檢查 Object
    if (filter.Object) {
      // 這個過濾條件需要檢查事件中涉及的物件
      // 實作取決於具體的事件結構
    }

    return true;
  });
}

/**
 * 使用串流方式監聽新事件
 * 適合即時監控場景
 */
export function subscribeToEvents(
  params: QueryEventsParams,
  onEvent: (event: any) => void,
  onError?: (error: Error) => void
): () => void {
  const clients = getSuiGrpcClients();
  
  if (!clients) {
    throw new Error('gRPC clients not initialized');
  }

  // 使用 SubscriptionService 訂閱 checkpoint
  const stream = callGrpcStream(
    clients.subscription,
    'SubscribeCheckpoints',
    {}, // 訂閱所有新的 checkpoints
    (checkpoint: any) => {
      // 從 checkpoint 中提取事件
      if (checkpoint.transactions) {
        for (const tx of checkpoint.transactions) {
          // 處理每個交易的事件
          if (tx.events) {
            const filteredEvents = filterEvents(tx.events, params.query);
            filteredEvents.forEach(onEvent);
          }
        }
      }
    },
    onError
  );

  // 回傳取消訂閱的函數
  return () => {
    stream.cancel();
  };
}
